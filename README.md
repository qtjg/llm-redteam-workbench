# Redline Observatory

**Redline Observatory is a local-first command-line evaluator for authorized AI/LLM security testing.** It executes bounded fixture suites, records only redacted evidence, enforces explicit scope, and compares safety signals across runs.

> **CLI only. No browser application, hosted service, target discovery, or tool-execution engine is included.** The default fixture mode has no network access and uses synthetic data only.

## Why this project is different

An LLM safety test is meaningful only when another reviewer can answer four questions: _what was tested, under what authority, with what detector policy, and did the result change over time?_ Redline records all four without retaining raw prompts, credentials, or live tool results.

| Capability            | What it provides                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Explicit scope        | A versioned manifest authorizes exact local fixtures by default, or one exact endpoint when an approved manifest enables endpoint mode.  |
| Policy gate           | A machine-readable risk policy marks a run `PASS` or `BLOCK` from declared risk thresholds.                                              |
| Reproducibility       | Scope, suite, detector, policy, response, and artifact digests make the evaluation configuration reviewable.                             |
| Redacted evidence     | JSON, JSONL, Markdown, and standalone HTML reports retain hashes and sanitized previews only.                                            |
| Regression comparison | Case-level comparisons identify risk regressions, improvements, coverage changes, and exposure-index deltas.                             |
| Stateful boundaries   | Versioned synthetic conversations and retrieval contexts record turn hashes, redacted previews, and boundary findings without live data. |
| Release readiness     | A manifest-only utility verifies artifact integrity, policy gates, provenance, redacted retention, and bounded-execution declarations.   |

## Install and run

```bash
git clone https://github.com/qtjg/llm-redteam-workbench.git
cd llm-redteam-workbench
pnpm install

pnpm redline doctor
pnpm redline list
pnpm redline run --suites examples/safe-baseline.suites.json --suite all --repeat 3
```

The resulting artifacts appear under `redline-out/` and are ignored by Git. The safe baseline exercises every schema feature, including bounded multi-turn and retrieval-boundary fixtures, while returning a passing policy decision. It is not a claim that any model is secure or insecure.

The foundation suite intentionally includes synthetic detector signals for review demonstrations, so its current default policy decision is `BLOCK` after writing redacted evidence. It is useful for verifying reporting and policy gates, while the safe baseline is used by `pnpm smoke` and CI to verify the full execution path. For a stricter release gate, copy [`examples/strict-release.policy.example.json`](examples/strict-release.policy.example.json) and pass it with `--policy`.

## End-to-end local workflow

The following workflow is the recommended starting point for a reviewer, contributor, or admissions portfolio reader. It starts with a no-network manifest check, examines declared coverage, executes only the safe bundled baseline, verifies integrity, and produces a release-readiness summary from the resulting redacted artifact.

| Step              | Command                                                                                      | What it proves                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1. Preflight      | `pnpm redline doctor`                                                                        | The selected scope is fixture-only, network-disabled, and tool-mocked.                             |
| 2. Validate       | `pnpm redline validate`                                                                      | Scope, suite, detector references, and policy shape are internally consistent.                     |
| 3. Audit coverage | `pnpm redline coverage --format markdown`                                                    | Declared threat classes, detector use, and stateful fixture modes are reviewable before execution. |
| 4. Run baseline   | `pnpm redline run --suites examples/safe-baseline.suites.json --out redline-out/safe`        | A deterministic safe corpus exercises the full artifact pipeline.                                  |
| 5. Verify         | `pnpm redline verify --input redline-out/safe/<run>.json`                                    | The artifact digest is intact and the current policy decision is reproduced.                       |
| 6. Release review | `pnpm redline release --input redline-out/safe/<run>.json --out redline-out/safe/release.md` | Integrity, policy, provenance, retention, and bounded-execution checks are summarized.             |

Replace `<run>` with the run identifier printed by the `run` command. Generated artifacts are deliberately ignored by Git so reviewers can reproduce them locally rather than trusting checked-in output.

## CLI reference

| Command                                                            | Purpose                                                                                |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `pnpm redline doctor`                                              | Displays scope containment, suite count, detector count, and active risk policy.       |
| `pnpm redline validate`                                            | Validates scope, suite, detector references, and policy schemas before a run.          |
| `pnpm redline list`                                                | Lists bounded suites with coverage tags and detector assignments.                      |
| `pnpm redline coverage --format markdown`                          | Audits declared fixture coverage, detector use, and stateful test modes without a run. |
| `pnpm redline run --suite all --repeat 3`                          | Runs the synthetic fixture corpus and emits redacted artifacts plus a policy decision. |
| `pnpm redline verify --input redline-out/<run>.json`               | Checks artifact integrity and reevaluates the active risk policy.                      |
| `pnpm redline report --input redline-out/<run>.json --format html` | Re-renders an HTML report from a redacted JSON record.                                 |
| `pnpm redline compare --baseline <a>.json --current <b>.json`      | Compares case-level risk signals between two runs.                                     |
| `pnpm redline release --input <run>.json --format markdown`        | Produces a release-readiness decision from a pre-existing redacted run artifact.       |

## Artifact guide

Every run uses a deterministic identifier and emits a small evidence bundle. These files are intended for review and regression work; they do not contain raw prompts, complete responses, credentials, live tool outputs, or full retrieval content.

| Artifact              | Purpose                        | Safe evidence retained                                                                             |
| --------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `<run>.json`          | Canonical redacted run record  | Metadata, hashes, sanitized previews, findings, coverage, policy decision, and provenance digests. |
| `<run>.events.jsonl`  | Append-friendly event stream   | Case and turn identifiers, detector finding IDs, response hashes, and timestamps.                  |
| `<run>.md`            | Human-readable review report   | Summary metrics, per-case detector outcomes, and coverage statements.                              |
| `<run>.html`          | Standalone local report        | The same redacted conclusions in a self-contained HTML view.                                       |
| `coverage-audit.json` | Manifest-level planning record | Coverage tags, detector-to-case mapping, test modes, and unused registered detectors.              |
| `release.md`          | Release-review decision        | Integrity, policy, provenance, evidence-retention, and bounded-execution checks.                   |

## Multi-turn and retrieval-boundary evaluation

Suite schema version 3 preserves the simple single-turn `prompt` plus `fixtureResponse` shape and adds two bounded fixture modes. A `turns[]` case evaluates ordered synthetic conversation turns; a `retrievalContexts[]` case records only a context identifier, source, trust label, content hash, and redacted preview. Each run includes total turns, retrieval-context counts, per-turn response hashes, and case-level detectors in its redacted artifacts.

The foundation pack demonstrates cross-turn injected-instruction persistence (`MT-05`) and retrieved-content instruction isolation (`RG-06`) with synthetic markers. These stateful modes remain fixture-only in this release; endpoint mode does not claim to model session memory or live retrieval pipelines.

## Coverage audit

`redline coverage` performs a deterministic, manifest-only review before an evaluation run. It counts declared cases, categories, threat-class tags, detector assignments, single-turn cases, multi-turn cases, and retrieval-boundary cases. It also identifies registered detectors that the selected fixture corpus does not use, making coverage gaps reviewable without contacting a model or retaining raw test payloads.

```bash
pnpm redline coverage --format markdown
pnpm redline coverage --format json --out redline-out/coverage-audit.json
```

## Release-readiness utility

`redline release` is intentionally separate from `redline run`. It never calls a model. Instead, it reads an existing redacted run artifact, recomputes its integrity digest, evaluates a chosen policy, checks the run’s bounded-execution declarations, confirms the expected provenance fields, and returns `READY` or `HOLD`. A `HOLD` exit code is deliberate: it prevents a release workflow from treating a blocked artifact as a passing gate.

```bash
pnpm redline release \
  --input redline-out/safe/<run>.json \
  --format markdown \
  --out redline-out/safe/release-readiness.md
```

Use `--format json` when another local tool needs structured release evidence. The command remains local-first and does not transmit artifact contents.

## Governance, review, and exceptions

Suite schema version 4 requires governance metadata for the whole fixture corpus: an accountable owner role, a reviewer role, the date of the last review, a review cadence, and an approval state. `redline coverage` displays this information beside the detector and threat-class inventory so review responsibility is visible before any execution.

Release policies may contain narrow, **time-bound exceptions** for one known `caseId` and one known `findingId`. An exception needs an owner, reviewer, rationale, and UTC expiration. It never edits the original run artifact or removes a finding. `redline release` preserves the raw safety posture, calculates an effective posture only for currently active exact-match exceptions, and reports `READY-WITH-EXCEPTIONS` when a documented exception is the only reason a release can proceed. Expired, malformed, or unmatched exceptions result in `HOLD`.

```bash
pnpm redline release \
  --input redline-out/<run>.json \
  --policy examples/time-bound-exception.policy.example.json \
  --format markdown
```

Read the [governance guide](docs/GOVERNANCE.md) before adding or renewing an exception.

## Automation

GitHub Actions verifies every pull request and `main` push with formatting, manifest validation, deterministic tests, a coverage audit, a current suite-review gate, and the safe-baseline smoke workflow. A separate **Redline Release Readiness** workflow runs on `v*` tags or manual dispatch and uploads redacted coverage, suite-review, and release-readiness evidence. For a deliberate version tag it creates or refreshes a **draft** GitHub release containing that evidence and the packaged CLI; it never publishes the draft, deploys a service, or contacts a live target automatically.

## Suite-review utility

`redline review` is a manifest-only governance check. It reads the validated suite governance record, calculates the next review date from `lastReviewedAt` and `reviewCadenceDays`, inventories multi-turn and retrieval-boundary coverage, and returns `CURRENT` or `OVERDUE`. It never executes a model, contacts a target, or writes fixture content to its output.

```bash
# Write a reviewer-friendly Markdown summary using a deterministic review date.
pnpm redline review \
  --as-of 2026-09-01T00:00:00Z \
  --format markdown \
  --out review-out/suite-review.md

# Use JSON when an internal governance workflow needs structured data.
pnpm redline review --format json --out review-out/suite-review.json
```

An overdue review exits with status code `2`, making it suitable as a merge or release gate. Review the owner, reviewer role, cadence, detector mappings, and synthetic scope before updating `lastReviewedAt`.

## Version-tag release flow

For an intentional version tag matching `v*`, the **Redline Release Readiness** workflow validates the repository, runs tests, packages the CLI, generates a coverage audit, suite-review summary, and safe-baseline release report, then uploads the redacted artifacts. It creates or refreshes a **draft** GitHub release for the tag; the workflow never publishes it automatically.

```bash
# After local checks and an authorized version decision.
git tag -a v0.8.0 -m "Redline Observatory v0.8.0"
git push github v0.8.0
```

Inspect the draft’s evidence bundle before selecting **Publish release** in GitHub. The project is a CLI package, so this workflow does not deploy a web service or contact any live evaluation target.

## Safe regression demonstration

The repository contains a clean synthetic baseline only to demonstrate the comparison workflow. It never invokes a remote target.

```bash
pnpm redline run --suites examples/safe-baseline.suites.json --out redline-out/baseline
pnpm redline run --out redline-out/current
pnpm redline compare \
  --baseline redline-out/baseline/<baseline-run>.json \
  --current redline-out/current/<current-run>.json
```

## Bounded autonomous agent

Redline includes an agent-style orchestrator for repeatable local evaluation workflows. It is autonomous only within a fixed plan: goals are allowlisted, the plan is hashed, execution is fixture-only, tools are mocked, network access is disabled, raw payloads are never written, and execution requires an explicit approval flag. There is no background daemon or hidden action loop.

```bash
pnpm redline agent goals
pnpm redline agent plan --goal evaluate_stateful_boundaries --out agent-out
pnpm redline agent run \
  --plan agent-out/<plan>.plan.json \
  --approve \
  --max-steps 2 \
  --out agent-out
```

A bounded run pauses after two steps and prints a resume command. Resume it with the saved state file:

```bash
pnpm redline agent run \
  --plan agent-out/<plan>.plan.json \
  --approve \
  --state agent-out/<plan>.state.json \
  --out agent-out
```

Each plan produces a state file, a chained JSONL audit log, and a summary containing completed steps, safety constraints, and audit-chain validity. The available goals are `evaluate_fixtures`, `evaluate_stateful_boundaries`, and `compare_baseline`. The orchestrator is deliberately not a general-purpose shell agent and cannot discover targets, execute real tools, or bypass scope gates.

## Repository map

```text
src/cli.mjs                 command interface
src/lib/manifests.mjs       scope, suite, and policy validation
src/lib/detectors.mjs       small policy-driven detector registry
src/lib/coverage.mjs        manifest-only coverage and detector-use audit
src/lib/evaluator.mjs       bounded execution, integrity, and provenance
src/lib/policy.mjs          scoring, thresholds, and risk decisions
src/lib/release.mjs         local release-readiness checks for a redacted run artifact
src/lib/artifacts.mjs       redacted JSON/JSONL/Markdown/HTML outputs
fixtures/                   synthetic scope, suite, and policy manifests
examples/                   safe baseline and endpoint-manifest example
test/                       deterministic Node.js unit tests
docs/                       architecture, threat model, and project showcase
```

## Endpoint mode: authorized targets only

The bundled scope remains in fixture mode. To test an endpoint you own or are explicitly authorized to assess, start from [`examples/approved-endpoint.scope.example.json`](examples/approved-endpoint.scope.example.json), allowlist only that exact endpoint, keep `mockTools: true`, and acknowledge authorization at invocation time.

```bash
export APPROVED_LLM_KEY="…"
pnpm redline run \
  --adapter openai-compatible \
  --scope ./approved.scope.json \
  --endpoint https://approved.example/v1 \
  --model approved-model \
  --api-key-env APPROVED_LLM_KEY \
  --acknowledge-authorization
```

## Responsible use

Redline is not a scanner, remote exploitation framework, or certification service. Its agent mode is a bounded fixture orchestrator, not a general-purpose autonomous agent. Do not test systems without authorization. Do not place real customer data, credentials, unreleased prompts, or personal information in a fixture. Review [SECURITY.md](SECURITY.md), the [threat model](docs/THREAT_MODEL.md), and the [contribution guide](CONTRIBUTING.md) before extending the corpus.

## Development and quality gates

The repository uses Node.js 20 or later, pnpm, Prettier, and the built-in Node test runner. No database, cloud service, browser runtime, or API key is required for the default workflow.

```bash
pnpm format:check  # verify formatting
pnpm test          # deterministic unit and artifact tests
pnpm validate      # validate default manifests
pnpm smoke         # run the complete safe-baseline path
```

Pull requests and pushes are expected to keep these four checks passing. When proposing a new detector or suite, update the versioned manifest, add a safe deterministic fixture, document the intended coverage tag, and include a test that proves the generated artifact remains redacted.

## Engineering rationale

The implementation treats AI red teaming as a disciplined software evaluation process. It uses case-specific detectors, explicit test coverage, repeat-trial reproduction rates, and reviewable evidence instead of vague claims based on a single prompt. This approach is consistent with public AI evaluation and testing guidance. [1] [2] [3]

[1]: https://www.cisa.gov/news-events/news/ai-red-teaming-applying-software-tevv-ai-evaluations "CISA: Applying Software TEVV for AI Evaluations"
[2]: https://owaspai.org/docs/5_testing/ "OWASP AI security testing"
[3]: https://developers.openai.com/api/docs/guides/evaluation-best-practices "OpenAI evaluation best practices"
