# ShadowTrace — Al Mahmud Shohan parts

**Project:** ShadowTrace – Integrated Modules 1 + 2 (SE331, Lab C2, Fall 2026, Group 05)
**Author of this part:** Al Mahmud Shohan — GitHub: Shohan230

This folder contains only the files for Shohan's assigned parts, copied from
the integrated project with their original paths preserved.

## 1. Module 1.3 — Role-based access control

- `backend/middleware/authMiddleware.js` — `requireAuth` and `requireRole(...roles)` (403 when the role does not match)
- `backend/routes/userRoutes.js` — admin-only `GET /users` and `PATCH /users/:id/role`, both behind `requireAuth` + `requireRole("admin")`
- `backend/controllers/userController.js` — `listUsers` and `updateUserRole` (validates role is `user`/`admin`, blocks removing your own admin role)
- `backend/models/User.js` — `role` field, enum `["user", "admin"]`, default `"user"`
- `frontend/src/components/ProtectedRoute.jsx` — `adminOnly` guard, redirects non-admins to `/dashboard`
- `frontend/src/pages/Admin.jsx` — admin panel: list users, change roles
- `frontend/src/App.jsx` — included for context: wires `/admin` behind `ProtectedRoute adminOnly`

## 2. Module 1.4 — User profile management

- `backend/controllers/userController.js` — `updateMyProfile` (name only, 2–80 chars, Zod-validated)
- `backend/routes/userRoutes.js` — `PATCH /users/me` behind `requireAuth`
- `frontend/src/pages/Profile.jsx` — profile card (name, email, role, member since) + edit-name form; email and role are read-only here
- `backend/models/User.js` — `toSafeObject()` used for profile responses

Note: `userController.js`, `userRoutes.js` and `User.js` appear in both 1.3 and 1.4 because profile and role management share them.

## 3. Module 2.4 — Generate security recommendations

- `backend/utils/riskEngine.js` — `buildRecommendations(records, risk)` in particular: routine advice when there are no matches; change passwords + enable MFA when there are matches; extra advice for password reuse, session tokens, and payment data; recovery-settings check. `calculateExposureRisk` in the same file is the risk-score part (Module 2, Ashif Mridha) and is included because `buildRecommendations` calls it by default.
- `backend/controllers/monitoringController.js` — `scanMonitoredAccount` calls `buildRecommendations` and returns `recommendations` in the scan response
- `frontend/src/pages/Monitoring.jsx` — Security Recommendations panel, labelled "MODULE 02 / AL MAHMUD SHOHAN", rendering the priority, title and detail of each recommendation

## What this is not

This is a subset for showing Shohan's contribution, not a standalone runnable app. It needs the rest of ShadowTrace (auth, MongoDB models, API setup, frontend shell and styles) to run.

## Tests for Shohan's parts

Following the same `node:test` style as Kafi backend tests in
Abdullahel-Kafi1/ShadowTrace PR #1, this repo adds 18 tests for Shohan's
parts only:

- `backend/utils/tests/authMiddleware.test.js` (4 tests) — `requireRole`
  allows an admin, blocks a normal user with 403, blocks a request with
  no signed-in user, and accepts any one of several allowed roles.
- `backend/utils/tests/userController.test.js` (9 tests) — profile name
  update, rejection of a too-short name and of extra fields, listing
  users, promoting a user to admin, blocking self-demotion, rejecting
  an invalid role or user id, and 404 for a missing user.
- `backend/utils/tests/recommendations.test.js` (5 tests) —
  `buildRecommendations`: password-hash reuse review, recovery-advice
  priority High for Critical risk and Medium for Low risk, MFA always
  recommended on a match, and no session/payment advice when those
  data types were not exposed.

Run them from the full ShadowTrace backend with:

```bash
node --test utils/tests/authMiddleware.test.js utils/tests/userController.test.js utils/tests/recommendations.test.js
```

All 18 tests passed locally (Node 24, with both Zod 3 and Zod 4).
