import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { ParcelNotificationService } from '../../../services/parcel-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  isMenuOpen = false;
  visitorNotificationCount = 0;
  parcelNotificationCount = 0;

  private visitorCountSub?: Subscription;
  private parcelCountSub?: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private parcelNotificationService: ParcelNotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser?.role === 'resident') {
      // Subscribe to visitor notifications
      this.visitorCountSub = this.notificationService.pendingCount$.subscribe(
        (count) => {
          this.visitorNotificationCount = count;
        }
      );

      // Subscribe to parcel notifications
      this.parcelCountSub =
        this.parcelNotificationService.pendingCount$.subscribe((count) => {
          this.parcelNotificationCount = count;
        });

      // Start polling
      this.notificationService.startPolling();
      this.parcelNotificationService.startPolling();
    }
  }

  ngOnDestroy(): void {
    this.visitorCountSub?.unsubscribe();
    this.parcelCountSub?.unsubscribe();
    this.notificationService.stopPolling();
    this.parcelNotificationService.stopPolling();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  async logout(): Promise<void> {
    const confirmed = await this.notificationService.confirm({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      confirmColor: 'warn',
    });

    if (confirmed) {
      this.authService.logout();
      this.router.navigate(['/login']);
      this.notificationService.info('Logged out successfully');
    }
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  get isGuard(): boolean {
    return this.currentUser?.role === 'guard';
  }

  get isResident(): boolean {
    return this.currentUser?.role === 'resident';
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  get userName(): string {
    return this.currentUser?.name || this.currentUser?.email || 'User';
  }

  get totalNotifications(): number {
    return this.visitorNotificationCount + this.parcelNotificationCount;
  }
}
