import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    const allowedRoles = (route.data['roles'] as UserRole[] | undefined) ?? [];
    if (!allowedRoles.length) {
      return true;
    }

    const user = this.auth.getCurrentUser();
    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
