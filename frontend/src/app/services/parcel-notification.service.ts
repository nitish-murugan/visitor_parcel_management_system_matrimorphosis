import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, interval, Subscription, switchMap } from 'rxjs';
import { ParcelService } from './parcel.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class ParcelNotificationService implements OnDestroy {
  private pendingCountSubject = new BehaviorSubject<number>(0);
  readonly pendingCount$ = this.pendingCountSubject.asObservable();

  private previousCount = 0;
  private pollingSubscription: Subscription | null = null;

  constructor(
    private parcelService: ParcelService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  startPolling(): void {
    const user = this.authService.getCurrentUser();

    // Only residents should poll for parcel notifications
    if (!user || user.role !== 'resident') {
      return;
    }

    // Fetch immediately
    this.fetchPendingCount(user.id);

    // Then set up polling every 30 seconds
    this.pollingSubscription = interval(30000)
      .pipe(
        switchMap(() => {
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            return this.parcelService.getPendingParcelsCount(currentUser.id);
          }
          return [] as any;
        })
      )
      .subscribe({
        next: (response: any) => {
          this.handleCountUpdate(response.count);
        },
        error: (error) => {
          console.error('Error polling parcel count:', error);
        },
      });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  private fetchPendingCount(residentId: number): void {
    this.parcelService.getPendingParcelsCount(residentId).subscribe({
      next: (response: any) => {
        this.handleCountUpdate(response.count);
      },
      error: (error) => {
        console.error('Error fetching pending parcels count:', error);
      },
    });
  }

  private handleCountUpdate(newCount: number): void {
    const previous = this.previousCount;

    // Emit the new count
    this.pendingCountSubject.next(newCount);

    // Show toast on increase
    if (newCount > previous) {
      const added = newCount - previous;
      this.notificationService.info(
        added > 1 ? `${added} new parcels pending` : `New parcel pending`
      );
    }

    // Store for next comparison
    this.previousCount = newCount;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
