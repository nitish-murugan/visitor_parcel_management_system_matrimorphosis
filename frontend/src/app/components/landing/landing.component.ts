import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements OnInit {
  features = [
    {
      icon: 'security',
      title: 'Enhanced Security',
      description:
        'Track and monitor all visitors and parcels entering your premises with real-time logging and status updates.',
    },
    {
      icon: 'notifications_active',
      title: 'Instant Notifications',
      description:
        'Residents receive immediate notifications when visitors arrive or parcels are delivered.',
    },
    {
      icon: 'speed',
      title: 'Streamlined Process',
      description:
        'Reduce wait times and improve efficiency with our digital visitor and parcel management system.',
    },
    {
      icon: 'analytics',
      title: 'Detailed Analytics',
      description:
        'Access comprehensive reports and analytics on visitor patterns and parcel deliveries.',
    },
    {
      icon: 'groups',
      title: 'Multi-User Support',
      description:
        'Separate portals for guards, residents, and administrators with role-based access control.',
    },
    {
      icon: 'cloud_done',
      title: 'Cloud-Based',
      description:
        'Access your data securely from anywhere, anytime with our cloud-based infrastructure.',
    },
  ];

  useCases = [
    {
      icon: 'apartment',
      title: 'Residential Complexes',
      description:
        'Perfect for apartment buildings and gated communities to manage visitor access and parcel deliveries efficiently.',
    },
    {
      icon: 'business',
      title: 'Corporate Offices',
      description:
        'Streamline visitor check-ins and manage deliveries for corporate buildings and business parks.',
    },
    {
      icon: 'school',
      title: 'Educational Institutions',
      description:
        'Enhance campus security by tracking visitors and managing deliveries for schools and universities.',
    },
  ];

  steps = [
    {
      icon: 'app_registration',
      title: 'Register',
      description: 'Quick signup for residents and staff members',
    },
    {
      icon: 'person_add',
      title: 'Log Visitors',
      description: 'Guards log visitor details at entry point',
    },
    {
      icon: 'notifications',
      title: 'Get Notified',
      description: 'Residents receive instant notifications',
    },
    {
      icon: 'verified',
      title: 'Approve & Track',
      description: 'Manage and monitor all entries securely',
    },
  ];

  stats = [
    { icon: 'apartment', value: '500', suffix: '+', label: 'Properties' },
    { icon: 'people', value: '50K', suffix: '+', label: 'Users' },
    { icon: 'inventory_2', value: '1M', suffix: '+', label: 'Parcels Tracked' },
    { icon: 'trending_up', value: '99.9', suffix: '%', label: 'Uptime' },
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.initScrollAnimations();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    this.animateOnScroll();
  }

  initScrollAnimations(): void {
    setTimeout(() => this.animateOnScroll(), 100);
  }

  animateOnScroll(): void {
    const elements = document.querySelectorAll(
      '.feature-card, .use-case-card, .step-card, .stat-card'
    );
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight - 100;
      if (isVisible) {
        el.classList.add('animate-in');
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
