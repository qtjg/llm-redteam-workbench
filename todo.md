# CLI evaluator pivot

- [x] Define a scope manifest that explicitly authorizes only local fixtures by default.
- [x] Implement `redline doctor`, `redline run`, and `redline report` commands.
- [x] Add synthetic prompt-injection, fake-secret leakage, output-boundary, and mocked-action fixtures.
- [x] Add deterministic redaction and severity scoring with machine-readable JSON evidence.
- [x] Export Markdown and JSON reports without retaining raw sensitive payloads by default.
- [x] Write usage documentation and validate the complete command workflow.
- [ ] Commit and push the CLI implementation to the private GitHub repository.

## Portfolio-quality hardening

- [x] Introduce a versioned evaluation schema with provenance, deterministic run IDs, and artifact integrity hashes.
- [x] Add a policy-driven detector registry covering prompt injection, synthetic canary leakage, unsafe action intent, and output-boundary findings.
- [x] Add a baseline comparison command that highlights risk regression and improvement between two redacted runs.
- [x] Add a structured JSONL event log and a self-contained HTML report for reproducible review.
- [x] Expand unit and integration coverage, then add a GitHub Actions CI workflow for every push and pull request.
- [x] Add architecture, threat-model, contribution, and admissions-showcase documentation grounded in the implemented behavior.
- [ ] Commit, validate, and push the hardened tool to the private GitHub repository.
