# CLI evaluator pivot

- [x] Define a scope manifest that explicitly authorizes only local fixtures by default.
- [x] Implement `redline doctor`, `redline run`, and `redline report` commands.
- [x] Add synthetic prompt-injection, fake-secret leakage, output-boundary, and mocked-action fixtures.
- [x] Add deterministic redaction and severity scoring with machine-readable JSON evidence.
- [x] Export Markdown and JSON reports without retaining raw sensitive payloads by default.
- [x] Write usage documentation and validate the complete command workflow.
- [x] Commit and push the CLI implementation to the private GitHub repository.

## Portfolio-quality hardening

- [x] Introduce a versioned evaluation schema with provenance, deterministic run IDs, and artifact integrity hashes.
- [x] Add a policy-driven detector registry covering prompt injection, synthetic canary leakage, unsafe action intent, and output-boundary findings.
- [x] Add a baseline comparison command that highlights risk regression and improvement between two redacted runs.
- [x] Add a structured JSONL event log and a self-contained HTML report for reproducible review.
- [x] Expand unit and integration coverage, then add a GitHub Actions CI workflow for every push and pull request.
- [x] Add architecture, threat-model, contribution, and admissions-showcase documentation grounded in the implemented behavior.
- [x] Commit and push the hardened tool to the private GitHub repository.

## CLI-only refactor

- [x] Remove the optional web dashboard and frontend-specific build dependencies from the repository.
- [x] Introduce focused CLI modules for manifests, detectors, reports, and comparison logic.
- [x] Add meaningful capability coverage for suite validation, risk policy thresholds, and report verification.
- [x] Expand the fixture corpus and tests with explicit expected outcomes and safe negative cases.
- [x] Update CI, package metadata, documentation, and showcase material for the CLI-only distribution.
- [x] Validate, commit, and push the CLI-only refactor to the private GitHub repository.

## Bounded autonomous agent

- [x] Define an agent run manifest with explicit scope, budget, timeout, and approval requirements.
- [x] Add a planner that converts approved evaluation goals into deterministic, inspectable steps.
- [x] Add a dry-run executor with mocked tools, step-level policy gates, and human approval checkpoints.
- [x] Add append-only audit events for planning, execution, approvals, blocks, and artifacts.
- [x] Add resume, pause, and bounded retry behavior without hidden background execution.
- [x] Add tests for budget exhaustion, unauthorized actions, prompt-injection-resistant planning, and audit integrity.
- [x] Update CLI documentation and publish the autonomous-agent extension to the private repository.

## Multi-turn and retrieval-boundary evaluation

- [x] Extend the suite schema with synthetic conversation turns and redacted retrieval context references.
- [x] Add stateful fixture execution that records turn-level hashes, previews, and detector results without writing raw prompts.
- [x] Add retrieval-boundary and cross-turn instruction-persistence detectors with safe synthetic markers.
- [x] Add multi-turn and retrieval-boundary fixture cases, deterministic tests, and report coverage summaries.
- [x] Update agent planning, documentation, CI, and versioned CLI metadata for the new evaluation modes.
- [x] Validate, commit, and push the enhanced CLI-only evaluator to the private GitHub repository.

## Coverage audit command

- [x] Add a deterministic coverage-audit model that summarizes threat classes, detector use, and stateful fixture modes.
- [x] Expose the audit through a `redline coverage` CLI command with JSON and Markdown output.
- [x] Add unit tests, usage documentation, validation, and a pushed GitHub release commit.

## Repository release utility and documentation

- [x] Add a deterministic utility that inspects a Redline run artifact and produces a release-readiness summary.
- [x] Expand the README with an end-to-end workflow, artifact guide, safety model, and development commands.
- [x] Review commit history and available GitHub contribution status, then validate, commit, and push the enhancement.

## GitHub integration hygiene

- [x] Verify GitHub integration access without exposing or storing a personal token in the repository.

## Governance and release automation

- [x] Add suite ownership and review metadata with deterministic manifest validation.
- [x] Implement time-bound, case-scoped policy exceptions that require an owner, rationale, and expiration date.
- [x] Add GitHub Actions automation for validation, tests, smoke checks, and release-readiness artifacts.
- [x] Add tests and governance documentation, then validate, commit, and push the completed enhancement.
