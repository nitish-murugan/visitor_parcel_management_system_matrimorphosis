export interface Visitor {
  id?: number;
  record_type?: 'visitor' | 'parcel';
  // Backend camelCase fields (from server response)
  fullName?: string;
  phone?: string;
  purpose?: string;
  residentId?: number;
  expectedAt?: Date;
  arrivedAt?: Date;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  // Frontend snake_case fields (for backward compatibility)
  visitor_name?: string;
  visitor_phone?: string;
  visitor_purpose?: string;
  resident_id?: number;
  resident_name?: string;
  resident_phone?: string;
  resident_flat?: string;
  parcel_description?: string;
  parcel_tracking_number?: string;
  parcel_sender?: string;
  status:
    | 'new'
    | 'waiting_approval'
    | 'approved'
    | 'rejected'
    | 'entered'
    | 'exited';
  expected_entry_time?: string;
  entry_time?: string;
  exit_time?: string;
  approval_time?: string;
  approved_by?: number;
  logged_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVisitorRequest {
  visitor_name: string;
  visitor_phone: string;
  visitor_purpose?: string;
  resident_id: number;
  resident_name: string;
  resident_phone: string;
  resident_flat: string;
  expected_entry_time?: string;
  exit_time?: string;
}

export interface UpdateVisitorStatusRequest {
  status:
    | 'new'
    | 'waiting_approval'
    | 'approved'
    | 'rejected'
    | 'entered'
    | 'exited';
}

export interface VisitorListResponse {
  visitors: Visitor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
