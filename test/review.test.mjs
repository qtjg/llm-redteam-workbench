import assert from "node:assert/strict";
import test from "node:test";
import {
  createSuiteReview,
  renderSuiteReviewMarkdown,
} from "../src/lib/review.mjs";

function suiteData() {
  return {
    version: 4,
    suiteName: "review-test-suite",
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
        title: "Synthetic boundary",
        category: "Prompt injection",
        coverage: ["instruction following"],
        detectors: ["instruction-boundary"],
        prompt: "raw prompt must not appear in review output",
        fixtureResponse: "safe",
      },
      {
        id: "MT-05",
        title: "Synthetic state",
        category: "Memory",
        coverage: ["persistence"],
        detectors: ["instruction-boundary"],
        turns: [{ id: "one", prompt: "x", fixtureResponse: "safe" }],
        retrievalContexts: [
          { id: "one", source: "synthetic://x", content: "not retained" },
        ],
      },
    ],
  };
}

test("creates a deterministic current suite-review summary without fixture content", () => {
  const review = createSuiteReview(suiteData(), {
    now: "2026-09-01T00:00:00Z",
    sourceRevision: "test",
  });
  assert.equal(review.schemaVersion, 1);
  assert.equal(review.governance.status, "current");
  assert.equal(review.governance.nextReviewAt, "2026-11-14");
  assert.equal(review.inventory.multiTurnCases, 1);
  assert.equal(review.inventory.retrievalBoundaryCases, 1);
  const markdown = renderSuiteReviewMarkdown(review);
  assert.match(markdown, /CURRENT/);
  assert.equal(markdown.includes("raw prompt must not appear"), false);
});

test("marks a suite review overdue and rejects invalid review timestamps", () => {
  const overdue = createSuiteReview(suiteData(), {
    now: "2027-01-01T00:00:00Z",
  });
  assert.equal(overdue.governance.status, "overdue");
  assert.ok(overdue.governance.daysUntilDue < 0);
  assert.throws(
    () => createSuiteReview(suiteData(), { now: "invalid-date" }),
    /valid ISO-8601/
  );
});
