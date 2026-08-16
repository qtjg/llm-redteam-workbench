# Redline Observatory

**Redline Observatory is a local-first command-line evaluator for authorized AI/LLM security testing.** It executes bounded fixture suites, records only redacted evidence, enforces explicit scope, and compares safety signals across runs.

> **CLI only. No browser application, hosted service, target discovery, or tool-execution engine is included.** The default fixture mode has no network access and uses synthetic data only.

## Why this project is different

An LLM safety test is meaningful only when another reviewer can answer four questions: _what was tested, under what authority, with what detector policy, and did the result change over time?_ Redline records all four without retaining raw prompts, credentials, or live tool results.

| Capability            | What it provides                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Explicit scope        | A versioned manifest authorizes exact local fixtures by default, or one exact endpoint when an approved manifest enables endpoint mode. |
| Policy gate           | A machine-readable risk policy marks a run `PASS` or `BLOCK` from declared risk thresholds.                                             |
| Reproducibility       | Scope, suite, detector, policy, response, and artifact digests make the evaluation configuration reviewable.                            |
| Redacted evidence     | JSON, JSONL, Markdown, and standalone HTML reports retain hashes and sanitized previews only.                                           |
| Regression comparison | Case-level comparisons identify risk regressions, improvements, coverage changes, and exposure-index deltas.                            |

## Install and run

```bash
git clone https://github.com/qtjg/llm-redteam-workbench.git
cd llm-redteam-workbench
pnpm install

pnpm redline doctor
pnpm redline list
pnpm redline run --suite all --repeat 3
```

The resulting artifacts appear under `redline-out/` and are ignored by Git. The foundation suite intentionally includes a synthetic canary disclosure and mocked-action intent so that reports demonstrate how findings are recorded. It is not a claim that any model is secure or insecure.

The default policy permits those intentional demonstration cases. For a fail-closed release-gate demonstration, copy [`examples/strict-release.policy.example.json`](examples/strict-release.policy.example.json) and pass it with `--policy`; the same fixture run will then return `BLOCK` after writing its redacted evidence.

## CLI reference

| Command                                                            | Purpose                                                                                |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `pnpm redline doctor`                                              | Displays scope containment, suite count, detector count, and active risk policy.       |
| `pnpm redline validate`                                            | Validates scope, suite, detector references, and policy schemas before a run.          |
| `pnpm redline list`                                                | Lists bounded suites with coverage tags and detector assignments.                      |
| `pnpm redline run --suite all --repeat 3`                          | Runs the synthetic fixture corpus and emits redacted artifacts plus a policy decision. |
| `pnpm redline verify --input redline-out/<run>.json`               | Checks artifact integrity and reevaluates the active risk policy.                      |
| `pnpm redline report --input redline-out/<run>.json --format html` | Re-renders an HTML report from a redacted JSON record.                                 |
| `pnpm redline compare --baseline <a>.json --current <b>.json`      | Compares case-level risk signals between two runs.                                     |

## Safe regression demonstration

The repository contains a clean synthetic baseline only to demonstrate the comparison workflow. It never invokes a remote target.

```bash
pnpm redline run --suites examples/safe-baseline.suites.json --out redline-out/baseline
pnpm redline run --out redline-out/current
pnpm redline compare \
  --baseline redline-out/baseline/<baseline-run>.json \
  --current redline-out/current/<current-run>.json
```

## Repository map

```text
src/cli.mjs                 command interface
src/lib/manifests.mjs       scope, suite, and policy validation
src/lib/detectors.mjs       small policy-driven detector registry
src/lib/evaluator.mjs       bounded execution, integrity, and provenance
src/lib/policy.mjs          scoring, thresholds, and risk decisions
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

Redline is not a scanner, remote exploitation framework, certification service, or agent executor. Do not test systems without authorization. Do not place real customer data, credentials, unreleased prompts, or personal information in a fixture. Review [SECURITY.md](SECURITY.md), the [threat model](docs/THREAT_MODEL.md), and the [contribution guide](CONTRIBUTING.md) before extending the corpus.

## Engineering rationale

The implementation treats AI red teaming as a disciplined software evaluation process. It uses case-specific detectors, explicit test coverage, repeat-trial reproduction rates, and reviewable evidence instead of vague claims based on a single prompt. This approach is consistent with public AI evaluation and testing guidance. [1] [2] [3]

[1]: https://www.cisa.gov/news-events/news/ai-red-teaming-applying-software-tevv-ai-evaluations "CISA: Applying Software TEVV for AI Evaluations"
[2]: https://owaspai.org/docs/5_testing/ "OWASP AI security testing"
[3]: https://developers.openai.com/api/docs/guides/evaluation-best-practices "OpenAI evaluation best practices"
