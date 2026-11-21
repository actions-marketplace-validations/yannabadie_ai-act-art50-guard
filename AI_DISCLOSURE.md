# AI Disclosure — EU AI Act Article 50

This repository (`ai-act-art50-guard`) is a deterministic static compliance scanner with **zero embedded LLM inference calls** at runtime. Pattern lists inside `src/scan.mjs` exist solely to detect third-party AI SDKs, APIs, and chat widgets in scanned repositories.

- **Legal Reference:** Regulation (EU) 2024/1689 (EU AI Act) & Digital Omnibus Regulation (EU) 2026/1744 (`OJ L 2026-07-24`).
- **Art. 50 Transparency Obligation:** In force since `2026-08-02`.
