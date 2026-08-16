import { verifyRunIntegrity } from "./evaluator.mjs";
import { applyPolicyExceptions } from "./exceptions.mjs";
import { evaluatePolicy } from "./policy.mjs";

export const RELEASE_READINESS_SCHEMA_VERSION = 2;

function check(id, status, title, detail) {
  return { id, status, title, detail };
}

export function createReleaseReadiness(run, policy, { now } = {}) {
  const integrity = verifyRunIntegrity(run);
  const rawPolicyDecision = evaluatePolicy(run, policy);
  const exceptionReview = applyPolicyExceptions(
    run,
    policy.exceptions ?? [],
    now
  );
  const policyDecision = evaluatePolicy(
    {
      ...run,
      summary: { ...run.summary, ...exceptionReview.effectiveSummary },
    },
    policy
  );
  const hasProvenance = Boolean(
    run.provenance?.scopeDigest &&
      run.provenance?.suiteDigest &&
      run.provenance?.detectorDigest &&
      run.provenance?.policyDigest &&
      run.provenance?.sourceRevision
  );
  const checks = [
    check(
      "artifact-integrity",
      integrity.valid ? "pass" : "fail",
      "Artifact integrity",
      integrity.valid
        ? "The run artifact digest matches its current payload."
        : (integrity.reason ?? "The artifact digest cannot be verified.")
    ),
    check(
      "policy-gate",
      policyDecision.decision === "pass" ? "pass" : "fail",
      "Policy gate",
      policyDecision.decision === "pass"
        ? `Policy ${policy.id} accepted the effective safety summary${exceptionReview.applied.length ? ` after ${exceptionReview.applied.length} active exception(s)` : ""}.`
        : policyDecision.reasons.join(" ")
    ),
    check(
      "policy-exceptions",
      exceptionReview.validationErrors.length || exceptionReview.expired.length
        ? "fail"
        : "pass",
      "Time-bound policy exceptions",
      exceptionReview.validationErrors.length
        ? exceptionReview.validationErrors.join(" ")
        : exceptionReview.expired.length
          ? `Expired exceptions: ${exceptionReview.expired.map(exception => exception.id).join(", ")}.`
          : exceptionReview.applied.length
            ? `Applied exceptions: ${exceptionReview.applied.map(exception => `${exception.id} (expires ${exception.expiresAt})`).join(", ")}.`
            : "No active policy exceptions were applied."
    ),
    check(
      "redacted-evidence",
      run.safety?.rawPayloadsStored === false ? "pass" : "fail",
      "Redacted evidence retention",
      run.safety?.rawPayloadsStored === false
        ? "The run declares that raw payloads were not stored."
        : "The run does not prove redacted-only evidence retention."
    ),
    check(
      "bounded-execution",
      run.safety?.authorized === true &&
        run.safety?.mockTools === true &&
        run.safety?.endpointAllowlisted === true
        ? "pass"
        : "fail",
      "Bounded execution",
      run.safety?.authorized === true &&
        run.safety?.mockTools === true &&
        run.safety?.endpointAllowlisted === true
        ? "Authorization, mocked-tool, and target-allowlist declarations are present."
        : "One or more bounded-execution declarations are missing."
    ),
    check(
      "provenance",
      hasProvenance ? "pass" : "fail",
      "Reproducible provenance",
      hasProvenance
        ? "Scope, suite, detector, policy, and source-revision provenance are present."
        : "One or more required provenance fields are missing."
    ),
  ];
  const failedChecks = checks.filter(item => item.status === "fail");
  return {
    schemaVersion: RELEASE_READINESS_SCHEMA_VERSION,
    runId: run.runId,
    artifactDigest: run.artifactDigest,
    decision: failedChecks.length
      ? "hold"
      : exceptionReview.applied.length
        ? "ready-with-exceptions"
        : "ready",
    checks,
    policy: policyDecision,
    rawPolicy: rawPolicyDecision,
    exceptions: exceptionReview,
    summary: {
      exposureIndex: exceptionReview.effectiveSummary.exposureIndex,
      exposures: exceptionReview.effectiveSummary.exposures,
      review: exceptionReview.effectiveSummary.review,
      verified: exceptionReview.effectiveSummary.verified,
      rawExposureIndex: run.summary.exposureIndex,
      rawExposures: run.summary.exposures,
      rawReview: run.summary.review,
      rawVerified: run.summary.verified,
      cases: run.summary.cases,
      turns: run.summary.turns ?? 0,
      retrievalContexts: run.summary.retrievalContexts ?? 0,
    },
    coverage: {
      threatClasses: run.coverage?.threatClasses ?? [],
      multiTurnCases: run.coverage?.multiTurnCases ?? [],
      retrievalBoundaryCases: run.coverage?.retrievalBoundaryCases ?? [],
      governance: run.coverage?.suiteGovernance ?? null,
    },
    findings: run.results.flatMap(result =>
      result.findings
        .filter(finding => finding.id !== "OBS-CLEAR")
        .map(finding => ({
          caseId: result.caseId,
          findingId: finding.id,
          severity: finding.severity,
          detector: finding.detector,
          title: finding.title,
          reproductionRate: finding.reproductionRate,
        }))
    ),
    recommendedActions: failedChecks.length
      ? failedChecks.map(item => `${item.title}: ${item.detail}`)
      : [
          "Retain the run artifact and policy manifest with the release record.",
          "Re-run the same suite when the model, retrieval corpus, policy, or detector registry changes.",
        ],
  };
}

export function renderReleaseReadinessMarkdown(readiness) {
  const checkRows = readiness.checks
    .map(
      item =>
        `| ${item.title} | ${item.status.toUpperCase()} | ${item.detail} |`
    )
    .join("\n");
  const findingRows = readiness.findings.length
    ? readiness.findings
        .map(
          finding =>
            `| ${finding.caseId} | ${finding.findingId} | ${finding.severity.toUpperCase()} | ${finding.detector} | ${Math.round(finding.reproductionRate * 100)}% |`
        )
        .join("\n")
    : "| — | — | — | — | — |";
  const actionRows = readiness.recommendedActions
    .map(action => `- ${action}`)
    .join("\n");
  return `# Redline release-readiness summary\n\n> This utility evaluates a pre-existing, redacted run artifact. It does not execute a model, discover targets, or retain raw prompts, responses, credentials, or retrieval content.\n\n| Field | Value |\n|---|---|\n| Run | \`${readiness.runId}\` |\n| Artifact digest | \`${readiness.artifactDigest}\` |\n| Decision | **${readiness.decision.toUpperCase()}** |\n| Exposure index | ${readiness.summary.exposureIndex}/100 |\n| Cases / turns / retrieval contexts | ${readiness.summary.cases} / ${readiness.summary.turns} / ${readiness.summary.retrievalContexts} |\n| Exposures / review / verified | ${readiness.summary.exposures} / ${readiness.summary.review} / ${readiness.summary.verified} |\n| Active / expired exceptions | ${readiness.exceptions.applied.length} / ${readiness.exceptions.expired.length} |\n| Suite owner / reviewer | ${readiness.coverage.governance?.owner ?? "not declared"} / ${readiness.coverage.governance?.reviewer ?? "not declared"} |\n\n## Release checks\n\n| Check | Status | Detail |\n|---|---|---|\n${checkRows}\n\n## Recorded findings\n\n| Case | Finding | Severity | Detector | Reproduction |\n|---|---|---|---|---:|\n${findingRows}\n\n## Recommended actions\n\n${actionRows}\n`;
}
