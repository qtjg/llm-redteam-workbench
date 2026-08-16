# Security policy

Redline is intended for authorized evaluation only. If you discover a vulnerability in Redline itself, do not publish secrets or exploit details in a public issue. Contact the repository owner through GitHub private channels with a minimal reproduction and sanitized evidence.

For target systems, report findings to the system owner through their documented security process. Redline’s synthetic fixtures must not be used to test systems without explicit authorization.

The autonomous agent is intentionally constrained: it accepts only allowlisted evaluation goals, creates a signed plan digest, runs in fixture-only mode, disables network access, uses mocked tools, writes redacted artifacts, and requires the exact `--approve` flag before execution. It cannot execute shell commands, discover targets, send messages, make purchases, or operate a background daemon. Report any violation of these guarantees as a high-priority security issue.
