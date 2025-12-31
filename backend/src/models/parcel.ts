export type ParcelStatus = "received" | "acknowledged" | "collected";

export interface Parcel {
  id: number;
  residentId: number;
  parcelNumber: string;
  senderName: string;
  senderPhone?: string;
  description?: string;
  status: ParcelStatus;
  receivedAt?: Date;
  acknowledgedAt?: Date;
  collectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
