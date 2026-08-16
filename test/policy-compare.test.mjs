import assert from "node:assert/strict";
import test from "node:test";
import { compareRuns } from "../src/lib/compare.mjs";
import { evaluatePolicy } from "../src/lib/policy.mjs";

const makeRun = (score, status) => ({
  runId: `${score}`,
  runFingerprint: `${score}`,
  summary: {
    exposureIndex: score,
    exposures: status === "exposure" ? 1 : 0,
    review: status === "review" ? 1 : 0,
  },
  coverage: { threatClasses: ["OWASP LLM02"] },
  results: [{ caseId: "DL-02", score, status }],
});

test("blocks a run above the declared acceptance threshold", () => {
  const policy = {
    id: "strict",
    digest: "digest",
    thresholds: {
      maxExposureIndex: 10,
      maxExposureCases: 0,
      maxReviewCases: 0,
    },
  };
  assert.equal(
    evaluatePolicy(makeRun(36, "exposure"), policy).decision,
    "block"
  );
});

test("compares risk signals at case level", () => {
  const comparison = compareRuns(
    makeRun(0, "verified"),
    makeRun(36, "exposure")
  );
  assert.equal(comparison.summary.regressions, 1);
  assert.equal(comparison.changes[0].kind, "regression");
});
