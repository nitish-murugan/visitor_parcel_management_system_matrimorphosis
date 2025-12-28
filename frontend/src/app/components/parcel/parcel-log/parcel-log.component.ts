import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ParcelService, Parcel } from '../../../services/parcel.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-parcel-log',
  templateUrl: './parcel-log.component.html',
  styleUrls: ['./parcel-log.component.scss'],
})
export class ParcelLogComponent implements OnInit {
  parcelForm!: FormGroup;
  isSubmitting = false;
  residents: any[] = [];
  photoPreview: string | null = null;
  photoFile: File | null = null;

  // View all parcels
  parcels: Parcel[] = [];
  isLoadingParcels = false;
  displayedColumns: string[] = [
    'id',
    'parcelNumber',
    'residentId',
    'senderName',
    'senderPhone',
    'description',
    'status',
    'receivedAt',
  ];
  showParcelList = true;
  viewMode = false; // true = only show list, false = show form + list

  constructor(
    private fb: FormBuilder,
    private parcelService: ParcelService,
    private authService: AuthService,
    private notifications: NotificationService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if we're in view-only mode
    this.viewMode = this.route.snapshot.data['viewMode'] === true;

    this.initializeForm();
    this.loadResidents();
    this.loadAllParcels();
  }

  initializeForm(): void {
    this.parcelForm = this.fb.group({
      residentId: ['', Validators.required],
      residentName: [''],
      residentEmail: [''],
      parcelNumber: ['', [Validators.required, Validators.minLength(3)]],
      senderName: ['', [Validators.required, Validators.minLength(2)]],
      senderPhone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      description: [''],
    });

    // Auto-fill resident details when resident is selected
    this.parcelForm.get('residentId')?.valueChanges.subscribe((residentId) => {
      if (residentId) {
        const resident = this.residents.find((r) => r.id === residentId);
        if (resident) {
          this.parcelForm.patchValue({
            residentName: resident.name,
            residentEmail: resident.email,
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
          email: r.email,
        }));
      },
      error: (error: any) => {
        console.error('Error loading residents:', error);
        this.notifications.error('Failed to load residents');
        this.residents = [];
      },
    });
  }

  loadAllParcels(): void {
    this.isLoadingParcels = true;
    this.parcelService.getParcels().subscribe({
      next: (response) => {
        this.parcels = response.data || [];
        this.isLoadingParcels = false;
      },
      error: (error) => {
        console.error('Error loading parcels:', error);
        this.notifications.error('Failed to load parcel records');
        this.isLoadingParcels = false;
      },
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.notifications.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.notifications.error('Image size must be less than 5MB');
      return;
    }

    this.photoFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.photoFile = null;
    this.photoPreview = null;
  }

  onSubmit(): void {
    if (this.parcelForm.invalid) {
      this.markFormGroupTouched(this.parcelForm);
      this.notifications.error('Please fill all required fields correctly');
      return;
    }

    this.isSubmitting = true;

    const formValue = this.parcelForm.value;
    const parcelData = {
      residentId: parseInt(formValue.residentId),
      parcelNumber: formValue.parcelNumber.trim(),
      senderName: formValue.senderName.trim(),
      senderPhone: formValue.senderPhone?.trim() || undefined,
      description: formValue.description?.trim() || undefined,
    };

    this.parcelService.logParcel(parcelData).subscribe({
      next: (response: any) => {
        this.notifications.success(
          response.message || 'Parcel logged successfully!'
        );

        // Reset form
        this.parcelForm.reset();
        this.removePhoto();
        this.isSubmitting = false;
        this.loadAllParcels(); // Refresh the list

        // Clear form after delay
        setTimeout(() => {
          this.parcelForm.reset();
        }, 1500);
      },
      error: (error: any) => {
        console.error('Error logging parcel:', error);
        const errorMessage =
          error.error?.message || 'Failed to log parcel. Please try again.';
        this.notifications.error(errorMessage);
        this.isSubmitting = false;
      },
    });
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

  getErrorMessage(fieldName: string): string {
    const control = this.parcelForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    switch (fieldName) {
      case 'residentId':
        if (errors['required']) return 'Please select a resident';
        break;

      case 'parcelNumber':
        if (errors['required']) return 'Parcel number is required';
        if (errors['minlength'])
          return `Parcel number must be at least ${errors['minlength'].requiredLength} characters`;
        break;

      case 'senderName':
        if (errors['required']) return 'Sender name is required';
        if (errors['minlength'])
          return `Sender name must be at least ${errors['minlength'].requiredLength} characters`;
        break;

      case 'senderPhone':
        if (errors['pattern'])
          return 'Please enter a valid 10-digit phone number';
        break;

      case 'description':
        if (errors['required']) return 'Description is required';
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
      case 'received':
        return 'status-received';
      case 'acknowledged':
        return 'status-acknowledged';
      case 'collected':
        return 'status-collected';
      default:
        return '';
    }
  }

  getResidentName(residentId: number): string {
    const resident = this.residents.find((r) => r.id === residentId);
    return resident ? resident.name : `Resident #${residentId}`;
  }
}
