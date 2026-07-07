import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { AuthStore } from '../../../core/auth/stores/auth.store';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">

      <div class="page-header">
        <div>
          <h1>{{ greeting() }}, {{ fullName() }}</h1>
          <p>{{ jobTitle() }} · {{ siteName() }}</p>
        </div>
        <span class="chip chip-green">SCR-010d</span>
      </div>

      <div class="supervisor-grid">

        <!-- My LPA Due Today -->
        <div class="q-card supervisor-section">
          <div class="section-header">
            <div class="section-icon lpa-icon">
              <i class="bi bi-clipboard-check"></i>
            </div>
            <div>
              <h2 class="section-title">My LPA Due Today</h2>
              <p class="section-sub">Layered Process Audits</p>
            </div>
            <span class="chip chip-amber">{{ lpaDueToday().length }} pending</span>
          </div>
          <div class="lpa-list">
            @for (run of lpaDueToday(); track run.id) {
              <div class="supervisor-row" (click)="router.navigate(['/lpa/run', run.id])">
                <div class="row-left">
                  <div class="layer-badge layer-{{ run.layer.toLowerCase() }}">{{ run.layer }}</div>
                  <div class="row-info">
                    <span class="record-id">{{ run.id }}</span>
                    <span class="row-title">{{ run.title }}</span>
                  </div>
                </div>
                <div class="row-right">
                  <span class="status-tip" [attr.data-tip]="getStatusTip(run)">
                    <span class="chip {{ run.status === 'Overdue' ? 'chip-breached' : 'chip-warning' }}">
                      {{ run.status }}
                    </span>
                  </span>
                  <button class="btn btn-sm btn-primary action-btn ms-2"
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
        <div class="q-card supervisor-section">
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
          <div class="lpa-list">
            @for (run of recentlyCompletedLpa(); track run.id) {
              <div class="supervisor-row" [routerLink]="['/lpa/run', run.id]">
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
        <div class="q-card supervisor-section">
          <div class="section-header">
            <div class="section-icon verify-icon">
              <i class="bi bi-person-check-fill"></i>
            </div>
            <div>
              <h2 class="section-title">Team L1 LPA — Cross-Verify</h2>
              <p class="section-sub">Operator checks in your areas</p>
            </div>
            <span class="chip {{ teamNotDoneCount() > 0 ? 'chip-amber' : 'chip-within-sla' }}">
              {{ teamNotDoneCount() > 0 ? teamNotDoneCount() + ' not done' : 'All done' }}
            </span>
          </div>
          <div class="verify-list">
            @for (item of teamL1Completions(); track item.run.id) {
              <div class="supervisor-row verify-row"
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

        <!-- My NCR Status -->
        <div class="q-card supervisor-section">
          <div class="section-header">
            <div class="section-icon ncr-icon">
              <i class="bi bi-exclamation-triangle"></i>
            </div>
            <div>
              <h2 class="section-title">My NCR Status</h2>
              <p class="section-sub">Open non-conformances</p>
            </div>
            <span class="chip chip-amber">{{ myNcrs().length }} open</span>
          </div>
          <div class="ncr-list">
            @for (ncr of myNcrs(); track ncr.id) {
              <div class="supervisor-row" [routerLink]="['/ncrs', ncr.id]">
                <div class="row-left">
                  <i class="bi bi-circle-fill severity-dot"
                     [style.color]="ncr.severity === 'Major' ? '#DC2626' : ncr.severity === 'Minor' ? '#F59E0B' : '#2563EB'"></i>
                  <div class="row-info">
                    <span class="record-id">{{ ncr.id }}</span>
                    <span class="row-title">{{ ncr.title }}</span>
                  </div>
                </div>
                <div class="row-right">
                  <span class="chip {{ ncr.ageInDays > 21 ? 'chip-breached' : ncr.ageInDays > 10 ? 'chip-warning' : 'chip-within-sla' }}">
                    {{ ncr.ageInDays }}d
                  </span>
                  <span class="chip {{ ncr.severity === 'Major' ? 'chip-major' : ncr.severity === 'Minor' ? 'chip-minor' : 'chip-ofi' }} ms-1">
                    {{ ncr.severity }}
                  </span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Docs To Acknowledge -->
        <div class="q-card supervisor-section">
          <div class="section-header">
            <div class="section-icon doc-icon">
              <i class="bi bi-file-earmark-check"></i>
            </div>
            <div>
              <h2 class="section-title">Docs To Acknowledge</h2>
              <p class="section-sub">New revisions requiring acknowledgement</p>
            </div>
            <span class="chip chip-blue">{{ docsToAck().length }} pending</span>
          </div>
          <div class="doc-list">
            @for (doc of docsToAck(); track doc.id) {
              <div class="supervisor-row" [routerLink]="['/documents', doc.id]">
                <div class="row-left">
                  <i class="bi bi-file-earmark-text doc-icon-sm"></i>
                  <div class="row-info">
                    <span class="record-id">{{ doc.id }}</span>
                    <span class="row-title">{{ doc.title }}</span>
                    <span class="row-sub">Rev. {{ doc.revision }} · {{ doc.type }}</span>
                  </div>
                </div>
                <div class="row-right">
                  <button class="btn btn-sm btn-outline-primary ack-btn" (click)="$event.stopPropagation(); onAck(doc.id)">
                    Acknowledge
                  </button>
                </div>
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

    .supervisor-grid { display: flex; flex-direction: column; gap: 1.25rem; }
    .supervisor-section { padding: 1.25rem; }

    .section-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding-bottom: 0.875rem; border-bottom: 1px solid #E2E8F0; }
    .section-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.125rem; flex-shrink: 0; }
    .lpa-icon    { background: #EDE9FE; color: #7C3AED; }
    .verify-icon { background: #CFFAFE; color: #0891B2; }
    .ncr-icon    { background: #FEE2E2; color: #DC2626; }
    .doc-icon    { background: #DBEAFE; color: #2563EB; }
    .section-title { font-size: 1rem; font-weight: 700; color: #0F172A; margin: 0 0 0.125rem; }
    .section-sub { font-size: 0.75rem; color: #94A3B8; margin: 0; }

    .supervisor-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 52px;
      padding: 0.75rem 0;
      border-bottom: 1px solid #F1F5F9;
      cursor: pointer;
      gap: 1rem;
      flex-wrap: wrap;
      &:last-child { border-bottom: none; }
      &:hover { background: #F8FAFC; margin: 0 -0.5rem; padding-left: 0.5rem; padding-right: 0.5rem; border-radius: 6px; }
    }
    .row-left  { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
    .row-right { display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; }
    .row-info  { display: flex; flex-direction: column; min-width: 0; }
    .row-title { font-size: 0.875rem; font-weight: 500; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .row-sub   { font-size: 0.75rem; color: #94A3B8; }
    .row-meta  { font-size: 0.6875rem; color: #94A3B8; margin-top: 1px; }
    .text-danger { color: #DC2626 !important; }
    .record-id { font-size: 0.6875rem; font-weight: 600; color: #94A3B8; font-family: monospace; }

    .layer-badge { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }
    .layer-l1 { background: #EDE9FE; color: #7C3AED; }
    .layer-l2 { background: #DBEAFE; color: #2563EB; }
    .layer-l3 { background: #DCFCE7; color: #16A34A; }

    .op-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }

    .severity-dot { font-size: 8px; flex-shrink: 0; }
    .doc-icon-sm  { font-size: 1.125rem; color: #2563EB; flex-shrink: 0; }

    .action-btn { border-radius: 6px; font-size: 0.75rem; }
    .ack-btn    { border-radius: 6px; font-size: 0.75rem; white-space: nowrap; }
    .review-btn { border-radius: 6px; font-size: 0.75rem; white-space: nowrap; }

    .hist-icon { background: #DCFCE7; color: #16A34A; }
    .see-all-link { font-size: 0.75rem; color: #2563EB; text-decoration: none; &:hover { text-decoration: underline; } }
    .lpa-list { display: flex; flex-direction: column; }
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
export class SupervisorDashboardComponent {
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
    if (roles.includes('QS')) return 'Quality Supervisor';
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
      item => item.run.status === 'Overdue' || item.run.status === 'Pending' || item.run.status === 'In Progress'
    ).length
  );

  readonly myNcrs = computed(() =>
    this.mock.ncrs().filter((n: any) => n.ownerInitials === this.myInitials()).slice(0, 4)
  );

  readonly docsToAck = computed(() =>
    this.mock.documents().filter((d: any) => d.status === 'Released').slice(0, 3)
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

  acknowledgedIds = new Set<string>();

  onAck(id: string): void {
    this.acknowledgedIds.add(id);
  }
}
