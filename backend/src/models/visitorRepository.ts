import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../config/db";
import { Visitor, VisitorStatus } from "./visitor";

interface VisitorFilters {
  residentId?: number;
  status?: VisitorStatus;
}

interface CreateVisitorInput {
  residentId: number;
  fullName: string;
  phone?: string;
  purpose?: string;
  expectedAt?: Date;
  checkedOutAt?: Date;
}

interface UpdateVisitorStatusInput {
  id: number;
  status: VisitorStatus;
  arrivedAt?: Date | null;
  checkedInAt?: Date | null;
  checkedOutAt?: Date | null;
}

type VisitorRow = RowDataPacket & {
  id: number;
  resident_id: number;
  visitor_name: string;
  visitor_phone: string | null;
  purpose: string | null;
  status: VisitorStatus;
  expected_at: Date | null;
  arrived_at: Date | null;
  checked_in_at: Date | null;
  checked_out_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

const mapRow = (row: VisitorRow): Visitor => ({
  id: row.id,
  residentId: row.resident_id,
  fullName: row.visitor_name,
  phone: row.visitor_phone ?? undefined,
  purpose: row.purpose ?? undefined,
  status: row.status,
  expectedAt: row.expected_at ?? undefined,
  arrivedAt: row.arrived_at ?? undefined,
  checkedInAt: row.checked_in_at ?? undefined,
  checkedOutAt: row.checked_out_at ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createVisitor = async (
  input: CreateVisitorInput
): Promise<Visitor> => {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO visitors_parcels (
       resident_id, visitor_name, visitor_phone, purpose, status, expected_at, checked_out_at, record_type
     ) VALUES (:resident_id, :visitor_name, :visitor_phone, :purpose, :status, :expected_at, :checked_out_at, 'visitor')`,
    {
      resident_id: input.residentId,
      visitor_name: input.fullName,
      visitor_phone: input.phone ?? null,
      purpose: input.purpose ?? null,
      status: "new" as VisitorStatus,
      expected_at: input.expectedAt ?? null,
      checked_out_at: input.checkedOutAt ?? null,
    }
  );

  const newId = result.insertId;
  const created = await getVisitorById(newId);
  if (!created) throw new Error("Failed to load created visitor");
  return created;
};

export const getVisitors = async (
  filters: VisitorFilters = {}
): Promise<Visitor[]> => {
  const where: string[] = ["record_type = 'visitor'"];
  const params: Record<string, unknown> = {};

  if (filters.residentId !== undefined) {
    where.push("resident_id = :resident_id");
    params.resident_id = filters.residentId;
  }
  if (filters.status !== undefined) {
    where.push("status = :status");
    params.status = filters.status;
  }

  const [rows] = await db.query<VisitorRow[]>(
    `SELECT id, resident_id, visitor_name, visitor_phone, purpose, status, expected_at, arrived_at, checked_in_at, checked_out_at, created_at, updated_at
     FROM visitors_parcels
     WHERE ${where.join(" AND ")}
     ORDER BY created_at DESC`,
    params
  );

  return rows.map(mapRow);
};

export const getVisitorById = async (id: number): Promise<Visitor | null> => {
  const [rows] = await db.query<VisitorRow[]>(
    `SELECT id, resident_id, visitor_name, visitor_phone, purpose, status, expected_at, arrived_at, checked_in_at, checked_out_at, created_at, updated_at
     FROM visitors_parcels
     WHERE id = :id AND record_type = 'visitor'
     LIMIT 1`,
    { id }
  );
  if (!rows.length) return null;
  return mapRow(rows[0]);
};

export const getPendingVisitorsForResident = async (
  residentId: number
): Promise<Visitor[]> => {
  const [rows] = await db.query<VisitorRow[]>(
    `SELECT id, resident_id, visitor_name, visitor_phone, purpose, status, expected_at, arrived_at, checked_in_at, checked_out_at, created_at, updated_at
     FROM visitors_parcels
     WHERE resident_id = :resident_id AND record_type = 'visitor' AND status IN ('new','waiting_approval')
     ORDER BY created_at DESC`,
    { resident_id: residentId }
  );
  return rows.map(mapRow);
};

export const updateVisitorStatus = async (
  input: UpdateVisitorStatusInput
): Promise<Visitor | null> => {
  await db.execute(
    `UPDATE visitors_parcels
     SET status = :status,
         arrived_at = COALESCE(:arrived_at, arrived_at),
         checked_in_at = COALESCE(:checked_in_at, checked_in_at),
         checked_out_at = COALESCE(:checked_out_at, checked_out_at)
     WHERE id = :id AND record_type = 'visitor'`,
    {
      id: input.id,
      status: input.status,
      arrived_at: input.arrivedAt ?? null,
      checked_in_at: input.checkedInAt ?? null,
      checked_out_at: input.checkedOutAt ?? null,
    }
  );

  return getVisitorById(input.id);
};

export const getVisitorHistoryForResident = async (
  residentId: number
): Promise<Visitor[]> => {
  const [rows] = await db.query<VisitorRow[]>(
    `SELECT id, resident_id, visitor_name, visitor_phone, purpose, status, expected_at, arrived_at, checked_in_at, checked_out_at, created_at, updated_at
     FROM visitors_parcels
     WHERE resident_id = :resident_id AND record_type = 'visitor'
     ORDER BY created_at DESC`,
    { resident_id: residentId }
  );
  return rows.map(mapRow);
};

export const getPendingVisitorsCountForResident = async (
  residentId: number
): Promise<number> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count
     FROM visitors_parcels
     WHERE resident_id = :resident_id 
       AND record_type = 'visitor'
       AND status IN ('new', 'waiting_approval')`,
    { resident_id: residentId }
  );
  return rows[0]?.count || 0;
};
