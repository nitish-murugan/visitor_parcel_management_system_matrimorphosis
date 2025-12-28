import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';
import { HomeComponent } from './components/home/home.component';
import { GuardComponent } from './components/guard/guard.component';
import { AdminComponent } from './components/admin/admin.component';
import { VisitorLogComponent } from './components/visitor/visitor-log/visitor-log.component';
import { ResidentApprovalComponent } from './components/visitor/resident-approval/resident-approval.component';
import { ParcelLogComponent } from './components/parcel/parcel-log/parcel-log.component';
import { ResidentParcelComponent } from './components/parcel/resident-parcel/resident-parcel.component';
import { GuardDashboardComponent } from './components/dashboards/guard-dashboard/guard-dashboard.component';
import { ResidentDashboardComponent } from './components/dashboards/resident-dashboard/resident-dashboard.component';
import { AdminDashboardComponent } from './components/dashboards/admin-dashboard/admin-dashboard.component';
import { LandingComponent } from './components/landing/landing.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'home',
    component: ResidentDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['resident'], breadcrumb: 'Home' },
  },
  {
    path: 'guard',
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: GuardDashboardComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['guard', 'admin'], breadcrumb: 'Dashboard' },
      },
      {
        path: 'visitor-log',
        component: VisitorLogComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: {
          roles: ['guard', 'admin'],
          breadcrumb: 'Log Visitor',
          viewMode: false,
        },
      },
      {
        path: 'visitors',
        component: VisitorLogComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: {
          roles: ['guard', 'admin'],
          breadcrumb: 'View Visitors',
          viewMode: true,
        },
      },
      {
        path: 'parcel-log',
        component: ParcelLogComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: {
          roles: ['guard', 'admin'],
          breadcrumb: 'Log Parcel',
          viewMode: false,
        },
      },
      {
        path: 'parcels',
        component: ParcelLogComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: {
          roles: ['guard', 'admin'],
          breadcrumb: 'View Parcels',
          viewMode: true,
        },
      },
    ],
  },
  {
    path: 'resident',
    children: [
      {
        path: 'visitor-approvals',
        component: ResidentApprovalComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['resident'], breadcrumb: 'Visitor Approvals' },
      },
      {
        path: 'parcels',
        component: ResidentParcelComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['resident'], breadcrumb: 'My Parcels' },
      },
    ],
  },
  {
    path: 'admin',
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'], breadcrumb: 'Dashboard' },
      },
      {
        path: 'users',
        component: AdminComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'], breadcrumb: 'User Management' },
      },
      {
        path: 'reports',
        component: AdminComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'], breadcrumb: 'Reports' },
      },
    ],
  },
  // Legacy routes for backward compatibility
  {
    path: 'visitor-log',
    redirectTo: 'guard/visitor-log',
    pathMatch: 'full',
  },
  {
    path: 'parcel-log',
    redirectTo: 'guard/parcel-log',
    pathMatch: 'full',
  },
  {
    path: 'resident-approval',
    redirectTo: 'resident/visitor-approvals',
    pathMatch: 'full',
  },
  {
    path: 'resident-parcel',
    redirectTo: 'resident/parcels',
    pathMatch: 'full',
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
