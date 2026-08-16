# Architecture

Redline follows a small, inspectable CLI pipeline so a reviewer can trace how a result was produced. The autonomous layer is a bounded orchestration loop over that pipeline; it does not create a second execution engine.

```text
scope manifest + suite manifest
            │
            ▼
      scope guard
            │       fixture mode: no network
            ▼
     adapter boundary
            │
            ▼
 detector registry → scoring → redaction → provenance bundle
            │
            ▼
 JSON · JSONL events · Markdown · standalone HTML report
            │
            ▼
 optional bounded agent plan → approval → steps → chained audit log
```

## Components

| Component                      | Responsibility                                                                            | Security property                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `fixtures/redline.scope.json`  | Declares what is authorized and whether networking is permitted.                          | Fails closed: fixture mode is default, and endpoint mode requires a matching exact allowlist. |
| `fixtures/redline.suites.json` | Holds synthetic prompts, expected coverage tags, and explicit detector assignments.       | Cases contain fake canaries only; no real credentials are bundled.                            |
| `src/lib/evaluator.mjs`        | Runs the bounded adapter, applies detectors, scores findings, and emits provenance.       | Tool actions are mocked and raw payloads are not written.                                     |
| `src/lib/agent.mjs`            | Creates allowlisted plans, gates approval, pauses/resumes steps, and chains audit events. | Fixture-only mode, disabled network, bounded step count, and tamper-evident audit log.        |
| `src/cli.mjs`                  | Provides the CLI contract and captures a source revision for artifact provenance.         | Agent execution requires the exact explicit approval flag.                                    |
| `redline-out/`                 | Holds ignored local evaluation artifacts.                                                 | JSON stores hashes and redacted previews; Markdown and HTML are derived from redacted JSON.   |

## Reproducibility

Every run contains SHA-256 digests for the scope manifest, suite manifest, detector catalog, and response hashes. A deterministic `runFingerprint` is derived from those digests and evaluated outcomes. This allows reviewers to distinguish a different target outcome from a modified test corpus or policy configuration.

The `--repeat` option records an observed reproduction rate for each detector. Redline does not present a single outcome as a universal claim about an LLM; it records the evaluated cases, retry count, and explicit coverage gaps.

## Non-goals

Redline is not a vulnerability scanner, a remote exploitation framework, or a security certification service. Its agent mode is deliberately bounded: it does not perform discovery, credential collection, persistence, destructive actions, unbounded prompt generation, shell commands, real tool invocation, or background execution.
