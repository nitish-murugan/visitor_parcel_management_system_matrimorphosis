import { Router } from "express";
import {
  createVisitorHandler,
  getPendingVisitorsHandler,
  getVisitorHandler,
  getVisitorHistoryHandler,
  listVisitorsHandler,
  updateVisitorStatusHandler,
  getPendingVisitorsCountHandler,
} from "../controllers/visitorController";
import { requireAuth, requireRoles } from "../middlewares/auth";
import {
  requireFields,
  validatePhoneNumber,
  validateNumericId,
  validateVisitorStatusTransition,
  validatePagination,
} from "../middlewares/validate";

const router = Router();

// Security Guard (and Admin) can log visitor entry
router.post(
  "/",
  requireAuth,
  requireRoles("guard", "admin"),
  requireFields(["resident_id", "visitor_name"]),
  validatePhoneNumber,
  createVisitorHandler
);

// Admin / Guard can view all visitors (with filters/pagination)
router.get(
  "/",
  requireAuth,
  requireRoles("guard", "admin"),
  validatePagination,
  listVisitorsHandler
);

// Any authenticated user can view a visitor by id
router.get("/:id", requireAuth, validateNumericId("id"), getVisitorHandler);

// Resident-only pending list (guards/admins also allowed)
router.get(
  "/pending/:residentId",
  requireAuth,
  validateNumericId("residentId"),
  getPendingVisitorsHandler
);

// Update visitor status (guard/admin)
router.put(
  "/:id/status",
  requireAuth,
  requireRoles("guard", "admin", "resident"),
  validateNumericId("id"),
  requireFields(["status"]),
  validateVisitorStatusTransition,
  updateVisitorStatusHandler
);

// Resident history (resident can access own; guard/admin can access any)
router.get(
  "/history/:residentId",
  requireAuth,
  validateNumericId("residentId"),
  getVisitorHistoryHandler
);

// Get pending visitors count (for notifications)
router.get(
  "/pending-count/:residentId",
  requireAuth,
  validateNumericId("residentId"),
  getPendingVisitorsCountHandler
);

export default router;
