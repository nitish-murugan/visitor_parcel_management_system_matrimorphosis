import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { VisitorService } from '../../../services/visitor.service';
import { AuthService } from '../../../services/auth.service';
import { CreateVisitorRequest, Visitor } from '../../../models/visitor';
import { NotificationService } from '../../../services/notification.service';

interface Resident {
  id: number;
  name: string;
  phone: string;
  flat: string;
}

@Component({
  selector: 'app-visitor-log',
  templateUrl: './visitor-log.component.html',
  styleUrls: ['./visitor-log.component.scss'],
})
export class VisitorLogComponent implements OnInit {
  visitorForm!: FormGroup;
  isSubmitting = false;
  residents: Resident[] = []; // Will be populated from backend in later phase
  selectedPhotoFile: File | null = null;
  selectedIdProofFile: File | null = null;
  photoPreview: string | null = null;

  // View all visitors
  visitors: Visitor[] = [];
  isLoadingVisitors = false;
  displayedColumns: string[] = [
    'id',
    'visitorName',
    'visitorPhone',
    'residentName',
    'purpose',
    'status',
    'entryTime',
    'exitTime',
  ];
  showVisitorList = true;
  viewMode = false; // true = only show list, false = show form + list

  constructor(
    private fb: FormBuilder,
    private visitorService: VisitorService,
    private authService: AuthService,
    private notifications: NotificationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if we're in view-only mode
    this.viewMode = this.route.snapshot.data['viewMode'] === true;

    this.initializeForm();
    this.loadResidents();
    this.loadAllVisitors();
  }

  initializeForm(): void {
    this.visitorForm = this.fb.group({
      visitor_name: ['', [Validators.required, Validators.minLength(2)]],
      visitor_phone: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{10}$/)],
      ],
      visitor_purpose: ['', Validators.required],
      resident_id: ['', Validators.required],
      // Resident details are auto-filled; no validation needed here
      resident_name: [''],
      resident_phone: [''],
      resident_flat: [''],
      vehicle_number: [''],
      vehicle_type: [''],
      expected_entry_time: [''],
      exit_time: [''],
    });

    // Auto-fill resident details when resident is selected
    this.visitorForm
      .get('resident_id')
      ?.valueChanges.subscribe((residentId) => {
        if (residentId) {
          const resident = this.residents.find((r) => r.id === residentId);
          if (resident) {
            this.visitorForm.patchValue({
              resident_name: resident.name,
              resident_phone: resident.phone,
              resident_flat: resident.flat,
            });
          }
        }
      });
  }

  loadResidents(): void {
    this.authService.getResidents().subscribe({
      next: (response: any) => {
        this.residents = response.residents.map((r: any) => ({
          id: r.id,
          name: r.fullName,
          phone: r.phone || 'Not provided',
          flat: `User-${r.id}`, // Placeholder for flat number
        }));
      },
      error: (error: any) => {
        console.error('Error loading residents:', error);
        this.notifications.error('Failed to load residents');
        this.residents = [];
      },
    });
  }

  loadAllVisitors(): void {
    this.isLoadingVisitors = true;
    this.visitorService.getVisitors().subscribe({
      next: (response) => {
        this.visitors = response.visitors || [];
        this.isLoadingVisitors = false;
      },
      error: (error) => {
        console.error('Error loading visitors:', error);
        this.notifications.error('Failed to load visitor records');
        this.isLoadingVisitors = false;
      },
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.notifications.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notifications.error('Image size should not exceed 5MB');
        return;
      }

      this.selectedPhotoFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onIdProofSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      const allowedTypes = ['image/', 'application/pdf'];
      const isValidType = allowedTypes.some((type) =>
        file.type.startsWith(type)
      );

      if (!isValidType) {
        this.notifications.error('Please select an image or PDF file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notifications.error('File size should not exceed 5MB');
        return;
      }

      this.selectedIdProofFile = file;
    }
  }

  removePhoto(): void {
    this.selectedPhotoFile = null;
    this.photoPreview = null;
  }

  removeIdProof(): void {
    this.selectedIdProofFile = null;
  }

  onSubmit(): void {
    if (this.visitorForm.invalid) {
      this.markFormGroupTouched(this.visitorForm);
      this.notifications.error('Please fill all required fields correctly');
      return;
    }

    this.isSubmitting = true;

    const visitorData: CreateVisitorRequest = {
      visitor_name: this.visitorForm.value.visitor_name,
      visitor_phone: this.visitorForm.value.visitor_phone,
      visitor_purpose: this.visitorForm.value.visitor_purpose,
      resident_id: this.visitorForm.value.resident_id,
      resident_name: this.visitorForm.value.resident_name,
      resident_phone: this.visitorForm.value.resident_phone,
      resident_flat: this.visitorForm.value.resident_flat,
      expected_entry_time:
        this.visitorForm.value.expected_entry_time || undefined,
      exit_time: this.visitorForm.value.exit_time || undefined,
    };

    // TODO: Handle file uploads in Phase 5 (add separate file upload API)
    // For now, just log the visitor without files

    this.visitorService.logVisitor(visitorData).subscribe({
      next: (response) => {
        this.notifications.success('Visitor logged successfully!');
        this.resetForm();
        this.loadAllVisitors(); // Refresh the list
      },
      error: (error) => {
        console.error('Error logging visitor:', error);
        const errorMessage =
          error.error?.message || 'Failed to log visitor. Please try again.';
        this.notifications.error(errorMessage);
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  resetForm(): void {
    this.visitorForm.reset();
    this.selectedPhotoFile = null;
    this.selectedIdProofFile = null;
    this.photoPreview = null;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Helper methods for template
  getErrorMessage(fieldName: string): string {
    const control = this.visitorForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    switch (fieldName) {
      case 'visitor_name':
        if (errors['required']) return 'Visitor name is required';
        if (errors['minlength'])
          return `Name must be at least ${errors['minlength'].requiredLength} characters`;
        break;

      case 'visitor_phone':
        if (errors['required']) return 'Phone number is required';
        if (errors['pattern'])
          return 'Please enter a valid 10-digit phone number';
        break;

      case 'visitor_purpose':
        if (errors['required']) return 'Purpose of visit is required';
        break;

      case 'resident_id':
        if (errors['required']) return 'Please select a resident';
        break;

      case 'resident_name':
        if (errors['required']) return 'Resident name is required';
        break;

      case 'resident_phone':
        if (errors['required']) return 'Resident phone is required';
        if (errors['pattern'])
          return 'Please enter a valid 10-digit phone number';
        break;

      case 'resident_flat':
        if (errors['required']) return 'Flat number is required';
        break;

      case 'vehicle_number':
        if (errors['pattern']) return 'Please enter a valid vehicle number';
        break;
    }

    return 'Invalid field';
  }

  formatDateTime(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'checked_in':
        return 'status-checked-in';
      case 'checked_out':
        return 'status-checked-out';
      default:
        return '';
    }
  }

  getResidentName(residentId: number): string {
    if (!residentId) return 'N/A';
    const resident = this.residents.find((r) => r.id === residentId);
    return resident ? resident.name : `Resident #${residentId}`;
  }
}
