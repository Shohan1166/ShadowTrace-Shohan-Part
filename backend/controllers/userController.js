import { z } from "zod";
import mongoose from "mongoose";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80)
}).strict();

export const updateMyProfile = asyncHandler(async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Please provide a valid name.",
      errors: parsed.error.flatten().fieldErrors
    });
  }

  req.user.name = parsed.data.name;
  await req.user.save();
  res.json({ message: "Profile updated successfully.", user: req.user.toSafeObject() });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("name email role createdAt updatedAt")
    .sort({ createdAt: -1 })
    .limit(200);

  res.json({ users: users.map(user => user.toSafeObject()) });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  const parsed = z.object({ role: z.enum(["user", "admin"]) }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Role must be either user or admin." });
  }

  if (req.user._id.toString() === id && parsed.data.role !== "admin") {
    return res.status(400).json({ message: "You cannot remove your own administrator role." });
  }

  const target = await User.findById(id);
  if (!target) return res.status(404).json({ message: "User not found." });

  target.role = parsed.data.role;
  await target.save();

  res.json({ message: "User role updated.", user: target.toSafeObject() });
});
