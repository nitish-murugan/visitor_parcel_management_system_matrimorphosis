import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { VisitorService } from './visitor.service';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../components/shared/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private pendingCountSubject = new BehaviorSubject<number>(0);
  public pendingCount$ = this.pendingCountSubject.asObservable();

  private previousCount = 0;
  private pollingSubscription?: Subscription;
  private pollingInterval = 30000; // 30 seconds
  private isPolling = false;

  constructor(
    private visitorService: VisitorService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  /**
   * Snackbar helpers
   */
  private show(
    message: string,
    panelClass: string[],
    duration = 4000,
    action = 'Close'
  ): void {
    this.snackBar.open(message, action, {
      duration,
      panelClass,
    });
  }

  success(message: string, duration = 4000): void {
    this.show(message, ['success-snackbar'], duration);
  }

  info(message: string, duration = 4000): void {
    this.show(message, ['info-snackbar'], duration);
  }

  warn(message: string, duration = 4000): void {
    this.show(message, ['warning-snackbar'], duration);
  }

  error(message: string, duration = 5000): void {
    this.show(message, ['error-snackbar'], duration);
  }

  /**
   * Confirmation dialog helper
   */
  confirm(data: Partial<ConfirmDialogData>): Promise<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: data.title || 'Are you sure?',
        message: data.message || 'This action cannot be undone.',
        confirmText: data.confirmText || 'Confirm',
        cancelText: data.cancelText || 'Cancel',
        confirmColor: data.confirmColor || 'warn',
      },
    });

    return dialogRef.afterClosed().toPromise();
  }

  /**
   * Start polling for pending visitors count
   */
  startPolling(): void {
    if (this.isPolling) {
      return; // Already polling
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'resident') {
      return; // Only poll for residents
    }

    this.isPolling = true;

    // Fetch immediately first
    this.fetchPendingCount(currentUser.id);

    // Then poll every 30 seconds
    this.pollingSubscription = interval(this.pollingInterval)
      .pipe(
        switchMap(() =>
          this.visitorService.getPendingVisitorsCount(currentUser.id)
        )
      )
      .subscribe({
        next: (response) => {
          this.handleCountUpdate(response.count);
        },
        error: (error) => {
          console.error('Error polling pending visitors count:', error);
        },
      });
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
    this.isPolling = false;
  }

  /**
   * Fetch pending count once
   */
  private fetchPendingCount(userId: number): void {
    this.visitorService.getPendingVisitorsCount(userId).subscribe({
      next: (response) => {
        this.handleCountUpdate(response.count);
      },
      error: (error) => {
        console.error('Error fetching pending visitors count:', error);
      },
    });
  }

  /**
   * Handle count update and detect new visitors
   */
  private handleCountUpdate(count: number): void {
    const hasNewVisitor = count > this.previousCount && this.previousCount >= 0;

    this.pendingCountSubject.next(count);

    if (hasNewVisitor) {
      // Trigger notification toast
      this.info('New visitor awaiting approval');
    }

    this.previousCount = count;
  }

  /**
   * Manually refresh count
   */
  refreshCount(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.fetchPendingCount(currentUser.id);
    }
  }

  /**
   * Get current pending count value
   */
  getCurrentCount(): number {
    return this.pendingCountSubject.value;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
