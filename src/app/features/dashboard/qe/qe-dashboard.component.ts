import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { AuthStore } from '../../../core/auth/stores/auth.store';

@Component({
  selector: 'app-qe-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">

      <div class="page-header">
        <div>
          <h1>{{ greeting() }}, {{ fullName() }}</h1>
          <p>{{ jobTitle() }} · {{ siteName() }}</p>
        </div>
        <span class="chip chip-blue">Layer 2 · Supervisor</span>
      </div>

      <!-- KPI Row -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-label">My Open Items</div>
          <div class="kpi-value">{{ myWorkItems().length }}</div>
          <div class="kpi-sub chip chip-amber">Across all types</div>
        </div>
        <div class="kpi-card {{ overdueCount() > 0 ? 'kpi-danger' : '' }}">
          <div class="kpi-label">My Overdue</div>
          <div class="kpi-value {{ overdueCount() > 0 ? 'text-danger' : '' }}">{{ overdueCount() }}</div>
          <div class="kpi-sub chip {{ overdueCount() > 0 ? 'chip-red' : 'chip-within-sla' }}">
            {{ overdueCount() > 0 ? 'Action required' : 'All on time' }}
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">My Open CAPAs</div>
          <div class="kpi-value">{{ myCAPAs().length }}</div>
          <div class="kpi-sub chip chip-blue">In progress</div>
        </div>
        <div class="kpi-card {{ teamNotDoneCount() > 0 ? 'kpi-warn' : '' }}">
          <div class="kpi-label">Team L1 Not Done</div>
          <div class="kpi-value {{ teamNotDoneCount() > 0 ? 'text-warn' : '' }}">{{ teamNotDoneCount() }}</div>
          <div class="kpi-sub chip {{ teamNotDoneCount() > 0 ? 'chip-amber' : 'chip-within-sla' }}">
            {{ teamNotDoneCount() > 0 ? 'Needs attention' : 'All done' }}
          </div>
        </div>
      </div>

      <!-- My LPA Due Today -->
      <div class="q-card lpa-section">
        <div class="section-header">
          <div class="section-icon lpa-icon"><i class="bi bi-clipboard-check"></i></div>
          <div>
            <h2 class="section-title">My LPA Due Today</h2>
            <p class="section-sub">Layer 2 process audits</p>
          </div>
          <span class="chip chip-amber">{{ lpaDueToday().length }} pending</span>
        </div>
        <div class="item-list">
          @for (run of lpaDueToday(); track run.id) {
            <div class="item-row" (click)="router.navigate(['/lpa/run', run.id])">
              <div class="row-left">
                <div class="layer-badge layer-l2">L2</div>
                <div class="row-info">
                  <span class="record-id">{{ run.id }}</span>
                  <span class="row-title">{{ run.title }}</span>
                  <span class="row-sub">{{ run.zone }}</span>
                </div>
              </div>
              <div class="row-right">
                <span class="status-tip" [attr.data-tip]="getStatusTip(run)">
                  <span class="chip {{ run.status === 'Overdue' ? 'chip-breached' : 'chip-warning' }}">
                    {{ run.status }}
                  </span>
                </span>
                <button class="btn btn-sm btn-primary ms-2"
                  (click)="$event.stopPropagation(); router.navigate(['/lpa/run', run.id])">
                  Start LPA
                </button>
              </div>
            </div>
          }
          @if (lpaDueToday().length === 0) {
            <div class="empty-state">
              <i class="bi bi-check-circle text-success me-2"></i>All your LPA checks complete for today
            </div>
          }
        </div>
      </div>

      <!-- My Completed LPA Checks -->
      <div class="q-card lpa-section">
        <div class="section-header">
          <div class="section-icon hist-icon"><i class="bi bi-check-circle-fill"></i></div>
          <div>
            <h2 class="section-title">My Completed LPA Checks</h2>
            <p class="section-sub">Layer 2 checks — your accountability trail</p>
          </div>
          <div class="ms-auto d-flex align-items-center gap-2">
            <span class="chip chip-green">{{ recentlyCompletedLpa().length }}</span>
            <a [routerLink]="['/lpa']" class="see-all-link">View all</a>
          </div>
        </div>
        <div class="item-list">
          @for (run of recentlyCompletedLpa(); track run.id) {
            <div class="item-row" [routerLink]="['/lpa/run', run.id]">
              <div class="row-left">
                <div class="layer-badge layer-{{ run.layer.toLowerCase() }}">{{ run.layer }}</div>
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
                <button class="btn btn-sm btn-outline-primary review-btn ms-2"
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

      <!-- Team L1 LPA Cross-Verification -->
      <div class="q-card lpa-section">
        <div class="section-header">
          <div class="section-icon verify-icon"><i class="bi bi-person-check-fill"></i></div>
          <div>
            <h2 class="section-title">Team L1 LPA — Cross-Verify</h2>
            <p class="section-sub">Operator checks in your areas</p>
          </div>
          <span class="chip {{ teamNotDoneCount() > 0 ? 'chip-amber' : 'chip-within-sla' }}">
            {{ teamNotDoneCount() > 0 ? teamNotDoneCount() + ' not done' : 'All done' }}
          </span>
        </div>
        <div class="item-list">
          @for (item of teamL1Completions(); track item.run.id) {
            <div class="item-row"
              (click)="item.run.status === 'Completed' ? router.navigate(['/lpa/run', item.run.id]) : router.navigate(['/lpa'])">
              <div class="row-left">
                <div class="op-avatar"
                  [style.background]="item.operatorColor + '22'"
                  [style.color]="item.operatorColor">
                  {{ item.operatorInitials }}
                </div>
                <div class="row-info">
                  <span class="row-title">{{ item.operatorName }}</span>
                  <span class="row-sub">{{ item.run.zone }} · L1 Daily</span>
                  @if (item.run.status === 'Completed' && item.run.completedDate) {
                    <span class="row-meta">Done {{ item.run.completedDate }}</span>
                  }
                  @if (item.run.status === 'Overdue') {
                    <span class="row-meta text-danger">Due {{ item.run.dueDate }}</span>
                  }
                </div>
              </div>
              <div class="row-right">
                @if (item.run.status === 'Completed') {
                  <span class="chip {{ item.run.completionRate === 100 ? 'chip-within-sla' : 'chip-amber' }}">
                    {{ item.run.completionRate }}% done
                  </span>
                  <button class="btn btn-sm btn-outline-primary review-btn ms-2"
                    (click)="$event.stopPropagation(); router.navigate(['/lpa/run', item.run.id])">
                    Review
                  </button>
                } @else if (item.run.status === 'In Progress') {
                  <span class="chip chip-amber">{{ item.run.completionRate }}% in progress</span>
                } @else {
                  <span class="status-tip" [attr.data-tip]="getStatusTip(item.run)">
                    <span class="chip {{ item.run.status === 'Overdue' ? 'chip-breached' : 'chip-warning' }}">
                      {{ item.run.status }}
                    </span>
                  </span>
                }
              </div>
            </div>
          }
          @if (teamL1Completions().length === 0) {
            <div class="empty-state">No operator LPA schedules in your areas</div>
          }
        </div>
      </div>

      <!-- Bottom grid -->
      <div class="main-grid">

        <!-- My Work -->
        <div class="q-card section-card">
          <div class="card-header-row mb-3">
            <h2 class="card-title">My Work — Top 5</h2>
            <a [routerLink]="['/my-work']" class="see-all-link">View all</a>
          </div>
          <div class="work-list">
            @for (item of myWorkItems().slice(0, 5); track item.id) {
              <div class="work-item" [routerLink]="item.route">
                <i class="bi {{ typeIcon(item.type) }} work-icon" [style.color]="typeColor(item.type)"></i>
                <div class="work-info">
                  <div class="work-id"><span class="record-id">{{ item.entityId }}</span></div>
                  <div class="work-title">{{ item.title }}</div>
                </div>
                <span class="chip {{ ageChip(item.dueCategory) }}">{{ ageLabel(item.dueCategory, item.ageDays) }}</span>
              </div>
            }
            @if (myWorkItems().length === 0) {
              <div class="empty-state">No open work items</div>
            }
          </div>
        </div>

        <!-- My CAPAs -->
        <div class="q-card section-card">
          <div class="card-header-row mb-3">
            <h2 class="card-title">My CAPAs</h2>
            <a [routerLink]="['/capas']" class="see-all-link">View all</a>
          </div>
          @for (capa of myCAPAs().slice(0, 3); track capa.id) {
            <div class="capa-mini" [routerLink]="['/capas', capa.id]">
              <div class="capa-mini-header">
                <span class="record-id">{{ capa.id }}</span>
                <span class="chip {{ capa.onTime ? 'chip-within-sla' : 'chip-breached' }}">
                  {{ capa.onTime ? 'On-time' : 'Overdue' }}
                </span>
              </div>
              <div class="capa-mini-title">{{ capa.title }}</div>
              <div class="capa-stepper">
                @for (step of stepArray(capa.totalSteps); track step; let i = $index) {
                  <div class="step-dot"
                    [class.step-done]="i < capa.stepNumber - 1"
                    [class.step-active]="i === capa.stepNumber - 1">
                  </div>
                }
              </div>
              <div class="capa-step-label">Step {{ capa.stepNumber }}/{{ capa.totalSteps }}: {{ capa.currentStep }}</div>
            </div>
          }
          @if (myCAPAs().length === 0) {
            <div class="empty-state">No open CAPAs assigned to you</div>
          }
        </div>

        <!-- Open NCRs at My Site -->
        <div class="q-card section-card">
          <div class="card-header-row mb-3">
            <h2 class="card-title">Open NCRs — My Site</h2>
            <a [routerLink]="['/ncrs']" class="see-all-link">View all</a>
          </div>
          <div class="recent-list">
            @for (ncr of siteNcrs(); track ncr.id) {
              <div class="recent-item" [routerLink]="['/ncrs', ncr.id]">
                <i class="bi bi-exclamation-triangle recent-icon"
                  [style.color]="ncr.severity === 'Major' ? '#DC2626' : '#F59E0B'"></i>
                <div class="recent-info">
                  <span class="record-id">{{ ncr.id }}</span>
                  <span class="recent-title ms-2">{{ ncr.title }}</span>
                </div>
                <span class="chip {{ ncr.ageInDays > 14 ? 'chip-breached' : 'chip-warning' }}">{{ ncr.ageInDays }}d</span>
              </div>
            }
            @if (siteNcrs().length === 0) {
              <div class="empty-state">No open NCRs at your site</div>
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

    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
    @media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
    .kpi-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1.125rem 1.25rem; }
    .kpi-danger { border-color: #FECACA; background: #FFF5F5; }
    .kpi-warn   { border-color: #FDE68A; background: #FFFBEB; }
    .kpi-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; margin-bottom: 0.375rem; }
    .kpi-value { font-size: 2rem; font-weight: 800; color: #0F172A; margin-bottom: 0.5rem; }
    .text-danger { color: #DC2626 !important; }
    .text-warn   { color: #B45309 !important; }

    .lpa-section { padding: 1.25rem; margin-bottom: 1.25rem; }
    .section-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding-bottom: 0.875rem; border-bottom: 1px solid #E2E8F0; }
    .section-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.125rem; flex-shrink: 0; }
    .lpa-icon    { background: #EDE9FE; color: #7C3AED; }
    .hist-icon   { background: #DCFCE7; color: #16A34A; }
    .verify-icon { background: #CFFAFE; color: #0891B2; }
    .see-all-link { font-size: 0.75rem; color: #2563EB; text-decoration: none; &:hover { text-decoration: underline; } }
    .layer-l1 { background: #EDE9FE; color: #7C3AED; }
    .layer-l3 { background: #DCFCE7; color: #16A34A; }
    .section-title { font-size: 1rem; font-weight: 700; color: #0F172A; margin: 0 0 0.125rem; }
    .section-sub { font-size: 0.75rem; color: #94A3B8; margin: 0; }

    .item-list { display: flex; flex-direction: column; }
    .item-row {
      display: flex; align-items: center; justify-content: space-between;
      min-height: 52px; padding: 0.75rem 0;
      border-bottom: 1px solid #F1F5F9; cursor: pointer; gap: 1rem; flex-wrap: wrap;
      &:last-child { border-bottom: none; }
      &:hover { background: #F8FAFC; margin: 0 -0.5rem; padding-left: 0.5rem; padding-right: 0.5rem; border-radius: 6px; }
    }
    .row-left  { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
    .row-right { display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; }
    .row-info  { display: flex; flex-direction: column; min-width: 0; }
    .row-title { font-size: 0.875rem; font-weight: 500; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .row-sub   { font-size: 0.75rem; color: #94A3B8; }
    .row-meta  { font-size: 0.6875rem; color: #94A3B8; margin-top: 1px; }
    .record-id { font-size: 0.6875rem; font-weight: 600; color: #94A3B8; font-family: monospace; }

    .layer-badge { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }
    .layer-l2 { background: #DBEAFE; color: #2563EB; }
    .op-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }

    .review-btn { border-radius: 6px; font-size: 0.75rem; white-space: nowrap; }
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

    .main-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
    @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
    .section-card { padding: 1.25rem; }
    .card-header-row { display: flex; align-items: center; justify-content: space-between; }
    .card-title { font-size: 0.9375rem; font-weight: 700; color: #0F172A; margin: 0; }
    .see-all-link { font-size: 0.75rem; color: #2563EB; text-decoration: none; &:hover { text-decoration: underline; } }

    .work-list { display: flex; flex-direction: column; }
    .work-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0; border-bottom: 1px solid #F1F5F9; cursor: pointer; transition: background 150ms; &:last-child { border-bottom: none; } &:hover { background: #F8FAFC; margin: 0 -0.25rem; padding-left: 0.25rem; padding-right: 0.25rem; } }
    .work-icon { font-size: 1rem; flex-shrink: 0; }
    .work-info { flex: 1; min-width: 0; }
    .work-title { font-size: 0.8125rem; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .capa-mini { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.875rem; margin-bottom: 0.875rem; cursor: pointer; &:last-child { margin-bottom: 0; } &:hover { background: #F1F5F9; } }
    .capa-mini-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.375rem; }
    .capa-mini-title { font-size: 0.8125rem; font-weight: 500; color: #0F172A; margin-bottom: 0.625rem; }
    .capa-stepper { display: flex; gap: 6px; margin-bottom: 0.375rem; }
    .step-dot { width: 18px; height: 6px; border-radius: 3px; background: #E2E8F0; }
    .step-done { background: #16A34A; }
    .step-active { background: #2563EB; }
    .capa-step-label { font-size: 0.75rem; color: #64748B; }

    .recent-list { display: flex; flex-direction: column; }
    .recent-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0; border-bottom: 1px solid #F1F5F9; cursor: pointer; &:last-child { border-bottom: none; } &:hover { background: #F8FAFC; } }
    .recent-icon { font-size: 1rem; flex-shrink: 0; }
    .recent-info { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .recent-title { font-size: 0.8125rem; color: #334155; }
    .recent-time { font-size: 0.75rem; color: #94A3B8; white-space: nowrap; }
  `]
})
export class QeDashboardComponent {
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
    if (roles.includes('QE')) return 'Quality Engineer';
    if (roles.includes('ME')) return 'Manufacturing Engineer';
    return 'Supervisor';
  });

  readonly siteName = computed(() => {
    const map: Record<string, string> = {
      'SITE-001': 'Plant-1 · Detroit',
      'SITE-002': 'Plant-2 · Chicago',
      'SITE-003': 'Plant-3 · Cleveland',
    };
    return map[this.auth.currentUser()?.siteId ?? ''] ?? 'Unknown Site';
  });

  private readonly myInitials = computed(() => {
    const u = this.auth.currentUser();
    return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '';
  });

  readonly lpaDueToday = computed(() =>
    this.mock.getLpaDueToday(this.auth.fullName())
  );

  readonly teamL1Completions = computed(() =>
    this.mock.getTeamL1Completions(this.auth.fullName())
  );

  readonly teamNotDoneCount = computed(() =>
    this.teamL1Completions().filter(
      item => item.run.status !== 'Completed'
    ).length
  );

  readonly myWorkItems = computed(() => {
    const userId = this.auth.currentUser()?.id;
    return this.mock.siteWorkItems().filter((w: any) => w.ownerId === userId);
  });

  readonly overdueCount = computed(() =>
    this.myWorkItems().filter((w: any) => w.dueCategory === 'overdue').length
  );

  readonly myCAPAs = computed(() =>
    this.mock.capas.filter(c => c.ownerInitials === this.myInitials())
  );

  readonly siteNcrs = computed(() =>
    this.mock.ncrs()
      .filter((n: any) => n.siteId === this.auth.currentUser()?.siteId && n.status !== 'Closed')
      .slice(0, 5)
  );

  readonly recentlyCompletedLpa = computed(() => {
    const uid = this.auth.currentUser()?.id ?? '';
    return [...this.mock.lpaRunsSignal()]
      .filter(r => r.ownerId === uid && r.status === 'Completed')
      .sort((a, b) => (b.completedDate ?? b.dueDate).localeCompare(a.completedDate ?? a.dueDate))
      .slice(0, 5);
  });

  getStatusTip(run: { status: string; dueDate: string }): string {
    const [y, m, d] = run.dueDate.split('-').map(Number);
    const formatted = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (run.status === 'Overdue') {
      return `Was due on ${formatted} (start of shift). You missed the check window — please complete it now.`;
    }
    return `Due today (${formatted}) before end of shift. You have not started it yet.`;
  }

  typeIcon(type: string): string {
    const m: Record<string, string> = {
      'Document Approval': 'bi-file-earmark-text',
      'NCR Disposition':   'bi-exclamation-triangle',
      'CAPA Review':       'bi-tools',
      'LPA Run':           'bi-clipboard-check',
      'Finding Response':  'bi-search',
    };
    return m[type] ?? 'bi-circle';
  }

  typeColor(type: string): string {
    const m: Record<string, string> = {
      'Document Approval': '#2563EB',
      'NCR Disposition':   '#DC2626',
      'CAPA Review':       '#059669',
      'LPA Run':           '#7C3AED',
      'Finding Response':  '#B45309',
    };
    return m[type] ?? '#64748B';
  }

  ageChip(cat: string): string {
    return cat === 'overdue' ? 'chip-breached' : cat === 'today' ? 'chip-warning' : 'chip-within-sla';
  }

  ageLabel(cat: string, days: number): string {
    if (cat === 'overdue') return `${days}d OD`;
    if (cat === 'today') return 'Today';
    return 'Wk';
  }

  stepArray(n: number): number[] { return Array.from({ length: n }, (_, i) => i); }
}
