import assert from "node:assert/strict";
import test from "node:test";
import {
  approveAgentExecution,
  createAgentPlan,
  createAgentState,
  makeAuditEvent,
  verifyAgentPlan,
  verifyAuditChain,
} from "../src/lib/agent.mjs";

test("creates a fixture-only plan with an inspectable step sequence", () => {
  const plan = createAgentPlan({
    goal: "evaluate_fixtures",
    scopePath: "fixtures/scope.json",
    suitesPath: "fixtures/suites.json",
    policyPath: "fixtures/policy.json",
    outputDir: "agent-out",
    repeat: 2,
  });
  assert.equal(plan.constraints.mode, "fixture-only");
  assert.deepEqual(
    plan.steps.map(step => step.id),
    ["validate_scope", "run_suite", "verify_artifact", "write_summary"]
  );
  assert.deepEqual(verifyAgentPlan(plan), []);
});

test("requires the exact explicit approval acknowledgement", () => {
  const plan = createAgentPlan({
    goal: "evaluate_fixtures",
    scopePath: "s",
    suitesPath: "u",
    policyPath: "p",
    outputDir: "o",
  });
  assert.throws(() => approveAgentExecution(plan, "yes"), /Approval denied/);
  assert.equal(
    approveAgentExecution(plan, "I_APPROVE_FIXTURE_EXECUTION").approved,
    true
  );
});

test("detects plan tampering and preserves bounded state", () => {
  const plan = createAgentPlan({
    goal: "evaluate_fixtures",
    scopePath: "s",
    suitesPath: "u",
    policyPath: "p",
    outputDir: "o",
  });
  const tampered = {
    ...plan,
    constraints: { ...plan.constraints, network: "enabled" },
  };
  assert.ok(
    verifyAgentPlan(tampered).some(error => error.includes("disable network"))
  );
  const state = createAgentState(plan, "agent_test");
  assert.equal(state.status, "planned");
  assert.equal(state.nextStepIndex, 0);
});

test("verifies a chained audit log and catches modification", () => {
  const first = makeAuditEvent({
    runId: "agent_test",
    type: "step.started",
    status: "running",
    stepId: "validate_scope",
  });
  const second = makeAuditEvent({
    runId: "agent_test",
    type: "step.completed",
    status: "completed",
    stepId: "validate_scope",
    previousHash: first.eventHash,
  });
  assert.equal(verifyAuditChain([first, second]).valid, true);
  assert.equal(
    verifyAuditChain([{ ...second, details: { changed: true } }, first]).valid,
    false
  );
});
