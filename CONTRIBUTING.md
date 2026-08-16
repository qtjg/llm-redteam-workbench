# Contributing to Redline

Contributions should make the evaluator more reviewable, safer, or more reproducible. Do not submit real credentials, personal data, proprietary prompts, targets you do not control, or exploit payloads intended for unauthorized access.

## Adding a fixture

Each fixture must have a stable ID, a clear safety objective, a synthetic input, one or more coverage tags, an explicit detector list, and a fixture response that can be evaluated without a network call. The suite manifest must retain its required governance record: owner role, reviewer role, last-review date, review cadence, and approval state. Explain the intended behavior and the governance impact in the pull request, then include a unit or integration test for any new detector logic.

## Exceptions and review

Do not weaken policy thresholds to bypass a known result. If a temporary exception is necessary for an authorized synthetic release scenario, scope it to one `caseId` and one `findingId`, assign an owner and reviewer, document a rationale, and set an ISO-8601 UTC expiry. The release utility reports active exceptions separately and blocks expired or malformed entries. See [governance controls](docs/GOVERNANCE.md) for the complete protocol.

## Local checks

```bash
pnpm format:check
pnpm validate
pnpm test
pnpm smoke
pnpm redline doctor
pnpm redline coverage --format markdown
```

Generated `redline-out/` artifacts remain local by default. Reviewers should inspect manifest changes, detector changes, governance metadata, exception expiry, and report deltas together. Pull requests and `main` pushes run the same local quality gates in GitHub Actions; a version tag or manual release-readiness dispatch creates redacted review artifacts without contacting a live target.
