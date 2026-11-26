import { Router } from "express";
import { updateMyProfile, listUsers, updateUserRole } from "../controllers/userController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.patch("/me", requireAuth, updateMyProfile);
router.get("/", requireAuth, requireRole("admin"), listUsers);
router.patch("/:id/role", requireAuth, requireRole("admin"), updateUserRole);

export default router;
