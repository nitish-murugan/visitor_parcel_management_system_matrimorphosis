import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VisitorService } from '../../../services/visitor.service';
import { AuthService } from '../../../services/auth.service';
import { Visitor } from '../../../models/visitor';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-resident-approval',
  templateUrl: './resident-approval.component.html',
  styleUrls: ['./resident-approval.component.scss'],
})
export class ResidentApprovalComponent implements OnInit {
  pendingVisitors: Visitor[] = [];
  visitorHistory: Visitor[] = [];
  filteredHistory: Visitor[] = [];
  isLoading = false;
  isLoadingHistory = false;
  currentUserId: number | null = null;
  selectedTabIndex = 0;

  // Filter properties
  filterStatus: string = 'all';
  filterDateFrom: Date | null = null;
  filterDateTo: Date | null = null;
  currentPage = 1;
  pageSize = 10;
  totalHistoryCount = 0;

  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'entered', label: 'Entered' },
    { value: 'exited', label: 'Exited' },
  ];

  constructor(
    private visitorService: VisitorService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserId = currentUser.id;
      this.loadPendingVisitors();
    } else {
      this.snackBar.open('Unable to identify current user', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    if (index === 1 && this.visitorHistory.length === 0) {
      this.loadVisitorHistory();
    }
  }

  loadPendingVisitors(): void {
    if (!this.currentUserId) return;

    this.isLoading = true;
    this.visitorService.getPendingVisitors(this.currentUserId).subscribe({
      next: (response) => {
        this.pendingVisitors = response.visitors;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending visitors:', error);
        this.snackBar.open('Failed to load pending visitors', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
        this.isLoading = false;
      },
    });
  }

  approveVisitor(visitor: Visitor): void {
    const visitorName = visitor.fullName || visitor.visitor_name || 'Visitor';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Approve Visitor',
        message: `Are you sure you want to approve ${visitorName}?`,
        confirmText: 'Approve',
        cancelText: 'Cancel',
        confirmColor: 'primary',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && visitor.id) {
        this.updateVisitorStatus(visitor.id, 'approved', visitorName);
      }
    });
  }

  rejectVisitor(visitor: Visitor): void {
    const visitorName = visitor.fullName || visitor.visitor_name || 'Visitor';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Reject Visitor',
        message: `Are you sure you want to reject ${visitorName}? This action cannot be undone.`,
        confirmText: 'Reject',
        cancelText: 'Cancel',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && visitor.id) {
        this.updateVisitorStatus(visitor.id, 'rejected', visitorName);
      }
    });
  }

  private updateVisitorStatus(
    visitorId: number | undefined,
    status: 'approved' | 'rejected',
    visitorName: string | undefined
  ): void {
    if (!visitorId) {
      console.error('Visitor ID is missing');
      return;
    }

    this.visitorService.updateVisitorStatus(visitorId, { status }).subscribe({
      next: (response) => {
        const action = status === 'approved' ? 'approved' : 'rejected';
        this.snackBar.open(
          `Visitor ${visitorName} has been ${action}`,
          'Close',
          {
            duration: 3000,
            panelClass: ['success-snackbar'],
          }
        );
        // Remove the visitor from the list immediately
        this.pendingVisitors = this.pendingVisitors.filter(
          (v) => v.id !== visitorId
        );
        console.log(
          'Visitor removed from list. Remaining:',
          this.pendingVisitors.length
        );
      },
      error: (error) => {
        console.error('Error updating visitor status:', error);
        const errorMessage =
          error.error?.message || 'Failed to update visitor status';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  getStatusChipClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      new: 'status-new',
      waiting_approval: 'status-waiting',
      approved: 'status-approved',
      rejected: 'status-rejected',
    };
    return statusClasses[status] || 'status-default';
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      new: 'New',
      waiting_approval: 'Waiting Approval',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return statusLabels[status] || status;
  }

  formatDateTime(dateTime: string | undefined): string {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  refresh(): void {
    if (this.selectedTabIndex === 0) {
      this.loadPendingVisitors();
    } else {
      this.loadVisitorHistory();
    }
  }

  loadVisitorHistory(): void {
    if (!this.currentUserId) return;

    this.isLoadingHistory = true;
    this.visitorService
      .getVisitorHistory(this.currentUserId, {
        page: this.currentPage,
        limit: this.pageSize,
      })
      .subscribe({
        next: (response) => {
          this.visitorHistory = (response.visitors || []).map((v) =>
            this.normalizeVisitorForHistory(v)
          );
          this.totalHistoryCount = response.total;
          this.applyFilters();
          this.isLoadingHistory = false;
        },
        error: (error) => {
          console.error('Error loading visitor history:', error);
          this.snackBar.open('Failed to load visitor history', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
          this.isLoadingHistory = false;
        },
      });
  }

  applyFilters(): void {
    let filtered = [...this.visitorHistory];

    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((v) => v.status === this.filterStatus);
    }

    // Filter by date range
    if (this.filterDateFrom) {
      const fromDate = new Date(this.filterDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((v) => {
        if (!v.created_at) return false;
        const visitorDate = new Date(v.created_at);
        return visitorDate >= fromDate;
      });
    }

    if (this.filterDateTo) {
      const toDate = new Date(this.filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((v) => {
        if (!v.created_at) return false;
        const visitorDate = new Date(v.created_at);
        return visitorDate <= toDate;
      });
    }

    this.filteredHistory = filtered;
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onDateFromChange(): void {
    this.applyFilters();
  }

  onDateToChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterStatus = 'all';
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this.applyFilters();
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      approved: 'check_circle',
      rejected: 'cancel',
      entered: 'login',
      exited: 'logout',
      new: 'fiber_new',
      waiting_approval: 'pending',
    };
    return icons[status] || 'info';
  }

  private normalizeVisitorForHistory(visitor: Visitor): Visitor {
    const normalizeDate = (value: any) => {
      if (!value) return undefined;
      return value instanceof Date ? value.toISOString() : value;
    };

    return {
      ...visitor,
      visitor_name: visitor.visitor_name || visitor.fullName,
      visitor_phone: visitor.visitor_phone || visitor.phone,
      visitor_purpose: visitor.visitor_purpose || visitor.purpose,
      entry_time:
        visitor.entry_time ||
        normalizeDate(visitor.arrivedAt) ||
        normalizeDate(visitor.checkedInAt) ||
        normalizeDate(visitor.expectedAt),
      exit_time: visitor.exit_time || normalizeDate(visitor.checkedOutAt),
      approval_time: visitor.approval_time || normalizeDate(visitor.updatedAt),
      created_at: visitor.created_at || normalizeDate(visitor.createdAt),
      updated_at: visitor.updated_at || normalizeDate(visitor.updatedAt),
    };
  }
}
