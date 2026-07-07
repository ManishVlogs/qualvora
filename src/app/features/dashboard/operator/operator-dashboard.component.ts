import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { AuthStore } from '../../../core/auth/stores/auth.store';

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">

      <div class="page-header">
        <div>
          <h1>{{ greeting() }}, {{ fullName() }}</h1>
          <p>{{ jobTitle() }} · {{ siteName() }}</p>
        </div>
        <span class="chip chip-green">Layer 1 · Operator</span>
      </div>

      <div class="operator-grid">

        <!-- My LPA Due Today -->
        <div class="q-card op-section">
          <div class="section-header">
            <div class="section-icon lpa-icon"><i class="bi bi-clipboard-check"></i></div>
            <div>
              <h2 class="section-title">My LPA Checks Due Today</h2>
              <p class="section-sub">Layer 1 daily station checks</p>
            </div>
            <span class="chip chip-amber">{{ lpaChecks().length }} pending</span>
          </div>
          <div class="op-list">
            @for (run of lpaChecks(); track run.id) {
              <div class="op-row" [routerLink]="['/lpa']">
                <div class="row-left">
                  <div class="layer-pill">L1</div>
                  <div class="row-info">
                    <span class="record-id">{{ run.id }}</span>
                    <span class="row-title">{{ run.title }}</span>
                    <span class="row-sub">{{ run.zone }}</span>
                  </div>
                </div>
                <div class="row-right">
                  <span class="status-tip"
                    [attr.data-tip]="getStatusTip(run)">
                    <span class="chip {{ run.status === 'Overdue' ? 'chip-breached' : 'chip-warning' }}">
                      {{ run.status }}
                    </span>
                  </span>
                  <button class="btn btn-sm btn-primary ms-2"
                    (click)="$event.stopPropagation(); router.navigate(['/lpa/run', run.id])">
                    Start Check
                  </button>
                </div>
              </div>
            }
            @if (lpaChecks().length === 0) {
              <div class="empty-state">
                <i class="bi bi-check-circle text-success me-2"></i>All checks complete for today
              </div>
            }
          </div>
        </div>

        <!-- My Completed LPA Checks -->
        <div class="q-card op-section">
          <div class="section-header">
            <div class="section-icon hist-icon"><i class="bi bi-check-circle-fill"></i></div>
            <div>
              <h2 class="section-title">My Completed LPA Checks</h2>
              <p class="section-sub">Layer 1 daily checks — your accountability trail</p>
            </div>
            <div class="ms-auto d-flex align-items-center gap-2">
              <span class="chip chip-green">{{ recentlyCompletedLpa().length }}</span>
              <a [routerLink]="['/lpa']" class="see-all-link">View all</a>
            </div>
          </div>
          <div class="op-list">
            @for (run of recentlyCompletedLpa(); track run.id) {
              <div class="op-row" [routerLink]="['/lpa/run', run.id]">
                <div class="row-left">
                  <div class="layer-pill">{{ run.layer }}</div>
                  <div class="row-info">
                    <span class="record-id">{{ run.id }}</span>
                    <span class="row-title">{{ run.title }}</span>
                    <span class="row-sub">{{ run.zone }} · {{ run.completedDate | date:'MMM d' }}</span>
                  </div>
                </div>
                <div class="row-right">
                  <span class="chip {{ run.completionRate === 100 ? 'chip-within-sla' : 'chip-amber' }}">
                    {{ run.completionRate }}%
                  </span>
                  <button class="btn btn-sm btn-outline-primary ms-2"
                    (click)="$event.stopPropagation(); router.navigate(['/lpa/run', run.id])">
                    Review
                  </button>
                </div>
              </div>
            }
            @if (recentlyCompletedLpa().length === 0) {
              <div class="empty-state">
                <i class="bi bi-clock-history me-2"></i>No completed checks yet
              </div>
            }
          </div>
        </div>

        <!-- My Work Instructions -->
        <div class="q-card op-section">
          <div class="section-header">
            <div class="section-icon wi-icon"><i class="bi bi-file-earmark-text"></i></div>
            <div>
              <h2 class="section-title">My Work Instructions</h2>
              <p class="section-sub">Active procedures for your station</p>
            </div>
            <span class="chip chip-blue">{{ workInstructions().length }} active</span>
          </div>
          <div class="op-list">
            @for (doc of workInstructions(); track doc.id) {
              <div class="op-row" [routerLink]="['/documents', doc.id]">
                <div class="row-left">
                  <i class="bi bi-file-earmark-text wi-doc-icon"></i>
                  <div class="row-info">
                    <span class="record-id">{{ doc.id }}</span>
                    <span class="row-title">{{ doc.title }}</span>
                    <span class="row-sub">Rev. {{ doc.revision }} · {{ doc.type }}</span>
                  </div>
                </div>
                <div class="row-right">
                  <span class="status-tip" data-tip="This document is approved and active. Follow this procedure at your station.">
                    <span class="chip chip-within-sla">Released</span>
                  </span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Quality Alerts in My Area -->
        <div class="q-card op-section">
          <div class="section-header">
            <div class="section-icon ncr-icon"><i class="bi bi-exclamation-triangle"></i></div>
            <div>
              <h2 class="section-title">Quality Alerts — My Area</h2>
              <p class="section-sub">Open NCRs you should be aware of</p>
            </div>
            <span class="chip chip-red">{{ areaAlerts().length }} open</span>
          </div>
          <div class="op-list">
            @for (ncr of areaAlerts(); track ncr.id) {
              <div class="op-row" [routerLink]="['/ncrs', ncr.id]">
                <div class="row-left">
                  <i class="bi bi-circle-fill sev-dot"
                     [style.color]="ncr.severity === 'Major' ? '#DC2626' : ncr.severity === 'Minor' ? '#F59E0B' : '#2563EB'">
                  </i>
                  <div class="row-info">
                    <span class="record-id">{{ ncr.id }}</span>
                    <span class="row-title">{{ ncr.title }}</span>
                  </div>
                </div>
                <div class="row-right">
                  <span class="status-tip"
                    [attr.data-tip]="ncr.severity === 'Major' ? 'Major: This is a serious quality problem. It can affect safety or the customer directly. Supervisor must be informed.' : ncr.severity === 'Minor' ? 'Minor: A small quality issue that does not stop production but needs to be fixed soon.' : 'OFI: Opportunity for improvement. Not urgent, but worth looking into.'">
                    <span class="chip {{ ncr.severity === 'Major' ? 'chip-major' : ncr.severity === 'Minor' ? 'chip-minor' : 'chip-ofi' }}">
                      {{ ncr.severity }}
                    </span>
                  </span>
                  <span class="status-tip ms-1"
                    [attr.data-tip]="ncr.ageInDays === 0 ? 'Opened today. Keep an eye on this.' : 'This alert has been open for ' + ncr.ageInDays + ' days without being resolved.'">
                    <span class="chip chip-amber">{{ ncr.ageInDays }}d open</span>
                  </span>
                </div>
              </div>
            }
            @if (areaAlerts().length === 0) {
              <div class="empty-state">
                <i class="bi bi-check-circle text-success me-2"></i>No open alerts in your area
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1280px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; margin: 0 0 0.25rem; }
    .page-header p { font-size: 0.875rem; color: #64748B; margin: 0; }

    .operator-grid { display: flex; flex-direction: column; gap: 1.25rem; }
    .op-section { padding: 1.25rem; }

    .section-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding-bottom: 0.875rem; border-bottom: 1px solid #E2E8F0; }
    .section-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.125rem; flex-shrink: 0; }
    .lpa-icon { background: #EDE9FE; color: #7C3AED; }
    .wi-icon  { background: #DBEAFE; color: #2563EB; }
    .ncr-icon { background: #FEE2E2; color: #DC2626; }
    .section-title { font-size: 1rem; font-weight: 700; color: #0F172A; margin: 0 0 0.125rem; }
    .section-sub { font-size: 0.75rem; color: #94A3B8; margin: 0; }

    .op-list { display: flex; flex-direction: column; }
    .op-row {
      display: flex; align-items: center; justify-content: space-between;
      min-height: 52px; padding: 0.75rem 0;
      border-bottom: 1px solid #F1F5F9; cursor: pointer; gap: 1rem; flex-wrap: wrap;
      &:last-child { border-bottom: none; }
      &:hover { background: #F8FAFC; margin: 0 -0.5rem; padding-left: 0.5rem; padding-right: 0.5rem; border-radius: 6px; }
    }
    .row-left  { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
    .row-right { display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; }
    .row-info  { display: flex; flex-direction: column; min-width: 0; }
    .record-id  { font-size: 0.6875rem; font-weight: 600; color: #94A3B8; font-family: monospace; }
    .row-title { font-size: 0.875rem; font-weight: 500; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .row-sub   { font-size: 0.75rem; color: #94A3B8; }

    .layer-pill { width: 28px; height: 28px; border-radius: 6px; background: #EDE9FE; color: #7C3AED; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }
    .wi-doc-icon { font-size: 1.125rem; color: #2563EB; flex-shrink: 0; }
    .sev-dot { font-size: 8px; flex-shrink: 0; }

    .hist-icon { background: #DCFCE7; color: #16A34A; }
    .see-all-link { font-size: 0.75rem; color: #2563EB; text-decoration: none; }
    .see-all-link:hover { text-decoration: underline; }
    .empty-state { padding: 1.5rem 0; font-size: 0.875rem; color: #64748B; text-align: center; }

    .status-tip { position: relative; cursor: help; }
    .status-tip::after {
      content: attr(data-tip);
      position: absolute;
      bottom: calc(100% + 8px);
      right: 0;
      background: #1E293B;
      color: #F1F5F9;
      font-size: 0.6875rem;
      line-height: 1.45;
      padding: 0.375rem 0.625rem;
      border-radius: 6px;
      width: max-content;
      max-width: 210px;
      white-space: normal;
      text-align: left;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 200;
    }
    .status-tip::before {
      content: '';
      position: absolute;
      bottom: calc(100% + 2px);
      right: 14px;
      border: 5px solid transparent;
      border-top-color: #1E293B;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 200;
    }
    .status-tip:hover::after,
    .status-tip:hover::before { opacity: 1; }
  `]
})
export class OperatorDashboardComponent {
  readonly mock   = inject(MockDataService);
  readonly router = inject(Router);
  private  auth   = inject(AuthStore);

  readonly fullName = this.auth.fullName;
  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  });

  readonly jobTitle = computed(() => {
    const roles = this.auth.currentUser()?.roles ?? [];
    if (roles.includes('QT'))       return 'Quality Technician';
    if (roles.includes('Operator')) return 'Production Operator';
    return 'Operator';
  });

  readonly siteName = computed(() => {
    const siteId = this.auth.currentUser()?.siteId;
    const map: Record<string, string> = {
      'SITE-001': 'Plant-1 · Detroit',
      'SITE-002': 'Plant-2 · Chicago',
      'SITE-003': 'Plant-3 · Cleveland',
    };
    return map[siteId ?? ''] ?? 'Unknown Site';
  });

  readonly lpaChecks = computed(() =>
    this.mock.getLpaDueToday(this.auth.fullName())
  );

  readonly workInstructions = computed(() => {
    const siteId = this.auth.currentUser()?.siteId;
    return this.mock.documents()
      .filter((d: any) => d.status === 'Released' && d.type === 'Work Instruction' && d.siteId === siteId)
      .slice(0, 4);
  });

  private readonly SEV_ORDER: Record<string, number> = { Major: 0, Minor: 1, OFI: 2 };

  readonly areaAlerts = computed(() => {
    const siteId = this.auth.currentUser()?.siteId;
    return this.mock.ncrs()
      .filter((n: any) => n.status !== 'Closed' && n.siteId === siteId)
      .sort((a: any, b: any) => (this.SEV_ORDER[a.severity] ?? 3) - (this.SEV_ORDER[b.severity] ?? 3))
      .slice(0, 4);
  });

  getStatusTip(run: { status: string; dueDate: string }): string {
    const [y, m, d] = run.dueDate.split('-').map(Number);
    const formatted = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (run.status === 'Overdue') {
      return `Was due on ${formatted} (start of shift). You missed the check window — please complete it now.`;
    }
    return `Due today (${formatted}) before end of shift. You have not started it yet.`;
  }

  readonly recentlyCompletedLpa = computed(() => {
    const uid = this.auth.currentUser()?.id ?? '';
    return [...this.mock.lpaRunsSignal()]
      .filter(r => r.ownerId === uid && r.status === 'Completed')
      .sort((a, b) => (b.completedDate ?? b.dueDate).localeCompare(a.completedDate ?? a.dueDate))
      .slice(0, 5);
  });
}
