const REDACTION_RULES = Object.freeze([
  {
    id: "synthetic-canary",
    pattern: /RL_CANARY_[A-Z0-9_-]+/gi,
    replacement: "[REDACTED_SYNTHETIC_CANARY]",
  },
  {
    id: "api-key",
    pattern: /sk-[A-Za-z0-9_-]{12,}/g,
    replacement: "[REDACTED_API_KEY]",
  },
  {
    id: "bearer-token",
    pattern: /(?:Bearer\s+)[A-Za-z0-9._-]{12,}/gi,
    replacement: "Bearer [REDACTED_TOKEN]",
  },
  {
    id: "email",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: "[REDACTED_EMAIL]",
  },
]);

export function redactText(value) {
  return REDACTION_RULES.reduce(
    (result, rule) => result.replace(rule.pattern, rule.replacement),
    String(value)
  );
}

export function redactionCatalog() {
  return REDACTION_RULES.map(({ id, replacement }) => ({ id, replacement }));
}
