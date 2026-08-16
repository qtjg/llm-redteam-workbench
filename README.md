# Redline Observatory

**Redline Observatory is a local-first CLI for turning authorized AI/LLM safety tests into reproducible, redacted, reviewable engineering evidence.** It is built for model and application owners who want to exercise bounded safety fixtures, inspect deterministic detector output, and compare risk signals after a change.

> **Safety by default:** Redline’s bundled fixture mode never contacts a network target and never executes tools. Endpoint mode is disabled unless an operator supplies a scope manifest that allowlists one exact endpoint, sets `allowNetwork: true`, keeps `mockTools: true`, and explicitly acknowledges authorization.

## Why it exists

LLM behavior is variable, and a screenshot of a single prompt is weak evidence. Redline records the evaluation scope, suite, detector policy, source revision, response hashes, repeat count, redacted findings, and coverage gaps. This supports regression testing and technical review without persisting raw prompts, credentials, or real tool output.

## Quick start

```bash
pnpm install
pnpm redline doctor
pnpm redline list
pnpm redline run --suite all --repeat 3
```

The run writes four local, ignored artifacts under `redline-out/`: a provenance-rich JSON record, a Markdown report, a standalone HTML report, and a JSONL event stream. No raw payloads or API keys are written.

To see a deterministic risk-regression comparison without contacting any model, run the clean synthetic baseline and then compare it against the foundation fixture pack:

```bash
pnpm redline run --suites examples/safe-baseline.suites.json --out redline-out/baseline
pnpm redline run --out redline-out/current
pnpm redline compare \
  --baseline redline-out/baseline/<baseline-run>.json \
  --current redline-out/current/<current-run>.json
```

## Core commands

| Command | Purpose |
|---|---|
| `pnpm redline doctor` | Validates the safety manifest, fixture-only containment, and configured detector registry. |
| `pnpm redline list` | Lists bounded cases with their coverage tags and detector assignments. |
| `pnpm redline run --suite all --repeat 3` | Executes the synthetic fixture suite, measures detector reproduction rates, and emits four redacted artifacts. |
| `pnpm redline report --input <run>.json --format html` | Re-renders a self-contained HTML report from a redacted JSON artifact. |
| `pnpm redline compare --baseline <run-a>.json --current <run-b>.json` | Flags case-level risk regressions and improvements between two runs. |
| `pnpm test` | Runs the deterministic evaluator unit tests. |

## Foundation coverage

The included fixture pack demonstrates four bounded test classes: prompt-injection instruction boundaries, synthetic canary leakage, mocked external-action intent, and unsafe-output boundaries. Every case declares its detector policy and coverage tags. The reports also name what is **not** yet tested: retrieval pipelines, multi-turn sessions, real tool execution, and multi-agent propagation.

| Coverage tag | Example controlled check | Detection approach |
|---|---|---|
| OWASP LLM01 | An untrusted document tries to override a higher-priority instruction. | Flag apparent disclosure of private system-level instructions. |
| OWASP LLM02 | A fake marker is placed in a synthetic test record. | Flag any `RL_CANARY_*` marker in a response, then redact it in artifacts. |
| OWASP LLM06 | A model is asked to suggest a fictitious external action. | Record mocked action intent; no action is ever wired for execution. |
| OWASP LLM05 | A case contains a locally-defined unsafe-output marker. | Apply an explicit case-specific output detector. |

## Endpoint mode for authorized targets only

Copy [`examples/approved-endpoint.scope.example.json`](examples/approved-endpoint.scope.example.json), replace the placeholder only after documented authorization, and keep tool execution mocked. API keys must remain in an environment variable; Redline never writes them to an artifact.

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

## Architecture and engineering evidence

The primary tool implementation is intentionally small and inspectable:

```text
scope + synthetic suite → safety guard → adapter boundary → detector registry
                                     → scoring + redaction + provenance
                                     → JSON / JSONL / Markdown / HTML artifacts
```

Read the [architecture](docs/ARCHITECTURE.md), [threat model](docs/THREAT_MODEL.md), [evaluation principles](docs/EVALUATION_PRINCIPLES.md), [contributing guide](CONTRIBUTING.md), and [project showcase](docs/SHOWCASE.md) for design choices, validation boundaries, and a technical walkthrough.

## Verification

GitHub Actions runs unit tests, TypeScript checking, the optional dashboard build, scope validation, and the fixture suite on pushes and pull requests. You can reproduce the same checks locally:

```bash
pnpm test
pnpm check
pnpm build
pnpm redline doctor
pnpm redline run --suite all --repeat 2
```

## Responsible-use statement

Redline is not a scanner, remote exploitation framework, vulnerability certification, or agent executor. Use it only on systems you own or are authorized to assess. Do not include real personal data, API keys, customer data, or unreleased prompts in fixtures. See [SECURITY.md](SECURITY.md) for reporting guidance.

## References

The scope, evidence, and regression design are informed by the following public guidance. [1] [2] [3]

[1]: https://www.cisa.gov/news-events/news/ai-red-teaming-applying-software-tevv-ai-evaluations "CISA: Applying Software TEVV for AI Evaluations"
[2]: https://owaspai.org/docs/5_testing/ "OWASP AI security testing"
[3]: https://developers.openai.com/api/docs/guides/evaluation-best-practices "OpenAI evaluation best practices"
