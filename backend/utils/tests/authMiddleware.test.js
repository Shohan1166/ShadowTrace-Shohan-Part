
import test from "node:test";
import assert from "node:assert/strict";

import { requireRole } from "../../middleware/authMiddleware.js";

// Module 1.3 — Role-based access control (Al Mahmud Shohan)
// Tests for requireRole, the guard used by the admin-only user routes.

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
}

// Test 1: Admin is allowed through
test("allows an admin through requireRole('admin')", () => {
  let nextCalled = false;
  const req = { user: { role: "admin" } };
  const res = createResponse();

  requireRole("admin")(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

// Test 2: A normal user is blocked from admin-only routes
test("blocks a normal user from admin-only routes with 403", () => {
  let nextCalled = false;
  const req = { user: { role: "user" } };
  const res = createResponse();

  requireRole("admin")(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "You do not have permission to perform this action.");
});

// Test 3: No signed-in user is blocked
test("blocks a request with no signed-in user", () => {
  let nextCalled = false;
  const req = {};
  const res = createResponse();

  requireRole("admin")(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

// Test 4: Any one of several allowed roles is accepted
test("allows any one of several allowed roles", () => {
  let nextCalled = false;
  const req = { user: { role: "user" } };
  const res = createResponse();

  requireRole("admin", "user")(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});
