import assert from "node:assert/strict";
import test from "node:test";
import { validateScope, validateSuiteManifest } from "../src/lib/manifests.mjs";

test("accepts the local fixture scope shape", () => {
  const scope = {
    version: 2,
    authorized: true,
    mode: "fixture",
    fixtureTarget: "local-fixture://test",
    allowedTargets: ["local-fixture://test"],
    allowNetwork: false,
    mockTools: true,
    evidenceRetention: "redacted-only",
  };
  assert.deepEqual(validateScope(scope), []);
});

test("rejects a suite that references an unknown detector", () => {
  const suites = {
    version: 2,
    suites: [
      {
        id: "PI-01",
        title: "x",
        category: "x",
        prompt: "x",
        coverage: ["x"],
        detectors: ["unknown"],
        fixtureResponse: "x",
      },
    ],
  };
  assert.ok(
    validateSuiteManifest(suites, ["known"]).some(error =>
      error.includes("unknown detector")
    )
  );
});
