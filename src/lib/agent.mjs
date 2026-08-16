import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { digestJson, stableStringify } from "./codec.mjs";

export const AGENT_SCHEMA_VERSION = 1;
export const MAX_STEPS = 32;
export const MAX_RETRIES = 2;
const ALLOWED_GOALS = Object.freeze({
  evaluate_fixtures: {
    title: "Evaluate the bounded fixture corpus",
    steps: [
      {
        id: "validate_scope",
        kind: "validation",
        description: "Validate the scope, suite, and policy manifests.",
      },
      {
        id: "run_suite",
        kind: "evaluation",
        description: "Run the approved fixture suite with mocked tools.",
      },
      {
        id: "verify_artifact",
        kind: "verification",
        description: "Verify the redacted evaluation artifact integrity.",
      },
      {
        id: "write_summary",
        kind: "reporting",
        description: "Write a reviewable agent summary.",
      },
    ],
  },
  compare_baseline: {
    title: "Compare a current fixture run with a supplied baseline",
    steps: [
      {
        id: "validate_scope",
        kind: "validation",
        description: "Validate the scope, suite, and policy manifests.",
      },
      {
        id: "run_suite",
        kind: "evaluation",
        description: "Run the approved fixture suite with mocked tools.",
      },
      {
        id: "compare_runs",
        kind: "comparison",
        description: "Compare the current run with the declared baseline.",
      },
      {
        id: "write_summary",
        kind: "reporting",
        description: "Write a reviewable agent summary.",
      },
    ],
  },
});

export function createAgentPlan({
  goal,
  scopePath,
  suitesPath,
  policyPath,
  outputDir,
  repeat = 1,
  baselinePath = null,
  requireApproval = true,
  sourceRevision = "unversioned",
}) {
  const template = ALLOWED_GOALS[goal];
  if (!template)
    throw new Error(
      `Unknown agent goal '${goal}'. Allowed goals: ${Object.keys(ALLOWED_GOALS).join(", ")}.`
    );
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 20)
    throw new Error("Agent repeat must be an integer from 1 to 20.");
  if (goal === "compare_baseline" && !baselinePath)
    throw new Error("compare_baseline requires --baseline path.");
  const plan = {
    schemaVersion: AGENT_SCHEMA_VERSION,
    planId: `plan_${digestJson({ goal, scopePath, suitesPath, policyPath, outputDir, repeat, baselinePath }).slice(0, 12)}`,
    goal,
    title: template.title,
    createdAt: new Date().toISOString(),
    sourceRevision,
    constraints: {
      mode: "fixture-only",
      network: "disabled",
      tools: "mocked-only",
      rawPayloads: "never-written",
      maxSteps: MAX_STEPS,
      maxRetriesPerStep: MAX_RETRIES,
      requireApproval,
    },
    inputs: {
      scopePath,
      suitesPath,
      policyPath,
      outputDir,
      repeat,
      baselinePath,
    },
    steps: template.steps.map((step, index) => ({
      ...step,
      index,
      status: "pending",
      retries: 0,
    })),
  };
  plan.planDigest = digestJson({ ...plan, planDigest: undefined });
  return plan;
}

export function verifyAgentPlan(plan) {
  const errors = [];
  if (plan?.schemaVersion !== AGENT_SCHEMA_VERSION)
    errors.push(`Unsupported agent plan schema ${plan?.schemaVersion}.`);
  if (!plan?.constraints || plan.constraints.mode !== "fixture-only")
    errors.push("Agent plans must use fixture-only mode.");
  if (plan?.constraints?.network !== "disabled")
    errors.push("Agent plans must disable network access.");
  if (plan?.constraints?.tools !== "mocked-only")
    errors.push("Agent plans must use mocked-only tools.");
  if (!plan?.constraints?.requireApproval)
    errors.push("Agent plans must require approval before execution.");
  if (
    !Array.isArray(plan?.steps) ||
    plan.steps.length < 1 ||
    plan.steps.length > MAX_STEPS
  )
    errors.push(`Agent plans must contain 1-${MAX_STEPS} steps.`);
  const expected = digestJson({ ...plan, planDigest: undefined });
  if (plan?.planDigest !== expected)
    errors.push("Agent plan digest is invalid.");
  if (plan?.goal === "compare_baseline" && !plan.inputs?.baselinePath)
    errors.push("Comparison plans must declare a baseline.");
  return errors;
}

export function makeAuditEvent({
  runId,
  type,
  stepId = null,
  status,
  details = {},
  previousHash = "GENESIS",
}) {
  const event = {
    schemaVersion: 1,
    eventId: `evt_${digestJson({ runId, type, stepId, status, details, previousHash }).slice(0, 12)}`,
    runId,
    occurredAt: new Date().toISOString(),
    type,
    stepId,
    status,
    details,
    previousHash,
  };
  return { ...event, eventHash: digestJson(event) };
}

export function verifyAuditChain(events) {
  let previousHash = "GENESIS";
  for (const event of events) {
    if (event.previousHash !== previousHash)
      return {
        valid: false,
        reason: `Audit chain breaks before ${event.eventId}.`,
      };
    const { eventHash: _eventHash, ...eventPayload } = event;
    const expected = digestJson(eventPayload);
    if (event.eventHash !== expected)
      return {
        valid: false,
        reason: `Audit event ${event.eventId} was modified.`,
      };
    previousHash = event.eventHash;
  }
  return { valid: true, lastHash: previousHash, events: events.length };
}

export function createAgentState(
  plan,
  runId = `agent_${digestJson({ plan: plan.planDigest, now: Date.now() }).slice(0, 12)}`
) {
  return {
    schemaVersion: AGENT_SCHEMA_VERSION,
    runId,
    planId: plan.planId,
    planDigest: plan.planDigest,
    status: "planned",
    nextStepIndex: 0,
    completedStepIds: [],
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function writeAgentPlan(plan, path) {
  const destination = resolve(path);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(plan, null, 2) + "\n");
  return destination;
}

export async function readAgentPlan(path) {
  const plan = JSON.parse(await readFile(resolve(path), "utf8"));
  const errors = verifyAgentPlan(plan);
  if (errors.length) throw new Error(`Invalid agent plan: ${errors.join(" ")}`);
  return plan;
}

export async function appendAudit(path, event) {
  const destination = resolve(path);
  await mkdir(dirname(destination), { recursive: true });
  await appendFile(destination, JSON.stringify(event) + "\n");
  return destination;
}

export async function readAudit(path) {
  try {
    const content = await readFile(resolve(path), "utf8");
    return content
      .split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function writeAgentState(state, path) {
  const destination = resolve(path);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(
    destination,
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2) +
      "\n"
  );
  return destination;
}

export async function readAgentState(path) {
  return JSON.parse(await readFile(resolve(path), "utf8"));
}

export function approveAgentExecution(plan, approval) {
  if (!plan.constraints.requireApproval)
    throw new Error("Agent plan must require approval before execution.");
  if (approval !== "I_APPROVE_FIXTURE_EXECUTION")
    throw new Error(
      "Approval denied. Pass --approve with the exact fixture-execution acknowledgement."
    );
  return {
    approved: true,
    mode: "fixture-only",
    approvedAt: new Date().toISOString(),
  };
}

export function summarizeAgentRun(state, plan, audit) {
  const chain = verifyAuditChain(audit);
  return {
    schemaVersion: 1,
    runId: state.runId,
    planId: plan.planId,
    planDigest: plan.planDigest,
    status: state.status,
    completedSteps: state.completedStepIds,
    attempts: state.attempts,
    audit: chain,
    safety: plan.constraints,
    nextStepIndex: state.nextStepIndex,
  };
}

export function allowedAgentGoals() {
  return Object.entries(ALLOWED_GOALS).map(([id, value]) => ({
    id,
    title: value.title,
    steps: value.steps.map(step => step.id),
  }));
}

export { stableStringify };
