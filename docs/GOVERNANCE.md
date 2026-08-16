# Suite governance and release controls

Redline treats every fixture suite as a maintained evaluation asset rather than an unowned collection of prompts. The suite manifest records a **governance** object with an accountable owner role, a reviewer role, a date of last review, a review cadence, and an approval state. These fields are schema-validated before a run or coverage audit can proceed.

| Record                     | Required fields                                                               | Purpose                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Suite governance           | `owner`, `reviewer`, `lastReviewedAt`, `reviewCadenceDays`, `reviewStatus`    | Establishes responsibility and an expected review interval for the entire synthetic corpus. |
| Fixture case               | Stable ID, category, coverage tags, detectors, synthetic response             | Makes each declared safety objective traceable and deterministic.                           |
| Policy exception           | Exact `caseId`, `findingId`, owner, reviewer, rationale, `expiresAt`          | Documents a narrow, temporary waiver without removing the original finding.                 |
| Release-readiness artifact | Integrity, effective and raw policy posture, provenance, exception accounting | Gives reviewers a local, redacted decision record.                                          |

## Review protocol

Fixture owners review the suite on its declared cadence and whenever a detector, policy threshold, retrieval boundary, model integration, or threat classification changes. The reviewer role should be independent of the immediate fixture edit when practical. A review should confirm that the fixture is synthetic, bounded, reproducible, covered by an appropriate detector, and still safe to retain as a local artifact.

> Governance metadata is accountability information, not a claim of production certification. Redline’s bundled corpus remains a fixture-only evaluation tool.

## Time-bound policy exceptions

An exception is permitted only for one known finding in one named suite case. It cannot broadly suppress a severity, detector, suite, or policy threshold. Every exception must contain an accountable owner, a reviewer role, a meaningful rationale, and an ISO-8601 UTC expiration timestamp. The schema rejects missing or malformed records.

During `redline release`, the original run artifact remains unchanged. The tool retains its raw risk summary and separately computes an effective summary after **currently active, exact-match** exceptions. A release with an active exception is reported as `READY-WITH-EXCEPTIONS`; the report lists the exception ID and expiration. An expired, malformed, or unmatched exception produces `HOLD` and must be reviewed instead of silently continuing.

The file [`examples/time-bound-exception.policy.example.json`](../examples/time-bound-exception.policy.example.json) is a safe template. It uses a synthetic finding and must not be copied as approval for a real system.

## Automated checks and release evidence

The standard verification workflow runs for pull requests and pushes to `main`. It validates manifests, executes deterministic tests, checks formatting, produces a manifest coverage audit, and runs the safe baseline smoke path. The separate **Redline Release Readiness** workflow runs on version tags matching `v*` or through manual dispatch. It rebuilds the safe-baseline evidence bundle and uploads only redacted coverage and release-readiness artifacts.

The workflow does **not** contact a model, send a prompt to a target, create a GitHub release, or publish a package. Creating a tag and releasing software remain deliberate maintainer actions. The automation supplies review evidence; it does not replace human authorization.
