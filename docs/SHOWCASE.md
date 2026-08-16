# Project showcase: Redline Observatory

## One-line description

**Redline Observatory is a local-first CLI that turns authorized AI/LLM safety tests into reproducible, redacted, reviewable engineering evidence.**

## The problem

Teams often demonstrate LLM safety with screenshots or one-off prompts. That approach makes it difficult to repeat the same evaluation, compare behavior after a change, or share evidence without retaining sensitive data. Redline explores a smaller question: what would a trustworthy local evaluator need in order to make an AI safety finding reviewable?

## What I built

I designed a Node.js command-line tool with an explicit scope manifest, synthetic fixture suites, a policy-driven detector registry, deterministic severity scoring, SHA-256 provenance, repeat-trial reproduction rates, redacted artifacts, and baseline-versus-current comparisons. The default mode has no network access and never invokes tools. An optional OpenAI-compatible adapter exists behind a strict allowlist and authorization gate.

## Engineering decisions worth discussing

| Decision                                           | Why it matters                                                                               |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Fixture-only default                               | It makes the safe path the easiest path and keeps demonstrations reproducible.               |
| Synthetic canaries instead of real secrets         | It demonstrates leakage detection without handling sensitive material.                       |
| Manifest and detector digests                      | It exposes when evaluation inputs or scoring logic changed.                                  |
| Repeat trials and reproduction rates               | It acknowledges that LLM outputs can vary across attempts.                                   |
| Redacted JSON, Markdown, HTML, and JSONL artifacts | It separates evidence useful for review from raw model payloads.                             |
| Regression comparison                              | It changes the question from “did it look safe once?” to “did risk increase after a change?” |

## Demonstration script

```bash
pnpm install
pnpm redline doctor
pnpm redline list
pnpm redline run --suite all --repeat 3
pnpm redline run --suites examples/safe-baseline.suites.json --out redline-out/baseline
pnpm redline compare --baseline redline-out/<baseline>.json --current redline-out/<current>.json
```

Then open the generated `redline-out/<run>.html` report. Explain one simulated data-leak exposure, one mocked-action review finding, the scope constraints, and why the report retains only redacted evidence.

## Honest limitations

This is a foundation evaluator, not a claim that any model is secure. It does not assess multi-turn attacks, production retrieval systems, tool execution, infrastructure security, or model supply chains. The repository makes those gaps explicit and is designed to be extended with organization-specific test cases by authorized evaluators.

## Suggested résumé language

> Built **Redline Observatory**, a local-first AI/LLM security evaluation CLI that enforces explicit target scope, runs synthetic prompt-injection and data-leakage fixtures, records SHA-256 provenance and redacted artifacts, and detects risk regressions across runs.

Use the sentence only if you can personally explain the architecture, safety choices, test suite, and limitations in a technical discussion.
