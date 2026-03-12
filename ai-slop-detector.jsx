import { useState, useRef, useEffect, useCallback } from "react";

const AI_PATTERNS = [
  {
    id: "significance",
    name: "Inflated significance",
    desc: "Puffs up importance with grand claims about legacy and broader trends",
    color: "#ff6b6b",
    words: [
      "stands as", "serves as", "testament", "reminder of", "vital role",
      "significant role", "crucial role", "pivotal role", "key role",
      "pivotal moment", "underscores", "highlights its importance",
      "reflects broader", "symbolizing", "ongoing legacy", "enduring legacy",
      "lasting legacy", "contributing to the", "setting the stage",
      "marking the", "shaping the", "represents a shift", "key turning point",
      "evolving landscape", "focal point", "indelible mark", "deeply rooted",
      "marks a pivotal"
    ]
  },
  {
    id: "notability",
    name: "Forced notability",
    desc: "Hits you over the head with how notable or covered something is",
    color: "#ffa94d",
    words: [
      "independent coverage", "local media outlets", "regional media outlets",
      "national media outlets", "leading expert", "active social media presence",
      "has been featured in", "has been cited in", "widely recognized",
      "widely regarded", "internationally recognized"
    ]
  },
  {
    id: "ing_analysis",
    name: "Superficial -ing analyses",
    desc: "Tacks participle phrases onto sentences for fake depth",
    color: "#ffd43b",
    words: [
      "highlighting the", "underscoring the", "emphasizing the",
      "ensuring that", "reflecting the", "symbolizing the",
      "contributing to", "cultivating", "fostering",
      "encompassing", "showcasing"
    ]
  },
  {
    id: "promo",
    name: "Promotional language",
    desc: "Reads like a brochure or tourism ad",
    color: "#69db7c",
    words: [
      "boasts a", "vibrant", "rich cultural", "rich heritage", "rich history",
      "profound", "enhancing its", "showcasing", "exemplifies",
      "commitment to", "natural beauty", "nestled", "in the heart of",
      "groundbreaking", "renowned", "breathtaking", "must-visit",
      "stunning", "world-class", "cutting-edge", "state-of-the-art"
    ]
  },
  {
    id: "weasel",
    name: "Vague attributions",
    desc: "Attributes opinions to unnamed authorities",
    color: "#4ecdc4",
    words: [
      "industry reports", "observers have", "experts argue",
      "some critics argue", "several sources", "several publications",
      "experts believe", "many experts", "industry experts",
      "analysts suggest", "researchers have noted"
    ]
  },
  {
    id: "ai_vocab",
    name: "AI vocabulary",
    desc: "Words that appear far more in post-2023 AI text than in human writing",
    color: "#74c0fc",
    words: [
      "additionally", "align with", "crucial", "delve", "emphasizing",
      "enduring", "enhance", "fostering", "garner", "interplay",
      "intricate", "intricacies", "landscape", "pivotal",
      "tapestry", "testament", "underscore", "valuable",
      "multifaceted", "nuanced", "realm", "holistic",
      "synergy", "paradigm", "leverage", "robust"
    ]
  },
  {
    id: "copula",
    name: "Copula avoidance",
    desc: "Uses elaborate constructions instead of simple 'is' or 'are'",
    color: "#b197fc",
    words: [
      "serves as", "stands as", "marks a", "represents a",
      "boasts", "features a", "offers a", "functions as",
      "acts as a", "operates as"
    ]
  },
  {
    id: "neg_parallel",
    name: "Negative parallelisms",
    desc: "Overuses 'not only...but' and 'it's not just...it's' constructions",
    color: "#f783ac",
    words: [
      "not only", "it's not just", "it's not merely",
      "not simply", "more than just", "goes beyond"
    ]
  },
  {
    id: "rule_of_three",
    name: "Rule of three",
    desc: "Forces ideas into groups of three to sound comprehensive",
    color: "#e599f7",
    words: [] // detected by comma pattern
  },
  {
    id: "em_dash",
    name: "Em dash overuse",
    desc: "Uses em dashes more than humans typically do",
    color: "#99e9f2",
    words: ["\u2014", "\u2013"] // em dash and en dash
  },
  {
    id: "sycophantic",
    name: "Sycophantic tone",
    desc: "Overly positive, people-pleasing chatbot language",
    color: "#ffb3b3",
    words: [
      "great question", "excellent point", "you're absolutely right",
      "that's a great", "i hope this helps", "let me know if",
      "of course!", "certainly!", "absolutely!", "happy to help",
      "here is a", "would you like me to"
    ]
  },
  {
    id: "filler",
    name: "Filler phrases",
    desc: "Wordy constructions that pad sentences without adding meaning",
    color: "#c3fae8",
    words: [
      "in order to", "due to the fact that", "at this point in time",
      "in the event that", "has the ability to", "it is important to note",
      "it is worth noting", "it should be noted", "needless to say",
      "at the end of the day", "when it comes to", "in terms of"
    ]
  },
  {
    id: "hedging",
    name: "Excessive hedging",
    desc: "Over-qualifying statements to avoid committing to anything",
    color: "#d8f5a2",
    words: [
      "could potentially", "it could be argued", "might possibly",
      "may potentially", "it is possible that", "arguably",
      "to some extent", "in some ways"
    ]
  },
  {
    id: "generic_conclusion",
    name: "Generic positive conclusions",
    desc: "Vague upbeat endings that say nothing specific",
    color: "#ffe8cc",
    words: [
      "the future looks bright", "exciting times", "continue their journey",
      "step in the right direction", "remains to be seen",
      "only time will tell", "paving the way", "poised to"
    ]
  },
  {
    id: "challenges",
    name: "Formulaic challenges sections",
    desc: "Stock 'despite challenges' phrasing",
    color: "#d0bfff",
    words: [
      "despite its", "faces several challenges", "despite these challenges",
      "continues to thrive", "challenges and opportunities",
      "challenges typical of"
    ]
  }
];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectPatterns(text) {
  if (!text.trim()) return { matches: [], score: 0, breakdown: {} };

  const lowerText = text.toLowerCase();
  const matches = [];
  const breakdown = {};

  for (const pattern of AI_PATTERNS) {
    let count = 0;
    for (const word of pattern.words) {
      const regex = new RegExp(escapeRegex(word.toLowerCase()), "gi");
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
    if (count > 0) {
      breakdown[pattern.id] = { ...pattern, count };
    }
  }

  // em dash specific count
  const emDashCount = (text.match(/[\u2014\u2013]/g) || []).length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // score: hits per 100 words, capped at 100
  const totalHits = matches.length;
  const rawScore = wordCount > 0 ? (totalHits / wordCount) * 100 : 0;
  const score = Math.min(100, Math.round(rawScore * 8));

  return { matches, score, breakdown, wordCount, totalHits };
}

function getScoreLabel(score) {
  if (score <= 10) return { label: "Reads human", emoji: "Writer", vibe: "Clean. Whoever wrote this either is a person or is very good at pretending." };
  if (score <= 25) return { label: "Mostly clean", emoji: "Editor", vibe: "A few tells, but nothing that screams 'I asked ChatGPT.' Fixable in five minutes." };
  if (score <= 50) return { label: "Suspicious", emoji: "Detective", vibe: "Your English teacher would raise an eyebrow. Multiple AI patterns detected." };
  if (score <= 75) return { label: "Likely AI", emoji: "Robot", vibe: "This has the fingerprints of a language model all over it. The vibrant tapestry of AI vocabulary is showcasing itself." };
  return { label: "Pure slop", emoji: "Biohazard", vibe: "Nestled in the heart of AI-generated text, this pivotal piece stands as a testament to the enduring legacy of not editing your output." };
}

function HighlightedText({ text, matches }) {
  if (!matches.length) return <span>{text}</span>;

  // sort and deduplicate overlapping matches
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
    if (m.start > cursor) {
      parts.push(<span key={`t-${cursor}`}>{text.slice(cursor, m.start)}</span>);
    }
    parts.push(
      <span
        key={`h-${m.start}`}
        title={m.name}
        style={{
          backgroundColor: m.color + "44",
          borderBottom: `2px solid ${m.color}`,
          borderRadius: 2,
          padding: "0 1px",
          cursor: "help"
        }}
      >
        {text.slice(m.start, m.end)}
      </span>
    );
    cursor = m.end;
  }
  if (cursor < text.length) {
    parts.push(<span key={`t-${cursor}`}>{text.slice(cursor)}</span>);
  }
  return <>{parts}</>;
}

const SAMPLE_TEXT = `Great question! Here is an overview of this topic. I hope this helps!

The initiative serves as an enduring testament to the transformative potential of modern technology, marking a pivotal moment in the evolving landscape of digital innovation. Nestled in the heart of the tech industry, this groundbreaking project showcases the intricate interplay between human creativity and artificial intelligence.

Additionally, the platform's vibrant community has garnered significant attention from industry experts. The tool doesn't just enhance productivity — it fosters collaboration, cultivating an environment where teams can delve into complex challenges while ensuring alignment with broader organizational goals.

Not only has the project been featured in leading publications, but it also underscores its crucial role in shaping the future of work. Despite these challenges, the team remains committed to their journey, highlighting the enduring value of innovation.

In conclusion, the future looks bright. Exciting times lie ahead as the team continues to pave the way for excellence. Let me know if you'd like me to expand on any section!`;

export default function SlopDetector() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const textareaRef = useRef(null);

  const analyze = useCallback((input) => {
    if (!input.trim()) {
      setResult(null);
      return;
    }
    const r = detectPatterns(input);
    setResult(r);
  }, []);

  useEffect(() => {
    if (text) analyze(text);
  }, [text, analyze]);

  const loadSample = () => {
    setText(SAMPLE_TEXT);
  };

  const clearAll = () => {
    setText("");
    setResult(null);
    setActiveFilter(null);
  };

  const filteredMatches = result
    ? activeFilter
      ? result.matches.filter((m) => m.pattern === activeFilter)
      : result.matches
    : [];

  const scoreInfo = result ? getScoreLabel(result.score) : null;

  const scoreColor =
    result
      ? result.score <= 10
        ? "#2d9d5a"
        : result.score <= 25
        ? "#5da832"
        : result.score <= 50
        ? "#c9971a"
        : result.score <= 75
        ? "#d4652a"
        : "#c43030"
      : "#666";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0f",
        color: "#e8e6e3",
        fontFamily: "'IBM Plex Mono', 'Fira Code', 'Source Code Pro', monospace",
        padding: "0"
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          borderBottom: "1px solid #ffffff10",
          padding: "28px 32px 24px"
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 28,
                fontWeight: 700,
                margin: 0,
                color: "#fff",
                letterSpacing: "-0.5px"
              }}
            >
              slop detector
            </h1>
            <span style={{ fontSize: 12, color: "#ffffff55", letterSpacing: 2, textTransform: "uppercase" }}>
              v1.0
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#ffffff77", margin: 0, lineHeight: 1.5 }}>
            Paste text. Find the AI patterns. Kill them.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 32px" }}>
        {/* Input area */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: "#ffffff55", textTransform: "uppercase", letterSpacing: 1.5 }}>
              Input text
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={loadSample}
                style={{
                  background: "#ffffff0d",
                  border: "1px solid #ffffff15",
                  color: "#ffffff88",
                  padding: "4px 10px",
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#ffffff1a";
                  e.target.style.color = "#ffffffcc";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#ffffff0d";
                  e.target.style.color = "#ffffff88";
                }}
              >
                load example (it's bad)
              </button>
              {text && (
                <button
                  onClick={clearAll}
                  style={{
                    background: "#ff6b6b15",
                    border: "1px solid #ff6b6b25",
                    color: "#ff6b6b99",
                    padding: "4px 10px",
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: "pointer"
                  }}
                >
                  clear
                </button>
              )}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here to scan for AI writing patterns..."
            style={{
              width: "100%",
              minHeight: 180,
              background: "#ffffff06",
              border: "1px solid #ffffff12",
              borderRadius: 6,
              color: "#e8e6e3",
              fontFamily: "inherit",
              fontSize: 13,
              lineHeight: 1.7,
              padding: 16,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => (e.target.style.borderColor = "#ffffff30")}
            onBlur={(e) => (e.target.style.borderColor = "#ffffff12")}
          />
        </div>

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Score card */}
            <div
              style={{
                background: `linear-gradient(135deg, ${scoreColor}15 0%, ${scoreColor}08 100%)`,
                border: `1px solid ${scoreColor}30`,
                borderRadius: 8,
                padding: "20px 24px",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 24
              }}
            >
              <div style={{ textAlign: "center", minWidth: 80 }}>
                <div
                  style={{
                    fontSize: 42,
                    fontWeight: 700,
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: scoreColor,
                    lineHeight: 1
                  }}
                >
                  {result.score}
                </div>
                <div style={{ fontSize: 10, color: "#ffffff44", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>
                  slop score
                </div>
              </div>
              <div style={{ borderLeft: `1px solid ${scoreColor}25`, paddingLeft: 24, flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: scoreColor, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 4 }}>
                  {scoreInfo.label}
                </div>
                <div style={{ fontSize: 12, color: "#ffffff77", lineHeight: 1.5 }}>
                  {scoreInfo.vibe}
                </div>
                <div style={{ fontSize: 11, color: "#ffffff44", marginTop: 6 }}>
                  {result.totalHits} pattern hits across {result.wordCount} words
                </div>
              </div>
            </div>

            {/* Pattern breakdown */}
            {Object.keys(result.breakdown).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: "#ffffff55", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
                  Detected patterns (click to filter)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.values(result.breakdown)
                    .sort((a, b) => b.count - a.count)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setActiveFilter(activeFilter === p.id ? null : p.id)}
                        style={{
                          background: activeFilter === p.id ? p.color + "30" : "#ffffff0a",
                          border: `1px solid ${activeFilter === p.id ? p.color + "60" : "#ffffff15"}`,
                          borderRadius: 4,
                          padding: "6px 10px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          transition: "all 0.15s"
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: p.color,
                            display: "inline-block",
                            flexShrink: 0
                          }}
                        />
                        <span style={{ fontSize: 11, color: "#ffffffcc" }}>{p.name}</span>
                        <span
                          style={{
                            fontSize: 10,
                            color: p.color,
                            fontWeight: 600,
                            background: p.color + "20",
                            padding: "1px 5px",
                            borderRadius: 3
                          }}
                        >
                          {p.count}
                        </span>
                      </button>
                    ))}
                  {activeFilter && (
                    <button
                      onClick={() => setActiveFilter(null)}
                      style={{
                        background: "transparent",
                        border: "1px dashed #ffffff25",
                        borderRadius: 4,
                        padding: "6px 10px",
                        cursor: "pointer",
                        fontSize: 11,
                        color: "#ffffff55"
                      }}
                    >
                      show all
                    </button>
                  )}
                </div>
                {activeFilter && result.breakdown[activeFilter] && (
                  <div style={{ fontSize: 12, color: "#ffffff66", marginTop: 8, paddingLeft: 2 }}>
                    {result.breakdown[activeFilter].desc}
                  </div>
                )}
              </div>
            )}

            {/* Highlighted preview */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#ffffff55", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
                Annotated text {activeFilter ? `(showing: ${result.breakdown[activeFilter]?.name})` : ""}
              </div>
              <div
                style={{
                  background: "#ffffff06",
                  border: "1px solid #ffffff12",
                  borderRadius: 6,
                  padding: 20,
                  fontSize: 13,
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 400,
                  overflowY: "auto"
                }}
              >
                <HighlightedText text={text} matches={filteredMatches} />
              </div>
            </div>

            {/* Guide toggle */}
            <button
              onClick={() => setShowGuide(!showGuide)}
              style={{
                background: "#ffffff08",
                border: "1px solid #ffffff15",
                borderRadius: 6,
                padding: "12px 16px",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: showGuide ? 12 : 0
              }}
            >
              <span style={{ fontSize: 12, color: "#ffffffaa" }}>
                Pattern reference guide ({AI_PATTERNS.length} patterns)
              </span>
              <span style={{ fontSize: 12, color: "#ffffff55" }}>{showGuide ? "collapse" : "expand"}</span>
            </button>

            {showGuide && (
              <div
                style={{
                  background: "#ffffff04",
                  border: "1px solid #ffffff10",
                  borderRadius: 6,
                  padding: 16,
                  maxHeight: 400,
                  overflowY: "auto"
                }}
              >
                {AI_PATTERNS.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid #ffffff08",
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start"
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: p.color,
                        flexShrink: 0,
                        marginTop: 4
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#ffffffcc", marginBottom: 2 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#ffffff66", lineHeight: 1.4 }}>
                        {p.desc}
                      </div>
                      {p.words.length > 0 && (
                        <div style={{ fontSize: 10, color: "#ffffff44", marginTop: 4, lineHeight: 1.5 }}>
                          Triggers: {p.words.slice(0, 8).join(", ")}
                          {p.words.length > 8 ? ` +${p.words.length - 8} more` : ""}
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
              <br />
              Or{" "}
              <span
                onClick={loadSample}
                style={{ color: "#74c0fc", cursor: "pointer", borderBottom: "1px dashed #74c0fc55" }}
              >
                load the example
              </span>{" "}
              to see how bad it can get.
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        textarea::placeholder {
          color: #ffffff33;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #ffffff15;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #ffffff25;
        }
      `}</style>
    </div>
  );
}
