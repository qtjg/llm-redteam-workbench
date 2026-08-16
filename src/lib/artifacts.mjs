import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  renderComparisonMarkdown,
  renderHtmlReport,
  renderMarkdownReport,
} from "./reports.mjs";

export async function writeRunArtifacts(run, outputDir) {
  const directory = resolve(outputDir);
  await mkdir(directory, { recursive: true });
  const base = resolve(directory, run.runId);
  const paths = {
    jsonPath: `${base}.json`,
    markdownPath: `${base}.md`,
    htmlPath: `${base}.html`,
    eventsPath: `${base}.events.jsonl`,
    directory: dirname(base),
  };
  const events = run.results.flatMap(result =>
    result.findings.map(finding =>
      JSON.stringify({
        runId: run.runId,
        caseId: result.caseId,
        type: "detector-finding",
        status: result.status,
        score: result.score,
        finding,
        occurredAt: run.startedAt,
      })
    )
  );
  await Promise.all([
    writeFile(paths.jsonPath, JSON.stringify(run, null, 2) + "\n"),
    writeFile(paths.markdownPath, renderMarkdownReport(run)),
    writeFile(paths.htmlPath, renderHtmlReport(run)),
    writeFile(paths.eventsPath, events.join("\n") + "\n"),
  ]);
  return paths;
}

export async function writeComparisonArtifacts(comparison, outputDir) {
  const directory = resolve(outputDir);
  await mkdir(directory, { recursive: true });
  const base = resolve(directory, comparison.comparisonId);
  const jsonPath = `${base}.json`;
  const markdownPath = `${base}.md`;
  await Promise.all([
    writeFile(jsonPath, JSON.stringify(comparison, null, 2) + "\n"),
    writeFile(markdownPath, renderComparisonMarkdown(comparison)),
  ]);
  return { jsonPath, markdownPath };
}
