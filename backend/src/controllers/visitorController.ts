import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import {
  createVisitor,
  getVisitors,
  getVisitorById,
  getPendingVisitorsForResident,
  updateVisitorStatus,
  getVisitorHistoryForResident,
  getPendingVisitorsCountForResident,
} from "../models/visitorRepository";
import { VisitorStatus } from "../models/visitor";

const parsePage = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export const createVisitorHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const {
    resident_id,
    visitor_name,
    visitor_phone,
    visitor_purpose,
    expected_entry_time,
    exit_time,
  } = req.body;
  try {
    const visitor = await createVisitor({
      residentId: Number(resident_id),
      fullName: visitor_name,
      phone: visitor_phone,
      purpose: visitor_purpose,
      expectedAt: expected_entry_time
        ? new Date(expected_entry_time)
        : undefined,
      checkedOutAt: exit_time ? new Date(exit_time) : undefined,
    });
    res.status(201).json({ visitor });
  } catch (err) {
    res.status(400).json({
      message: err instanceof Error ? err.message : "Could not create visitor",
    });
  }
};

export const listVisitorsHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { residentId, status, page = "1", pageSize = "20" } = req.query;
  const filters: { residentId?: number; status?: VisitorStatus } = {};
  if (residentId !== undefined) filters.residentId = Number(residentId);
  if (status !== undefined) filters.status = status as VisitorStatus;

  const pageNum = parsePage(page, 1);
  const sizeNum = parsePage(pageSize, 20);
  const all = await getVisitors(filters);
  const start = (pageNum - 1) * sizeNum;
  const paged = all.slice(start, start + sizeNum);
  const totalPages = Math.ceil(all.length / sizeNum);
  res.json({
    visitors: paged,
    total: all.length,
    page: pageNum,
    limit: sizeNum,
    totalPages: totalPages,
  });
};

export const getVisitorHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const id = Number(req.params.id);
  const visitor = await getVisitorById(id);
  if (!visitor) return res.status(404).json({ message: "Visitor not found" });
  res.json({ visitor });
};

export const getPendingVisitorsHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const residentId = Number(req.params.residentId);
  // Enforce resident can only view their own pending list unless admin/guard
  if (req.user?.role === "resident" && req.user.id !== residentId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const visitors = await getPendingVisitorsForResident(residentId);
  res.json({ visitors });
};

export const updateVisitorStatusHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const id = Number(req.params.id);
  const { status, arrivedAt, checkedInAt, checkedOutAt } = req.body as {
    status: VisitorStatus;
    arrivedAt?: string;
    checkedInAt?: string;
    checkedOutAt?: string;
  };

  // If resident, ensure they are approving/rejecting only their own visitor
  if (req.user?.role === "resident") {
    const visitor = await getVisitorById(id);
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    if (visitor.residentId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  const allowed: VisitorStatus[] = [
    "approved",
    "rejected",
    "entered",
    "exited",
    "waiting_approval",
  ];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const updated = await updateVisitorStatus({
    id,
    status,
    arrivedAt: arrivedAt ? new Date(arrivedAt) : undefined,
    checkedInAt: checkedInAt ? new Date(checkedInAt) : undefined,
    checkedOutAt: checkedOutAt ? new Date(checkedOutAt) : undefined,
  });

  if (!updated) return res.status(404).json({ message: "Visitor not found" });
  res.json({ visitor: updated });
};

export const getVisitorHistoryHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const residentId = Number(req.params.residentId);
  if (req.user?.role === "resident" && req.user.id !== residentId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const visitors = await getVisitorHistoryForResident(residentId);
  res.json({ visitors });
};

export const getPendingVisitorsCountHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const residentId = Number(req.params.residentId);
  // Enforce resident can only view their own count unless admin/guard
  if (req.user?.role === "resident" && req.user.id !== residentId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const count = await getPendingVisitorsCountForResident(residentId);
  res.json({ count });
};
