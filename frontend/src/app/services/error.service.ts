import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppError {
  status: number;
  message: string;
  details?: any;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private errorSubject = new BehaviorSubject<AppError | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Handle HTTP error responses
   */
  handleError(error: HttpErrorResponse): void {
    const appError: AppError = {
      status: error.status,
      message: this.getErrorMessage(error),
      details: error.error,
      timestamp: new Date(),
    };

    // Store error for potential display in error component
    this.errorSubject.next(appError);

    // Show notification based on error type
    this.showErrorNotification(appError);
  }

  /**
   * Get user-friendly error message based on error type
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    // Handle server-side validation errors
    if (error.error?.message) {
      return error.error.message;
    }

    // Handle specific HTTP status codes
    switch (error.status) {
      case 400:
        return this.getValidationErrorMessage(error);

      case 401:
        return 'Session expired. Please login again.';

      case 403:
        return 'Access denied. You do not have permission to perform this action.';

      case 404:
        return 'The requested resource was not found.';

      case 409:
        return error.error?.message || 'Conflict with existing data.';

      case 500:
        return 'Server error. Please try again later.';

      case 502:
        return 'Bad Gateway. The server is temporarily unavailable.';

      case 503:
        return 'Service unavailable. Please try again later.';

      case 0:
        // Network error
        return 'Network error. Please check your internet connection.';

      default:
        return `An error occurred (${error.status}). Please try again.`;
    }
  }

  /**
   * Extract validation error message from 400 error response
   */
  private getValidationErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.errors && Array.isArray(error.error.errors)) {
      // Join multiple validation errors
      const messages = error.error.errors
        .map((err: any) => err.message || err)
        .join(', ');
      return messages || 'Please check your input and try again.';
    }

    return error.error?.message || 'Please check your input and try again.';
  }

  /**
   * Display error notification
   */
  private showErrorNotification(error: AppError): void {
    const panelClass = this.getErrorPanelClass(error.status);

    this.snackBar.open(error.message, 'Close', {
      duration: this.getNotificationDuration(error.status),
      panelClass: [panelClass],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  /**
   * Get CSS class for snackbar based on error type
   */
  private getErrorPanelClass(status: number): string {
    switch (status) {
      case 401:
      case 403:
        return 'error-snackbar-auth';
      case 404:
        return 'error-snackbar-notfound';
      case 500:
      case 502:
      case 503:
        return 'error-snackbar-server';
      default:
        return 'error-snackbar';
    }
  }

  /**
   * Get notification duration based on error severity
   */
  private getNotificationDuration(status: number): number {
    // Server errors show longer
    if (status >= 500) {
      return 7000;
    }
    // Auth errors show longer
    if (status === 401 || status === 403) {
      return 5000;
    }
    // Validation errors standard duration
    return 4000;
  }

  /**
   * Clear current error
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Get current error
   */
  getCurrentError(): AppError | null {
    return this.errorSubject.value;
  }

  /**
   * Check if there's an active error
   */
  hasError(): boolean {
    return this.errorSubject.value !== null;
  }
}
