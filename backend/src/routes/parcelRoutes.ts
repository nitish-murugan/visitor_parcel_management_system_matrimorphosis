import { Router } from "express";
import {
  createParcelHandler,
  getParcelsHandler,
  getParcelHandler,
  getParcelsForResidentHandler,
  acknowledgeParcelHandler,
  updateParcelStatusHandler,
  getParcelHistoryHandler,
  getPendingParcelsCountHandler,
} from "../controllers/parcelController";
import { requireAuth, requireRoles } from "../middlewares/auth";
import {
  requireFields,
  validatePhoneNumber,
  validateNumericId,
  validateParcelStatusTransition,
  validatePagination,
} from "../middlewares/validate";

const router = Router();

// Security Guard can log new parcel
router.post(
  "/",
  requireAuth,
  requireRoles("guard", "admin"),
  requireFields(["residentId", "parcelNumber", "senderName"]),
  validatePhoneNumber,
  createParcelHandler
);

// Admin / Guard can view all parcels (with filters/pagination)
router.get(
  "/",
  requireAuth,
  requireRoles("guard", "admin"),
  validatePagination,
  getParcelsHandler
);

// Get pending parcels count for resident (for notifications)
router.get(
  "/pending-count/:residentId",
  requireAuth,
  validateNumericId("residentId"),
  getPendingParcelsCountHandler
);

// Resident can acknowledge parcel
router.put(
  "/:id/acknowledge",
  requireAuth,
  requireRoles("resident"),
  validateNumericId("id"),
  acknowledgeParcelHandler
);

// Update parcel status (guard for received, resident for collected)
router.put(
  "/:id/status",
  requireAuth,
  requireRoles("guard", "admin", "resident"),
  validateNumericId("id"),
  requireFields(["status"]),
  validateParcelStatusTransition,
  updateParcelStatusHandler
);

// Get parcels for resident
router.get(
  "/resident/:residentId",
  requireAuth,
  validateNumericId("residentId"),
  getParcelsForResidentHandler
);

// Get parcel history for resident
router.get(
  "/history/resident/:residentId",
  requireAuth,
  validateNumericId("residentId"),
  getParcelHistoryHandler
);

// Get parcel by ID
router.get("/:id", requireAuth, validateNumericId("id"), getParcelHandler);

export default router;
