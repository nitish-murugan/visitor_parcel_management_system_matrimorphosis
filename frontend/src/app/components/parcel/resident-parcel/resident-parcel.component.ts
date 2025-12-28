import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { ParcelService } from '../../../services/parcel.service';
import { Parcel } from '../../../services/parcel.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-resident-parcel',
  templateUrl: './resident-parcel.component.html',
  styleUrls: ['./resident-parcel.component.scss'],
})
export class ResidentParcelComponent implements OnInit {
  parcels: Parcel[] = [];
  isLoading = false;
  residentId: number | null = null;
  processingIds: Set<number> = new Set<number>();

  constructor(
    private parcelService: ParcelService,
    private authService: AuthService,
    private notifications: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.residentId = user.id;
      this.loadParcels();
    }
  }

  loadParcels(): void {
    if (!this.residentId) return;

    this.isLoading = true;
    this.parcelService.getParcelsForResident(this.residentId).subscribe({
      next: (response: any) => {
        this.parcels = response.data;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading parcels:', error);
        this.notifications.error('Failed to load parcels');
        this.isLoading = false;
      },
    });
  }

  getStatusChipClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      received: 'status-received',
      acknowledged: 'status-acknowledged',
      collected: 'status-collected',
    };
    return statusMap[status] || 'status-default';
  }

  getStatusLabel(status: string): string {
    const labelMap: { [key: string]: string } = {
      received: 'Received',
      acknowledged: 'Acknowledged',
      collected: 'Collected',
    };
    return labelMap[status] || status;
  }

  getStatusIcon(status: string): string {
    const iconMap: { [key: string]: string } = {
      received: 'local_shipping',
      acknowledged: 'done',
      collected: 'check_circle',
    };
    return iconMap[status] || 'help';
  }

  canAcknowledge(parcel: Parcel): boolean {
    return parcel.status === 'received';
  }

  acknowledgeParcel(parcel: Parcel): void {
    this.notifications
      .confirm({
        title: 'Acknowledge Parcel',
        message: `Do you want to acknowledge receipt of parcel from ${parcel.senderName}?`,
        confirmText: 'Acknowledge',
        cancelText: 'Cancel',
        confirmColor: 'primary',
      })
      .then((result) => {
        if (result) {
          this.performAcknowledge(parcel);
        }
      });
  }

  private performAcknowledge(parcel: Parcel): void {
    this.processingIds.add(parcel.id);
    this.parcelService.acknowledgeParcel(parcel.id).subscribe({
      next: (response: any) => {
        this.notifications.success(
          response.message || 'Parcel acknowledged successfully!'
        );

        // Update the parcel in the list
        const index = this.parcels.findIndex((p) => p.id === parcel.id);
        if (index !== -1) {
          this.parcels[index] = response.data;
        }
        this.processingIds.delete(parcel.id);
      },
      error: (error: any) => {
        console.error('Error acknowledging parcel:', error);
        const errorMessage =
          error.error?.message || 'Failed to acknowledge parcel';
        this.notifications.error(errorMessage);
        this.processingIds.delete(parcel.id);
      },
    });
  }

  collectParcel(parcel: Parcel): void {
    this.notifications
      .confirm({
        title: 'Collect Parcel',
        message: `Mark parcel from ${parcel.senderName} as collected?`,
        confirmText: 'Collect',
        cancelText: 'Cancel',
        confirmColor: 'accent',
      })
      .then((result) => {
        if (result) {
          this.performCollect(parcel);
        }
      });
  }

  private performCollect(parcel: Parcel): void {
    this.processingIds.add(parcel.id);
    this.parcelService
      .updateParcelStatus(parcel.id, { status: 'collected' })
      .subscribe({
        next: (response: any) => {
          this.notifications.success(
            response.message || 'Parcel marked as collected!'
          );

          // Update the parcel in the list
          const index = this.parcels.findIndex((p) => p.id === parcel.id);
          if (index !== -1) {
            this.parcels[index] = response.data;
          }
          this.processingIds.delete(parcel.id);
        },
        error: (error: any) => {
          console.error('Error collecting parcel:', error);
          const errorMessage =
            error.error?.message || 'Failed to collect parcel';
          this.notifications.error(errorMessage);
          this.processingIds.delete(parcel.id);
        },
      });
  }

  refresh(): void {
    this.loadParcels();
  }

  formatDateTime(date: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString();
  }
}
