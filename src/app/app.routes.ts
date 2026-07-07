import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { dashboardRedirectGuard } from './core/auth/guards/dashboard-redirect.guard';
import { dashboardAccessGuard } from './core/auth/guards/dashboard-access.guard';
import { ShellLayoutComponent } from './core/layout/shell/shell-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'signin', pathMatch: 'full' },

  // ── Public: Sign In ────────────────────────────────────────────────────────
  {
    path: 'signin',
    loadComponent: () =>
      import('./features/auth/signin/signin.component').then(m => m.SigninComponent),
  },

  // ── Public: Signup & Onboarding ───────────────────────────────────────────
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/auth/signup/signup.component').then(m => m.SignupComponent),
  },
  {
    path: 'welcome',
    loadComponent: () =>
      import('./features/auth/welcome/welcome.component').then(m => m.WelcomeComponent),
  },

  // ── Mobile: standalone full-screen routes (no shell) ──────────────────────
  {
    path: 'd/:qr',
    loadComponent: () =>
      import('./features/mobile/document-viewer/document-viewer.component').then(m => m.DocumentViewerComponent),
  },
  {
    path: 'ncrs/quick',
    loadComponent: () =>
      import('./features/mobile/quick-ncr/quick-ncr.component').then(m => m.QuickNcrComponent),
  },
  {
    path: 'lpa/run/:id',
    loadComponent: () =>
      import('./features/mobile/lpa-runner/lpa-runner.component').then(m => m.LpaRunnerComponent),
  },

  // ── Authenticated shell ────────────────────────────────────────────────────
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [authGuard],
    children: [

      // Dashboards
      {
        path: 'dashboard',
        children: [
          {
            path: '',
            canActivate: [dashboardRedirectGuard],
            data: { allowedRoles: ['QM', 'PM'] },
            loadComponent: () =>
              import('./features/dashboard/qm/qm-dashboard.component').then(m => m.QmDashboardComponent),
          },
          {
            path: 'qe',
            canActivate: [dashboardAccessGuard],
            data: { allowedRoles: ['QE', 'ME'] },
            loadComponent: () =>
              import('./features/dashboard/qe/qe-dashboard.component').then(m => m.QeDashboardComponent),
          },
          {
            path: 'director',
            canActivate: [dashboardAccessGuard],
            data: { allowedRoles: ['Director'] },
            loadComponent: () =>
              import('./features/dashboard/director/director-dashboard.component').then(m => m.DirectorDashboardComponent),
          },
          {
            path: 'supervisor',
            canActivate: [dashboardAccessGuard],
            data: { allowedRoles: ['QS'] },
            loadComponent: () =>
              import('./features/dashboard/supervisor/supervisor-dashboard.component').then(m => m.SupervisorDashboardComponent),
          },
          {
            path: 'operator',
            canActivate: [dashboardAccessGuard],
            data: { allowedRoles: ['QT', 'Operator'] },
            loadComponent: () =>
              import('./features/dashboard/operator/operator-dashboard.component').then(m => m.OperatorDashboardComponent),
          },
        ],
      },

      // My Work
      {
        path: 'my-work',
        loadComponent: () =>
          import('./features/my-work/my-work.component').then(m => m.MyWorkComponent),
      },

      // NCRs module — static before :id
      {
        path: 'ncrs',
        loadComponent: () =>
          import('./features/ncrs/ncr-list/ncr-list.component').then(m => m.NcrListComponent),
      },
      {
        path: 'ncrs/new',
        loadComponent: () =>
          import('./features/ncrs/ncr-create/ncr-create.component').then(m => m.NcrCreateComponent),
      },
      {
        path: 'ncrs/mrb',
        loadComponent: () =>
          import('./features/ncrs/ncr-mrb/ncr-mrb.component').then(m => m.NcrMrbComponent),
      },
      {
        path: 'ncrs/:id',
        loadComponent: () =>
          import('./features/ncrs/ncr-detail/ncr-detail.component').then(m => m.NcrDetailComponent),
      },

      // Customer Complaints
      {
        path: 'complaints',
        loadComponent: () =>
          import('./features/complaints/complaints.component').then(m => m.ComplaintsComponent),
      },

      // CAPAs module — static before :id
      {
        path: 'capas',
        loadComponent: () =>
          import('./features/capas/capa-list/capa-list.component').then(m => m.CapaListComponent),
      },
      {
        path: 'capas/new',
        loadComponent: () =>
          import('./features/ncrs/ncr-create/ncr-create.component').then(m => m.NcrCreateComponent),
      },
      {
        path: 'capas/aging',
        loadComponent: () =>
          import('./features/capas/capa-aging/capa-aging.component').then(m => m.CapaAgingComponent),
      },
      {
        path: 'capas/:id/d4',
        loadComponent: () =>
          import('./features/capas/capa-root-cause/capa-root-cause.component').then(m => m.CapaRootCauseComponent),
      },
      {
        path: 'capas/:id/scar',
        loadComponent: () =>
          import('./features/capas/capa-scar/capa-scar.component').then(m => m.CapaScarComponent),
      },
      {
        path: 'capas/:id',
        loadComponent: () =>
          import('./features/capas/capa-workspace/capa-workspace.component').then(m => m.CapaWorkspaceComponent),
      },

      // Documents module — static before :id
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/document-library/document-library.component').then(m => m.DocumentLibraryComponent),
      },
      {
        path: 'documents/new',
        loadComponent: () =>
          import('./features/documents/document-create/document-create.component').then(m => m.DocumentCreateComponent),
      },
      {
        path: 'documents/obsolete',
        loadComponent: () =>
          import('./features/documents/document-obsolete/document-obsolete.component').then(m => m.DocumentObsoleteComponent),
      },
      {
        path: 'documents/import',
        loadComponent: () =>
          import('./features/documents/document-import/document-import.component').then(m => m.DocumentImportComponent),
      },
      {
        path: 'documents/:id',
        loadComponent: () =>
          import('./features/documents/document-detail/document-detail.component').then(m => m.DocumentDetailComponent),
      },
      {
        path: 'documents/:id/edit',
        loadComponent: () =>
          import('./features/documents/document-create/document-create.component').then(m => m.DocumentCreateComponent),
      },
      {
        path: 'documents/:id/compare',
        loadComponent: () =>
          import('./features/documents/document-compare/document-compare.component').then(m => m.DocumentCompareComponent),
      },
      {
        path: 'documents/:id/approve',
        loadComponent: () =>
          import('./features/documents/document-approve/document-approve.component').then(m => m.DocumentApproveComponent),
      },
      {
        path: 'documents/:id/distribution',
        loadComponent: () =>
          import('./features/documents/document-distribution/document-distribution.component').then(m => m.DocumentDistributionComponent),
      },

      // Audits module — static before :id
      {
        path: 'audits',
        loadComponent: () =>
          import('./features/audits/audit-list/audit-list.component').then(m => m.AuditListComponent),
      },
      {
        path: 'audits/new',
        loadComponent: () =>
          import('./features/audits/audit-list/audit-list.component').then(m => m.AuditListComponent),
      },
      {
        path: 'audits/program',
        loadComponent: () =>
          import('./features/audits/audit-program/audit-program.component').then(m => m.AuditProgramComponent),
      },
      {
        path: 'audits/checklists',
        loadComponent: () =>
          import('./features/audits/checklist-builder/checklist-builder.component').then(m => m.ChecklistBuilderComponent),
      },
      {
        path: 'audits/:id/run',
        loadComponent: () =>
          import('./features/audits/audit-execution/audit-execution.component').then(m => m.AuditExecutionComponent),
      },
      {
        path: 'audits/:id',
        loadComponent: () =>
          import('./features/audits/audit-detail/audit-detail.component').then(m => m.AuditDetailComponent),
      },

      // Findings
      {
        path: 'findings/:id',
        loadComponent: () =>
          import('./features/findings/finding-detail/finding-detail.component').then(m => m.FindingDetailComponent),
      },

      // Reports
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then(m => m.ReportsComponent),
      },

      // Clause Map
      {
        path: 'clause-map',
        loadComponent: () =>
          import('./features/clause-map/clause-map.component').then(m => m.ClauseMapComponent),
      },

      // Notifications — static before :id
      {
        path: 'notifications/preferences',
        loadComponent: () =>
          import('./features/notifications/notification-preferences/notification-preferences.component').then(m => m.NotificationPreferencesComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notification-center/notification-center.component').then(m => m.NotificationCenterComponent),
      },

      // Global Search
      {
        path: 'search',
        loadComponent: () =>
          import('./features/search/search-results/search-results.component').then(m => m.SearchResultsComponent),
      },

      // LPA module — static before :id
      {
        path: 'lpa',
        loadComponent: () =>
          import('./features/lpa/lpa-dashboard/lpa-dashboard.component').then(m => m.LpaDashboardComponent),
      },
      {
        path: 'lpa/setup',
        loadComponent: () =>
          import('./features/lpa/lpa-setup/lpa-setup.component').then(m => m.LpaSetupComponent),
      },

      // 8D Problem Resolution module — static before :id
      {
        path: 'quality/8d',
        loadComponent: () =>
          import('./features/eight-d/eight-d-dashboard/eight-d-dashboard.component').then(m => m.EightDDashboardComponent),
      },
      {
        path: 'quality/8d/list',
        loadComponent: () =>
          import('./features/eight-d/eight-d-list/eight-d-list.component').then(m => m.EightDListComponent),
      },
      {
        path: 'quality/8d/new',
        loadComponent: () =>
          import('./features/eight-d/eight-d-create/eight-d-create.component').then(m => m.EightDCreateComponent),
      },
      {
        path: 'quality/8d/:id/effectiveness',
        loadComponent: () =>
          import('./features/eight-d/eight-d-effectiveness/eight-d-effectiveness.component').then(m => m.EightDEffectivenessComponent),
      },
      {
        path: 'quality/8d/:id',
        loadComponent: () =>
          import('./features/eight-d/eight-d-workspace/eight-d-workspace.component').then(m => m.EightDWorkspaceComponent),
      },

      // Locked modules — professional placeholder
      { path: 'ppap', loadComponent: () => import('./shared/components/placeholder-page/placeholder-page.component').then(m => m.PlaceholderPageComponent) },
      { path: 'fmea', loadComponent: () => import('./shared/components/placeholder-page/placeholder-page.component').then(m => m.PlaceholderPageComponent) },
      { path: 'suppliers', loadComponent: () => import('./shared/components/placeholder-page/placeholder-page.component').then(m => m.PlaceholderPageComponent) },
      { path: 'spc', loadComponent: () => import('./shared/components/placeholder-page/placeholder-page.component').then(m => m.PlaceholderPageComponent) },

      // Settings suite — shell with child router-outlet
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-shell/settings-shell.component').then(m => m.SettingsShellComponent),
        children: [
          { path: '', redirectTo: 'tenant', pathMatch: 'full' },
          {
            path: 'tenant',
            loadComponent: () =>
              import('./features/settings/tenant/tenant-settings.component').then(m => m.TenantSettingsComponent),
          },
          {
            path: 'sites',
            loadComponent: () =>
              import('./features/settings/sites/sites-settings.component').then(m => m.SitesSettingsComponent),
          },
          {
            path: 'users',
            loadComponent: () =>
              import('./features/settings/users/users-settings.component').then(m => m.UsersSettingsComponent),
          },
          {
            path: 'guest-auditor',
            loadComponent: () =>
              import('./features/settings/guest-auditor/guest-auditor-settings.component').then(m => m.GuestAuditorSettingsComponent),
          },
          {
            path: 'taxonomies',
            loadComponent: () =>
              import('./features/settings/taxonomies/taxonomies-settings.component').then(m => m.TaxonomiesSettingsComponent),
          },
          {
            path: 'workflows',
            loadComponent: () =>
              import('./features/settings/workflows/workflows-settings.component').then(m => m.WorkflowsSettingsComponent),
          },
          {
            path: 'notifications',
            loadComponent: () =>
              import('./features/settings/notifications/notifications-settings.component').then(m => m.NotificationsSettingsComponent),
          },
          {
            path: 'billing',
            loadComponent: () =>
              import('./features/settings/billing/billing-settings.component').then(m => m.BillingSettingsComponent),
          },
          {
            path: 'audit-trail',
            loadComponent: () =>
              import('./features/settings/audit-trail/audit-trail-settings.component').then(m => m.AuditTrailSettingsComponent),
          },
          {
            path: 'data-export',
            loadComponent: () =>
              import('./features/settings/data-export/data-export-settings.component').then(m => m.DataExportSettingsComponent),
          },
          {
            path: 'doc-types',
            loadComponent: () =>
              import('./features/settings/doc-types/doc-types.component').then(m => m.DocTypesComponent),
          },
        ],
      },

      // Sitemap — dev utility
      {
        path: 'sitemap',
        loadComponent: () =>
          import('./features/sitemap/sitemap.component').then(m => m.SitemapComponent),
      },

      // Fallback inside shell
      { path: '**', redirectTo: 'dashboard' },
    ],
  },

  // Global fallback
  { path: '**', redirectTo: 'signin' },
];
