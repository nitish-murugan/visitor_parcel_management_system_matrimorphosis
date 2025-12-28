import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Visitor,
  CreateVisitorRequest,
  UpdateVisitorStatusRequest,
  VisitorListResponse,
} from '../models/visitor';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VisitorService {
  private apiUrl = `${environment.apiUrl}/visitors`;

  constructor(private http: HttpClient) {}

  /**
   * Log a new visitor entry (Guard/Admin only)
   */
  logVisitor(
    visitorData: CreateVisitorRequest
  ): Observable<{ message: string; visitor: Visitor }> {
    return this.http.post<{ message: string; visitor: Visitor }>(
      this.apiUrl,
      visitorData
    );
  }

  /**
   * Get all visitors with optional filters (Guard/Admin only)
   */
  getVisitors(params?: {
    page?: number;
    limit?: number;
    status?: string;
    residentId?: number;
  }): Observable<VisitorListResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page)
        httpParams = httpParams.set('page', params.page.toString());
      if (params.limit)
        httpParams = httpParams.set('limit', params.limit.toString());
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.residentId)
        httpParams = httpParams.set('residentId', params.residentId.toString());
    }

    return this.http.get<VisitorListResponse>(this.apiUrl, {
      params: httpParams,
    });
  }

  /**
   * Get a specific visitor by ID
   */
  getVisitorById(id: number): Observable<{ visitor: Visitor }> {
    return this.http.get<{ visitor: Visitor }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get pending visitors for a specific resident
   */
  getPendingVisitors(residentId: number): Observable<{ visitors: Visitor[] }> {
    return this.http.get<{ visitors: Visitor[] }>(
      `${this.apiUrl}/pending/${residentId}`
    );
  }

  /**
   * Update visitor status (Guard/Admin only)
   */
  updateVisitorStatus(
    id: number,
    statusData: UpdateVisitorStatusRequest
  ): Observable<{ message: string; visitor: Visitor }> {
    return this.http.put<{ message: string; visitor: Visitor }>(
      `${this.apiUrl}/${id}/status`,
      statusData
    );
  }

  /**
   * Get visitor history for a specific resident
   */
  getVisitorHistory(
    residentId: number,
    params?: { page?: number; limit?: number }
  ): Observable<VisitorListResponse> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page)
        httpParams = httpParams.set('page', params.page.toString());
      if (params.limit)
        httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<VisitorListResponse>(
      `${this.apiUrl}/history/${residentId}`,
      { params: httpParams }
    );
  }

  /**
   * Get pending visitors count for a specific resident (for notifications)
   */
  getPendingVisitorsCount(residentId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${this.apiUrl}/pending-count/${residentId}`
    );
  }
}
