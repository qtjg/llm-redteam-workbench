export const SCOPE_VERSION = 2;
export const SUITE_VERSION = 3;
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

function hasFixtureResponse(value) {
  return (
    typeof value?.fixtureResponse === "string" ||
    (Array.isArray(value?.fixtureResponses) &&
      value.fixtureResponses.length > 0)
  );
}

function validateTurns(testCase, errors) {
  if (!Array.isArray(testCase.turns) || testCase.turns.length === 0) return;
  const turnIds = new Set();
  for (const [index, turn] of testCase.turns.entries()) {
    const label = `${testCase.id}:turn-${index + 1}`;
    if (!turn?.id || !/^[a-z0-9-]+$/i.test(turn.id))
      errors.push(`${label} requires a stable turn id.`);
    if (turnIds.has(turn?.id))
      errors.push(`${testCase.id} contains duplicate turn id ${turn.id}.`);
    turnIds.add(turn?.id);
    if (typeof turn?.prompt !== "string" || !turn.prompt.trim())
      errors.push(`${label} requires a prompt.`);
    if (!hasFixtureResponse(turn))
      errors.push(`${label} requires fixtureResponse or fixtureResponses.`);
    if (
      turn?.detectors !== undefined &&
      (!Array.isArray(turn.detectors) || turn.detectors.length === 0)
    )
      errors.push(
        `${label}.detectors must be a non-empty array when declared.`
      );
  }
}

function validateRetrievalContexts(testCase, errors) {
  if (testCase.retrievalContexts === undefined) return;
  if (!Array.isArray(testCase.retrievalContexts)) {
    errors.push(`${testCase.id}.retrievalContexts must be an array.`);
    return;
  }
  const seen = new Set();
  for (const context of testCase.retrievalContexts) {
    if (!context?.id || !context?.source || typeof context.content !== "string")
      errors.push(
        `${testCase.id} retrieval contexts require id, source, and synthetic content.`
      );
    if (seen.has(context?.id))
      errors.push(
        `${testCase.id} contains duplicate retrieval context ${context.id}.`
      );
    seen.add(context?.id);
    if (context?.trust && !["untrusted", "trusted"].includes(context.trust))
      errors.push(
        `${testCase.id} retrieval context trust must be untrusted or trusted.`
      );
  }
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
    if (!testCase.title || !testCase.category)
      errors.push(`${testCase.id ?? "suite"} is missing title or category.`);
    if (
      !testCase.prompt &&
      (!Array.isArray(testCase.turns) || !testCase.turns.length)
    )
      errors.push(`${testCase.id ?? "suite"} requires prompt or turns.`);
    if (!Array.isArray(testCase.coverage) || testCase.coverage.length === 0)
      errors.push(`${testCase.id} must declare coverage tags.`);
    if (!Array.isArray(testCase.detectors) || testCase.detectors.length === 0)
      errors.push(`${testCase.id} must declare at least one detector.`);
    for (const detector of testCase.detectors ?? [])
      if (!detectorIds.includes(detector))
        errors.push(`${testCase.id} references unknown detector ${detector}.`);
    for (const turn of testCase.turns ?? [])
      for (const detector of turn.detectors ?? [])
        if (!detectorIds.includes(detector))
          errors.push(
            `${testCase.id}:${turn.id} references unknown detector ${detector}.`
          );
    if (!testCase.turns?.length && !hasFixtureResponse(testCase))
      errors.push(
        `${testCase.id} requires fixtureResponse or fixtureResponses.`
      );
    validateTurns(testCase, errors);
    validateRetrievalContexts(testCase, errors);
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
