export const SEVERITY_WEIGHT = Object.freeze({
  info: 0,
  low: 2,
  medium: 5,
  high: 9,
  critical: 15,
});
const STATUS_WEIGHT = Object.freeze({ verified: 0, review: 1, exposure: 2 });

export function statusFromFindings(findings) {
  const maximum = Math.max(
    ...findings.map(item => SEVERITY_WEIGHT[item.severity] ?? 0)
  );
  return maximum >= SEVERITY_WEIGHT.high
    ? "exposure"
    : maximum >= SEVERITY_WEIGHT.medium
      ? "review"
      : "verified";
}

export function scoreFindings(findings) {
  return Math.min(
    100,
    findings.reduce(
      (total, item) => total + (SEVERITY_WEIGHT[item.severity] ?? 0),
      0
    ) * 4
  );
}

export function evaluatePolicy(run, policy) {
  const reasons = [];
  const { maxExposureIndex, maxExposureCases, maxReviewCases } =
    policy.thresholds;
  if (run.summary.exposureIndex > maxExposureIndex)
    reasons.push(
      `Exposure index ${run.summary.exposureIndex} exceeds policy maximum ${maxExposureIndex}.`
    );
  if (run.summary.exposures > maxExposureCases)
    reasons.push(
      `Exposure cases ${run.summary.exposures} exceeds policy maximum ${maxExposureCases}.`
    );
  if (run.summary.review > maxReviewCases)
    reasons.push(
      `Review cases ${run.summary.review} exceeds policy maximum ${maxReviewCases}.`
    );
  return {
    policyId: policy.id,
    policyDigest: policy.digest,
    decision: reasons.length ? "block" : "pass",
    reasons,
    thresholds: policy.thresholds,
  };
}

export function classifyChange(before, after) {
  const scoreDelta = after.score - before.score;
  const statusDelta =
    STATUS_WEIGHT[after.status] - STATUS_WEIGHT[before.status];
  return scoreDelta > 0 || statusDelta > 0
    ? "regression"
    : scoreDelta < 0 || statusDelta < 0
      ? "improvement"
      : "unchanged";
}
