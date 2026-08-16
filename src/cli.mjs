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
import {
  createCoverageAudit,
  renderCoverageMarkdown,
} from "./lib/coverage.mjs";
import { detectorCatalog } from "./lib/detectors.mjs";
import { executeRun, verifyRunIntegrity } from "./lib/evaluator.mjs";
import {
  validatePolicy,
  validateScope,
  validateSuiteManifest,
} from "./lib/manifests.mjs";
import { evaluatePolicy } from "./lib/policy.mjs";
import {
  createReleaseReadiness,
  renderReleaseReadinessMarkdown,
} from "./lib/release.mjs";
import { createSuiteReview, renderSuiteReviewMarkdown } from "./lib/review.mjs";
import { renderHtmlReport, renderMarkdownReport } from "./lib/reports.mjs";
import {
  allowedAgentGoals,
  appendAudit,
  approveAgentExecution,
  createAgentPlan,
  createAgentState,
  makeAuditEvent,
  readAgentPlan,
  readAgentState,
  readAudit,
  summarizeAgentRun,
  verifyAuditChain,
  writeAgentPlan,
  writeAgentState,
} from "./lib/agent.mjs";

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
    `\nredline — CLI-only, evidence-led AI/LLM safety evaluator\n\nCommands:\n  redline doctor [--scope path] [--suites path] [--policy path]\n  redline validate [--scope path] [--suites path] [--policy path]\n  redline list [--suites path]\n  redline coverage [--suites path] [--format json|markdown] [--out path]\n  redline review [--suites path] [--as-of ISO-8601] [--format json|markdown] [--out path]\n  redline run [--suite all|ID] [--repeat 1..20] [--out dir]\n  redline verify --input run.json [--policy path]\n  redline release --input run.json [--policy path] [--format json|markdown] [--out path]\n  redline report --input run.json [--format markdown|html] [--out path]\n  redline compare --baseline run-a.json --current run-b.json [--out dir]
  redline agent goals
  redline agent plan --goal evaluate_fixtures|evaluate_stateful_boundaries|compare_baseline [--out dir]
  redline agent run --plan plan.json --approve [--max-steps N] [--out dir]

Default mode is local fixtures only. Endpoint mode requires an explicit exact allowlist, mock tools, and --acknowledge-authorization.\n`
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

async function runAgentCommand(args) {
  const subcommand = args[0] ?? "help";
  const subargs = args.slice(1);
  if (["help", "--help", "-h"].includes(subcommand)) {
    console.log(
      "Agent commands: goals | plan --goal <goal> | run --plan <plan.json> --approve [--max-steps N]"
    );
    console.log(
      "Safety: fixture-only, network disabled, mocked tools, raw payloads never written."
    );
    return;
  }
  if (subcommand === "goals") {
    for (const goal of allowedAgentGoals())
      console.log(`${goal.id}\t${goal.title}\tsteps: ${goal.steps.join(", ")}`);
    return;
  }
  if (subcommand === "plan") {
    const goal = option(subargs, "--goal", "evaluate_fixtures");
    const outputDir = resolve(
      option(subargs, "--out", resolve(ROOT, "agent-out"))
    );
    const plan = createAgentPlan({
      goal,
      scopePath: resolve(option(subargs, "--scope", DEFAULT_SCOPE)),
      suitesPath: resolve(option(subargs, "--suites", DEFAULT_SUITES)),
      policyPath: resolve(option(subargs, "--policy", DEFAULT_POLICY)),
      outputDir,
      repeat: Number(option(subargs, "--repeat", "1")),
      baselinePath: option(subargs, "--baseline", null),
      sourceRevision: sourceRevision(),
    });
    const planPath = await writeAgentPlan(
      plan,
      resolve(outputDir, `${plan.planId}.plan.json`)
    );
    console.log(
      `Agent plan created: ${planPath}\nGoal: ${plan.title}\nSteps: ${plan.steps.map(step => step.id).join(" → ")}\nApproval: required (--approve)`
    );
    return;
  }
  if (subcommand === "run") {
    const planPath = option(subargs, "--plan");
    if (!planPath) throw new Error("agent run requires --plan plan.json");
    const plan = await readAgentPlan(planPath);
    approveAgentExecution(
      plan,
      flag(subargs, "--approve") ? "I_APPROVE_FIXTURE_EXECUTION" : ""
    );
    const outputDir = resolve(option(subargs, "--out", plan.inputs.outputDir));
    const statePath = resolve(
      option(
        subargs,
        "--state",
        resolve(outputDir, `${plan.planId}.state.json`)
      )
    );
    const auditPath = resolve(
      option(
        subargs,
        "--audit",
        resolve(outputDir, `${plan.planId}.audit.jsonl`)
      )
    );
    let state = existsSync(statePath)
      ? await readAgentState(statePath)
      : createAgentState(plan);
    state.context ??= {};
    let events = await readAudit(auditPath);
    const record = async (type, status, stepId, details = {}) => {
      const previousHash = events.at(-1)?.eventHash ?? "GENESIS";
      const event = makeAuditEvent({
        runId: state.runId,
        type,
        status,
        stepId,
        details,
        previousHash,
      });
      events.push(event);
      await appendAudit(auditPath, event);
    };
    if (state.status === "completed")
      throw new Error(`Agent run ${state.runId} is already complete.`);
    if (state.status === "planned" || state.status === "paused") {
      state.status = "running";
      await record("agent.approval", "approved", null, {
        mode: "fixture-only",
        approval: "explicit-cli-flag",
      });
    }
    const maxSteps = Number(
      option(subargs, "--max-steps", String(plan.steps.length))
    );
    if (
      !Number.isInteger(maxSteps) ||
      maxSteps < 1 ||
      maxSteps > plan.steps.length
    )
      throw new Error(
        `--max-steps must be an integer from 1 to ${plan.steps.length}.`
      );
    let processed = 0;
    try {
      for (
        let index = state.nextStepIndex;
        index < plan.steps.length && processed < maxSteps;
        index += 1
      ) {
        const step = plan.steps[index];
        await record("step.started", "running", step.id, {
          kind: step.kind,
          description: step.description,
        });
        state.attempts += 1;
        if (step.kind === "validation") {
          const [scope, suites, rawPolicy] = await Promise.all([
            readJson(plan.inputs.scopePath),
            readJson(plan.inputs.suitesPath),
            readJson(plan.inputs.policyPath),
          ]);
          const policy = { ...rawPolicy, digest: digestJson(rawPolicy) };
          const errors = errorsFor(scope, suites, policy);
          if (errors.length) throw new Error(errors.join(" "));
          state.context.validation = "passed";
        } else if (step.kind === "evaluation") {
          const [scope, suites, rawPolicy] = await Promise.all([
            readJson(plan.inputs.scopePath),
            readJson(plan.inputs.suitesPath),
            readJson(plan.inputs.policyPath),
          ]);
          const policy = { ...rawPolicy, digest: digestJson(rawPolicy) };
          const run = await executeRun({
            scope,
            suiteData: suites,
            policy,
            suiteId: "all",
            acknowledged: false,
            repeat: plan.inputs.repeat,
            sourceRevision: plan.sourceRevision,
          });
          const paths = await writeRunArtifacts(run, plan.inputs.outputDir);
          state.context.runPath = paths.jsonPath;
          state.context.runId = run.runId;
          state.context.runPolicy = run.policy.decision;
        } else if (step.kind === "verification") {
          if (!state.context.runPath)
            throw new Error(
              "No evaluation artifact is available for verification."
            );
          const run = await readJson(state.context.runPath);
          const integrity = verifyRunIntegrity(run);
          if (!integrity.valid)
            throw new Error(
              integrity.reason ?? "Artifact integrity verification failed."
            );
          state.context.integrity = "valid";
        } else if (step.kind === "comparison") {
          if (!state.context.runPath || !plan.inputs.baselinePath)
            throw new Error(
              "Comparison step requires a current run and baseline path."
            );
          const comparison = compareRuns(
            await readJson(plan.inputs.baselinePath),
            await readJson(state.context.runPath)
          );
          const paths = await writeComparisonArtifacts(
            comparison,
            plan.inputs.outputDir
          );
          state.context.comparisonPath = paths.jsonPath;
          state.context.regressions = comparison.summary.regressions;
        } else if (step.kind === "reporting") {
          state.context.summaryPath = resolve(
            plan.inputs.outputDir,
            `${state.runId}.summary.json`
          );
        }
        state.completedStepIds.push(step.id);
        state.nextStepIndex = index + 1;
        processed += 1;
        await record("step.completed", "completed", step.id, {
          completedStepIds: state.completedStepIds,
        });
        await writeAgentState(state, statePath);
      }
      state.status =
        state.nextStepIndex >= plan.steps.length ? "completed" : "paused";
      const summary = summarizeAgentRun(state, plan, events);
      if (state.status === "completed") {
        await writeFile(
          resolve(plan.inputs.outputDir, `${state.runId}.summary.json`),
          JSON.stringify({ ...summary, context: state.context }, null, 2) + "\n"
        );
        await record("agent.completed", "completed", null, {
          summaryPath: summary.contextPath ?? `${state.runId}.summary.json`,
        });
      } else {
        await record("agent.paused", "paused", null, {
          nextStepIndex: state.nextStepIndex,
          remaining: plan.steps.length - state.nextStepIndex,
        });
      }
      await writeAgentState(state, statePath);
      const chain = verifyAuditChain(await readAudit(auditPath));
      console.log(
        `Agent ${state.status}: ${state.runId}\nCompleted: ${state.completedStepIds.join(", ") || "none"}\nAudit: ${auditPath}\nAudit chain: ${chain.valid ? "VALID" : "INVALID"}`
      );
      if (state.status === "paused")
        console.log(
          `Resume with: pnpm redline agent run --plan ${planPath} --approve --state ${statePath}`
        );
      return;
    } catch (error) {
      state.status = "blocked";
      await record(
        "agent.blocked",
        "blocked",
        plan.steps[state.nextStepIndex]?.id ?? null,
        { reason: error.message }
      );
      await writeAgentState(state, statePath);
      throw error;
    }
  }
  throw new Error(`Unknown agent command: ${subcommand}`);
}

async function main() {
  const [, , command = "help", ...args] = process.argv;
  if (["help", "--help", "-h"].includes(command)) return usage();
  if (command === "agent") return runAgentCommand(args);
  const { scopePath, suitesPath, policyPath } = readPaths(args);
  if (
    !["report", "compare", "verify", "coverage", "review", "release"].includes(
      command
    )
  )
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
  if (command === "coverage") {
    if (!existsSync(suitesPath))
      throw new Error(`Manifest not found: ${suitesPath}`);
    const suites = await readJson(suitesPath);
    const errors = validateSuiteManifest(
      suites,
      detectorCatalog().map(detector => detector.id)
    );
    if (errors.length) throw new Error(errors.join(" "));
    const audit = createCoverageAudit(
      suites,
      detectorCatalog().map(detector => detector.id),
      sourceRevision()
    );
    const format = option(args, "--format", "markdown");
    if (!["json", "markdown"].includes(format))
      throw new Error("--format must be json or markdown.");
    const output = option(args, "--out", null);
    const content =
      format === "json"
        ? JSON.stringify(audit, null, 2) + "\n"
        : renderCoverageMarkdown(audit);
    if (output) {
      const path = resolve(output);
      await writeFile(path, content);
      console.log(`Wrote ${format} coverage audit: ${path}`);
    } else console.log(content);
    return;
  }
  if (command === "review") {
    if (!existsSync(suitesPath))
      throw new Error(`Manifest not found: ${suitesPath}`);
    const suites = await readJson(suitesPath);
    const errors = validateSuiteManifest(
      suites,
      detectorCatalog().map(detector => detector.id)
    );
    if (errors.length) throw new Error(errors.join(" "));
    const review = createSuiteReview(suites, {
      now: option(args, "--as-of", new Date().toISOString()),
      sourceRevision: sourceRevision(),
    });
    const format = option(args, "--format", "markdown");
    if (!["json", "markdown"].includes(format))
      throw new Error("--format must be json or markdown.");
    const output = option(args, "--out", null);
    const content =
      format === "json"
        ? JSON.stringify(review, null, 2) + "\n"
        : renderSuiteReviewMarkdown(review);
    if (output) {
      const path = resolve(output);
      await writeFile(path, content);
      console.log(`Wrote ${format} suite-review summary: ${path}`);
    } else console.log(content);
    if (review.governance.status === "overdue") process.exitCode = 2;
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
  if (command === "release") {
    const input = option(args, "--input");
    if (!input) throw new Error("release requires --input run.json");
    const [run, rawPolicy] = await Promise.all([
      readJson(resolve(input)),
      readJson(policyPath),
    ]);
    const policy = { ...rawPolicy, digest: digestJson(rawPolicy) };
    const policyErrors = validatePolicy(policy);
    if (policyErrors.length) throw new Error(policyErrors.join(" "));
    const readiness = createReleaseReadiness(run, policy);
    const format = option(args, "--format", "markdown");
    if (!["json", "markdown"].includes(format))
      throw new Error("--format must be json or markdown.");
    const content =
      format === "json"
        ? JSON.stringify(readiness, null, 2) + "\n"
        : renderReleaseReadinessMarkdown(readiness);
    const output = option(args, "--out", null);
    if (output) {
      const path = resolve(output);
      await writeFile(path, content);
      console.log(`Wrote ${format} release-readiness summary: ${path}`);
    } else console.log(content);
    if (readiness.decision === "hold") process.exitCode = 2;
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
