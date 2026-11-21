#!/usr/bin/env node
/**
 * AIActKit 2026 — EU AI Act Art. 50 Transparency Guard (v1.0.0)
 * Zero-dependency Node 20/22+ scanner aligned with:
 *   - Regulation (EU) 2024/1689 (EU AI Act)
 *   - Digital Omnibus Regulation (EU) 2026/1744 (OJ L 2026-07-24, in force 2026-07-27)
 *     * Art. 50 Transparency IN FORCE since 2026-08-02 (chatbots, synthetic content, deepfakes)
 *     * Art. 4 AI Literacy softened to means-oriented duty (internal role-based register recommended)
 *     * Annex III standalone high-risk deferred to 2027-12-02; Annex I embedded high-risk to 2028-08-02.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TOOL_NAME = "ai-act-art50-guard";
export const TOOL_VERSION = "1.0.0";

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "target",
  "vendor",
  "venv",
  ".venv",
  "__pycache__",
  ".next",
  ".nuxt",
  "coverage",
]);

/**
 * 36 curated AI SDKs, LLM APIs, synthetic-media providers & customer-facing chat widgets.
 */
export const AI_SIGNATURES = [
  // LLM & Agent SDKs (dependencies & code imports)
  { id: "openai", name: "OpenAI SDK / API", category: "llm-sdk", art50Scope: "Art. 50(1)/(2) — interactive AI & synthetic text/media", pkgNames: ["openai"], codePatterns: [/\bfrom\s+["']openai["']/, /\bimport\s+openai\b/, /api\.openai\.com\/v1\//i] },
  { id: "anthropic", name: "Anthropic Claude SDK / API", category: "llm-sdk", art50Scope: "Art. 50(1)/(2) — interactive AI & synthetic text", pkgNames: ["@anthropic-ai/sdk", "anthropic"], codePatterns: [/@anthropic-ai\/sdk/, /\bimport\s+anthropic\b/, /api\.anthropic\.com\/v1\//i] },
  { id: "google-genai", name: "Google Gemini GenAI SDK", category: "llm-sdk", art50Scope: "Art. 50(1)/(2) — interactive AI & synthetic content", pkgNames: ["@google/genai", "@google/generative-ai", "google-genai", "google-generativeai"], codePatterns: [/@google\/genai/, /@google\/generative-ai/, /generativelanguage\.googleapis\.com/i] },
  { id: "vercel-ai", name: "Vercel AI SDK", category: "llm-sdk", art50Scope: "Art. 50(1)/(2) — streaming AI chat & text generation", pkgNames: ["ai", "@ai-sdk/openai", "@ai-sdk/anthropic", "@ai-sdk/google"], codePatterns: [/from\s+["']ai["']/, /@ai-sdk\//] },
  { id: "langchain", name: "LangChain", category: "agent-framework", art50Scope: "Art. 50(1)/(2) — LLM orchestration & agent workflows", pkgNames: ["langchain", "@langchain/core", "@langchain/openai", "langchain-core", "langchain-openai"], codePatterns: [/@langchain\//, /\bfrom\s+langchain\b/, /\bimport\s+langchain\b/] },
  { id: "llamaindex", name: "LlamaIndex", category: "agent-framework", art50Scope: "Art. 50(1)/(2) — RAG & conversational AI", pkgNames: ["llamaindex", "llama-index", "llama-index-core"], codePatterns: [/\bllama_index\b/, /from\s+["']llamaindex["']/] },
  { id: "mistral", name: "Mistral AI SDK", category: "llm-sdk", art50Scope: "Art. 50(1)/(2) — interactive AI & synthetic text", pkgNames: ["@mistralai/mistralai", "mistralai"], codePatterns: [/@mistralai\/mistralai/, /api\.mistral\.ai\/v1\//i] },
  { id: "cohere", name: "Cohere SDK", category: "llm-sdk", art50Scope: "Art. 50(1)/(2) — generative text & chat", pkgNames: ["cohere-ai", "cohere"], codePatterns: [/api\.cohere\.(?:ai|com)\//i, /\bfrom\s+["']cohere-ai["']/] },
  { id: "groq", name: "Groq LLM SDK", category: "llm-sdk", art50Scope: "Art. 50(1)/(2) — low-latency LLM inference", pkgNames: ["groq-sdk", "groq"], codePatterns: [/api\.groq\.com\/openai\/v1/i, /\bfrom\s+["']groq-sdk["']/] },
  { id: "openrouter", name: "OpenRouter API", category: "llm-gateway", art50Scope: "Art. 50(1)/(2) — multi-LLM API gateway", pkgNames: ["@openrouter/sdk"], codePatterns: [/openrouter\.ai\/api\/v1/i] },
  { id: "together", name: "Together AI SDK", category: "llm-sdk", art50Scope: "Art. 50(1)/(2) — open-weights LLM inference", pkgNames: ["together-ai", "together"], codePatterns: [/api\.together\.xyz\/v1/i] },
  { id: "perplexity", name: "Perplexity API", category: "llm-sdk", art50Scope: "Art. 50(1)/(2) — AI search & synthesis", pkgNames: ["@perplexity-ai/sdk"], codePatterns: [/api\.perplexity\.ai\//i] },
  { id: "ollama", name: "Ollama Local LLM", category: "llm-runtime", art50Scope: "Art. 50(1)/(2) — local LLM chat/generation", pkgNames: ["ollama"], codePatterns: [/from\s+["']ollama["']/, /\bimport\s+ollama\b/] },
  { id: "litellm", name: "LiteLLM Proxy / SDK", category: "llm-gateway", art50Scope: "Art. 50(1)/(2) — unified LLM router", pkgNames: ["litellm"], codePatterns: [/\bimport\s+litellm\b/] },
  { id: "crewai", name: "CrewAI Multi-Agent", category: "agent-framework", art50Scope: "Art. 50(1) — autonomous AI agents", pkgNames: ["crewai"], codePatterns: [/\bfrom\s+crewai\b/, /\bimport\s+crewai\b/] },
  { id: "pydantic-ai", name: "PydanticAI", category: "agent-framework", art50Scope: "Art. 50(1)/(2) — typed AI agent framework", pkgNames: ["pydantic-ai"], codePatterns: [/\bfrom\s+pydantic_ai\b/] },
  { id: "autogen", name: "AutoGen Agent Framework", category: "agent-framework", art50Scope: "Art. 50(1) — multi-agent orchestration", pkgNames: ["pyautogen", "autogen-agentchat"], codePatterns: [/\bimport\s+autogen\b/] },
  { id: "huggingface", name: "Hugging Face Transformers / Inference", category: "ml-genai", art50Scope: "Art. 50(2) — synthetic text/audio/image generation", pkgNames: ["transformers", "@huggingface/inference", "@huggingface/transformers", "huggingface-hub", "diffusers"], codePatterns: [/@huggingface\/inference/, /api-inference\.huggingface\.co/i, /\bfrom\s+transformers\s+import\b/] },
  { id: "azure-openai", name: "Azure OpenAI Service", category: "llm-sdk", art50Scope: "Art. 50(1)/(2) — enterprise LLM inference", pkgNames: ["@azure/openai"], codePatterns: [/openai\.azure\.com\/openai\/deployments/i] },
  { id: "aws-bedrock", name: "AWS Bedrock Runtime", category: "llm-sdk", art50Scope: "Art. 50(1)/(2) — managed foundation models", pkgNames: ["@aws-sdk/client-bedrock-runtime"], codePatterns: [/@aws-sdk\/client-bedrock-runtime/] },

  // Synthetic Voice, Image & Video Generators (Art. 50(2) & Art. 50(4) deepfake / synthetic content marking)
  { id: "elevenlabs", name: "ElevenLabs Voice AI", category: "synthetic-media", art50Scope: "Art. 50(2)/(4) — synthetic audio / voice cloning disclosure", pkgNames: ["elevenlabs", "@elevenlabs/elevenlabs-js"], codePatterns: [/api\.elevenlabs\.io\/v1/i, /@elevenlabs\//] },
  { id: "replicate", name: "Replicate GenAI Models", category: "synthetic-media", art50Scope: "Art. 50(2)/(4) — synthetic image/video/audio generation", pkgNames: ["replicate"], codePatterns: [/api\.replicate\.com\/v1/i, /from\s+["']replicate["']/] },
  { id: "stability", name: "Stability AI", category: "synthetic-media", art50Scope: "Art. 50(2)/(4) — synthetic image generation", pkgNames: ["stability-sdk"], codePatterns: [/api\.stability\.ai\/v[12]/i] },
  { id: "fal-ai", name: "fal.ai Media GenAI", category: "synthetic-media", art50Scope: "Art. 50(2)/(4) — synthetic image/video generation", pkgNames: ["@fal-ai/client", "fal-client"], codePatterns: [/@fal-ai\/client/, /fal\.run\//i] },
  { id: "heygen", name: "HeyGen Synthetic Video", category: "synthetic-media", art50Scope: "Art. 50(4) — AI avatar / deepfake video disclosure", pkgNames: [], codePatterns: [/api\.heygen\.com/i] },
  { id: "synthesia", name: "Synthesia Synthetic Video", category: "synthetic-media", art50Scope: "Art. 50(4) — AI avatar / synthetic video disclosure", pkgNames: [], codePatterns: [/api\.synthesia\.io/i] },

  // Customer-Facing Chatbots & Support AI Widgets (Art. 50(1) natural person interaction notice)
  { id: "intercom", name: "Intercom / Fin AI Widget", category: "chat-widget", art50Scope: "Art. 50(1) — user-facing AI chatbot disclosure required", pkgNames: ["@intercom/messenger-js-sdk"], codePatterns: [/widget\.intercom\.io/i, /intercomSettings\b/] },
  { id: "crisp", name: "Crisp Chat / AI Bot Widget", category: "chat-widget", art50Scope: "Art. 50(1) — user-facing AI chatbot disclosure required", pkgNames: ["crisp-sdk-web"], codePatterns: [/client\.crisp\.chat\/l\.js/i, /\$crisp\b/] },
  { id: "drift", name: "Drift Conversational AI", category: "chat-widget", art50Scope: "Art. 50(1) — user-facing AI chatbot disclosure required", pkgNames: [], codePatterns: [/js\.driftt\.com/i] },
  { id: "tidio", name: "Tidio Lyro AI Chat", category: "chat-widget", art50Scope: "Art. 50(1) — user-facing AI chatbot disclosure required", pkgNames: [], codePatterns: [/code\.tidio\.co\//i] },
  { id: "zendesk", name: "Zendesk AI Web Widget", category: "chat-widget", art50Scope: "Art. 50(1) — user-facing AI chatbot disclosure required", pkgNames: [], codePatterns: [/static\.zdassets\.com\/ekr\/snippet\.js/i] },
  { id: "botpress", name: "Botpress Webchat", category: "chat-widget", art50Scope: "Art. 50(1) — user-facing AI chatbot disclosure required", pkgNames: ["@botpress/webchat"], codePatterns: [/cdn\.botpress\.cloud\/webchat/i] },
  { id: "voiceflow", name: "Voiceflow AI Widget", category: "chat-widget", art50Scope: "Art. 50(1) — user-facing AI chatbot disclosure required", pkgNames: [], codePatterns: [/cdn\.voiceflow\.com\/widget/i] },
  { id: "hubspot-chat", name: "HubSpot Chat / Breeze AI", category: "chat-widget", art50Scope: "Art. 50(1) — user-facing AI chatbot disclosure required", pkgNames: [], codePatterns: [/js\.hs-scripts\.com\//i] },
  { id: "freshchat", name: "Freshchat / Freddy AI", category: "chat-widget", art50Scope: "Art. 50(1) — user-facing AI chatbot disclosure required", pkgNames: [], codePatterns: [/wchat\.freshchat\.com/i] },
  { id: "dialogflow", name: "Google Dialogflow Messenger", category: "chat-widget", art50Scope: "Art. 50(1) — user-facing AI chatbot disclosure required", pkgNames: ["@google-cloud/dialogflow", "google-cloud-dialogflow"], codePatterns: [/dialogflow-console\/fast\/messenger/i, /<df-messenger\b/i] },
];

const DISCLOSURE_MARKERS = [
  /data-ai-act-disclosure/i,
  /class=["'][^"']*ai-act-disclosure[^"']*["']/i,
  /id=["']ai-act-disclosure["']/i,
  /aria-label=["'][^"']*(?:ai\s+assistant|assistant\s+ia|artificial\s+intelligence|intelligence\s+artificielle|art\.?\s*50)[^"']*["']/i,
  /\b(?:eu\s+ai\s+act|article\s*50|r[èe]glement\s*\(ue\)\s*2024\/1689)\b/i,
];

const ANNEX_III_KEYWORDS = /\b(?:cv\s+screening|resume\s+scoring|credit\s+scoring|biometric\s+categor|emotion\s+recognition|exam\s+proctoring|recruitment\s+ranking)\b/i;

function extractPackageNames(filePath, text) {
  const base = path.basename(filePath);
  const found = new Set();
  if (base === "package.json") {
    try {
      const data = JSON.parse(text);
      for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
        if (data[field] && typeof data[field] === "object") {
          for (const k of Object.keys(data[field])) found.add(k.toLowerCase());
        }
      }
    } catch {
      // ignore invalid json
    }
  } else if (base === "requirements.txt") {
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.split("#")[0].split(";")[0].trim();
      const m = line.match(/^([A-Za-z0-9_.-]+)/);
      if (m) found.add(m[1].toLowerCase().replace(/_/g, "-"));
    }
  } else if (base === "pyproject.toml") {
    const depM = text.match(/\bdependencies\s*=\s*\[((?:[^\]"']|"[^"]*"|'[^']*')*)\]/m);
    if (depM) {
      for (const q of depM[1].match(/["']([^"']+)["']/g) || []) {
        const m = q.slice(1, -1).trim().match(/^([A-Za-z0-9_.-]+)/);
        if (m) found.add(m[1].toLowerCase().replace(/_/g, "-"));
      }
    }
    const poetryM = text.match(/\[tool\.poetry\.dependencies\]([\s\S]*?)(?:\n\[|$)/);
    if (poetryM) {
      for (const raw of poetryM[1].split(/\r?\n/)) {
        const m = raw.trim().match(/^([A-Za-z0-9_.-]+)\s*=/);
        if (m && m[1].toLowerCase() !== "python") found.add(m[1].toLowerCase().replace(/_/g, "-"));
      }
    }
  }
  return found;
}

/**
 * Scan a list of { path, content } virtual or real files.
 */
export function scanFilesInMemory(files) {
  const detections = new Map();
  const disclosureFiles = [];
  const annexIIIHints = [];

  for (const file of files) {
    const relPath = file.path;
    const base = path.basename(relPath);
    const text = String(file.content || "");

    // Check dedicated AI disclosure files
    if (/^ai[_-]disclosure\.md$/i.test(base)) {
      disclosureFiles.push({ file: relPath, marker: "dedicated-disclosure-file" });
    }

    // Check inline Art. 50 transparency markers in HTML/JS/TS/MD
    if (/\.(?:html|htm|js|mjs|cjs|ts|tsx|jsx|vue|svelte)$/i.test(base)) {
      for (const re of DISCLOSURE_MARKERS) {
        if (re.test(text)) {
          disclosureFiles.push({ file: relPath, marker: re.source.slice(0, 48) });
          break;
        }
      }
    }

    // Check manifest dependencies
    if (["package.json", "requirements.txt", "pyproject.toml"].includes(base)) {
      const pkgs = extractPackageNames(relPath, text);
      for (const sig of AI_SIGNATURES) {
        for (const pkg of sig.pkgNames) {
          if (pkgs.has(pkg.toLowerCase())) {
            recordDetection(detections, sig, relPath, `dependency:${pkg}`);
          }
        }
      }
    }

    // Check source & HTML files for SDK imports / API endpoints / chat widget snippets
    if (/\.(?:html|htm|js|mjs|cjs|ts|tsx|jsx|py|vue|svelte)$/i.test(base)) {
      for (const sig of AI_SIGNATURES) {
        for (const pat of sig.codePatterns) {
          if (pat.test(text)) {
            recordDetection(detections, sig, relPath, `code:${pat.source.slice(0, 40)}`);
            break;
          }
        }
      }
      if (ANNEX_III_KEYWORDS.test(text)) {
        annexIIIHints.push(relPath);
      }
    }
  }

  const aiSystems = Array.from(detections.values()).sort((a, b) => a.id.localeCompare(b.id));
  const art50Required = aiSystems.length > 0;
  const art50DisclosureFound = disclosureFiles.length > 0;
  const hasAnnexIIIHint = annexIIIHints.length > 0;

  let riskTier = "MINIMAL_RISK";
  if (hasAnnexIIIHint) riskTier = "ANNEX_III_WATCH_DEC2027";
  else if (art50Required) riskTier = "ART50_TRANSPARENCY_LIVE";

  let readinessScore = 100;
  if (art50Required && !art50DisclosureFound) {
    readinessScore -= 45;
  }
  if (aiSystems.some((s) => s.category === "chat-widget") && !art50DisclosureFound) {
    readinessScore -= 15;
  }
  if (aiSystems.some((s) => s.category === "synthetic-media") && !art50DisclosureFound) {
    readinessScore -= 10;
  }
  if (hasAnnexIIIHint) {
    readinessScore -= 15;
  }
  readinessScore = Math.max(0, Math.min(100, readinessScore));

  return {
    aiSystems,
    disclosureFiles,
    annexIIIHints,
    summary: {
      filesScanned: files.length,
      aiSystemsCount: aiSystems.length,
      art50Required,
      art50DisclosureFound,
      annexIIIWatchTriggered: hasAnnexIIIHint,
      riskTier,
      readinessScore,
    },
  };
}

function recordDetection(map, sig, file, evidence) {
  if (!map.has(sig.id)) {
    map.set(sig.id, {
      id: sig.id,
      name: sig.name,
      category: sig.category,
      art50Scope: sig.art50Scope,
      applicableSince: "2026-08-02",
      files: [file],
      evidence: [evidence],
    });
  } else {
    const entry = map.get(sig.id);
    if (!entry.files.includes(file)) entry.files.push(file);
    if (!entry.evidence.includes(evidence)) entry.evidence.push(evidence);
  }
}

export function discoverTargetFiles(targetPath, maxDepth = 4) {
  const resolved = path.resolve(targetPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Target path does not exist: ${resolved}`);
  }
  const stat = fs.statSync(resolved);
  if (stat.isFile()) return [resolved];

  const found = [];
  const walk = (dir, depth) => {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) walk(path.join(dir, entry.name), depth + 1);
      } else if (entry.isFile()) {
        const name = entry.name;
        if (
          ["package.json", "requirements.txt", "pyproject.toml"].includes(name) ||
          /^ai[_-]disclosure\.md$/i.test(name) ||
          /\.(?:html|htm|js|mjs|cjs|ts|tsx|jsx|py|vue|svelte)$/i.test(name)
        ) {
          found.push(path.join(dir, name));
        }
      }
    }
  };
  walk(resolved, 0);
  return found.sort();
}

function csvEscape(val) {
  const s = String(val ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function renderRegisterCsv(scanResult) {
  const header = [
    "system_id",
    "system_name",
    "category",
    "eu_ai_act_scope",
    "applicable_since",
    "art50_disclosure_found",
    "risk_tier",
    "files",
    "evidence",
  ];
  const rows = [header.join(",")];
  for (const sys of scanResult.aiSystems) {
    rows.push(
      [
        sys.id,
        sys.name,
        sys.category,
        sys.art50Scope,
        sys.applicableSince,
        String(scanResult.summary.art50DisclosureFound),
        scanResult.summary.riskTier,
        sys.files.join(" ; "),
        sys.evidence.join(" ; "),
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  return "\uFEFF" + rows.join("\r\n") + "\r\n";
}

export function renderMarkdownSummary(report) {
  const s = report.summary;
  const status = !s.art50Required
    ? "PASS — No Art. 50 AI SDKs or Chat Widgets Detected"
    : s.art50DisclosureFound
      ? "PASS — AI Systems Inventoried & Art. 50 Transparency Marker Found"
      : "ACTION REQUIRED — AI Systems Detected Without Art. 50 Transparency Disclosure";

  const lines = [
    "## AIActKit 2026 — EU AI Act Art. 50 Transparency & AI Register Audit",
    "",
    `**Status:** ${status}`,
    "",
    "| Metric | Value |",
    "|---|---|",
    "| **Legal Basis** | Regulation (EU) 2024/1689 + Digital Omnibus Regulation (EU) 2026/1744 (`OJ L 2026-07-24`) |",
    "| **Active Deadlines** | Art. 50 Transparency LIVE since `2026-08-02` • Annex III High-Risk deferred to `2027-12-02` |",
    `| **Readiness Score** | **${s.readinessScore} / 100** |`,
    `| **Risk Tier** | \`${s.riskTier}\` |`,
    `| **AI Systems Detected** | ${s.aiSystemsCount} |`,
    `| **Art. 50 Transparency Marker Found** | ${s.art50DisclosureFound ? "Yes" : "No"} |`,
    "",
  ];

  if (report.aiSystems.length > 0) {
    lines.push("### Detected AI Systems (Exported to AI Register JSON/CSV)");
    lines.push("");
    lines.push("| System | Category | EU AI Act Scope | Files |");
    lines.push("|---|---|---|---|");
    for (const sys of report.aiSystems) {
      lines.push(`| **${sys.name}** (\`${sys.id}\`) | \`${sys.category}\` | ${sys.art50Scope} | \`${sys.files.slice(0, 3).join(", ")}\` |`);
    }
    lines.push("");
  }

  lines.push(
    "_Generated by [AIActKit 2026 — EU AI Act Art. 50 Guard](https://yannabadie.github.io/ai-act-art50-guard/) (MIT, zero dependencies)._"
  );
  return lines.join("\n");
}

function parseConfig(argv, env) {
  const cfg = {
    target: env.INPUT_TARGET || ".",
    jsonOutput: env["INPUT_JSON-OUTPUT"] || env.INPUT_JSON_OUTPUT || "ai-register.json",
    csvOutput: env["INPUT_CSV-OUTPUT"] || env.INPUT_CSV_OUTPUT || "ai-register.csv",
    failOnMissing: (env["INPUT_FAIL-ON-MISSING-DISCLOSURE"] || env.INPUT_FAIL_ON_MISSING_DISCLOSURE || "false").toLowerCase() === "true",
    maxDepth: Number.parseInt(env["INPUT_MAX-DEPTH"] || env.INPUT_MAX_DEPTH || "4", 10) || 4,
    quiet: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target" && argv[i + 1]) cfg.target = argv[++i];
    else if (a === "--json" && argv[i + 1]) cfg.jsonOutput = argv[++i];
    else if (a === "--csv" && argv[i + 1]) cfg.csvOutput = argv[++i];
    else if (a === "--fail-on-missing-disclosure") cfg.failOnMissing = true;
    else if (a === "--quiet") cfg.quiet = true;
    else if (a === "--help" || a === "-h") {
      console.log(`AIActKit v${TOOL_VERSION} — EU AI Act Art. 50 Scanner & AI Register Generator\n\nUsage:\n  node src/scan.mjs [target] [--json ai-register.json] [--csv ai-register.csv] [--fail-on-missing-disclosure]`);
      process.exit(0);
    } else if (!a.startsWith("-")) {
      cfg.target = a;
    }
  }
  return cfg;
}

export function runScan(cfg) {
  const rootDir = path.resolve(cfg.target);
  const baseDir = fs.statSync(rootDir).isDirectory() ? rootDir : path.dirname(rootDir);
  const paths = discoverTargetFiles(rootDir, cfg.maxDepth);
  const files = paths.map((fp) => ({
    path: path.relative(baseDir, fp) || path.basename(fp),
    content: fs.readFileSync(fp, "utf8"),
  }));

  const scanResult = scanFilesInMemory(files);
  const jsonPath = path.resolve(cfg.jsonOutput);
  const csvPath = path.resolve(cfg.csvOutput);

  const report = {
    tool: `${TOOL_NAME}@${TOOL_VERSION}`,
    scannedAt: new Date().toISOString(),
    regulation: {
      aiAct: "Regulation (EU) 2024/1689",
      digitalOmnibus: "Regulation (EU) 2026/1744 (OJ L 2026-07-24, in force 2026-07-27)",
      article50EffectiveDate: "2026-08-02",
      article4Note: "Softened to means-oriented AI literacy duty under Regulation (EU) 2026/1744",
      annexIIIHighRiskDate: "2027-12-02",
      annexIEmbeddedHighRiskDate: "2028-08-02",
      article99Fines: "Up to EUR 15M or 3% worldwide turnover (Art. 50); capped at lower amount for SMEs/startups (Art. 99(6))",
    },
    summary: scanResult.summary,
    aiSystems: scanResult.aiSystems,
    disclosureFiles: scanResult.disclosureFiles,
    annexIIIHints: scanResult.annexIIIHints,
  };

  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  fs.writeFileSync(csvPath, renderRegisterCsv(scanResult), "utf8");

  const markdown = renderMarkdownSummary(report);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + "\n", "utf8");
  }
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      [
        `json-path=${jsonPath}`,
        `csv-path=${csvPath}`,
        `ai-systems-count=${report.summary.aiSystemsCount}`,
        `art50-required=${report.summary.art50Required}`,
        `art50-disclosure-found=${report.summary.art50DisclosureFound}`,
        `risk-tier=${report.summary.riskTier}`,
        `readiness-score=${report.summary.readinessScore}`,
      ].join("\n") + "\n",
      "utf8"
    );
  }

  return { report, markdown };
}

const isMain =
  process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isMain) {
  try {
    const cfg = parseConfig(process.argv.slice(2), process.env);
    const { report, markdown } = runScan(cfg);
    if (!cfg.quiet) console.log(markdown);
    if (cfg.failOnMissing && report.summary.art50Required && !report.summary.art50DisclosureFound) {
      console.error(
        `\n[AIActKit] FAIL: ${report.summary.aiSystemsCount} AI system(s) detected without an EU AI Act Art. 50 transparency notice.`
      );
      process.exit(1);
    }
  } catch (err) {
    console.error(`[AIActKit] ERROR: ${err.message}`);
    process.exit(2);
  }
}
