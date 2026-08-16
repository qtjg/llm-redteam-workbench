import assert from "node:assert/strict";
import test from "node:test";
import { redactText } from "../src/lib/redaction.mjs";

test("redacts synthetic markers, API-shaped keys, bearer tokens, and email addresses", () => {
  const output = redactText(
    "RL_CANARY_ALDER RL_RETRIEVAL_CANARY_VIOLET RL_MEMORY_DIRECTIVE_SAFFRON sk-abcdefghijklmnop Bearer abcdefghijklmnop analyst@example.test"
  );
  for (const secret of [
    "RL_CANARY_ALDER",
    "RL_RETRIEVAL_CANARY_VIOLET",
    "RL_MEMORY_DIRECTIVE_SAFFRON",
    "sk-abcdefghijklmnop",
    "abcdefghijklmnop",
    "analyst@example.test",
  ])
    assert.equal(output.includes(secret), false);
});
