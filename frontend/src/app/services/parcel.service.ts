import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Parcel {
  id: number;
  residentId: number;
  parcelNumber: string;
  senderName: string;
  senderPhone?: string;
  description?: string;
  status: 'received' | 'acknowledged' | 'collected';
  receivedAt?: Date;
  acknowledgedAt?: Date;
  collectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateParcelInput {
  residentId: number;
  parcelNumber: string;
  senderName: string;
  senderPhone?: string;
  description?: string;
}

export interface UpdateParcelStatusInput {
  status: 'received' | 'acknowledged' | 'collected';
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface ListResponse {
  data: Parcel[];
  total?: number;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

const API_BASE = `${environment.apiUrl}/parcels`;

@Injectable({ providedIn: 'root' })
export class ParcelService {
  constructor(private http: HttpClient) {}

  /**
   * Log new parcel (Guard only)
   * POST /api/parcels
   */
  logParcel(parcelData: CreateParcelInput): Observable<ApiResponse<Parcel>> {
    return this.http.post<ApiResponse<Parcel>>(`${API_BASE}`, parcelData);
  }

  /**
   * Get all parcels with pagination and filters (Guard/Admin only)
   * GET /api/parcels
   */
  getParcels(
    status?: 'received' | 'acknowledged' | 'collected',
    limit: number = 10,
    offset: number = 0
  ): Observable<ListResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ListResponse>(`${API_BASE}`, { params });
  }

  /**
   * Get parcel by ID
   * GET /api/parcels/:id
   */
  getParcelById(id: number): Observable<ApiResponse<Parcel>> {
    return this.http.get<ApiResponse<Parcel>>(`${API_BASE}/${id}`);
  }

  /**
   * Get parcels for resident
   * GET /api/parcels/resident/:residentId
   */
  getParcelsForResident(residentId: number): Observable<ListResponse> {
    return this.http.get<ListResponse>(`${API_BASE}/resident/${residentId}`);
  }

  /**
   * Acknowledge parcel (Resident only)
   * PUT /api/parcels/:id/acknowledge
   */
  acknowledgeParcel(id: number): Observable<ApiResponse<Parcel>> {
    return this.http.put<ApiResponse<Parcel>>(
      `${API_BASE}/${id}/acknowledge`,
      {}
    );
  }

  /**
   * Update parcel status
   * PUT /api/parcels/:id/status
   */
  updateParcelStatus(
    id: number,
    statusData: UpdateParcelStatusInput
  ): Observable<ApiResponse<Parcel>> {
    return this.http.put<ApiResponse<Parcel>>(
      `${API_BASE}/${id}/status`,
      statusData
    );
  }

  /**
   * Get parcel history for resident
   * GET /api/parcels/history/resident/:residentId
   */
  getParcelHistoryForResident(residentId: number): Observable<ListResponse> {
    return this.http.get<ListResponse>(
      `${API_BASE}/history/resident/${residentId}`
    );
  }

  /**
   * Get pending parcels count for resident (for notifications)
   * GET /api/parcels/pending-count/:residentId
   */
  getPendingParcelsCount(residentId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${API_BASE}/pending-count/${residentId}`
    );
  }
}
