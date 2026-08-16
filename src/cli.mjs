#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  writeComparisonArtifacts,
  writeRunArtifacts,
} from "./lib/artifacts.mjs";
import { compareRuns } from "./lib/compare.mjs";
import { readJson, digestJson } from "./lib/codec.mjs";
import { detectorCatalog } from "./lib/detectors.mjs";
import { executeRun, verifyRunIntegrity } from "./lib/evaluator.mjs";
import {
  validatePolicy,
  validateScope,
  validateSuiteManifest,
} from "./lib/manifests.mjs";
import { evaluatePolicy } from "./lib/policy.mjs";
import { renderHtmlReport, renderMarkdownReport } from "./lib/reports.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_SCOPE = resolve(ROOT, "fixtures/redline.scope.json");
const DEFAULT_SUITES = resolve(ROOT, "fixtures/redline.suites.json");
const DEFAULT_POLICY = resolve(ROOT, "fixtures/redline.policy.json");
const option = (args, name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const flag = (args, name) => args.includes(name);
const sourceRevision = () => {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unversioned";
  }
};
const readPaths = args => ({
  scopePath: resolve(option(args, "--scope", DEFAULT_SCOPE)),
  suitesPath: resolve(option(args, "--suites", DEFAULT_SUITES)),
  policyPath: resolve(option(args, "--policy", DEFAULT_POLICY)),
});

function usage() {
  console.log(
    `\nredline — CLI-only, evidence-led AI/LLM safety evaluator\n\nCommands:\n  redline doctor [--scope path] [--suites path] [--policy path]\n  redline validate [--scope path] [--suites path] [--policy path]\n  redline list [--suites path]\n  redline run [--suite all|ID] [--repeat 1..20] [--out dir]\n  redline verify --input run.json [--policy path]\n  redline report --input run.json [--format markdown|html] [--out path]\n  redline compare --baseline run-a.json --current run-b.json [--out dir]\n\nDefault mode is local fixtures only. Endpoint mode requires an explicit exact allowlist, mock tools, and --acknowledge-authorization.\n`
  );
}
function errorsFor(scope, suites, policy) {
  return [
    ...validateScope(scope),
    ...validateSuiteManifest(
      suites,
      detectorCatalog().map(detector => detector.id)
    ),
    ...validatePolicy(policy),
  ];
}
function printPaths(paths) {
  console.log(
    `  ${paths.jsonPath}\n  ${paths.markdownPath}\n  ${paths.htmlPath}\n  ${paths.eventsPath}`
  );
}

async function main() {
  const [, , command = "help", ...args] = process.argv;
  if (["help", "--help", "-h"].includes(command)) return usage();
  const { scopePath, suitesPath, policyPath } = readPaths(args);
  if (!["report", "compare", "verify"].includes(command))
    for (const path of [scopePath, suitesPath, policyPath])
      if (!existsSync(path)) throw new Error(`Manifest not found: ${path}`);
  if (command === "doctor" || command === "validate") {
    const [scope, suites, rawPolicy] = await Promise.all([
      readJson(scopePath),
      readJson(suitesPath),
      readJson(policyPath),
    ]);
    const policy = { ...rawPolicy, digest: digestJson(rawPolicy) };
    const errors = errorsFor(scope, suites, policy);
    if (command === "doctor") {
      console.log(
        `\nScope: ${scope.mode} · network ${scope.allowNetwork ? "allowlisted" : "disabled"} · tools ${scope.mockTools ? "mocked" : "invalid"}`
      );
      console.log(
        `Suites: ${suites.suites.length} · detectors: ${detectorCatalog().length} · policy: ${policy.id}`
      );
    }
    if (errors.length) {
      console.error(errors.map(error => `- ${error}`).join("\n"));
      process.exitCode = 2;
    } else
      console.log(
        command === "validate"
          ? "Manifest validation passed."
          : "Safety manifest validation passed."
      );
    return;
  }
  if (command === "list") {
    const suites = await readJson(suitesPath);
    for (const suite of suites.suites)
      console.log(
        `${suite.id}\t${suite.category}\tcoverage: ${suite.coverage.join(", ")}\tdetectors: ${suite.detectors.join(", ")}`
      );
    return;
  }
  if (command === "run") {
    const [scope, suites, rawPolicy] = await Promise.all([
      readJson(scopePath),
      readJson(suitesPath),
      readJson(policyPath),
    ]);
    const policy = { ...rawPolicy, digest: digestJson(rawPolicy) };
    const errors = errorsFor(scope, suites, policy);
    if (errors.length) throw new Error(errors.join(" "));
    const repeat = Number(option(args, "--repeat", "1"));
    const adapter = option(args, "--adapter", "fixture");
    if (!["fixture", "openai-compatible"].includes(adapter))
      throw new Error(`Unsupported adapter: ${adapter}`);
    if (adapter === "openai-compatible" && scope.mode !== "endpoint")
      throw new Error(
        "OpenAI-compatible adapter requires an endpoint-mode scope manifest."
      );
    const run = await executeRun({
      scope,
      suiteData: suites,
      policy,
      suiteId: option(args, "--suite", "all"),
      endpoint: option(args, "--endpoint"),
      model: option(args, "--model", "not-applicable"),
      apiKey: process.env[option(args, "--api-key-env", "")],
      acknowledged: flag(args, "--acknowledge-authorization"),
      repeat,
      sourceRevision: sourceRevision(),
    });
    const paths = await writeRunArtifacts(
      run,
      option(args, "--out", resolve(ROOT, "redline-out"))
    );
    console.log(
      `\n${run.runId} · ${run.summary.exposureIndex}/100 · policy ${run.policy.decision.toUpperCase()}\nArtifacts:`
    );
    printPaths(paths);
    if (run.policy.decision === "block") process.exitCode = 2;
    return;
  }
  if (command === "verify") {
    const input = option(args, "--input");
    if (!input) throw new Error("verify requires --input run.json");
    const [run, rawPolicy] = await Promise.all([
      readJson(resolve(input)),
      readJson(policyPath),
    ]);
    const policy = { ...rawPolicy, digest: digestJson(rawPolicy) };
    const integrity = verifyRunIntegrity(run);
    const decision = evaluatePolicy(run, policy);
    console.log(
      `Integrity: ${integrity.valid ? "VALID" : "INVALID"}\nPolicy: ${decision.decision.toUpperCase()}${decision.reasons.length ? `\n${decision.reasons.map(reason => `- ${reason}`).join("\n")}` : ""}`
    );
    if (!integrity.valid || decision.decision === "block") process.exitCode = 2;
    return;
  }
  if (command === "report") {
    const input = option(args, "--input");
    if (!input) throw new Error("report requires --input run.json");
    const run = await readJson(resolve(input));
    const format = option(args, "--format", "markdown");
    if (!["markdown", "html"].includes(format))
      throw new Error("--format must be markdown or html.");
    const output = resolve(
      option(args, "--out", `${input}.${format === "html" ? "html" : "md"}`)
    );
    await writeFile(
      output,
      format === "html" ? renderHtmlReport(run) : renderMarkdownReport(run)
    );
    console.log(`Wrote ${format} report: ${output}`);
    return;
  }
  if (command === "compare") {
    const baseline = option(args, "--baseline");
    const current = option(args, "--current");
    if (!baseline || !current)
      throw new Error(
        "compare requires --baseline run-a.json and --current run-b.json"
      );
    const artifacts = await writeComparisonArtifacts(
      compareRuns(
        await readJson(resolve(baseline)),
        await readJson(resolve(current))
      ),
      option(args, "--out", resolve(ROOT, "redline-out"))
    );
    console.log(
      `Comparison artifacts:\n  ${artifacts.jsonPath}\n  ${artifacts.markdownPath}`
    );
    return;
  }
  throw new Error(`Unknown command: ${command}`);
}

main().catch(error => {
  console.error(`redline error: ${error.message}`);
  process.exitCode = 1;
});
