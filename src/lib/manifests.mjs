export const SCOPE_VERSION = 2;
export const SUITE_VERSION = 2;
export const POLICY_VERSION = 1;

export function validateScope(scope) {
  const errors = [];
  if (scope?.version !== SCOPE_VERSION)
    errors.push(`scope.version must be ${SCOPE_VERSION}.`);
  if (scope?.authorized !== true) errors.push("scope.authorized must be true.");
  if (!["fixture", "endpoint"].includes(scope?.mode))
    errors.push("scope.mode must be fixture or endpoint.");
  if (scope?.mockTools !== true)
    errors.push("scope.mockTools must remain true.");
  if (scope?.evidenceRetention !== "redacted-only")
    errors.push("scope.evidenceRetention must be redacted-only.");
  if (
    !Array.isArray(scope?.allowedTargets) ||
    scope.allowedTargets.length === 0
  )
    errors.push("scope.allowedTargets must contain at least one target.");
  if (
    scope?.mode === "fixture" &&
    (!scope.fixtureTarget ||
      !scope.allowedTargets.includes(scope.fixtureTarget))
  )
    errors.push("fixtureTarget must be present in allowedTargets.");
  if (scope?.mode === "endpoint" && scope.allowNetwork !== true)
    errors.push("endpoint mode requires allowNetwork: true.");
  return errors;
}

export function assertScope(scope, options) {
  const errors = validateScope(scope);
  if (errors.length)
    throw new Error(`Invalid scope manifest: ${errors.join(" ")}`);
  if (scope.mode === "fixture") return;
  if (!options.acknowledged)
    throw new Error("Endpoint mode requires --acknowledge-authorization.");
  if (!options.endpoint || !scope.allowedTargets.includes(options.endpoint))
    throw new Error("Endpoint is not allowlisted by scope.allowedTargets.");
}

export function validateSuiteManifest(suites, detectorIds) {
  const errors = [];
  if (suites?.version !== SUITE_VERSION)
    errors.push(`suite version must be ${SUITE_VERSION}.`);
  if (!Array.isArray(suites?.suites) || suites.suites.length === 0)
    return [...errors, "suite manifest must contain at least one suite."];
  const seen = new Set();
  for (const testCase of suites.suites) {
    if (!testCase.id || !/^[A-Z]{2,4}-\d{2}$/.test(testCase.id))
      errors.push("every suite requires a stable ID such as PI-01.");
    if (seen.has(testCase.id))
      errors.push(`suite ID ${testCase.id} is duplicated.`);
    seen.add(testCase.id);
    if (!testCase.title || !testCase.category || !testCase.prompt)
      errors.push(
        `${testCase.id ?? "suite"} is missing title, category, or prompt.`
      );
    if (!Array.isArray(testCase.coverage) || testCase.coverage.length === 0)
      errors.push(`${testCase.id} must declare coverage tags.`);
    if (!Array.isArray(testCase.detectors) || testCase.detectors.length === 0)
      errors.push(`${testCase.id} must declare at least one detector.`);
    for (const detector of testCase.detectors ?? [])
      if (!detectorIds.includes(detector))
        errors.push(`${testCase.id} references unknown detector ${detector}.`);
    if (
      typeof testCase.fixtureResponse !== "string" &&
      !Array.isArray(testCase.fixtureResponses)
    )
      errors.push(
        `${testCase.id} requires fixtureResponse or fixtureResponses.`
      );
  }
  return errors;
}

export function validatePolicy(policy) {
  const errors = [];
  if (policy?.version !== POLICY_VERSION)
    errors.push(`policy.version must be ${POLICY_VERSION}.`);
  if (
    !Number.isInteger(policy?.thresholds?.maxExposureIndex) ||
    policy.thresholds.maxExposureIndex < 0 ||
    policy.thresholds.maxExposureIndex > 100
  )
    errors.push(
      "policy.thresholds.maxExposureIndex must be an integer from 0 to 100."
    );
  if (
    !Number.isInteger(policy?.thresholds?.maxExposureCases) ||
    policy.thresholds.maxExposureCases < 0
  )
    errors.push(
      "policy.thresholds.maxExposureCases must be a non-negative integer."
    );
  if (
    !Number.isInteger(policy?.thresholds?.maxReviewCases) ||
    policy.thresholds.maxReviewCases < 0
  )
    errors.push(
      "policy.thresholds.maxReviewCases must be a non-negative integer."
    );
  return errors;
}
