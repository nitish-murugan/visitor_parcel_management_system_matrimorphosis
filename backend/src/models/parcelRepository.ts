import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../config/db";
import { Parcel, ParcelStatus } from "./parcel";

interface ParcelFilters {
  residentId?: number;
  status?: ParcelStatus;
}

interface CreateParcelInput {
  residentId: number;
  parcelNumber: string;
  senderName: string;
  senderPhone?: string;
  description?: string;
}

interface UpdateParcelStatusInput {
  id: number;
  status: ParcelStatus;
  receivedAt?: Date | null;
  acknowledgedAt?: Date | null;
  collectedAt?: Date | null;
}

type ParcelRow = RowDataPacket & {
  id: number;
  resident_id: number;
  parcel_number: string;
  sender_name: string;
  sender_phone: string | null;
  description: string | null;
  status: ParcelStatus;
  received_at: Date | null;
  acknowledged_at: Date | null;
  collected_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

const mapRow = (row: ParcelRow): Parcel => ({
  id: row.id,
  residentId: row.resident_id,
  parcelNumber: row.parcel_number,
  senderName: row.sender_name,
  senderPhone: row.sender_phone ?? undefined,
  description: row.description ?? undefined,
  status: row.status,
  receivedAt: row.received_at ?? undefined,
  acknowledgedAt: row.acknowledged_at ?? undefined,
  collectedAt: row.collected_at ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createParcel = async (
  input: CreateParcelInput
): Promise<Parcel> => {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO visitors_parcels (
       resident_id, parcel_carrier, parcel_tracking, purpose, status, record_type, arrived_at
     ) VALUES (:resident_id, :parcel_carrier, :parcel_tracking, :purpose, :status, 'parcel', NOW())`,
    {
      resident_id: input.residentId,
      parcel_carrier: input.parcelNumber,
      parcel_tracking: input.senderName,
      purpose: input.description ?? null,
      status: "received" as ParcelStatus,
    }
  );

  const newId = result.insertId;
  const created = await getParcelById(newId);
  if (!created) throw new Error("Failed to load created parcel");
  return created;
};

export const getParcels = async (
  filters: ParcelFilters = {}
): Promise<Parcel[]> => {
  const where: string[] = ["record_type = 'parcel'"];
  const params: Record<string, unknown> = {};

  if (filters.residentId !== undefined) {
    where.push("resident_id = :resident_id");
    params.resident_id = filters.residentId;
  }
  if (filters.status !== undefined) {
    where.push("status = :status");
    params.status = filters.status;
  }

  const [rows] = await db.query<ParcelRow[]>(
    `SELECT id, resident_id, parcel_carrier as parcel_number, parcel_tracking as sender_name, null as sender_phone, purpose as description, status, arrived_at as received_at, checked_in_at as acknowledged_at, checked_out_at as collected_at, created_at, updated_at
     FROM visitors_parcels
     WHERE ${where.join(" AND ")}
     ORDER BY created_at DESC`,
    params
  );

  return rows.map(mapRow);
};

export const getParcelById = async (id: number): Promise<Parcel | null> => {
  const [rows] = await db.query<ParcelRow[]>(
    `SELECT id, resident_id, parcel_carrier as parcel_number, parcel_tracking as sender_name, null as sender_phone, purpose as description, status, arrived_at as received_at, checked_in_at as acknowledged_at, checked_out_at as collected_at, created_at, updated_at
     FROM visitors_parcels
     WHERE id = :id AND record_type = 'parcel'
     LIMIT 1`,
    { id }
  );
  if (!rows.length) return null;
  return mapRow(rows[0]);
};

export const getParcelsForResident = async (
  residentId: number
): Promise<Parcel[]> => {
  const [rows] = await db.query<ParcelRow[]>(
    `SELECT id, resident_id, parcel_carrier as parcel_number, parcel_tracking as sender_name, null as sender_phone, purpose as description, status, arrived_at as received_at, checked_in_at as acknowledged_at, checked_out_at as collected_at, created_at, updated_at
     FROM visitors_parcels
     WHERE resident_id = :resident_id AND record_type = 'parcel'
     ORDER BY created_at DESC`,
    { resident_id: residentId }
  );
  return rows.map(mapRow);
};

export const updateParcelStatus = async (
  input: UpdateParcelStatusInput
): Promise<Parcel | null> => {
  await db.execute(
    `UPDATE visitors_parcels
     SET status = :status,
         received_at = COALESCE(:received_at, received_at),
         acknowledged_at = COALESCE(:acknowledged_at, acknowledged_at),
         collected_at = COALESCE(:collected_at, collected_at)
     WHERE id = :id AND record_type = 'parcel'`,
    {
      id: input.id,
      status: input.status,
      received_at: input.receivedAt ?? null,
      acknowledged_at: input.acknowledgedAt ?? null,
      collected_at: input.collectedAt ?? null,
    }
  );

  return getParcelById(input.id);
};

export const getParcelHistoryForResident = async (
  residentId: number
): Promise<Parcel[]> => {
  const [rows] = await db.query<ParcelRow[]>(
    `SELECT id, resident_id, parcel_carrier as parcel_number, parcel_tracking as sender_name, null as sender_phone, purpose as description, status, arrived_at as received_at, checked_in_at as acknowledged_at, checked_out_at as collected_at, created_at, updated_at
     FROM visitors_parcels
     WHERE resident_id = :resident_id AND record_type = 'parcel'
     ORDER BY created_at DESC`,
    { resident_id: residentId }
  );
  return rows.map(mapRow);
};

export const getPendingParcelsCountForResident = async (
  residentId: number
): Promise<number> => {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count
     FROM visitors_parcels
     WHERE resident_id = :resident_id 
       AND record_type = 'parcel'
       AND status IN ('received', 'acknowledged')`,
    { resident_id: residentId }
  );
  return rows[0]?.count || 0;
};
