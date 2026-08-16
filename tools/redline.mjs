#!/usr/bin/env node
/** Redline CLI — an authorized, defensive AI/LLM evaluation runner. */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { compareRuns, detectorCatalog, executeRun, readJson, renderHtmlReport, renderMarkdownReport, writeComparisonArtifacts, writeRunArtifacts } from "./core.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_SCOPE = resolve(ROOT, "fixtures/redline.scope.json");
const DEFAULT_SUITES = resolve(ROOT, "fixtures/redline.suites.json");

function usage() {
  console.log(`
redline — authorized, evidence-led AI/LLM evaluation runner

Usage:
  redline doctor [--scope path]
  redline list [--suites path]
  redline run [--suite all|ID] [--repeat 1..20] [--scope path] [--out directory]
  redline run --adapter openai-compatible --endpoint URL --model NAME --api-key-env ENV --acknowledge-authorization [--scope path] [--suite all|ID]
  redline report --input run.json [--format markdown|html] [--out report]
  redline compare --baseline run-a.json --current run-b.json [--out directory]

Safety model:
  Fixture mode is the default and never contacts a network target.
  Endpoint mode requires an exact allowlisted scope manifest, mockTools: true,
  allowNetwork: true, and --acknowledge-authorization.
`);
}

function readOption(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function hasFlag(args, name) { return args.includes(name); }

function positiveInteger(value, flagName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) throw new Error(`${flagName} must be an integer from 1 to 20.`);
  return parsed;
}

function sourceRevision() {
  try { return execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(); } catch { return "unversioned"; }
}

function printRun(run, artifacts) {
  console.log(`\nRedline run ${run.runId}`);
  console.log(`  Mode: ${run.mode} · Target: ${run.target}`);
  console.log(`  Exposure index: ${run.summary.exposureIndex}/100`);
  console.log(`  Cases: ${run.summary.cases} · attempts ${run.summary.attempts} · exposure ${run.summary.exposures} · review ${run.summary.review} · verified ${run.summary.verified}`);
  console.log(`  Provenance: scope ${run.provenance.scopeDigest.slice(0, 12)} · suite ${run.provenance.suiteDigest.slice(0, 12)} · revision ${run.provenance.sourceRevision}`);
  for (const result of run.results) console.log(`  [${result.status.toUpperCase()}] ${result.caseId} ${result.title} (${result.score}/100)`);
  console.log(`\nArtifacts (redacted):\n  ${artifacts.jsonPath}\n  ${artifacts.markdownPath}\n  ${artifacts.htmlPath}\n  ${artifacts.eventsPath}`);
}

async function main() {
  const [, , command = "help", ...args] = process.argv;
  if (["help", "--help", "-h"].includes(command)) return usage();
  const scopePath = resolve(readOption(args, "--scope", DEFAULT_SCOPE));
  const suitesPath = resolve(readOption(args, "--suites", DEFAULT_SUITES));
  const needsScope = !["report", "compare"].includes(command);
  if (needsScope && !existsSync(scopePath)) throw new Error(`Scope manifest not found: ${scopePath}`);
  if (needsScope && !existsSync(suitesPath)) throw new Error(`Suite manifest not found: ${suitesPath}`);

  if (command === "doctor") {
    const scope = await readJson(scopePath);
    console.log("\nRedline scope doctor");
    console.log(`  Authorized: ${scope.authorized === true ? "yes" : "no"}`);
    console.log(`  Mode: ${scope.mode}`);
    console.log(`  Mock tools: ${scope.mockTools === true ? "enforced" : "missing"}`);
    console.log(`  Network: ${scope.allowNetwork ? "allowlisted endpoint only" : "disabled"}`);
    console.log(`  Evidence retention: ${scope.evidenceRetention ?? "unspecified"}`);
    console.log(`  Fixture target: ${scope.fixtureTarget ?? "not configured"}`);
    console.log(`  Detectors: ${detectorCatalog().map((detector) => detector.id).join(", ")}`);
    if (scope.authorized !== true || scope.mockTools !== true) process.exitCode = 2;
    return;
  }

  if (command === "list") {
    const suites = await readJson(suitesPath);
    console.log("\nAvailable bounded suites:");
    for (const testCase of suites.suites) console.log(`  ${testCase.id}  ${testCase.category.padEnd(24)} ${testCase.title}\n          coverage: ${(testCase.coverage ?? []).join(", ")} · detectors: ${(testCase.detectors ?? []).join(", ")}`);
    return;
  }

  if (command === "report") {
    const input = readOption(args, "--input");
    if (!input) throw new Error("report requires --input run.json");
    const run = await readJson(resolve(input));
    const format = readOption(args, "--format", "markdown");
    if (!["markdown", "html"].includes(format)) throw new Error("--format must be markdown or html.");
    const output = resolve(readOption(args, "--out", `${input}.${format === "html" ? "html" : "md"}`));
    await writeFile(output, format === "html" ? renderHtmlReport(run) : renderMarkdownReport(run));
    console.log(`Wrote ${format} report: ${output}`);
    return;
  }

  if (command === "compare") {
    const baselinePath = readOption(args, "--baseline");
    const currentPath = readOption(args, "--current");
    if (!baselinePath || !currentPath) throw new Error("compare requires --baseline run-a.json and --current run-b.json");
    const comparison = compareRuns(await readJson(resolve(baselinePath)), await readJson(resolve(currentPath)));
    const artifacts = await writeComparisonArtifacts(comparison, readOption(args, "--out", resolve(ROOT, "redline-out")));
    console.log(`\nRedline comparison ${comparison.comparisonId}`);
    console.log(`  Exposure delta: ${comparison.summary.exposureDelta >= 0 ? "+" : ""}${comparison.summary.exposureDelta}`);
    console.log(`  Regressions: ${comparison.summary.regressions} · Improvements: ${comparison.summary.improvements} · Unchanged: ${comparison.summary.unchanged}`);
    console.log(`  Artifacts:\n  ${artifacts.jsonPath}\n  ${artifacts.markdownPath}`);
    return;
  }

  if (command === "run") {
    const scope = await readJson(scopePath);
    const suites = await readJson(suitesPath);
    const adapter = readOption(args, "--adapter", "fixture");
    const endpoint = readOption(args, "--endpoint");
    const model = readOption(args, "--model", "not-applicable");
    const apiKeyEnv = readOption(args, "--api-key-env");
    if (adapter !== "fixture" && adapter !== "openai-compatible") throw new Error(`Unsupported adapter: ${adapter}`);
    if (adapter === "openai-compatible" && scope.mode !== "endpoint") throw new Error("OpenAI-compatible adapter requires an endpoint-mode scope manifest.");
    const run = await executeRun({
      scope,
      suiteData: suites,
      suiteId: readOption(args, "--suite", "all"),
      endpoint,
      model,
      apiKey: apiKeyEnv ? process.env[apiKeyEnv] : undefined,
      acknowledged: hasFlag(args, "--acknowledge-authorization"),
      repeat: positiveInteger(readOption(args, "--repeat", "1"), "--repeat"),
      sourceRevision: sourceRevision(),
    });
    const artifacts = await writeRunArtifacts(run, readOption(args, "--out", resolve(ROOT, "redline-out")));
    printRun(run, artifacts);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`\nredline error: ${error.message}`);
  process.exitCode = 1;
});
