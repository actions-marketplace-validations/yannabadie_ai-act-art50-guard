# AIActKit 2026 — EU AI Act Art. 50 Transparency Guard

[![CI](https://github.com/yannabadie/ai-act-art50-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/yannabadie/ai-act-art50-guard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![EU AI Act Art. 50](https://img.shields.io/badge/EU%20AI%20Act%20Art.%2050-In%20Force%20since%202026--08--02-7C3AED)](https://yannabadie.github.io/ai-act-art50-guard/)

**Zero-dependency** GitHub Action, Node 20/22+ CLI, and **100 % browser-side EU AI Act Risk Classifier + Art. 50 Banner Generator + Exportable AI Register (CSV/JSON)**.

- **Free Web Risk Classifier, Banner Generator & AI Register (FR/EN):** https://yannabadie.github.io/ai-act-art50-guard/
- **Aligned with LIVE November 2026 EU Law:** Regulation `(EU) 2024/1689` + **Digital Omnibus Regulation `(EU) 2026/1744`** (`OJ L 24 July 2026`, in force `27 July 2026`).

---

## Live EU AI Act Timeline (Verified November 2026)

- **`2025-02-02` (IN FORCE):** Prohibited AI practices (Art. 5, up to €35M / 7%) & Art. 4 AI Literacy *(softened to a **means-oriented duty** by Regulation (EU) 2026/1744 — role-based internal register recommended)*.
- **`2026-08-02` (IN FORCE):** **Article 50 Transparency Obligations** — mandatory user notice for chatbots/AI assistants, synthetic media/deepfake marking, and emotion/biometric notices (Art. 99 fines up to **€15M or 3%** worldwide turnover, capped at the **lower** figure for SMEs/startups under Art. 99(6)).
- **`2027-12-02` (DEFERRED by Reg. (EU) 2026/1744):** Standalone High-Risk AI systems (**Annex III** — HR/recruitment, credit, education, biometrics, essential services).
- **`2028-08-02` (DEFERRED by Reg. (EU) 2026/1744):** Embedded High-Risk AI systems (**Annex I** — medical devices, machinery, toys, lifts).

---

## What It Detects (36 AI SDKs, LLM APIs & Chat Widgets)

- **LLM & Agent SDKs:** `openai`, `@anthropic-ai/sdk`, `@google/genai`, `ai` (Vercel AI SDK), `langchain`, `llamaindex`, `mistralai`, `cohere`, `groq-sdk`, `openrouter`, `together-ai`, `perplexity`, `ollama`, `litellm`, `crewai`, `pydantic-ai`, `autogen`, `transformers` / Hugging Face, Azure OpenAI, AWS Bedrock.
- **Synthetic Media (Art. 50(2)/(4)):** `elevenlabs`, `replicate`, `stability-sdk`, `fal-ai`, `heygen`, `synthesia`.
- **Chatbots & Support AI Widgets (Art. 50(1)):** `Intercom/Fin`, `Crisp`, `Drift`, `Tidio`, `Zendesk`, `Botpress`, `Voiceflow`, `HubSpot`, `Freshchat`, `Dialogflow`.
- **Art. 50 Transparency Markers:** `AI_DISCLOSURE.md`, `data-ai-act-disclosure`, `.ai-act-disclosure`, accessible AI `aria-label`, explicit Art. 50 notice.

---

## Quick Start — GitHub Actions (5 Lines)

```yaml
- uses: actions/checkout@v4
- uses: yannabadie/ai-act-art50-guard@v1.0.0
  with:
    target: "."
    json-output: "ai-register.json"
    csv-output: "ai-register.csv"
    fail-on-missing-disclosure: "false"
```

---

## Companion EU RegTech Tools

- **CRA-SBOM-Guard (EU Cyber Resilience Act Art. 14):** https://yannabadie.github.io/cra-sbom-guard/
- **AccessiKit (EU EAA & French RGAA v5):** https://yannabadie.github.io/accessikit-eaa-rgaa/
- **FacturKit 2027 (French Factur-X 1.09.2 & 159 PA):** https://yannabadie.github.io/facturkit-2027/

## License

MIT — see [LICENSE](LICENSE).
