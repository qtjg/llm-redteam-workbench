# Redline Observatory

Redline Observatory is a **local-first CLI evaluator for authorized AI/LLM security testing**. Its default mode runs only bundled synthetic fixtures. It captures redacted evidence, assigns deterministic severity, and writes JSON plus Markdown reports. It does not scan targets, persist raw prompts, execute agent tools, or use real secrets.

> **Safety boundary:** Use Redline only on models and endpoints you own or are explicitly authorized to test. The bundled fixture mode is the recommended starting point. Any endpoint-mode run requires a user-authored scope manifest that allowlists one exact endpoint, explicitly allows network access, and keeps `mockTools` enabled.

## Quick start

```bash
pnpm redline doctor
pnpm redline list
pnpm redline run
```

The final command writes redacted artifacts to `redline-out/`. A typical report records the target, mode, model, response hashes, a redacted response preview, detector findings, and an exposure index. Raw payloads and API keys are not written to disk.

## Commands

| Command | Purpose |
|---|---|
| `pnpm redline doctor` | Validates the local scope manifest and confirms fixture-only containment. |
| `pnpm redline list` | Lists the bundled prompt-injection, canary, mocked-action, and output-boundary suites. |
| `pnpm redline run --suite all` | Executes the bounded fixture suite and exports JSON and Markdown evidence. |
| `pnpm redline report --input redline-out/<run>.json` | Re-renders a Markdown report from a redacted JSON artifact. |
| `pnpm redline:test` | Runs deterministic unit tests for redaction and severity logic. |

## Optional endpoint adapter

Endpoint support is intentionally constrained. Create a separate scope manifest only for an endpoint you are authorized to test:

```json
{
  "version": 1,
  "authorized": true,
  "mode": "endpoint",
  "allowedTargets": ["https://approved.example/v1"],
  "allowNetwork": true,
  "mockTools": true,
  "evidenceRetention": "redacted-only"
}
```

Then run an OpenAI-compatible endpoint only after explicitly acknowledging authorization. The API key stays in an environment variable and is never copied into the report.

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

## Repository layout

The CLI lives in `tools/`, its synthetic suites and default local scope live in `fixtures/`, and its generated artifacts are ignored under `redline-out/`. The `client/` directory remains an optional visual prototype of the same safe evaluation workflow.

## Evaluation coverage

The initial suite maps to selected LLM application risks such as prompt injection, sensitive information disclosure, improper output handling, and excessive agency. It is deliberately a narrow, explainable evaluator rather than an automated exploitation framework. See the OWASP LLM Top 10 for broader risk coverage: <https://genai.owasp.org/llm-top-10/>.
