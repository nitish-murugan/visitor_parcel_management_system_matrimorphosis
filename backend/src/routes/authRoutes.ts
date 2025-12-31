import { Router } from "express";
import {
  register,
  login,
  me,
  logout,
  getResidents,
} from "../controllers/authController";
import { requireAuth, requireRoles } from "../middlewares/auth";
import {
  requireFields,
  validateEmail,
  validatePassword,
} from "../middlewares/validate";

const router = Router();

router.post(
  "/register",
  requireFields(["fullName", "email", "password"]),
  validateEmail,
  validatePassword(6),
  register
);

router.post(
  "/login",
  requireFields(["email", "password"]),
  validateEmail,
  login
);

router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.get(
  "/residents",
  requireAuth,
  requireRoles("guard", "admin"),
  getResidents
);

export default router;
