import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorService } from '../services/error.service';
import { Router } from '@angular/router';

const TOKEN_KEY = 'vpms_token';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private errorService = inject(ErrorService);
  private router = inject(Router);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle specific error codes
        switch (error.status) {
          case 401:
            // Unauthorized - redirect to login
            this.handleUnauthorized();
            break;

          case 403:
            // Forbidden - access denied
            this.handleForbidden();
            break;

          case 404:
            // Not found
            this.handleNotFound();
            break;

          case 500:
          case 502:
          case 503:
            // Server errors
            this.handleServerError(error);
            break;

          case 400:
            // Validation errors - handled by error service
            this.errorService.handleError(error);
            break;

          default:
            // Other errors
            this.errorService.handleError(error);
        }

        // Re-throw error so services can handle it if needed
        return throwError(() => error);
      })
    );
  }

  /**
   * Handle 401 Unauthorized
   */
  private handleUnauthorized(): void {
    // Clear token directly to avoid circular dependency
    localStorage.removeItem(TOKEN_KEY);

    // Navigate to login
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url },
    });

    // Show error notification
    this.errorService.handleError(
      new HttpErrorResponse({
        error: { message: 'Session expired. Please login again.' },
        status: 401,
        statusText: 'Unauthorized',
        url: '',
      })
    );
  }

  /**
   * Handle 403 Forbidden
   */
  private handleForbidden(): void {
    this.errorService.handleError(
      new HttpErrorResponse({
        error: {
          message:
            'Access denied. You do not have permission to perform this action.',
        },
        status: 403,
        statusText: 'Forbidden',
        url: '',
      })
    );
  }

  /**
   * Handle 404 Not Found
   */
  private handleNotFound(): void {
    this.errorService.handleError(
      new HttpErrorResponse({
        error: { message: 'The requested resource was not found.' },
        status: 404,
        statusText: 'Not Found',
        url: '',
      })
    );
  }

  /**
   * Handle 500+ Server Errors
   */
  private handleServerError(error: HttpErrorResponse): void {
    let message = 'Server error. Please try again later.';

    if (error.status === 502) {
      message = 'Bad Gateway. The server is temporarily unavailable.';
    } else if (error.status === 503) {
      message = 'Service unavailable. Please try again later.';
    }

    this.errorService.handleError(
      new HttpErrorResponse({
        error: { message },
        status: error.status,
        statusText: error.statusText,
        url: error.url || '',
      })
    );
  }
}
