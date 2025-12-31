import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import {
  createParcel,
  getParcels,
  getParcelById,
  getParcelsForResident,
  updateParcelStatus,
  getParcelHistoryForResident,
  getPendingParcelsCountForResident,
} from "../models/parcelRepository";
import { Parcel, ParcelStatus } from "../models/parcel";

const toPublicParcel = (parcel: Parcel) => ({
  id: parcel.id,
  residentId: parcel.residentId,
  parcelNumber: parcel.parcelNumber,
  senderName: parcel.senderName,
  senderPhone: parcel.senderPhone,
  description: parcel.description,
  status: parcel.status,
  receivedAt: parcel.receivedAt,
  acknowledgedAt: parcel.acknowledgedAt,
  collectedAt: parcel.collectedAt,
  createdAt: parcel.createdAt,
  updatedAt: parcel.updatedAt,
});

/**
 * POST /api/parcels
 * Log new parcel (Security Guard only)
 */
export const createParcelHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  // Only guards and admins can log parcels
  if (req.user?.role !== "guard" && req.user?.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Only security guards and admins can log parcels" });
  }

  const { residentId, parcelNumber, senderName, senderPhone, description } =
    req.body;

  // Validation
  if (!residentId || !parcelNumber || !senderName) {
    return res.status(400).json({
      message: "Resident ID, parcel number, and sender name are required",
    });
  }

  if (typeof residentId !== "number" || residentId <= 0) {
    return res.status(400).json({ message: "Invalid resident ID" });
  }

  if (typeof parcelNumber !== "string" || parcelNumber.trim().length === 0) {
    return res.status(400).json({ message: "Parcel number cannot be empty" });
  }

  if (typeof senderName !== "string" || senderName.trim().length === 0) {
    return res.status(400).json({ message: "Sender name cannot be empty" });
  }

  try {
    const parcel = await createParcel({
      residentId,
      parcelNumber: parcelNumber.trim(),
      senderName: senderName.trim(),
      senderPhone: senderPhone?.trim() || undefined,
      description: description?.trim() || undefined,
    });

    return res.status(201).json({
      message: "Parcel logged successfully",
      data: toPublicParcel(parcel),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error creating parcel:", errorMsg);
    return res.status(500).json({
      message: "Failed to create parcel",
      error: errorMsg,
    });
  }
};

/**
 * GET /api/parcels
 * Get all parcels (with pagination & filters)
 */
export const getParcelsHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  // Only guards and admins can view all parcels
  if (!req.user || (req.user.role !== "guard" && req.user.role !== "admin")) {
    return res.status(403).json({
      message: "Only guards and admins can view all parcels",
    });
  }

  const { status, limit = "10", offset = "0" } = req.query;

  try {
    const filters: { status?: ParcelStatus } = {};
    if (
      status &&
      ["received", "acknowledged", "collected"].includes(status as string)
    ) {
      filters.status = status as ParcelStatus;
    }

    const parcels = await getParcels(filters);

    // Pagination
    const pageLimit = Math.min(parseInt(limit as string) || 10, 100);
    const pageOffset = Math.max(parseInt(offset as string) || 0, 0);
    const paginatedParcels = parcels.slice(pageOffset, pageOffset + pageLimit);

    return res.json({
      data: paginatedParcels.map(toPublicParcel),
      pagination: {
        total: parcels.length,
        limit: pageLimit,
        offset: pageOffset,
      },
    });
  } catch (error) {
    console.error("Error fetching parcels:", error);
    return res.status(500).json({ message: "Failed to fetch parcels" });
  }
};

/**
 * GET /api/parcels/:id
 * Get parcel details
 */
export const getParcelHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: "Invalid parcel ID" });
  }

  try {
    const parcel = await getParcelById(parseInt(id));

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    // Residents can only view their own parcels
    if (req.user?.role === "resident" && parcel.residentId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You don't have permission to view this parcel" });
    }

    return res.json({ data: toPublicParcel(parcel) });
  } catch (error) {
    console.error("Error fetching parcel:", error);
    return res.status(500).json({ message: "Failed to fetch parcel" });
  }
};

/**
 * GET /api/parcels/resident/:residentId
 * Get parcels for resident
 */
export const getParcelsForResidentHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { residentId } = req.params;

  if (!residentId || isNaN(parseInt(residentId))) {
    return res.status(400).json({ message: "Invalid resident ID" });
  }

  const numResidentId = parseInt(residentId);

  // Residents can only view their own parcels
  if (req.user?.role === "resident" && req.user.id !== numResidentId) {
    return res.status(403).json({
      message: "You don't have permission to view these parcels",
    });
  }

  try {
    const parcels = await getParcelsForResident(numResidentId);
    return res.json({
      data: parcels.map(toPublicParcel),
      total: parcels.length,
    });
  } catch (error) {
    console.error("Error fetching resident parcels:", error);
    return res.status(500).json({ message: "Failed to fetch parcels" });
  }
};

/**
 * PUT /api/parcels/:id/acknowledge
 * Acknowledge parcel (Resident only)
 */
export const acknowledgeParcelHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  // Only residents can acknowledge parcels
  if (req.user?.role !== "resident") {
    return res
      .status(403)
      .json({ message: "Only residents can acknowledge parcels" });
  }

  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: "Invalid parcel ID" });
  }

  try {
    const parcel = await getParcelById(parseInt(id));

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    // Verify ownership
    if (parcel.residentId !== req.user.id) {
      return res.status(403).json({
        message: "You don't have permission to acknowledge this parcel",
      });
    }

    // Update status to acknowledged
    const updated = await updateParcelStatus({
      id: parseInt(id),
      status: "acknowledged",
      acknowledgedAt: new Date(),
    });

    return res.json({
      message: "Parcel acknowledged successfully",
      data: toPublicParcel(updated!),
    });
  } catch (error) {
    console.error("Error acknowledging parcel:", error);
    return res.status(500).json({ message: "Failed to acknowledge parcel" });
  }
};

/**
 * PUT /api/parcels/:id/status
 * Update parcel status (Guard for received, Resident for collected)
 */
export const updateParcelStatusHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: "Invalid parcel ID" });
  }

  if (!status || !["received", "acknowledged", "collected"].includes(status)) {
    return res.status(400).json({
      message: "Invalid status. Must be: received, acknowledged, or collected",
    });
  }

  try {
    const parcel = await getParcelById(parseInt(id));

    if (!parcel) {
      return res.status(404).json({ message: "Parcel not found" });
    }

    // Authorization checks
    if (status === "received") {
      // Only guards can mark as received
      if (req.user?.role !== "guard") {
        return res
          .status(403)
          .json({ message: "Only guards can mark parcels as received" });
      }
    } else if (status === "acknowledged" || status === "collected") {
      // Only the owning resident can acknowledge/collect
      if (req.user?.role !== "resident") {
        return res
          .status(403)
          .json({ message: "Only residents can update this parcel" });
      }
      if (parcel.residentId !== req.user.id) {
        return res.status(403).json({
          message: "You don't have permission to update this parcel",
        });
      }
    }

    // Update status with appropriate timestamp
    const updateInput: any = { id: parseInt(id), status };

    if (status === "received") {
      updateInput.receivedAt = new Date();
    } else if (status === "acknowledged") {
      updateInput.acknowledgedAt = new Date();
    } else if (status === "collected") {
      updateInput.collectedAt = new Date();
    }

    const updated = await updateParcelStatus(updateInput);

    return res.json({
      message: `Parcel status updated to ${status}`,
      data: toPublicParcel(updated!),
    });
  } catch (error) {
    console.error("Error updating parcel status:", error);
    return res.status(500).json({ message: "Failed to update parcel status" });
  }
};

/**
 * GET /api/parcels/history/resident/:residentId
 * Get complete parcel history for resident
 */
export const getParcelHistoryHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { residentId } = req.params;

  if (!residentId || isNaN(parseInt(residentId))) {
    return res.status(400).json({ message: "Invalid resident ID" });
  }

  const numResidentId = parseInt(residentId);

  // Residents can only view their own history
  if (req.user?.role === "resident" && req.user.id !== numResidentId) {
    return res.status(403).json({
      message: "You don't have permission to view this history",
    });
  }

  try {
    const parcels = await getParcelHistoryForResident(numResidentId);
    return res.json({
      data: parcels.map(toPublicParcel),
      total: parcels.length,
    });
  } catch (error) {
    console.error("Error fetching parcel history:", error);
    return res.status(500).json({ message: "Failed to fetch parcel history" });
  }
};

/**
 * GET /api/parcels/pending-count/:residentId
 * Get count of pending parcels for notification polling
 */
export const getPendingParcelsCountHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { residentId } = req.params;

  if (!residentId || isNaN(parseInt(residentId))) {
    return res.status(400).json({ message: "Invalid resident ID" });
  }

  const numResidentId = parseInt(residentId);

  // Residents can only view their own count
  if (req.user?.role === "resident" && req.user.id !== numResidentId) {
    return res
      .status(403)
      .json({ message: "You don't have permission to view this count" });
  }

  try {
    const count = await getPendingParcelsCountForResident(numResidentId);
    return res.json({ count });
  } catch (error) {
    console.error("Error fetching pending parcels count:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch pending parcels count" });
  }
};
