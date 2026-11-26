
import test from "node:test";
import assert from "node:assert/strict";

import { buildRecommendations } from "../riskEngine.js";

// Module 2.4 — Generate security recommendations (Al Mahmud Shohan).
// Focused tests for buildRecommendations cases not covered by the
// existing risk-engine tests: password-hash reuse, recovery-setting
// priority by risk level, and advice that must not appear when the
// matching data type was not exposed.

function titles(recommendations) {
  return recommendations.map((item) => item.title);
}

// Test 1: A password hash also triggers the password-reuse review
test("recommends a password reuse review when a password hash is exposed", () => {
  const records = [
    { severity: "High", exposedDataTypes: ["password hash"] }
  ];
  const recommendations = buildRecommendations(records);

  assert.ok(titles(recommendations).includes("Review password reuse"));
  assert.ok(titles(recommendations).includes("Change affected account passwords"));
});

// Test 2: Recovery advice is High priority for a Critical risk
test("gives recovery advice High priority for a Critical risk", () => {
  const records = [
    { severity: "Critical", exposedDataTypes: ["password", "session token"] }
  ];
  const recommendations = buildRecommendations(records);
  const recovery = recommendations.find(
    (item) => item.title === "Check account recovery settings"
  );

  assert.ok(recovery);
  assert.equal(recovery.priority, "High");
});

// Test 3: Recovery advice is Medium priority for a Low risk
test("gives recovery advice Medium priority for a Low risk", () => {
  const records = [
    { severity: "Low", exposedDataTypes: ["email"] }
  ];
  const recommendations = buildRecommendations(records);
  const recovery = recommendations.find(
    (item) => item.title === "Check account recovery settings"
  );

  assert.ok(recovery);
  assert.equal(recovery.priority, "Medium");
});

// Test 4: Multi-factor authentication is always recommended on a match
test("always recommends multi-factor authentication when there is a match", () => {
  const records = [
    { severity: "Medium", exposedDataTypes: ["email", "full name"] }
  ];
  const recommendations = buildRecommendations(records);

  assert.ok(titles(recommendations).includes("Enable multi-factor authentication"));
});

// Test 5: Session and payment advice do not appear when not exposed
test("does not recommend session or payment actions when those types were not exposed", () => {
  const records = [
    { severity: "Medium", exposedDataTypes: ["email"] }
  ];
  const recommendations = buildRecommendations(records);

  assert.ok(!titles(recommendations).includes("Sign out other sessions"));
  assert.ok(!titles(recommendations).includes("Review payment activity"));
});
