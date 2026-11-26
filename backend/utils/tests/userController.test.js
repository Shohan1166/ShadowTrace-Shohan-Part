
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import User from "../../models/User.js";
import {
  updateMyProfile,
  listUsers,
  updateUserRole
} from "../../controllers/userController.js";

// Module 1.3 + 1.4 — Role-based access control and user profile
// management (Al Mahmud Shohan).
// Tests for updateMyProfile, listUsers and updateUserRole. The database
// is mocked, following the style of the existing monitoring tests.

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

function createUserDoc(overrides = {}) {
  const doc = {
    _id: new mongoose.Types.ObjectId(),
    name: "Al Mahmud Shohan",
    email: "shohan@example.com",
    role: "user",
    createdAt: new Date("2026-01-10T00:00:00.000Z"),
    updatedAt: new Date("2026-01-10T00:00:00.000Z"),
    save: async function () { return this; },
    toSafeObject() {
      return {
        id: this._id.toString(),
        name: this.name,
        email: this.email,
        role: this.role,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    },
    ...overrides
  };
  return doc;
}

// Test 1: Profile update with a valid name
test("updates the signed-in user's profile name", async () => {
  const user = createUserDoc();
  const req = { user, body: { name: "  Shohan Updated  " } };
  const res = createResponse();

  await updateMyProfile(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Profile updated successfully.");
  assert.equal(res.body.user.name, "Shohan Updated");
  assert.equal(user.name, "Shohan Updated");
});

// Test 2: Profile update rejects a name that is too short
test("rejects a profile name shorter than 2 characters", async () => {
  const user = createUserDoc();
  const req = { user, body: { name: "A" } };
  const res = createResponse();

  await updateMyProfile(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Please provide a valid name.");
});

// Test 3: Profile update rejects extra fields
test("rejects extra fields in a profile update", async () => {
  const user = createUserDoc();
  const req = { user, body: { name: "Shohan", role: "admin" } };
  const res = createResponse();

  await updateMyProfile(req, res, () => {});

  // The profile schema is strict, so role cannot be changed here.
  assert.equal(res.statusCode, 400);
});

// Test 4: Admin lists users
test("lists users for an admin", async (t) => {
  const users = [createUserDoc(), createUserDoc({ name: "Kafi", email: "kafi@example.com", role: "admin" })];
  const chain = {
    select() { return this; },
    sort() { return this; },
    limit() { return Promise.resolve(users); }
  };
  t.mock.method(User, "find", () => chain);

  const res = createResponse();
  await listUsers({}, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.users.length, 2);
  assert.equal(res.body.users[0].name, "Al Mahmud Shohan");
  assert.equal(res.body.users[1].role, "admin");
});

// Test 5: Admin promotes a user to admin
test("updates a user's role to admin", async (t) => {
  const targetId = new mongoose.Types.ObjectId();
  const target = createUserDoc({ _id: targetId, role: "user" });
  t.mock.method(User, "findById", async () => target);

  const adminId = new mongoose.Types.ObjectId();
  const req = {
    user: { _id: adminId },
    params: { id: targetId.toString() },
    body: { role: "admin" }
  };
  const res = createResponse();

  await updateUserRole(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "User role updated.");
  assert.equal(res.body.user.role, "admin");
  assert.equal(target.role, "admin");
});

// Test 6: An admin cannot remove their own admin role
test("blocks an admin from removing their own admin role", async () => {
  const adminId = new mongoose.Types.ObjectId();
  const req = {
    user: { _id: adminId },
    params: { id: adminId.toString() },
    body: { role: "user" }
  };
  const res = createResponse();

  await updateUserRole(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "You cannot remove your own administrator role.");
});

// Test 7: Role update rejects an invalid role value
test("rejects a role that is not user or admin", async () => {
  const targetId = new mongoose.Types.ObjectId();
  const req = {
    user: { _id: new mongoose.Types.ObjectId() },
    params: { id: targetId.toString() },
    body: { role: "superadmin" }
  };
  const res = createResponse();

  await updateUserRole(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Role must be either user or admin.");
});

// Test 8: Role update rejects an invalid user id
test("rejects a role update with an invalid user id", async () => {
  const req = {
    user: { _id: new mongoose.Types.ObjectId() },
    params: { id: "not-an-id" },
    body: { role: "admin" }
  };
  const res = createResponse();

  await updateUserRole(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "Invalid user ID.");
});

// Test 9: Role update returns 404 when the user does not exist
test("returns 404 when the user to update does not exist", async (t) => {
  t.mock.method(User, "findById", async () => null);

  const targetId = new mongoose.Types.ObjectId();
  const req = {
    user: { _id: new mongoose.Types.ObjectId() },
    params: { id: targetId.toString() },
    body: { role: "admin" }
  };
  const res = createResponse();

  await updateUserRole(req, res, () => {});

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, "User not found.");
});
