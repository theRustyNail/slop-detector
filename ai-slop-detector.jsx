import { useState, useRef, useEffect, useCallback } from "react";

// ─── Pattern Database ───────────────────────────────────────────────
// Each pattern has:
//   phrases: multi-word triggers (matched as substrings, case-insensitive)
//   wholeWords: single words matched with word boundaries to avoid partial matches
//   regex: custom regex patterns for structural detection
//   weight: how much each hit contributes to the score (default 1)

const AI_PATTERNS = [
  {
    id: "significance",
    name: "Inflated significance",
    desc: "Puffs up importance with grand claims about legacy and broader trends",
    color: "#ff6b6b",
    weight: 1.5,
    phrases: [
      "stands as a", "serves as a testament", "serves as a reminder",
      "is a testament", "is a reminder of", "vital role in",
      "significant role in", "crucial role in", "pivotal role in",
      "key role in", "pivotal moment", "highlights its importance",
      "highlights its significance", "reflects broader",
      "symbolizing its", "ongoing legacy", "enduring legacy",
      "lasting legacy", "contributing to the broader",
      "setting the stage for", "marking a", "shaping the",
      "represents a shift", "key turning point",
      "evolving landscape", "focal point for", "indelible mark",
      "deeply rooted in", "marks a pivotal", "underscores the importance",
      "underscores the significance", "broader implications",
      "broader context", "broader trend", "played a key role",
      "played a crucial role", "played a pivotal role",
      "played a significant role", "continues to shape"
    ],
    wholeWords: []
  },
  {
    id: "notability",
    name: "Forced notability",
    desc: "Hits you over the head with how notable or covered something is",
    color: "#ffa94d",
    weight: 1.2,
    phrases: [
      "independent coverage", "local media outlets", "regional media outlets",
      "national media outlets", "leading expert in", "active social media presence",
      "has been featured in", "has been cited in", "widely recognized as",
      "widely regarded as", "internationally recognized",
      "gained widespread recognition", "attracted significant attention",
      "received widespread acclaim", "gained international attention",
      "has been praised by", "has been lauded by"
    ],
    wholeWords: []
  },
  {
    id: "ing_analysis",
    name: "Superficial -ing analyses",
    desc: "Tacks participle phrases onto sentences for fake depth",
    color: "#ffd43b",
    weight: 1.3,
    phrases: [
      "highlighting the", "underscoring the", "emphasizing the",
      "ensuring that", "reflecting the", "symbolizing the",
      "contributing to a", "contributing to the",
      "showcasing the", "showcasing how", "showcasing its",
      "encompassing a", "encompassing the",
      "demonstrating the", "illustrating the",
      "underscoring its", "highlighting its", "emphasizing its",
      "reinforcing the", "solidifying its"
    ],
    wholeWords: ["cultivating", "fostering"],
    regex: [
      /,\s+\w+ing\s+(the|its|a|an|their|his|her)\s+\w+\s+(of|in|to|for|and|with)\b/gi
    ]
  },
  {
    id: "promo",
    name: "Promotional language",
    desc: "Reads like a brochure or tourism ad",
    color: "#69db7c",
    weight: 1.0,
    phrases: [
      "boasts a", "boasts an", "rich cultural heritage",
      "rich heritage", "rich history and", "enhancing its",
      "exemplifies the", "commitment to excellence",
      "commitment to innovation", "natural beauty",
      "nestled in", "nestled between", "nestled within",
      "in the heart of", "must-visit destination",
      "world-class", "cutting-edge", "state-of-the-art",
      "one-of-a-kind", "second to none", "unparalleled"
    ],
    wholeWords: [
      "breathtaking", "groundbreaking", "renowned", "stunning",
      "awe-inspiring", "trailblazing"
    ]
  },
  {
    id: "weasel",
    name: "Vague attributions",
    desc: "Attributes opinions to unnamed authorities",
    color: "#4ecdc4",
    weight: 1.4,
    phrases: [
      "industry reports suggest", "industry reports indicate",
      "observers have cited", "observers have noted",
      "experts argue that", "experts believe that",
      "some critics argue", "several sources suggest",
      "several publications have", "many experts believe",
      "industry experts suggest", "analysts suggest that",
      "researchers have noted", "studies have shown that",
      "it is widely believed", "it has been suggested",
      "according to experts", "according to analysts",
      "commentators have noted", "critics have pointed out"
    ],
    wholeWords: []
  },
  {
    id: "ai_vocab",
    name: "AI vocabulary",
    desc: "Words that appear far more in post-2023 AI text than in human writing",
    color: "#74c0fc",
    weight: 0.8,
    phrases: [
      "align with", "aligns with", "aligned with",
      "the interplay between", "the interplay of",
      "intricate interplay", "rich tapestry",
      "a tapestry of", "cultural tapestry",
      "the intricacies of", "navigate the complexities",
      "in the realm of", "the realm of",
      "a holistic approach", "holistic understanding",
      "leverage the", "leveraging the"
    ],
    wholeWords: [
      "delve", "delves", "delved", "delving",
      "pivotal", "multifaceted", "nuanced",
      "synergy", "synergies", "paradigm",
      "underscores", "underscored", "underscore",
      "garner", "garnered", "garnering",
      "spearhead", "spearheaded", "spearheading"
    ]
  },
  {
    id: "copula",
    name: "Copula avoidance",
    desc: "Uses elaborate constructions instead of simple 'is' or 'are'",
    color: "#b197fc",
    weight: 1.0,
    phrases: [
      "serves as a", "serves as an", "serves as the",
      "stands as a", "stands as an", "stands as the",
      "functions as a", "functions as an", "functions as the",
      "operates as a", "operates as an", "operates as the",
      "acts as a catalyst", "acts as a bridge",
      "marks a significant", "marks an important",
      "represents a major", "represents a significant"
    ],
    wholeWords: []
  },
  {
    id: "neg_parallel",
    name: "Negative parallelisms",
    desc: "Overuses 'not only...but' and 'it's not just...it's' constructions",
    color: "#f783ac",
    weight: 1.2,
    phrases: [
      "not only", "it's not just about",
      "it's not just", "it's not merely", "it is not just",
      "it is not merely", "not simply a",
      "more than just a", "goes beyond mere",
      "goes beyond simply", "goes beyond just"
    ],
    wholeWords: []
  },
  {
    id: "rule_of_three",
    name: "Rule of three",
    desc: "Forces ideas into groups of three to sound comprehensive",
    color: "#e599f7",
    weight: 1.0,
    phrases: [],
    wholeWords: [],
    regex: [
      /\b(\w+ing),\s+(\w+ing),\s+and\s+(\w+ing)\b/gi,
      /\b(innovation|collaboration|excellence|creativity|efficiency|transparency|sustainability|accountability|inclusivity|diversity|integrity|resilience),\s+(innovation|collaboration|excellence|creativity|efficiency|transparency|sustainability|accountability|inclusivity|diversity|integrity|resilience),\s+and\s+(innovation|collaboration|excellence|creativity|efficiency|transparency|sustainability|accountability|inclusivity|diversity|integrity|resilience)\b/gi,
      /\b(stakeholders|developers|end users|users|teams|leaders|partners|communities),\s+(stakeholders|developers|end users|users|teams|leaders|partners|communities),\s+and\s+(stakeholders|developers|end users|users|teams|leaders|partners|communities)\b/gi
    ]
  },
  {
    id: "em_dash",
    name: "Em dash overuse",
    desc: "Uses em dashes more than humans typically do",
    color: "#99e9f2",
    weight: 0.6,
    phrases: [],
    wholeWords: [],
    regex: [/\u2014/g, /\u2013/g, /\s--\s/g]
  },
  {
    id: "sycophantic",
    name: "Sycophantic tone",
    desc: "Overly positive, people-pleasing chatbot language",
    color: "#ffb3b3",
    weight: 1.8,
    phrases: [
      "great question", "excellent question", "excellent point",
      "you're absolutely right", "you are absolutely right",
      "that's a great", "that is a great",
      "i hope this helps", "hope this helps",
      "let me know if you'd like", "let me know if you would like",
      "let me know if you need", "let me know if you want",
      "feel free to ask", "don't hesitate to",
      "happy to help", "glad you asked",
      "would you like me to expand", "would you like me to elaborate",
      "shall i elaborate", "want me to dive deeper"
    ],
    wholeWords: []
  },
  {
    id: "filler",
    name: "Filler phrases",
    desc: "Wordy constructions that pad sentences without adding meaning",
    color: "#c3fae8",
    weight: 0.9,
    phrases: [
      "in order to", "due to the fact that", "at this point in time",
      "in the event that", "has the ability to",
      "it is important to note that", "it is worth noting that",
      "it should be noted that", "needless to say",
      "at the end of the day", "it goes without saying",
      "the fact of the matter is", "for all intents and purposes",
      "in light of the fact that", "with regard to",
      "with respect to the", "in the context of",
      "on a daily basis", "at the present time"
    ],
    wholeWords: []
  },
  {
    id: "hedging",
    name: "Excessive hedging",
    desc: "Over-qualifying statements to avoid committing to anything",
    color: "#d8f5a2",
    weight: 1.0,
    phrases: [
      "could potentially", "it could be argued that",
      "might possibly", "may potentially",
      "it is possible that", "to some extent",
      "it may be worth considering", "one might argue that",
      "there is reason to believe", "it remains unclear whether",
      "while it is difficult to say", "it is hard to overstate"
    ],
    wholeWords: []
  },
  {
    id: "generic_conclusion",
    name: "Generic positive conclusions",
    desc: "Vague upbeat endings that say nothing specific",
    color: "#ffe8cc",
    weight: 1.5,
    phrases: [
      "the future looks bright", "exciting times lie ahead",
      "exciting times ahead", "continue their journey",
      "continue this journey", "continues to evolve",
      "step in the right direction", "remains to be seen",
      "only time will tell", "paving the way for",
      "poised to become", "poised to transform",
      "poised for growth", "well-positioned to",
      "on the cusp of", "the sky is the limit",
      "just the beginning", "tip of the iceberg"
    ],
    wholeWords: []
  },
  {
    id: "challenges",
    name: "Formulaic challenges sections",
    desc: "Stock 'despite challenges' phrasing",
    color: "#d0bfff",
    weight: 1.3,
    phrases: [
      "despite its challenges", "faces several challenges",
      "despite these challenges", "continues to thrive",
      "challenges and opportunities", "challenges typical of",
      "despite facing", "while challenges remain",
      "notwithstanding these challenges", "in the face of challenges",
      "challenges notwithstanding", "overcome significant challenges"
    ],
    wholeWords: []
  },
  {
    id: "synonym_cycling",
    name: "Synonym cycling",
    desc: "Swaps synonyms unnaturally to avoid repeating the same word",
    color: "#fcc2d7",
    weight: 1.1,
    phrases: [
      "the platform", "the tool", "the system", "the framework",
      "the initiative", "the endeavor", "the undertaking",
      "the mechanism", "the apparatus"
    ],
    wholeWords: [],
    contextual: true
  },
  {
    id: "false_range",
    name: "False ranges",
    desc: "Uses 'from X to Y' where X and Y aren't on a meaningful scale",
    color: "#fab005",
    weight: 1.2,
    phrases: [],
    wholeWords: [],
    regex: [
      /from\s+(?:the\s+)?\w+(?:\s+\w+)?\s+to\s+(?:the\s+)?\w+(?:\s+\w+)?,\s*from\s+/gi
    ]
  },
  {
    id: "cutoff_disclaimer",
    name: "Knowledge-cutoff disclaimers",
    desc: "AI disclaimers about incomplete information left in the text",
    color: "#868e96",
    weight: 2.0,
    phrases: [
      "as of my last", "as of my knowledge", "up to my last training",
      "based on available information", "based on my training",
      "while specific details are limited",
      "while specific details are scarce",
      "information is not extensively documented",
      "details are limited in readily available",
      "i don't have access to real-time",
      "i cannot browse the internet",
      "my training data", "my knowledge cutoff",
      "as of my last update"
    ],
    wholeWords: []
  },
  {
    id: "emoji_bold",
    name: "Emoji and bold decoration",
    desc: "Decorates headers or bullets with emojis and mechanical bold",
    color: "#ff922b",
    weight: 1.4,
    phrases: [],
    wholeWords: [],
    regex: [
      /[\u{1F300}-\u{1F9FF}]\s*\*\*[^*]+\*\*/gu,
      /^[\s-]*\*\*[^*]+\*\*:/gm,
      /^[\s-]*[\u{1F300}-\u{1F9FF}]/gmu
    ]
  }
];

// ─── Detection Engine ───────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectPatterns(text) {
  if (!text.trim()) return { matches: [], score: 0, breakdown: {}, wordCount: 0, totalHits: 0, density: 0, patternDiversity: 0, weightedHits: 0 };

  const lowerText = text.toLowerCase();
  const matches = [];
  const breakdown = {};
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  for (const pattern of AI_PATTERNS) {
    let count = 0;

    // Multi-word phrases
    if (pattern.phrases) {
      for (const phrase of pattern.phrases) {
        const regex = new RegExp(escapeRegex(phrase), "gi");
        let m;
        while ((m = regex.exec(lowerText)) !== null) {
          matches.push({
            start: m.index,
            end: m.index + m[0].length,
            pattern: pattern.id,
            name: pattern.name,
            color: pattern.color,
            text: text.slice(m.index, m.index + m[0].length)
          });
          count++;
        }
      }
    }

    // Whole words with word boundaries
    if (pattern.wholeWords) {
      for (const word of pattern.wholeWords) {
        const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "gi");
        let m;
        while ((m = regex.exec(text)) !== null) {
          const dominated = matches.some(
            (existing) =>
              existing.pattern === pattern.id &&
              existing.start <= m.index &&
              existing.end >= m.index + m[0].length
          );
          if (!dominated) {
            matches.push({
              start: m.index,
              end: m.index + m[0].length,
              pattern: pattern.id,
              name: pattern.name,
              color: pattern.color,
              text: text.slice(m.index, m.index + m[0].length)
            });
            count++;
          }
        }
      }
    }

    // Custom regex
    if (pattern.regex) {
      for (const re of pattern.regex) {
        const regex = new RegExp(re.source, re.flags);
        let m;
        while ((m = regex.exec(text)) !== null) {
          const dominated = matches.some(
            (existing) =>
              existing.pattern === pattern.id &&
              existing.start <= m.index &&
              existing.end >= m.index + m[0].length
          );
          if (!dominated) {
            matches.push({
              start: m.index,
              end: m.index + m[0].length,
              pattern: pattern.id,
              name: pattern.name,
              color: pattern.color,
              text: text.slice(m.index, m.index + m[0].length)
            });
            count++;
          }
        }
      }
    }

    if (count > 0) {
      breakdown[pattern.id] = { ...pattern, count };
    }
  }

  // ─── Contextual adjustments ─────────────────────────────────
  // Em dashes: only flag if density is high (>1 per 150 words)
  if (breakdown["em_dash"]) {
    const emDashRate = breakdown["em_dash"].count / wordCount;
    if (emDashRate < 1 / 150) {
      const emMatches = matches.filter((m) => m.pattern === "em_dash");
      for (const em of emMatches) matches.splice(matches.indexOf(em), 1);
      delete breakdown["em_dash"];
    }
  }

  // Synonym cycling: only flag if 3+ generic referents appear
  if (breakdown["synonym_cycling"] && breakdown["synonym_cycling"].count < 3) {
    const synMatches = matches.filter((m) => m.pattern === "synonym_cycling");
    for (const s of synMatches) matches.splice(matches.indexOf(s), 1);
    delete breakdown["synonym_cycling"];
  }

  // ─── Scoring ────────────────────────────────────────────────
  let weightedHits = 0;
  for (const pid of Object.keys(breakdown)) {
    const p = breakdown[pid];
    weightedHits += p.count * (p.weight || 1);
  }

  const totalHits = matches.length;
  const patternDiversity = Object.keys(breakdown).length;
  const density = wordCount > 0 ? (weightedHits / wordCount) * 100 : 0;
  const diversityMultiplier = 1 + Math.min(patternDiversity, 8) * 0.06;
  const lengthDampener = Math.min(1, wordCount / 80);
  const rawScore = density * diversityMultiplier * lengthDampener;
  const score = Math.min(100, Math.round(Math.pow(rawScore, 0.85) * 6));

  return { matches, score, breakdown, wordCount, totalHits, density, patternDiversity, weightedHits };
}

// ─── Score Labels ───────────────────────────────────────────────────

function getScoreLabel(score) {
  if (score <= 8) return { label: "Reads human", vibe: "Clean. Whoever wrote this either is a person or is very good at pretending." };
  if (score <= 20) return { label: "Mostly clean", vibe: "A few tells, but nothing that screams 'I asked ChatGPT.' Fixable in five minutes." };
  if (score <= 40) return { label: "Suspicious", vibe: "Multiple AI patterns clustering together. Your tutor would raise an eyebrow." };
  if (score <= 65) return { label: "Likely AI", vibe: "This has the fingerprints of a language model. The vibrant tapestry of AI vocabulary is showcasing itself." };
  return { label: "Pure slop", vibe: "Nestled in the heart of AI-generated text, this pivotal piece stands as a testament to the enduring legacy of not editing your output." };
}

// ─── Highlighted Text ───────────────────────────────────────────────

function HighlightedText({ text, matches }) {
  if (!matches.length) return <span>{text}</span>;

  const sorted = [...matches].sort((a, b) => a.start - b.start);
  const merged = [];
  for (const m of sorted) {
    if (merged.length && m.start < merged[merged.length - 1].end) {
      const last = merged[merged.length - 1];
      if (m.end > last.end) last.end = m.end;
    } else {
      merged.push({ ...m });
    }
  }

  const parts = [];
  let cursor = 0;
  for (const m of merged) {
    if (m.start > cursor) parts.push(<span key={`t-${cursor}`}>{text.slice(cursor, m.start)}</span>);
    parts.push(
      <span
        key={`h-${m.start}`}
        title={m.name}
        style={{
          backgroundColor: m.color + "44",
          borderBottom: `2px solid ${m.color}`,
          borderRadius: 2,
          padding: "0 1px",
          cursor: "help",
        }}
      >
        {text.slice(m.start, m.end)}
      </span>
    );
    cursor = m.end;
  }
  if (cursor < text.length) parts.push(<span key={`t-${cursor}`}>{text.slice(cursor)}</span>);
  return <>{parts}</>;
}

// ─── Sample Text ────────────────────────────────────────────────────

const SAMPLE_TEXT = `Great question! Here is an overview of this topic. I hope this helps!

The initiative serves as an enduring testament to the transformative potential of modern technology, marking a pivotal moment in the evolving landscape of digital innovation. Nestled in the heart of the tech industry, this groundbreaking project showcases the intricate interplay between human creativity and artificial intelligence.

Additionally, the platform's vibrant community has garnered significant attention from industry experts. Experts believe that the tool doesn't just enhance productivity \u2014 it fosters collaboration, cultivating an environment where teams can delve into complex challenges while ensuring alignment with broader organizational goals.

Not only has the project been featured in leading publications, but it also underscores its crucial role in shaping the future of work. Despite these challenges, the team remains committed to their journey, highlighting the enduring value of innovation.

From small startups to multinational corporations, from solo developers to cross-functional teams \u2014 the technology continues to evolve. It is important to note that the framework leverages cutting-edge algorithms, fostering synergy between stakeholders, developers, and end users.

In conclusion, the future looks bright. Exciting times lie ahead as the team continues to pave the way for excellence. Let me know if you'd like me to expand on any section!`;

// ─── Main Component ─────────────────────────────────────────────────

export default function SlopDetector() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const analyze = useCallback((input) => {
    if (!input.trim()) { setResult(null); return; }
    setResult(detectPatterns(input));
  }, []);

  useEffect(() => {
    if (text) analyze(text);
    else setResult(null);
  }, [text, analyze]);

  const loadSample = () => setText(SAMPLE_TEXT);
  const clearAll = () => { setText(""); setResult(null); setActiveFilter(null); };

  const filteredMatches = result
    ? activeFilter ? result.matches.filter((m) => m.pattern === activeFilter) : result.matches
    : [];

  const scoreInfo = result ? getScoreLabel(result.score) : null;
  const scoreColor = result
    ? result.score <= 8 ? "#2d9d5a"
      : result.score <= 20 ? "#5da832"
      : result.score <= 40 ? "#c9971a"
      : result.score <= 65 ? "#d4652a"
      : "#c43030"
    : "#666";

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0f", color: "#e8e6e3", fontFamily: "'IBM Plex Mono', 'Fira Code', 'Source Code Pro', monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", borderBottom: "1px solid #ffffff10", padding: "28px 32px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, margin: 0, color: "#fff", letterSpacing: "-0.5px" }}>slop detector</h1>
            <span style={{ fontSize: 12, color: "#ffffff55", letterSpacing: 2, textTransform: "uppercase" }}>v2.0</span>
          </div>
          <p style={{ fontSize: 13, color: "#ffffff77", margin: 0, lineHeight: 1.5 }}>Paste text. Find the AI patterns. Kill them.</p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 32px" }}>
        {/* Input */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: "#ffffff55", textTransform: "uppercase", letterSpacing: 1.5 }}>Input text</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={loadSample} style={{ background: "#ffffff0d", border: "1px solid #ffffff15", color: "#ffffff88", padding: "4px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.target.style.background = "#ffffff1a"; e.target.style.color = "#ffffffcc"; }}
                onMouseLeave={(e) => { e.target.style.background = "#ffffff0d"; e.target.style.color = "#ffffff88"; }}>
                load example (it's bad)
              </button>
              {text && (
                <button onClick={clearAll} style={{ background: "#ff6b6b15", border: "1px solid #ff6b6b25", color: "#ff6b6b99", padding: "4px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>clear</button>
              )}
            </div>
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your text here to scan for AI writing patterns..."
            style={{ width: "100%", minHeight: 180, background: "#ffffff06", border: "1px solid #ffffff12", borderRadius: 6, color: "#e8e6e3", fontFamily: "inherit", fontSize: 13, lineHeight: 1.7, padding: 16, resize: "vertical", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
            onFocus={(e) => (e.target.style.borderColor = "#ffffff30")}
            onBlur={(e) => (e.target.style.borderColor = "#ffffff12")}
          />
          {text && <div style={{ fontSize: 11, color: "#ffffff33", marginTop: 4, textAlign: "right" }}>{text.split(/\s+/).filter(Boolean).length} words</div>}
        </div>

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Score card */}
            <div style={{ background: `linear-gradient(135deg, ${scoreColor}15 0%, ${scoreColor}08 100%)`, border: `1px solid ${scoreColor}30`, borderRadius: 8, padding: "20px 24px", marginBottom: 24, display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ textAlign: "center", minWidth: 80 }}>
                <div style={{ fontSize: 42, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: scoreColor, lineHeight: 1 }}>{result.score}</div>
                <div style={{ fontSize: 10, color: "#ffffff44", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>slop score</div>
              </div>
              <div style={{ borderLeft: `1px solid ${scoreColor}25`, paddingLeft: 24, flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: scoreColor, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>{scoreInfo.label}</div>
                <div style={{ fontSize: 12, color: "#ffffff77", lineHeight: 1.5 }}>{scoreInfo.vibe}</div>
                <div style={{ fontSize: 11, color: "#ffffff44", marginTop: 6, display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span>{result.totalHits} hits</span>
                  <span>{result.patternDiversity} pattern types</span>
                  <span>{result.wordCount} words</span>
                  <span onClick={() => setShowStats(!showStats)} style={{ color: "#74c0fc88", cursor: "pointer", borderBottom: "1px dashed #74c0fc44" }}>
                    {showStats ? "hide maths" : "show maths"}
                  </span>
                </div>
                {showStats && (
                  <div style={{ fontSize: 10, color: "#ffffff33", marginTop: 6, lineHeight: 1.6, fontFamily: "'IBM Plex Mono', monospace" }}>
                    weighted hits: {result.weightedHits.toFixed(1)} | density: {result.density.toFixed(2)}/100w | diversity: {(1 + Math.min(result.patternDiversity, 8) * 0.06).toFixed(2)}x | length dampener: {Math.min(1, result.wordCount / 80).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Pattern breakdown */}
            {Object.keys(result.breakdown).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: "#ffffff55", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Detected patterns (click to filter)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.values(result.breakdown)
                    .sort((a, b) => b.count * (b.weight || 1) - a.count * (a.weight || 1))
                    .map((p) => (
                      <button key={p.id} onClick={() => setActiveFilter(activeFilter === p.id ? null : p.id)}
                        style={{ background: activeFilter === p.id ? p.color + "30" : "#ffffff0a", border: `1px solid ${activeFilter === p.id ? p.color + "60" : "#ffffff15"}`, borderRadius: 4, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: "#ffffffcc" }}>{p.name}</span>
                        <span style={{ fontSize: 10, color: p.color, fontWeight: 600, background: p.color + "20", padding: "1px 5px", borderRadius: 3 }}>{p.count}</span>
                      </button>
                    ))}
                  {activeFilter && (
                    <button onClick={() => setActiveFilter(null)} style={{ background: "transparent", border: "1px dashed #ffffff25", borderRadius: 4, padding: "6px 10px", cursor: "pointer", fontSize: 11, color: "#ffffff55" }}>show all</button>
                  )}
                </div>
                {activeFilter && result.breakdown[activeFilter] && (
                  <div style={{ fontSize: 12, color: "#ffffff66", marginTop: 8, paddingLeft: 2 }}>{result.breakdown[activeFilter].desc}</div>
                )}
              </div>
            )}

            {/* Highlighted preview */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#ffffff55", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
                Annotated text {activeFilter ? `(showing: ${result.breakdown[activeFilter]?.name})` : ""}
              </div>
              <div style={{ background: "#ffffff06", border: "1px solid #ffffff12", borderRadius: 6, padding: 20, fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 500, overflowY: "auto" }}>
                <HighlightedText text={text} matches={filteredMatches} />
              </div>
            </div>

            {/* Guide toggle */}
            <button onClick={() => setShowGuide(!showGuide)}
              style={{ background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 6, padding: "12px 16px", cursor: "pointer", width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showGuide ? 12 : 0 }}>
              <span style={{ fontSize: 12, color: "#ffffffaa" }}>Pattern reference guide ({AI_PATTERNS.length} patterns)</span>
              <span style={{ fontSize: 12, color: "#ffffff55" }}>{showGuide ? "collapse" : "expand"}</span>
            </button>

            {showGuide && (
              <div style={{ background: "#ffffff04", border: "1px solid #ffffff10", borderRadius: 6, padding: 16, maxHeight: 400, overflowY: "auto" }}>
                {AI_PATTERNS.filter((p) => !p.contextual).map((p) => (
                  <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid #ffffff08", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0, marginTop: 4 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#ffffffcc", marginBottom: 2 }}>
                        {p.name}
                        <span style={{ fontSize: 10, color: "#ffffff33", marginLeft: 8 }}>weight: {p.weight}x</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#ffffff66", lineHeight: 1.4 }}>{p.desc}</div>
                      {(p.phrases?.length > 0 || p.wholeWords?.length > 0) && (
                        <div style={{ fontSize: 10, color: "#ffffff44", marginTop: 4, lineHeight: 1.5 }}>
                          Triggers: {[...(p.phrases || []), ...(p.wholeWords || [])].slice(0, 6).map((t) => `"${t}"`).join(", ")}
                          {[...(p.phrases || []), ...(p.wholeWords || [])].length > 6 ? ` +${[...(p.phrases || []), ...(p.wholeWords || [])].length - 6} more` : ""}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!result && !text && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#ffffff33" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>_</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              Paste some text above to scan it for AI writing patterns.
              <br />Or{" "}
              <span onClick={loadSample} style={{ color: "#74c0fc", cursor: "pointer", borderBottom: "1px dashed #74c0fc55" }}>load the example</span>
              {" "}to see how bad it can get.
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        textarea::placeholder { color: #ffffff33; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ffffff15; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #ffffff25; }
      `}</style>
    </div>
  );
}
