import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from '../../services/notification.service';
import { ParcelNotificationService } from '../../services/parcel-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  pendingVisitorCount = 0;
  pendingParcelCount = 0;
  private visitorCountSubscription?: Subscription;
  private parcelCountSubscription?: Subscription;
  private previousVisitorCount = 0;
  private previousParcelCount = 0;

  constructor(
    private notificationService: NotificationService,
    private parcelNotificationService: ParcelNotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Subscribe to visitor pending count changes
    this.visitorCountSubscription =
      this.notificationService.pendingCount$.subscribe((count) => {
        const hasNewVisitor =
          count > this.previousVisitorCount && this.previousVisitorCount > 0;

        this.pendingVisitorCount = count;

        if (hasNewVisitor) {
          this.showNewVisitorAlert();
        }

        this.previousVisitorCount = count;
      });

    // Subscribe to parcel pending count changes
    this.parcelCountSubscription =
      this.parcelNotificationService.pendingCount$.subscribe((count) => {
        const hasNewParcel =
          count > this.previousParcelCount && this.previousParcelCount > 0;

        this.pendingParcelCount = count;

        if (hasNewParcel) {
          this.showNewParcelAlert();
        }

        this.previousParcelCount = count;
      });

    // Start polling for notifications
    this.notificationService.startPolling();
    this.parcelNotificationService.startPolling();
  }

  ngOnDestroy(): void {
    if (this.visitorCountSubscription) {
      this.visitorCountSubscription.unsubscribe();
    }
    if (this.parcelCountSubscription) {
      this.parcelCountSubscription.unsubscribe();
    }
    this.notificationService.stopPolling();
    this.parcelNotificationService.stopPolling();
  }

  private showNewVisitorAlert(): void {
    this.snackBar
      .open('🔔 New visitor awaiting approval!', 'View', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['notification-snackbar'],
      })
      .onAction()
      .subscribe(() => {
        // Navigate to pending approvals
        window.location.href = '/resident-approval';
      });
  }

  private showNewParcelAlert(): void {
    this.snackBar
      .open('📦 New parcel has arrived!', 'View', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['parcel-notification-snackbar'],
      })
      .onAction()
      .subscribe(() => {
        // Navigate to parcels
        window.location.href = '/resident-parcel';
      });
  }
}
