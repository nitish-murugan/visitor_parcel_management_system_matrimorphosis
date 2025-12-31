export type VisitorStatus =
  | "new"
  | "waiting_approval"
  | "approved"
  | "rejected"
  | "entered"
  | "exited";

export interface Visitor {
  id: number;
  residentId: number;
  fullName: string;
  phone?: string;
  purpose?: string;
  status: VisitorStatus;
  expectedAt?: Date;
  arrivedAt?: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
