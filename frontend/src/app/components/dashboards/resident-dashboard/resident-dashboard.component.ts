import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { ParcelNotificationService } from '../../../services/parcel-notification.service';

@Component({
  selector: 'app-resident-dashboard',
  templateUrl: './resident-dashboard.component.html',
  styleUrls: ['./resident-dashboard.component.scss'],
})
export class ResidentDashboardComponent implements OnInit, OnDestroy {
  currentUser: any;
  visitorCount = 0;
  parcelCount = 0;

  private visitorCountSub?: Subscription;
  private parcelCountSub?: Subscription;

  quickLinks = [
    {
      title: 'Visitor Approvals',
      description: 'Review and approve pending visitors',
      icon: 'how_to_reg',
      route: '/resident/visitor-approvals',
      color: 'primary',
      countKey: 'visitor',
    },
    {
      title: 'My Parcels',
      description: 'View and collect your parcels',
      icon: 'inbox',
      route: '/resident/parcels',
      color: 'accent',
      countKey: 'parcel',
    },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private parcelNotificationService: ParcelNotificationService
  ) {
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    // Subscribe to pending counts
    this.visitorCountSub = this.notificationService.pendingCount$.subscribe(
      (count) => (this.visitorCount = count)
    );

    this.parcelCountSub =
      this.parcelNotificationService.pendingCount$.subscribe(
        (count) => (this.parcelCount = count)
      );

    // Start polling for notifications
    this.notificationService.startPolling();
    this.parcelNotificationService.startPolling();
  }

  ngOnDestroy(): void {
    this.visitorCountSub?.unsubscribe();
    this.parcelCountSub?.unsubscribe();
    this.notificationService.stopPolling();
    this.parcelNotificationService.stopPolling();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getCount(countKey: string): number {
    return countKey === 'visitor' ? this.visitorCount : this.parcelCount;
  }

  get userName(): string {
    return this.currentUser?.name || 'Resident';
  }

  get totalPendingItems(): number {
    return this.visitorCount + this.parcelCount;
  }
}
