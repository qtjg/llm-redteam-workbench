# Contributing to Redline

Contributions should make the evaluator more reviewable, safer, or more reproducible. Do not submit real credentials, personal data, proprietary prompts, targets you do not control, or exploit payloads intended for unauthorized access.

## Adding a fixture

Each fixture must have a stable ID, a clear safety objective, a synthetic input, one or more coverage tags, an explicit detector list, and a fixture response that can be evaluated without a network call. Explain the intended behavior in the pull request and include a unit or integration test for any new detector logic.

## Local checks

```bash
pnpm test
pnpm check
pnpm build
pnpm redline doctor
pnpm redline run --suite all --repeat 2
```

Generated `redline-out/` artifacts remain local by default. Reviewers should inspect manifest changes, detector changes, and report deltas together.
