#!/usr/bin/env node
/** Redline CLI — an authorized, defensive AI/LLM evaluation runner. */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { executeRun, readJson, renderMarkdownReport, writeRunArtifacts } from "./core.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_SCOPE = resolve(ROOT, "fixtures/redline.scope.json");
const DEFAULT_SUITES = resolve(ROOT, "fixtures/redline.suites.json");

function usage() {
  console.log(`
redline — authorized AI/LLM evaluation runner

Usage:
  redline doctor [--scope path]
  redline list [--suites path]
  redline run [--suite all|ID] [--scope path] [--out directory]
  redline run --adapter openai-compatible --endpoint URL --model NAME --api-key-env ENV --acknowledge-authorization [--scope path] [--suite all|ID]
  redline report --input run.json [--out report.md]

Safety model:
  Fixture mode is the default and never contacts a network target.
  Endpoint mode requires a matching allowlisted scope manifest, mockTools: true,
  allowNetwork: true, and --acknowledge-authorization.
`);
}

function readOption(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function hasFlag(args, name) { return args.includes(name); }

function printRun(run, artifacts) {
  console.log(`\nRedline run ${run.runId}`);
  console.log(`  Mode: ${run.mode} · Target: ${run.target}`);
  console.log(`  Exposure index: ${run.summary.exposureIndex}/100`);
  console.log(`  Cases: ${run.summary.cases} · exposure ${run.summary.exposures} · review ${run.summary.review} · verified ${run.summary.verified}`);
  for (const result of run.results) console.log(`  [${result.status.toUpperCase()}] ${result.caseId} ${result.title} (${result.score}/100)`);
  console.log(`\nArtifacts (redacted):\n  ${artifacts.jsonPath}\n  ${artifacts.markdownPath}`);
}

async function main() {
  const [, , command = "help", ...args] = process.argv;
  if (["help", "--help", "-h"].includes(command)) return usage();

  const scopePath = resolve(readOption(args, "--scope", DEFAULT_SCOPE));
  const suitesPath = resolve(readOption(args, "--suites", DEFAULT_SUITES));
  if (!existsSync(scopePath)) throw new Error(`Scope manifest not found: ${scopePath}`);
  if (!existsSync(suitesPath) && command !== "report") throw new Error(`Suite manifest not found: ${suitesPath}`);

  if (command === "doctor") {
    const scope = await readJson(scopePath);
    console.log("\nRedline scope doctor");
    console.log(`  Authorized: ${scope.authorized === true ? "yes" : "no"}`);
    console.log(`  Mode: ${scope.mode}`);
    console.log(`  Mock tools: ${scope.mockTools === true ? "enforced" : "missing"}`);
    console.log(`  Network: ${scope.allowNetwork ? "allowlisted endpoint only" : "disabled"}`);
    console.log(`  Fixture target: ${scope.fixtureTarget ?? "not configured"}`);
    if (scope.authorized !== true || scope.mockTools !== true) process.exitCode = 2;
    return;
  }

  if (command === "list") {
    const suites = await readJson(suitesPath);
    console.log("\nAvailable bounded suites:");
    for (const testCase of suites.suites) console.log(`  ${testCase.id}  ${testCase.category.padEnd(24)} ${testCase.title}`);
    return;
  }

  if (command === "report") {
    const input = readOption(args, "--input");
    if (!input) throw new Error("report requires --input run.json");
    const run = await readJson(resolve(input));
    const output = resolve(readOption(args, "--out", `${input}.md`));
    await (await import("node:fs/promises")).writeFile(output, renderMarkdownReport(run));
    console.log(`Wrote Markdown report: ${output}`);
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
