import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isSubmitting = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.registerForm = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        role: ['resident', Validators.required],
        agreeToTerms: [false, Validators.requiredTrue],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);

    if (!control || !control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    switch (fieldName) {
      case 'fullName':
        if (errors['required']) return 'Full name is required';
        if (errors['minlength'])
          return `Full name must be at least ${errors['minlength'].requiredLength} characters`;
        break;

      case 'email':
        if (errors['required']) return 'Email is required';
        if (errors['email']) return 'Please enter a valid email address';
        break;

      case 'phone':
        if (errors['required']) return 'Phone number is required';
        if (errors['pattern'])
          return 'Phone number must be 7-15 digits (numbers only)';
        break;

      case 'password':
        if (errors['required']) return 'Password is required';
        if (errors['minlength'])
          return `Password must be at least ${errors['minlength'].requiredLength} characters`;
        break;

      case 'confirmPassword':
        if (errors['required']) return 'Please confirm your password';
        if (errors['passwordMismatch']) return 'Passwords do not match';
        break;

      case 'role':
        if (errors['required']) return 'Please select a role';
        break;

      case 'agreeToTerms':
        if (errors['required'])
          return 'You must agree to the terms and conditions';
        break;
    }

    return 'Invalid field';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.isSubmitting = true;
    const { fullName, email, phone, password, role } = this.registerForm.value;

    this.authService
      .register({ fullName, email, phone, password, role })
      .subscribe({
        next: (response) => {
          this.snackBar.open(
            'Registration successful! Redirecting...',
            'Close',
            {
              duration: 3000,
              panelClass: ['success-snackbar'],
            }
          );

          // Navigate based on role
          setTimeout(() => {
            if (response.user.role === 'admin') {
              this.router.navigate(['/admin/dashboard']);
            } else if (response.user.role === 'guard') {
              this.router.navigate(['/guard/dashboard']);
            } else {
              this.router.navigate(['/home']);
            }
          }, 1500);
        },
        error: (error) => {
          console.error('Registration error:', error);
          const errorMessage =
            error.error?.message || 'Registration failed. Please try again.';
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
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
}
