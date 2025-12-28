import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-guard-dashboard',
  templateUrl: './guard-dashboard.component.html',
  styleUrls: ['./guard-dashboard.component.scss'],
})
export class GuardDashboardComponent {
  quickActions = [
    {
      title: 'Log Visitor',
      description: 'Register a new visitor entry',
      icon: 'person_add',
      route: '/guard/visitor-log',
      color: 'primary',
    },
    {
      title: 'Log Parcel',
      description: 'Register a new parcel delivery',
      icon: 'local_shipping',
      route: '/guard/parcel-log',
      color: 'accent',
    },
    {
      title: 'View Visitors',
      description: 'See all visitor records',
      icon: 'people',
      route: '/guard/visitors',
      color: 'primary',
    },
    {
      title: 'View Parcels',
      description: 'See all parcel records',
      icon: 'inventory_2',
      route: '/guard/parcels',
      color: 'accent',
    },
  ];

  constructor(private router: Router) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
