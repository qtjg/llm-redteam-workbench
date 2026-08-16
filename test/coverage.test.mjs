import assert from "node:assert/strict";
import test from "node:test";
import {
  createCoverageAudit,
  renderCoverageMarkdown,
} from "../src/lib/coverage.mjs";

const suiteData = {
  version: 4,
  suiteName: "coverage-audit-test-suite",
  governance: {
    owner: "Test maintainers",
    reviewer: "Test review role",
    lastReviewedAt: "2026-08-16",
    reviewCadenceDays: 90,
    reviewStatus: "approved",
  },
  suites: [
    {
      id: "PI-01",
      title: "Single-turn boundary",
      category: "Prompt injection",
      coverage: ["OWASP LLM01"],
      detectors: ["instruction-boundary"],
      prompt: "synthetic prompt",
      fixtureResponse: "safe response",
    },
    {
      id: "MT-05",
      title: "Cross-turn persistence",
      category: "Multi-turn memory",
      coverage: ["OWASP LLM01", "multi-turn persistence"],
      detectors: ["cross-turn-persistence"],
      turns: [
        { id: "setup", prompt: "synthetic setup", fixtureResponse: "safe" },
        {
          id: "follow-up",
          prompt: "synthetic follow-up",
          fixtureResponse: "safe",
        },
      ],
    },
    {
      id: "RG-06",
      title: "Retrieved-content boundary",
      category: "Retrieval boundary",
      coverage: ["retrieval isolation"],
      detectors: ["retrieval-boundary"],
      prompt: "synthetic retrieval question",
      fixtureResponse: "safe",
      retrievalContexts: [
        {
          id: "context-1",
          source: "synthetic://context",
          content: "synthetic context content",
        },
      ],
    },
  ],
};

test("creates a deterministic manifest-only coverage audit", () => {
  const audit = createCoverageAudit(
    suiteData,
    [
      "cross-turn-persistence",
      "instruction-boundary",
      "retrieval-boundary",
      "synthetic-canary",
    ],
    "test"
  );
  assert.equal(audit.schemaVersion, 2);
  assert.equal(audit.governance.owner, "Test maintainers");
  assert.equal(audit.summary.cases, 3);
  assert.equal(audit.summary.singleTurnCases, 1);
  assert.equal(audit.summary.multiTurnCases, 1);
  assert.equal(audit.summary.retrievalBoundaryCases, 1);
  assert.deepEqual(audit.unusedDetectorIds, ["synthetic-canary"]);
  assert.deepEqual(audit.detectors[0], {
    id: "cross-turn-persistence",
    caseIds: ["MT-05"],
  });
  assert.deepEqual(
    audit.threatClasses.find(entry => entry.name === "OWASP LLM01"),
    { name: "OWASP LLM01", caseIds: ["MT-05", "PI-01"] }
  );
});

test("renders a reviewer-friendly coverage audit without raw fixture content", () => {
  const audit = createCoverageAudit(
    suiteData,
    ["instruction-boundary", "cross-turn-persistence", "retrieval-boundary"],
    "test"
  );
  const report = renderCoverageMarkdown(audit);
  assert.match(report, /# Redline coverage audit/);
  assert.match(report, /multi-turn/);
  assert.match(report, /retrieval-boundary/);
  assert.match(report, /Test maintainers/);
  assert.equal(report.includes("synthetic context content"), false);
  assert.equal(report.includes("synthetic retrieval question"), false);
});
