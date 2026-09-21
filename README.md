# slop detector

Built with AI assistance; design, testing and validation my own.

A browser-based tool that scans text for common AI writing patterns and highlights them in real time. Paste anything in, get an instant breakdown of what reads like it was written by a language model.

Built on the pattern taxonomy from Wikipedia's [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) guide, maintained by WikiProject AI Cleanup.

## What it does

You paste text. It finds the slop. It shows you where.

The detector scans for **15 categories** of AI writing patterns:

| Category | What it catches |
|---|---|
| Inflated significance | "pivotal moment", "enduring legacy", "evolving landscape" |
| Forced notability | "has been featured in", "widely recognized" |
| Superficial -ing analyses | "highlighting the", "fostering", "showcasing" |
| Promotional language | "nestled", "breathtaking", "world-class", "vibrant" |
| Vague attributions | "experts argue", "industry reports suggest" |
| AI vocabulary | "delve", "tapestry", "multifaceted", "nuanced" |
| Copula avoidance | "serves as" instead of "is", "stands as" instead of "is" |
| Negative parallelisms | "it's not just X, it's Y" |
| Rule of three | Forcing ideas into groups of three |
| Em dash overuse | More em dashes than any human would use |
| Sycophantic tone | "Great question!", "I hope this helps!" |
| Filler phrases | "in order to", "it is important to note" |
| Excessive hedging | "could potentially", "it could be argued" |
| Generic conclusions | "the future looks bright", "exciting times ahead" |
| Formulaic challenges | "despite these challenges, continues to thrive" |

Each hit is colour-coded and highlighted inline. You can click any pattern category to filter the view and see just those matches.

The **slop score** (0–100) gives you a rough sense of how AI-flavoured the text reads, with ratings from "Reads human" through to "Pure slop."

## Running it

This is a single React component (`.jsx`). You can drop it into any React project, or run it standalone with something like Vite:

```bash
# quick start with Vite
npm create vite@latest slop-detector -- --template react
cd slop-detector
# replace src/App.jsx with the contents of ai-slop-detector.jsx
npm install
npm run dev
```

No external dependencies beyond React itself. Uses Google Fonts (IBM Plex Mono, Space Grotesk) loaded via CDN — works fine offline, just falls back to system monospace.

## How scoring works

The score is based on pattern hits per 100 words, scaled and capped at 100. It's deliberately imprecise — a blunt instrument, not a classifier. The point is to flag sections worth rethinking, not to produce a definitive AI/human verdict.

Rough guide:

- **0–10**: Clean. Either human-written or very well edited.
- **11–25**: A few tells. Easy to fix.
- **26–50**: Suspicious. Multiple patterns showing up together.
- **51–75**: Likely AI. The vocabulary and structure both point that way.
- **76–100**: The text is doing everything on the list at once.

## Limitations

Pattern matching catches the obvious stuff — the "delves" and "tapestries" and "it's not just X, it's Y" constructions. It won't catch subtler problems like uniform sentence rhythm, lack of personality, or that particular brand of confident vagueness that AI writing does so well.

It also produces false positives. The word "additionally" is fine in moderation. "Crucial" isn't inherently suspicious. Context matters, and a keyword scanner doesn't have context. Use the highlights as a starting point, not a verdict.



## Credits

Pattern taxonomy adapted from [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), maintained by WikiProject AI Cleanup. That page is worth reading in full if you're interested in how people identify AI-generated text in the wild.

## Licence

MIT
