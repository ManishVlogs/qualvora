import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../auth/stores/auth.store';
import { TenantStore } from '../../tenant/stores/tenant.store';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  locked?: boolean;
  dividerBefore?: boolean;
  isBottom?: boolean;
  hideForRoles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: 'bi-house', route: '/dashboard' },
  { label: 'My Work', icon: 'bi-check2-square', route: '/my-work' },
  { label: 'Documents', icon: 'bi-folder2-open', route: '/documents', hideForRoles: ['Operator', 'QT'] },
  { label: 'NCRs', icon: 'bi-exclamation-triangle', route: '/ncrs' },
  { label: 'CAPAs', icon: 'bi-tools', route: '/capas' },
  { label: 'Audits', icon: 'bi-clipboard-check', route: '/audits' },
  { label: 'LPA', icon: 'bi-layers-half', route: '/lpa' },
  { label: 'Reports', icon: 'bi-bar-chart-line', route: '/reports' },
  { label: 'Clause Map', icon: 'bi-diagram-3', route: '/clause-map' },
  { label: 'Complaints', icon: 'bi-chat-left-text', route: '/complaints' },
  { label: '8D Reports', icon: 'bi-exclamation-diamond', route: '/quality/8d' },
  { label: 'PPAP', icon: 'bi-layers', route: '/ppap', locked: true, dividerBefore: true },
  { label: 'FMEA', icon: 'bi-grid-3x3', route: '/fmea', locked: true },
  { label: 'Suppliers', icon: 'bi-truck', route: '/suppliers', locked: true },
  { label: 'SPC', icon: 'bi-graph-up', route: '/spc', locked: true },
  { label: 'Settings', icon: 'bi-gear', route: '/settings', isBottom: true },
  { label: 'Sitemap', icon: 'bi-grid-3x3-gap', route: '/sitemap', isBottom: true },
];

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  private authStore = inject(AuthStore);
  private tenantStore = inject(TenantStore);

  private readonly userRoles = computed(() => this.authStore.currentUser()?.roles ?? []);

  private visibleItems(items: NavItem[]): NavItem[] {
    const roles = this.userRoles();
    return items.filter(i => !i.hideForRoles?.some(r => roles.includes(r)));
  }

  readonly mainItems = computed(() => this.visibleItems(NAV_ITEMS.filter(i => !i.isBottom)));
  readonly bottomItems = computed(() => this.visibleItems(NAV_ITEMS.filter(i => i.isBottom)));
}
