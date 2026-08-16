import { digestJson } from "./codec.mjs";

export const SUITE_REVIEW_SCHEMA_VERSION = 1;

function asUtcMidnight(date) {
  return new Date(`${date}T00:00:00Z`);
}

function reviewDueDate(lastReviewedAt, cadenceDays) {
  const due = asUtcMidnight(lastReviewedAt);
  due.setUTCDate(due.getUTCDate() + cadenceDays);
  return due;
}

export function createSuiteReview(
  suiteData,
  { now = new Date().toISOString(), sourceRevision = "unversioned" } = {}
) {
  const governance = suiteData.governance;
  const reviewedAt = asUtcMidnight(governance.lastReviewedAt);
  const dueAt = reviewDueDate(
    governance.lastReviewedAt,
    governance.reviewCadenceDays
  );
  const evaluatedAt = new Date(now);
  if (!Number.isFinite(evaluatedAt.getTime()))
    throw new Error("--as-of must be a valid ISO-8601 timestamp.");
  const millisecondsUntilDue = dueAt.getTime() - evaluatedAt.getTime();
  const daysUntilDue = Math.ceil(millisecondsUntilDue / 86_400_000);
  const status = daysUntilDue < 0 ? "overdue" : "current";
  const basis = {
    suiteDigest: digestJson(suiteData),
    sourceRevision,
    asOf: evaluatedAt.toISOString(),
  };
  return {
    schemaVersion: SUITE_REVIEW_SCHEMA_VERSION,
    reviewId: `review_${digestJson(basis).slice(0, 12)}`,
    suiteName: suiteData.suiteName,
    suiteDigest: basis.suiteDigest,
    sourceRevision,
    asOf: basis.asOf,
    governance: {
      owner: governance.owner,
      reviewer: governance.reviewer,
      reviewStatus: governance.reviewStatus,
      lastReviewedAt: governance.lastReviewedAt,
      reviewCadenceDays: governance.reviewCadenceDays,
      nextReviewAt: dueAt.toISOString().slice(0, 10),
      daysUntilDue,
      status,
    },
    inventory: {
      cases: suiteData.suites.length,
      multiTurnCases: suiteData.suites.filter(
        testCase => testCase.turns?.length
      ).length,
      retrievalBoundaryCases: suiteData.suites.filter(
        testCase => testCase.retrievalContexts?.length
      ).length,
    },
    recommendedActions:
      status === "overdue"
        ? [
            "Review suite objectives, detector mappings, and synthetic content before the next release decision.",
            "Update governance.lastReviewedAt only after the documented review is complete.",
          ]
        : [
            "Retain this manifest-only review alongside the coverage and release-readiness evidence.",
            "Re-run it when governance metadata or fixture scope changes.",
          ],
  };
}

export function renderSuiteReviewMarkdown(review) {
  const actionRows = review.recommendedActions
    .map(action => `- ${action}`)
    .join("\n");
  return `# Redline suite-review summary\n\n> This manifest-only utility evaluates governance metadata. It does not execute a model, contact a target, or retain fixture prompts, responses, or retrieval content.\n\n| Field | Value |\n|---|---|\n| Review | \`${review.reviewId}\` |\n| Suite | ${review.suiteName} |\n| Suite digest | \`${review.suiteDigest}\` |\n| Source revision | \`${review.sourceRevision}\` |\n| Reviewed as of | ${review.asOf} |\n| Owner / reviewer | ${review.governance.owner} / ${review.governance.reviewer} |\n| Last / next review | ${review.governance.lastReviewedAt} / ${review.governance.nextReviewAt} |\n| Cadence / days until due | ${review.governance.reviewCadenceDays} days / ${review.governance.daysUntilDue} |\n| Review status | **${review.governance.status.toUpperCase()}** |\n| Cases / multi-turn / retrieval-boundary | ${review.inventory.cases} / ${review.inventory.multiTurnCases} / ${review.inventory.retrievalBoundaryCases} |\n\n## Recommended actions\n\n${actionRows}\n`;
}
