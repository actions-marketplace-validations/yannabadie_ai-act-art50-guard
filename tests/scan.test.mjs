import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  AI_SIGNATURES,
  discoverTargetFiles,
  renderMarkdownSummary,
  renderRegisterCsv,
  runScan,
  scanFilesInMemory,
} from "../src/scan.mjs";

test("AI_SIGNATURES covers at least 30 distinct AI SDKs, LLM APIs & chat widgets", () => {
  assert.ok(AI_SIGNATURES.length >= 30, `Expected >= 30 signatures, got ${AI_SIGNATURES.length}`);
  const ids = new Set(AI_SIGNATURES.map((s) => s.id));
  assert.equal(ids.size, AI_SIGNATURES.length);
  for (const required of ["openai", "anthropic", "google-genai", "langchain", "vercel-ai", "huggingface", "intercom", "crisp", "drift", "tidio", "zendesk", "botpress", "voiceflow", "elevenlabs", "replicate", "stability"]) {
    assert.ok(ids.has(required), `Missing required AI signature: ${required}`);
  }
});

test("scanFilesInMemory detects npm AI SDKs in package.json without disclosure", () => {
  const res = scanFilesInMemory([
    {
      path: "package.json",
      content: JSON.stringify({
        name: "saas-app",
        dependencies: { openai: "^4.70.0", "@anthropic-ai/sdk": "^0.32.0", ai: "^4.0.0" },
      }),
    },
  ]);
  assert.equal(res.summary.aiSystemsCount, 3);
  assert.equal(res.summary.art50Required, true);
  assert.equal(res.summary.art50DisclosureFound, false);
  assert.equal(res.summary.riskTier, "ART50_TRANSPARENCY_LIVE");
  assert.ok(res.summary.readinessScore <= 55);
});

test("scanFilesInMemory detects Python AI SDKs in requirements.txt and pyproject.toml", () => {
  const res = scanFilesInMemory([
    { path: "requirements.txt", content: "langchain==0.3.7\nelevenlabs>=1.9.0\ntransformers==4.46.0\n" },
    {
      path: "pyproject.toml",
      content: '[project]\ndependencies = ["google-genai>=1.0.0", "replicate==1.0.3"]\n',
    },
  ]);
  const ids = new Set(res.aiSystems.map((s) => s.id));
  assert.ok(ids.has("langchain"));
  assert.ok(ids.has("elevenlabs"));
  assert.ok(ids.has("huggingface"));
  assert.ok(ids.has("google-genai"));
  assert.ok(ids.has("replicate"));
  assert.equal(res.summary.aiSystemsCount, 5);
});

test("scanFilesInMemory detects customer-facing chat widgets in HTML (Intercom, Crisp, Tidio, Voiceflow)", () => {
  const res = scanFilesInMemory([
    {
      path: "index.html",
      content: `<script src="https://client.crisp.chat/l.js"></script><script src="https://widget.intercom.io/widget/abc"></script>`,
    },
  ]);
  const ids = new Set(res.aiSystems.map((s) => s.id));
  assert.ok(ids.has("crisp"));
  assert.ok(ids.has("intercom"));
  assert.equal(res.summary.art50DisclosureFound, false);
  assert.ok(res.summary.readinessScore <= 40);
});

test("scanFilesInMemory recognizes Art. 50 transparency notice markers & AI_DISCLOSURE.md", () => {
  const res = scanFilesInMemory([
    { path: "index.html", content: `<script src="https://client.crisp.chat/l.js"></script><aside data-ai-act-disclosure="art50">Assistant IA (Art. 50)</aside>` },
    { path: "AI_DISCLOSURE.md", content: "# AI Disclosure\nWe inform users interacting with our AI chatbot under EU AI Act Art. 50." },
  ]);
  assert.equal(res.summary.art50Required, true);
  assert.equal(res.summary.art50DisclosureFound, true);
  assert.equal(res.summary.readinessScore, 100);
});

test("scanFilesInMemory flags Annex III high-risk hints (deferred to 2027-12-02 by Reg. (EU) 2026/1744)", () => {
  const res = scanFilesInMemory([
    { path: "hr.js", content: `import OpenAI from "openai"; // automated cv screening pipeline` },
    { path: "AI_DISCLOSURE.md", content: "# AI Disclosure" },
  ]);
  assert.equal(res.summary.annexIIIWatchTriggered, true);
  assert.equal(res.summary.riskTier, "ANNEX_III_WATCH_DEC2027");
});

test("scanFilesInMemory scores 100/100 MINIMAL_RISK for non-AI projects", () => {
  const res = scanFilesInMemory([
    { path: "package.json", content: JSON.stringify({ name: "plain-site", dependencies: {} }) },
    { path: "index.html", content: "<html><body><h1>Hello</h1></body></html>" },
  ]);
  assert.equal(res.summary.aiSystemsCount, 0);
  assert.equal(res.summary.art50Required, false);
  assert.equal(res.summary.riskTier, "MINIMAL_RISK");
  assert.equal(res.summary.readinessScore, 100);
});

test("renderRegisterCsv & runScan output valid UTF-8-SIG CSV, JSON report & Markdown summary", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aiact-guard-"));
  try {
    fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({ dependencies: { openai: "4.70.0" } }));
    fs.writeFileSync(path.join(tmpDir, "AI_DISCLOSURE.md"), "# EU AI Act Art. 50 Disclosure\n");
    const jsonOut = path.join(tmpDir, "ai-register.json");
    const csvOut = path.join(tmpDir, "ai-register.csv");

    assert.equal(discoverTargetFiles(tmpDir).length, 2);
    const { report, markdown } = runScan({
      target: tmpDir,
      jsonOutput: jsonOut,
      csvOutput: csvOut,
      failOnMissing: true,
      maxDepth: 2,
      quiet: true,
    });

    assert.equal(report.summary.aiSystemsCount, 1);
    assert.equal(report.summary.art50DisclosureFound, true);
    assert.equal(report.summary.readinessScore, 100);
    assert.ok(fs.existsSync(jsonOut));
    assert.ok(fs.existsSync(csvOut));

    const csvText = fs.readFileSync(csvOut, "utf8");
    assert.ok(csvText.startsWith("\uFEFFsystem_id,system_name,"));
    assert.ok(csvText.includes("openai,OpenAI SDK / API"));
    assert.ok(renderRegisterCsv(report).includes("2026-08-02"));
    assert.ok(markdown.includes("2026/1744"));
    assert.ok(renderMarkdownSummary(report).includes("AIActKit 2026"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
