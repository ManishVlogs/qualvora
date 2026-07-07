import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/settings/tenant', label: 'Tenant Profile', icon: 'bi-building' },
  { path: '/settings/sites', label: 'Sites', icon: 'bi-geo-alt' },
  { path: '/settings/users', label: 'Users & Roles', icon: 'bi-people' },
  { path: '/settings/guest-auditor', label: 'Guest Auditor Access', icon: 'bi-person-badge' },
  { path: '/settings/taxonomies', label: 'Taxonomies', icon: 'bi-tags' },
  { path: '/settings/workflows', label: 'Workflows & Thresholds', icon: 'bi-diagram-3' },
  { path: '/settings/notifications', label: 'Notification Defaults', icon: 'bi-bell' },
  { path: '/settings/billing', label: 'Billing & Plan', icon: 'bi-credit-card' },
  { path: '/settings/audit-trail', label: 'Audit Trail', icon: 'bi-shield-check' },
  { path: '/settings/data-export', label: 'Data Export', icon: 'bi-download' },
  { path: '/settings/doc-types', label: 'Document Types', icon: 'bi-file-earmark-text' },
];

@Component({
  selector: 'app-settings-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="settings-layout">
      <aside class="settings-nav">
        <div class="nav-header">
          <h6 class="nav-title">Settings</h6>
        </div>
        <nav class="nav-list">
          @for (item of navItems; track item.path) {
            <a class="nav-item" [routerLink]="item.path" routerLinkActive="active">
              <i [class]="'bi ' + item.icon"></i>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
      </aside>
      <div class="settings-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .settings-layout {
      display: flex; height: calc(100vh - 60px); overflow: hidden;
    }
    .settings-nav {
      width: 240px; flex-shrink: 0; background: #fff;
      border-right: 1px solid #E2E8F0; overflow-y: auto;
    }
    .nav-header {
      padding: 20px 16px 8px;
      border-bottom: 1px solid #F1F5F9;
    }
    .nav-title {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: #94A3B8; margin: 0;
    }
    .nav-list { padding: 8px 8px; }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 10px; border-radius: 8px; margin-bottom: 2px;
      font-size: 13.5px; color: #475569; text-decoration: none;
      transition: all 0.15s;
    }
    .nav-item:hover { background: #F8FAFC; color: #1E293B; }
    .nav-item.active { background: #EFF6FF; color: #2563EB; font-weight: 600; }
    .nav-item i { font-size: 15px; flex-shrink: 0; }
    .settings-content { flex: 1; overflow-y: auto; padding: 32px; background: #F8FAFC; }
  `]
})
export class SettingsShellComponent {
  readonly navItems = NAV_ITEMS;
}
