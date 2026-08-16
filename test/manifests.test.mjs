import assert from "node:assert/strict";
import test from "node:test";
import {
  validatePolicy,
  validateScope,
  validateSuiteManifest,
} from "../src/lib/manifests.mjs";

const knownDetectors = [
  "synthetic-canary",
  "retrieval-boundary",
  "cross-turn-persistence",
];

function baseScope() {
  return {
    version: 2,
    authorized: true,
    mode: "fixture",
    fixtureTarget: "local-fixture://test",
    allowedTargets: ["local-fixture://test"],
    allowNetwork: false,
    mockTools: true,
    evidenceRetention: "redacted-only",
  };
}

function baseGovernance() {
  return {
    owner: "Test maintainers",
    reviewer: "Test review role",
    lastReviewedAt: "2026-08-16",
    reviewCadenceDays: 90,
    reviewStatus: "approved",
  };
}

function statefulSuite(overrides = {}) {
  return {
    id: "MT-05",
    title: "Stateful synthetic case",
    category: "Multi-turn memory",
    coverage: ["multi-turn persistence"],
    detectors: ["cross-turn-persistence"],
    turns: [
      { id: "setup", prompt: "setup", fixtureResponse: "safe" },
      { id: "follow-up", prompt: "follow-up", fixtureResponse: "safe" },
    ],
    ...overrides,
  };
}

test("accepts the local fixture scope shape", () => {
  assert.deepEqual(validateScope(baseScope()), []);
});

test("accepts governed multi-turn and redacted retrieval-context fixtures", () => {
  const suites = {
    version: 4,
    governance: baseGovernance(),
    suites: [
      statefulSuite(),
      {
        id: "RG-06",
        title: "Retrieved content",
        category: "Retrieval boundary",
        coverage: ["retrieval isolation"],
        detectors: ["retrieval-boundary"],
        prompt: "x",
        fixtureResponse: "safe",
        retrievalContexts: [
          {
            id: "context-1",
            source: "synthetic://context",
            content: "synthetic test text",
          },
        ],
      },
    ],
  };
  assert.deepEqual(validateSuiteManifest(suites, knownDetectors), []);
});

test("rejects invalid turns, retrieval contexts, duplicates, and unknown turn detectors", () => {
  const suites = {
    version: 4,
    governance: baseGovernance(),
    suites: [
      statefulSuite({
        turns: [
          { id: "repeated", prompt: "setup", fixtureResponse: "safe" },
          { id: "repeated", prompt: "", detectors: ["unknown"] },
        ],
        retrievalContexts: [
          { id: "context", source: "synthetic://context" },
          { id: "context", source: "synthetic://context", content: "x" },
        ],
      }),
    ],
  };
  const errors = validateSuiteManifest(suites, knownDetectors);
  assert.ok(errors.some(error => error.includes("duplicate turn id")));
  assert.ok(errors.some(error => error.includes("requires a prompt")));
  assert.ok(errors.some(error => error.includes("requires fixtureResponse")));
  assert.ok(errors.some(error => error.includes("unknown detector")));
  assert.ok(errors.some(error => error.includes("retrieval contexts require")));
  assert.ok(
    errors.some(error => error.includes("duplicate retrieval context"))
  );
});

test("rejects a suite that references an unknown detector", () => {
  const suites = {
    version: 4,
    governance: baseGovernance(),
    suites: [
      {
        id: "PI-01",
        title: "x",
        category: "x",
        prompt: "x",
        coverage: ["x"],
        detectors: ["unknown"],
        fixtureResponse: "x",
      },
    ],
  };
  assert.ok(
    validateSuiteManifest(suites, ["known"]).some(error =>
      error.includes("unknown detector")
    )
  );
});

test("rejects missing governance metadata and malformed time-bound exceptions", () => {
  const suiteErrors = validateSuiteManifest(
    {
      version: 4,
      suites: [statefulSuite()],
    },
    knownDetectors
  );
  assert.ok(suiteErrors.some(error => error.includes("governance record")));
  const policyErrors = validatePolicy({
    version: 1,
    thresholds: { maxExposureIndex: 0, maxExposureCases: 0, maxReviewCases: 0 },
    exceptions: [
      {
        id: "bad",
        caseId: "invalid",
        findingId: "x",
        owner: "",
        reviewer: "",
        rationale: "too short",
        expiresAt: "not-a-date",
      },
    ],
  });
  assert.ok(policyErrors.some(error => error.includes("stable EX-* id")));
  assert.ok(policyErrors.some(error => error.includes("expiresAt")));
});
