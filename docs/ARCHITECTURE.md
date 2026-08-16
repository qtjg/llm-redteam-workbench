# Architecture

Redline follows a small, inspectable pipeline so a reviewer can trace how a result was produced. The CLI is the primary deliverable; the dashboard is an optional visualization prototype and does not drive the evaluator.

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
```

## Components

| Component | Responsibility | Security property |
|---|---|---|
| `fixtures/redline.scope.json` | Declares what is authorized and whether networking is permitted. | Fails closed: fixture mode is default, and endpoint mode requires a matching exact allowlist. |
| `fixtures/redline.suites.json` | Holds synthetic prompts, expected coverage tags, and explicit detector assignments. | Cases contain fake canaries only; no real credentials are bundled. |
| `tools/core.mjs` | Enforces scope, invokes the bounded adapter, applies detectors, scores findings, and emits artifacts. | Tool actions are always mocked and raw payloads are not written. |
| `tools/redline.mjs` | Provides the CLI contract and captures a source revision for the artifact provenance. | Endpoint mode requires an explicit authorization acknowledgement. |
| `redline-out/` | Holds ignored local artifacts. | JSON stores hashes and redacted previews; Markdown and HTML are derived from the redacted JSON. |

## Reproducibility

Every run contains SHA-256 digests for the scope manifest, suite manifest, detector catalog, and response hashes. A deterministic `runFingerprint` is derived from those digests and evaluated outcomes. This allows reviewers to distinguish a different target outcome from a modified test corpus or policy configuration.

The `--repeat` option records an observed reproduction rate for each detector. Redline does not present a single outcome as a universal claim about an LLM; it records the evaluated cases, retry count, and explicit coverage gaps.

## Non-goals

Redline is not a vulnerability scanner, a remote exploitation framework, an agent executor, or a security certification service. It deliberately does not perform discovery, credential collection, persistence, destructive actions, unbounded prompt generation, or real tool invocation.
