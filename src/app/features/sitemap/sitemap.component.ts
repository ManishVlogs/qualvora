import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface ScreenEntry {
  id: string; route: string; title: string; tag: string;
}

const SCREENS: { group: string; color: string; screens: ScreenEntry[] }[] = [
  {
    group: 'Auth & Onboarding', color: '#7C3AED',
    screens: [
      { id: 'AUTH-001', route: '/signin', title: 'Sign In', tag: 'Public' },
      { id: 'SCR-002', route: '/signup', title: 'Signup & Tenant Provisioning', tag: 'Public' },
      { id: 'SCR-003', route: '/welcome', title: 'Onboarding Wizard', tag: 'Public' },
    ],
  },
  {
    group: 'Dashboards', color: '#2563EB',
    screens: [
      { id: 'SCR-010', route: '/dashboard', title: 'QM Dashboard', tag: 'Shell' },
      { id: 'SCR-011', route: '/dashboard/qe', title: 'QE Dashboard', tag: 'Shell' },
      { id: 'SCR-012', route: '/dashboard/director', title: 'Director Dashboard', tag: 'Shell' },
      { id: 'SCR-013', route: '/dashboard/supervisor', title: 'Supervisor Dashboard', tag: 'Shell' },
      { id: 'SCR-200', route: '/my-work', title: 'My Work', tag: 'Shell' },
    ],
  },
  {
    group: 'NCR Module', color: '#DC2626',
    screens: [
      { id: 'SCR-020', route: '/ncrs', title: 'NCR List', tag: 'Shell' },
      { id: 'SCR-021', route: '/ncrs/NCR-2026-0147', title: 'NCR Detail', tag: 'Shell' },
      { id: 'SCR-022', route: '/ncrs/mrb', title: 'MRB Review', tag: 'Shell' },
      { id: 'SCR-023', route: '/ncrs/new', title: 'Create NCR', tag: 'Shell' },
    ],
  },
  {
    group: 'CAPA Module', color: '#D97706',
    screens: [
      { id: 'SCR-030', route: '/capas', title: 'CAPA List', tag: 'Shell' },
      { id: 'SCR-031', route: '/capas/CAPA-2026-031', title: 'CAPA Workspace', tag: 'Shell' },
      { id: 'SCR-032', route: '/capas/CAPA-2026-031/d4', title: 'Root Cause (D4)', tag: 'Shell' },
      { id: 'SCR-033', route: '/capas/CAPA-2026-031/scar', title: 'SCAR', tag: 'Shell' },
      { id: 'SCR-034', route: '/capas/aging', title: 'CAPA Aging', tag: 'Shell' },
    ],
  },
  {
    group: 'Document Control', color: '#0891B2',
    screens: [
      { id: 'SCR-040', route: '/documents', title: 'Document Library', tag: 'Shell' },
      { id: 'SCR-041', route: '/documents/DOC-2026-0032', title: 'Document Detail', tag: 'Shell' },
      { id: 'SCR-042', route: '/documents/new', title: 'Create Document', tag: 'Shell' },
      { id: 'SCR-043', route: '/documents/DOC-2026-0032/compare', title: 'Compare Revisions', tag: 'Shell' },
      { id: 'SCR-044', route: '/documents/DOC-2026-0032/approve', title: 'Approve Document', tag: 'Shell' },
      { id: 'SCR-045', route: '/documents/DOC-2026-0032/distribution', title: 'Distribution', tag: 'Shell' },
      { id: 'SCR-046', route: '/documents/obsolete', title: 'Obsolete Documents', tag: 'Shell' },
      { id: 'SCR-047', route: '/documents/import', title: 'Import Documents', tag: 'Shell' },
    ],
  },
  {
    group: 'Audit Module', color: '#059669',
    screens: [
      { id: 'SCR-050', route: '/audits/program', title: 'Audit Program', tag: 'Shell' },
      { id: 'SCR-051', route: '/audits', title: 'Audit List', tag: 'Shell' },
      { id: 'SCR-052', route: '/audits/AUD-2026-011', title: 'Audit Detail', tag: 'Shell' },
      { id: 'SCR-053', route: '/audits/AUD-2026-011/run', title: 'Audit Execution', tag: 'Shell' },
      { id: 'SCR-054', route: '/audits/checklists', title: 'Checklist Builder', tag: 'Shell' },
      { id: 'SCR-055', route: '/findings/FND-2026-003', title: 'Finding Detail', tag: 'Shell' },
    ],
  },
  {
    group: 'LPA Module', color: '#7C3AED',
    screens: [
      { id: 'SCR-057', route: '/lpa', title: 'LPA Dashboard', tag: 'Shell' },
      { id: 'SCR-056', route: '/lpa/setup', title: 'LPA Setup', tag: 'Shell' },
    ],
  },
  {
    group: 'Reports & Analytics', color: '#2563EB',
    screens: [
      { id: 'SCR-070', route: '/reports', title: 'Reports Library & Viewer', tag: 'Shell' },
      { id: 'SCR-080', route: '/clause-map', title: 'IATF Clause Coverage Map', tag: 'Shell' },
    ],
  },
  {
    group: 'Notifications & Search', color: '#0F172A',
    screens: [
      { id: 'SCR-100', route: '/notifications', title: 'Notification Center', tag: 'Shell' },
      { id: 'SCR-100P', route: '/notifications/preferences', title: 'Notification Preferences', tag: 'Shell' },
      { id: 'SCR-110', route: '/search', title: 'Search Results', tag: 'Shell' },
    ],
  },
  {
    group: 'Complaints', color: '#DC2626',
    screens: [
      { id: 'SCR-060', route: '/complaints', title: 'Customer Complaints', tag: 'Shell' },
    ],
  },
  {
    group: 'Settings Suite', color: '#475569',
    screens: [
      { id: 'SCR-090A', route: '/settings/tenant', title: 'Tenant Profile', tag: 'Shell' },
      { id: 'SCR-090B', route: '/settings/sites', title: 'Sites', tag: 'Shell' },
      { id: 'SCR-090C', route: '/settings/users', title: 'Users & Roles', tag: 'Shell' },
      { id: 'SCR-090D', route: '/settings/guest-auditor', title: 'Guest Auditor Access', tag: 'Shell' },
      { id: 'SCR-090E', route: '/settings/taxonomies', title: 'Taxonomies', tag: 'Shell' },
      { id: 'SCR-090F', route: '/settings/workflows', title: 'Workflows & Thresholds', tag: 'Shell' },
      { id: 'SCR-090G', route: '/settings/notifications', title: 'Notification Defaults', tag: 'Shell' },
      { id: 'SCR-090H', route: '/settings/billing', title: 'Billing & Plan', tag: 'Shell' },
      { id: 'SCR-090I', route: '/settings/audit-trail', title: 'Audit Trail', tag: 'Shell' },
      { id: 'SCR-090J', route: '/settings/data-export', title: 'Data Export', tag: 'Shell' },
      { id: 'SCR-090K', route: '/settings/doc-types', title: 'Document Types', tag: 'Shell' },
    ],
  },
  {
    group: 'Mobile Screens', color: '#16A34A',
    screens: [
      { id: 'SCR-120', route: '/d/WI-48201-A', title: 'Mobile Document Viewer', tag: 'Mobile' },
      { id: 'SCR-121', route: '/ncrs/quick', title: 'Mobile Quick NCR', tag: 'Mobile' },
      { id: 'SCR-122', route: '/lpa/run/LPA-RUN-0042', title: 'Mobile LPA Runner', tag: 'Mobile' },
    ],
  },
  {
    group: 'Placeholders', color: '#94A3B8',
    screens: [
      { id: '—', route: '/ppap', title: 'PPAP Module', tag: 'Shell' },
      { id: '—', route: '/fmea', title: 'FMEA Module', tag: 'Shell' },
      { id: '—', route: '/suppliers', title: 'Supplier Management', tag: 'Shell' },
      { id: '—', route: '/spc', title: 'SPC Module', tag: 'Shell' },
    ],
  },
];

const TOTAL = SCREENS.reduce((sum, g) => sum + g.screens.length, 0);

@Component({
  selector: 'app-sitemap',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sitemap-page">
      <div class="sitemap-header">
        <div>
          <h1 class="page-title">Sitemap</h1>
          <p class="text-muted">All {{ totalScreens }} screens — dev reference tool</p>
        </div>
        <div class="stat-pills">
          <span class="stat-pill">{{ totalScreens }} screens</span>
          <span class="stat-pill public">3 public</span>
          <span class="stat-pill mobile">3 mobile</span>
        </div>
      </div>

      <div class="group-grid">
        @for (group of groups; track group.group) {
          <div class="group-card">
            <div class="group-header" [style.border-left-color]="group.color">
              <span class="group-title">{{ group.group }}</span>
              <span class="group-count">{{ group.screens.length }}</span>
            </div>
            <div class="screen-list">
              @for (screen of group.screens; track screen.route) {
                <a class="screen-row" [routerLink]="screen.route">
                  <div class="screen-id">{{ screen.id }}</div>
                  <div class="screen-title">{{ screen.title }}</div>
                  <div class="screen-tag" [class]="'tag-' + screen.tag.toLowerCase()">{{ screen.tag }}</div>
                  <i class="bi bi-arrow-right screen-arrow"></i>
                </a>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .sitemap-page { padding: 32px; max-width: 1200px; }
    .sitemap-header {
      display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px;
    }
    .page-title { font-size: 24px; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .stat-pills { display: flex; gap: 8px; }
    .stat-pill {
      display: inline-block; padding: 4px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600; background: #E2E8F0; color: #475569;
    }
    .stat-pill.public { background: #EDE9FE; color: #7C3AED; }
    .stat-pill.mobile { background: #DCFCE7; color: #16A34A; }
    .group-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;
    }
    .group-card {
      background: #fff; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      overflow: hidden;
    }
    .group-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-left: 4px solid; background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
    }
    .group-title { font-size: 13px; font-weight: 700; color: #1E293B; }
    .group-count {
      width: 22px; height: 22px; border-radius: 50%; background: #E2E8F0;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #64748B;
    }
    .screen-list { padding: 4px 0; }
    .screen-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 16px; text-decoration: none;
      transition: background 0.15s; border-bottom: 1px solid #F8FAFC;
    }
    .screen-row:hover { background: #F0F9FF; }
    .screen-row:last-child { border-bottom: none; }
    .screen-id {
      font-size: 10px; font-family: monospace; color: #94A3B8;
      min-width: 72px; flex-shrink: 0;
    }
    .screen-title { flex: 1; font-size: 13px; color: #1E293B; font-weight: 500; }
    .screen-tag {
      font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; flex-shrink: 0;
    }
    .tag-shell { background: #E0F2FE; color: #0369A1; }
    .tag-public { background: #EDE9FE; color: #7C3AED; }
    .tag-mobile { background: #DCFCE7; color: #16A34A; }
    .screen-arrow { color: #CBD5E1; font-size: 12px; }
    .screen-row:hover .screen-arrow { color: #2563EB; }
  `]
})
export class SitemapComponent {
  readonly groups = SCREENS;
  readonly totalScreens = TOTAL;
}
