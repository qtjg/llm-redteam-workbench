# Threat model and safety boundary

Redline evaluates the behavior of an AI application **only when the operator owns the target or has explicit authorization**. The default fixture mode has no network capability. Endpoint mode is intentionally frictionful: it requires an exact allowlist, `allowNetwork: true`, `mockTools: true`, and `--acknowledge-authorization`.

## Assets and trust boundaries

| Asset | Threat considered | Redline control |
|---|---|---|
| System and developer instructions | Prompt injection or instruction disclosure. | `instruction-boundary` detector and explicit prompt-injection fixture. |
| Sensitive strings in an evaluation | Accidental retention or disclosure. | Synthetic canaries, deterministic redaction, response hashes, and redacted-only artifact retention. |
| Agentic action surface | Unauthorised tool intent. | `mocked-action-intent` detector; tools are not wired to execution capability. |
| Evaluation corpus and policies | Silent test changes or ambiguous evidence. | Versioned manifests, SHA-256 provenance, source revision, JSONL events, and run comparison. |
| Reviewer confidence | Overclaiming coverage or security. | Coverage tags and an explicit list of untested threat classes in every report. |

## In-scope testing

The foundation fixture pack exercises prompt-injection boundaries, synthetic data leakage, mocked action intent, and output-boundary handling. Each case defines its coverage and detector policy. The initial tool is appropriate for safe regression testing and for demonstrating a reviewable evaluation workflow.

## Explicitly untested

Retrieval pipelines, long multi-turn sessions, real tool execution, multi-agent propagation, model supply-chain integrity, and infrastructure security are outside the initial evaluator. These omissions are recorded in artifacts rather than hidden.

## Responsible use

Do not add targets, prompts, data, or endpoints that you are not permitted to evaluate. Do not place real personal data, API keys, customer content, or unreleased system prompts into fixtures. If a production system requires testing, create a reviewable authorization record and use a dedicated sandbox endpoint.

## References

The approach follows CISA’s framing of AI red teaming within software Testing, Evaluation, Validation and Verification (TEVV), and uses the OWASP AI testing lifecycle as a source for explicit scope, threat modeling, case-specific detection, remediation, and retesting. [1] [2]

[1]: https://www.cisa.gov/news-events/news/ai-red-teaming-applying-software-tevv-ai-evaluations "CISA: AI Red Teaming: Applying Software TEVV for AI Evaluations"
[2]: https://owaspai.org/docs/5_testing/ "OWASP AI Exchange: AI security testing"
