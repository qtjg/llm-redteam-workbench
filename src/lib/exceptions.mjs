import { scoreFindings, statusFromFindings } from "./policy.mjs";

export const POLICY_EXCEPTION_SCHEMA_VERSION = 1;

function isIsoDate(value) {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)
  );
}

export function validatePolicyExceptions(exceptions) {
  if (exceptions === undefined) return [];
  const errors = [];
  if (!Array.isArray(exceptions))
    return ["policy.exceptions must be an array."];
  const ids = new Set();
  for (const exception of exceptions) {
    const label = `policy exception ${exception?.id ?? "<unknown>"}`;
    if (!exception?.id || !/^EX-[A-Z0-9-]+$/i.test(exception.id))
      errors.push(`${label} requires a stable EX-* id.`);
    if (ids.has(exception?.id))
      errors.push(`${label} duplicates an existing exception id.`);
    ids.add(exception?.id);
    if (!exception?.caseId || !/^[A-Z]{2,4}-\d{2}$/.test(exception.caseId))
      errors.push(`${label} requires an exact suite caseId.`);
    if (!exception?.findingId || !/^[A-Z][A-Z0-9-]+$/.test(exception.findingId))
      errors.push(`${label} requires an exact findingId.`);
    if (typeof exception?.owner !== "string" || !exception.owner.trim())
      errors.push(`${label} requires an accountable owner.`);
    if (typeof exception?.reviewer !== "string" || !exception.reviewer.trim())
      errors.push(`${label} requires an independent reviewer role.`);
    if (
      typeof exception?.rationale !== "string" ||
      exception.rationale.trim().length < 16
    )
      errors.push(`${label} requires a rationale of at least 16 characters.`);
    if (!isIsoDate(exception?.expiresAt))
      errors.push(`${label} requires an ISO-8601 UTC expiresAt timestamp.`);
  }
  return errors;
}

function activeExceptionIndex(exceptions, now) {
  const active = new Map();
  const expired = [];
  for (const exception of exceptions) {
    if (Date.parse(exception.expiresAt) > Date.parse(now))
      active.set(`${exception.caseId}:${exception.findingId}`, exception);
    else expired.push(exception);
  }
  return { active, expired };
}

export function applyPolicyExceptions(
  run,
  exceptions = [],
  now = new Date().toISOString()
) {
  const validationErrors = validatePolicyExceptions(exceptions);
  const validExceptions = validationErrors.length ? [] : exceptions;
  const { active, expired } = activeExceptionIndex(validExceptions, now);
  const applied = [];
  const unmatched = [];
  const effectiveResults = run.results.map(result => {
    const findings = result.findings.filter(
      finding => finding.id !== "OBS-CLEAR"
    );
    const unresolved = findings.filter(finding => {
      const exception = active.get(`${result.caseId}:${finding.id}`);
      if (exception) {
        applied.push({
          id: exception.id,
          caseId: result.caseId,
          findingId: finding.id,
          owner: exception.owner,
          reviewer: exception.reviewer,
          expiresAt: exception.expiresAt,
        });
        return false;
      }
      return true;
    });
    return {
      ...result,
      findings: unresolved.length
        ? unresolved
        : [{ id: "OBS-CLEAR", severity: "info" }],
      score: unresolved.length ? scoreFindings(unresolved) : 0,
      status: unresolved.length ? statusFromFindings(unresolved) : "verified",
    };
  });
  for (const exception of validExceptions)
    if (
      !applied.some(appliedException => appliedException.id === exception.id) &&
      !expired.some(expiredException => expiredException.id === exception.id)
    )
      unmatched.push(exception);
  const summary = {
    exposureIndex: Math.round(
      effectiveResults.reduce((total, result) => total + result.score, 0) /
        effectiveResults.length
    ),
    exposures: effectiveResults.filter(result => result.status === "exposure")
      .length,
    review: effectiveResults.filter(result => result.status === "review")
      .length,
    verified: effectiveResults.filter(result => result.status === "verified")
      .length,
  };
  return {
    schemaVersion: POLICY_EXCEPTION_SCHEMA_VERSION,
    evaluatedAt: now,
    validationErrors,
    applied,
    expired,
    unmatched,
    effectiveSummary: summary,
  };
}
