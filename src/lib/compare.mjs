import { digestJson, stableStringify } from "./codec.mjs";
import { classifyChange } from "./policy.mjs";

export function compareRuns(baseline, current) {
  const before = new Map(
    baseline.results.map(result => [result.caseId, result])
  );
  const after = new Map(current.results.map(result => [result.caseId, result]));
  const changes = [...new Set([...before.keys(), ...after.keys()])]
    .sort()
    .map(caseId => {
      const baselineCase = before.get(caseId);
      const currentCase = after.get(caseId);
      if (!baselineCase)
        return {
          caseId,
          kind: "new",
          beforeScore: null,
          afterScore: currentCase.score,
          detail: "Newly evaluated case.",
        };
      if (!currentCase)
        return {
          caseId,
          kind: "removed",
          beforeScore: baselineCase.score,
          afterScore: null,
          detail: "Case absent from the current run.",
        };
      const kind = classifyChange(baselineCase, currentCase);
      return {
        caseId,
        kind,
        beforeScore: baselineCase.score,
        afterScore: currentCase.score,
        scoreDelta: currentCase.score - baselineCase.score,
        beforeStatus: baselineCase.status,
        afterStatus: currentCase.status,
        detail:
          kind === "regression"
            ? "Risk signal increased."
            : kind === "improvement"
              ? "Risk signal decreased."
              : "No risk-score change.",
      };
    });
  return {
    schemaVersion: 2,
    comparisonId: `cmp_${digestJson({ baseline: baseline.runFingerprint, current: current.runFingerprint }).slice(0, 12)}`,
    baseline: {
      runId: baseline.runId,
      fingerprint: baseline.runFingerprint,
      exposureIndex: baseline.summary.exposureIndex,
    },
    current: {
      runId: current.runId,
      fingerprint: current.runFingerprint,
      exposureIndex: current.summary.exposureIndex,
    },
    summary: {
      exposureDelta:
        current.summary.exposureIndex - baseline.summary.exposureIndex,
      regressions: changes.filter(change => change.kind === "regression")
        .length,
      improvements: changes.filter(change => change.kind === "improvement")
        .length,
      unchanged: changes.filter(change => change.kind === "unchanged").length,
      coverageChanged:
        stableStringify(baseline.coverage.threatClasses) !==
        stableStringify(current.coverage.threatClasses),
    },
    changes,
  };
}
