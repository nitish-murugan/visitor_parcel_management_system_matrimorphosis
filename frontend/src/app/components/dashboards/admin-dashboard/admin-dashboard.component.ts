import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent {
  managementCards = [
    {
      title: 'User Management',
      description: 'Manage residents, guards, and admin accounts',
      icon: 'manage_accounts',
      route: '/admin/users',
      color: 'primary',
      stats: 'View all users',
    },
    {
      title: 'System Reports',
      description: 'View visitor and parcel statistics',
      icon: 'assessment',
      route: '/admin/reports',
      color: 'accent',
      stats: 'Generate reports',
    },
    {
      title: 'Settings',
      description: 'Configure system settings and preferences',
      icon: 'settings',
      route: '/admin/settings',
      color: 'warn',
      stats: 'System configuration',
    },
  ];

  quickStats = [
    {
      label: 'Total Users',
      value: '-',
      icon: 'group',
      color: '#3f51b5',
    },
    {
      label: 'Active Guards',
      value: '-',
      icon: 'security',
      color: '#4caf50',
    },
    {
      label: 'Residents',
      value: '-',
      icon: 'home',
      color: '#ff9800',
    },
    {
      label: 'System Status',
      value: 'Online',
      icon: 'check_circle',
      color: '#4caf50',
    },
  ];

  constructor(private router: Router) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
