function escapeHtml(value) {
  return String(value).replace(
    /[&<>'"]/g,
    character =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        character
      ]
  );
}

export function renderMarkdownReport(run) {
  const rows = run.results
    .map(
      result =>
        `| ${result.caseId} | ${result.category} | ${result.status.toUpperCase()} | ${result.score}/100 | ${result.findings.map(finding => `${finding.title} (${Math.round(finding.reproductionRate * 100)}%)`).join("; ")} |`
    )
    .join("\n");
  return `# Redline evaluation report\n\n> Evidence-led and scope-bounded: raw prompts, credentials, and tool results are never stored.\n\n| Field | Value |\n|---|---|\n| Run | \`${run.runId}\` |\n| Artifact digest | \`${run.artifactDigest}\` |\n| Mode / target | ${run.mode} / ${run.target} |\n| Exposure index | **${run.summary.exposureIndex}/100** |\n| Policy decision | **${run.policy.decision.toUpperCase()}** |\n| Cases / attempts | ${run.summary.cases} / ${run.summary.attempts} |\n\n## Findings\n\n| Case | Category | Result | Score | Detector output |\n|---|---|---:|---:|---|\n${rows}\n\n## Provenance\n\n| Component | SHA-256 digest |\n|---|---|\n| Scope | \`${run.provenance.scopeDigest}\` |\n| Suite | \`${run.provenance.suiteDigest}\` |\n| Detector registry | \`${run.provenance.detectorDigest}\` |\n| Risk policy | \`${run.provenance.policyDigest}\` |\n| Source revision | \`${run.provenance.sourceRevision}\` |\n\n## Scope\n\nTested threat classes: ${run.coverage.threatClasses.join(", ")}. Explicitly untested: ${run.coverage.explicitlyUntested.join(", ")}.\n`;
}

export function renderHtmlReport(run) {
  const rows = run.results
    .map(
      result =>
        `<tr><td>${escapeHtml(result.caseId)}</td><td>${escapeHtml(result.category)}</td><td class="${escapeHtml(result.status)}">${escapeHtml(result.status.toUpperCase())}</td><td>${result.score}/100</td></tr>`
    )
    .join("");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Redline ${escapeHtml(run.runId)}</title><style>body{margin:0;background:#101512;color:#eaf1e9;font:15px system-ui,sans-serif;line-height:1.55}main{max-width:960px;margin:auto;padding:48px 24px}h1{font-size:32px}.tag,code{color:#c7f36b;font-family:ui-monospace,monospace}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.card,table{background:#171d19;border:1px solid #2f3c33;border-radius:12px;padding:16px}.card strong{font-size:28px;display:block}table{margin-top:24px;width:100%;padding:0;border-collapse:separate;border-spacing:0;overflow:hidden}th,td{padding:12px;text-align:left;border-bottom:1px solid #2f3c33}.exposure{color:#ff9389}.review{color:#f3bd69}.verified{color:#c7f36b}@media(max-width:650px){.metrics{grid-template-columns:repeat(2,1fr)}}</style><main><p class="tag">REDLINE · REDACTED EVALUATION ARTIFACT</p><h1>Evidence-led AI safety evaluation</h1><p>Run <code>${escapeHtml(run.runId)}</code> · policy <strong>${escapeHtml(run.policy.decision.toUpperCase())}</strong></p><section class="metrics"><div class="card">Exposure index<strong>${run.summary.exposureIndex}/100</strong></div><div class="card">Cases<strong>${run.summary.cases}</strong></div><div class="card">Exposures<strong>${run.summary.exposures}</strong></div><div class="card">Attempts<strong>${run.summary.attempts}</strong></div></section><table><thead><tr><th>Case</th><th>Category</th><th>Result</th><th>Score</th></tr></thead><tbody>${rows}</tbody></table><p>Artifact digest: <code>${escapeHtml(run.artifactDigest)}</code></p><p>Raw prompts and responses are not included. Tool execution remains mocked.</p></main>`;
}

export function renderComparisonMarkdown(comparison) {
  const rows = comparison.changes
    .map(
      change =>
        `| ${change.caseId} | ${change.kind.toUpperCase()} | ${change.beforeScore ?? "—"} | ${change.afterScore ?? "—"} | ${change.detail} |`
    )
    .join("\n");
  return `# Redline regression comparison\n\n| Field | Value |\n|---|---|\n| Comparison | \`${comparison.comparisonId}\` |\n| Exposure delta | **${comparison.summary.exposureDelta >= 0 ? "+" : ""}${comparison.summary.exposureDelta}** |\n| Regressions / improvements / unchanged | ${comparison.summary.regressions} / ${comparison.summary.improvements} / ${comparison.summary.unchanged} |\n| Coverage changed | ${comparison.summary.coverageChanged ? "yes" : "no"} |\n\n| Case | Change | Baseline | Current | Interpretation |\n|---|---|---:|---:|---|\n${rows}\n`;
}
