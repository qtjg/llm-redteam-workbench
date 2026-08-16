import { digestJson } from "./codec.mjs";

export const COVERAGE_AUDIT_SCHEMA_VERSION = 1;

function fixtureMode(testCase) {
  const multiTurn = Array.isArray(testCase.turns) && testCase.turns.length > 0;
  const retrieval =
    Array.isArray(testCase.retrievalContexts) &&
    testCase.retrievalContexts.length > 0;
  if (multiTurn && retrieval) return "multi-turn + retrieval";
  if (multiTurn) return "multi-turn";
  if (retrieval) return "retrieval-boundary";
  return "single-turn";
}

function groupedEntries(entries, key, value) {
  const grouped = new Map();
  for (const entry of entries) {
    const groupKey = key(entry);
    const values = grouped.get(groupKey) ?? [];
    values.push(value(entry));
    grouped.set(groupKey, values);
  }
  return [...grouped.entries()]
    .map(([name, caseIds]) => ({ name, caseIds: caseIds.sort() }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function tagEntries(testCases, property) {
  const groups = new Map();
  for (const testCase of testCases)
    for (const tag of testCase[property] ?? []) {
      const caseIds = groups.get(tag) ?? [];
      caseIds.push(testCase.id);
      groups.set(tag, caseIds);
    }
  return [...groups.entries()]
    .map(([name, caseIds]) => ({ name, caseIds: caseIds.sort() }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function createCoverageAudit(
  suiteData,
  registeredDetectorIds = [],
  sourceRevision = "unversioned"
) {
  const testCases = suiteData.suites.map(testCase => ({
    caseId: testCase.id,
    title: testCase.title,
    category: testCase.category,
    coverage: [...testCase.coverage].sort(),
    detectors: [...testCase.detectors].sort(),
    mode: fixtureMode(testCase),
    turnCount: testCase.turns?.length ?? 1,
    retrievalContextCount: testCase.retrievalContexts?.length ?? 0,
  }));
  const usedDetectorIds = [
    ...new Set(testCases.flatMap(testCase => testCase.detectors)),
  ].sort();
  const registered = [...new Set(registeredDetectorIds)].sort();
  const unusedDetectorIds = registered.filter(
    detector => !usedDetectorIds.includes(detector)
  );
  const detectorRows = registered.map(id => ({
    id,
    caseIds: testCases
      .filter(testCase => testCase.detectors.includes(id))
      .map(testCase => testCase.caseId)
      .sort(),
  }));
  const categories = groupedEntries(
    testCases,
    testCase => testCase.category,
    testCase => testCase.caseId
  );
  const threatClasses = tagEntries(suiteData.suites, "coverage");
  const auditBasis = {
    suiteDigest: digestJson(suiteData),
    registeredDetectorIds: registered,
    sourceRevision,
  };
  return {
    schemaVersion: COVERAGE_AUDIT_SCHEMA_VERSION,
    auditId: `coverage_${digestJson(auditBasis).slice(0, 12)}`,
    suiteName: suiteData.suiteName,
    suiteDigest: auditBasis.suiteDigest,
    sourceRevision,
    summary: {
      cases: testCases.length,
      categories: categories.length,
      threatClasses: threatClasses.length,
      detectorsUsed: usedDetectorIds.length,
      registeredDetectors: registered.length,
      singleTurnCases: testCases.filter(
        testCase => testCase.mode === "single-turn"
      ).length,
      multiTurnCases: testCases.filter(testCase =>
        testCase.mode.includes("multi-turn")
      ).length,
      retrievalBoundaryCases: testCases.filter(testCase =>
        testCase.mode.includes("retrieval")
      ).length,
      unusedDetectorCount: unusedDetectorIds.length,
    },
    categories,
    threatClasses,
    detectors: detectorRows,
    unusedDetectorIds,
    cases: testCases,
  };
}

export function renderCoverageMarkdown(audit) {
  const categoryRows = audit.categories
    .map(entry => `| ${entry.name} | ${entry.caseIds.join(", ")} |`)
    .join("\n");
  const threatRows = audit.threatClasses
    .map(entry => `| ${entry.name} | ${entry.caseIds.join(", ")} |`)
    .join("\n");
  const detectorRows = audit.detectors
    .map(entry => `| ${entry.id} | ${entry.caseIds.join(", ") || "—"} |`)
    .join("\n");
  const caseRows = audit.cases
    .map(
      testCase =>
        `| ${testCase.caseId} | ${testCase.category} | ${testCase.mode} | ${testCase.turnCount} | ${testCase.retrievalContextCount} | ${testCase.detectors.join(", ")} |`
    )
    .join("\n");
  return `# Redline coverage audit\n\n> This manifest-level audit describes declared fixture coverage. It does not execute a model, contact a target, or retain raw prompts or retrieval content.\n\n| Field | Value |\n|---|---|\n| Audit | \`${audit.auditId}\` |\n| Suite | ${audit.suiteName} |\n| Suite digest | \`${audit.suiteDigest}\` |\n| Source revision | \`${audit.sourceRevision}\` |\n| Cases / categories / threat classes | ${audit.summary.cases} / ${audit.summary.categories} / ${audit.summary.threatClasses} |\n| Single-turn / multi-turn / retrieval-boundary cases | ${audit.summary.singleTurnCases} / ${audit.summary.multiTurnCases} / ${audit.summary.retrievalBoundaryCases} |\n| Used / registered detectors | ${audit.summary.detectorsUsed} / ${audit.summary.registeredDetectors} |\n| Registered but unused detectors | ${audit.unusedDetectorIds.join(", ") || "none"} |\n\n## Categories\n\n| Category | Cases |\n|---|---|\n${categoryRows}\n\n## Threat classes\n\n| Coverage tag | Cases |\n|---|---|\n${threatRows}\n\n## Detector use\n\n| Detector | Cases |\n|---|---|\n${detectorRows}\n\n## Fixture inventory\n\n| Case | Category | Mode | Turns | Retrieval contexts | Detectors |\n|---|---|---|---:|---:|---|\n${caseRows}\n`;
}
