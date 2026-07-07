import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { WorkItem, ActivityFeedItem } from '../../../shared/interfaces/models';
import { AuthStore } from '../../../core/auth/stores/auth.store';

@Component({
  selector: 'app-qm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <div class="page-wrapper">

      <!-- Greeting row -->
      <div class="greeting-row">
        <div class="greeting-left">
          <h1 class="greeting-text">{{ greeting() }}, {{ fullName() }}</h1>
          <div class="greeting-meta">
            <span class="chip chip-site"><i class="bi bi-building me-1"></i>Plant-1</span>
            <span class="meta-date">{{ today | date:'EEEE, MMMM d, y' }}</span>
          </div>
        </div>
        <span class="chip chip-active"><i class="bi bi-check-circle me-1"></i>Active</span>
      </div>

      <!-- KPI Row -->
      <div class="kpi-row">

        <!-- Open NCRs -->
        <div class="kpi-tip-wrap">
          <div class="kpi-card" [routerLink]="['/ncrs']" role="button">
            <div class="kpi-header">
              <span class="kpi-label">Open NCRs</span>
              <span class="chip chip-amber">+2 this week</span>
            </div>
            <div class="kpi-value">{{ openNcrCount() }}</div>
            <div class="kpi-sparkline">
              <svg viewBox="0 0 88 36" preserveAspectRatio="none">
                <rect x="0"  y="24" width="9" height="12" fill="#F97316" rx="1" opacity="0.7"/>
                <rect x="13" y="18" width="9" height="18" fill="#F97316" rx="1" opacity="0.7"/>
                <rect x="26" y="20" width="9" height="16" fill="#F97316" rx="1" opacity="0.7"/>
                <rect x="39" y="12" width="9" height="24" fill="#F97316" rx="1" opacity="0.7"/>
                <rect x="52" y="16" width="9" height="20" fill="#F97316" rx="1" opacity="0.7"/>
                <rect x="65" y="10" width="9" height="26" fill="#F97316" rx="1" opacity="0.9"/>
                <rect x="78" y="8"  width="9" height="28" fill="#F97316" rx="1"/>
              </svg>
            </div>
          </div>
          <div class="kpi-tip">
            <div class="kpi-tip-title"><i class="bi bi-exclamation-triangle me-1"></i> Open NCRs</div>
            <p>Number of quality defects or process failures that have been reported but <strong>not yet resolved</strong> at this site.</p>
            <p class="kpi-tip-note">Lower is better. Click to see the full list and take action.</p>
          </div>
        </div>

        <!-- CAPA On-Time -->
        <div class="kpi-tip-wrap">
          <div class="kpi-card" [routerLink]="['/capas']" role="button">
            <div class="kpi-header">
              <span class="kpi-label">CAPA On-Time</span>
              <span class="chip chip-red">-4% vs last month</span>
            </div>
            <div class="kpi-value">{{ capaOnTimePct() }}%</div>
            <div class="kpi-sparkline">
              <svg viewBox="0 0 88 36" preserveAspectRatio="none" fill="none">
                <polyline
                  points="0,8 13,10 26,12 39,9 52,14 65,18 78,22"
                  stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="78" cy="22" r="3" fill="#EF4444"/>
              </svg>
            </div>
          </div>
          <div class="kpi-tip">
            <div class="kpi-tip-title"><i class="bi bi-tools me-1"></i> CAPA On-Time</div>
            <p>Percentage of corrective actions (fixes for recurring problems) that are being <strong>completed by their due date</strong>.</p>
            <p class="kpi-tip-note">Higher is better. Below 80% needs attention. Click to manage CAPAs.</p>
          </div>
        </div>

        <!-- LPA Completion -->
        <div class="kpi-tip-wrap">
          <div class="kpi-card" [routerLink]="['/lpa']" role="button">
            <div class="kpi-header">
              <span class="kpi-label">LPA Completion</span>
              <span class="chip chip-green">+5% this week</span>
            </div>
            <div class="kpi-value">{{ lpaCompletionPct() }}%</div>
            <div class="kpi-sparkline">
              <svg viewBox="0 0 88 36" preserveAspectRatio="none">
                <rect x="0"  y="12" width="9" height="24" fill="#16A34A" rx="1" opacity="0.6"/>
                <rect x="13" y="10" width="9" height="26" fill="#16A34A" rx="1" opacity="0.6"/>
                <rect x="26" y="8"  width="9" height="28" fill="#16A34A" rx="1" opacity="0.7"/>
                <rect x="39" y="6"  width="9" height="30" fill="#16A34A" rx="1" opacity="0.7"/>
                <rect x="52" y="10" width="9" height="26" fill="#16A34A" rx="1" opacity="0.8"/>
                <rect x="65" y="6"  width="9" height="30" fill="#16A34A" rx="1" opacity="0.9"/>
                <rect x="78" y="4"  width="9" height="32" fill="#16A34A" rx="1"/>
              </svg>
            </div>
          </div>
          <div class="kpi-tip">
            <div class="kpi-tip-title"><i class="bi bi-clipboard-check me-1"></i> LPA Completion</div>
            <p>Layered Process Audits — short daily spot-checks done on the shop floor. This shows <strong>how many scheduled checks were actually completed</strong> this week.</p>
            <p class="kpi-tip-note">Higher is better. Target is 100%. Click to view LPA schedules.</p>
          </div>
        </div>

        <!-- Docs Overdue Review -->
        <div class="kpi-tip-wrap">
          <div class="kpi-card" [routerLink]="['/documents']" role="button">
            <div class="kpi-header">
              <span class="kpi-label">Docs Overdue Review</span>
              <span class="chip chip-amber">unchanged</span>
            </div>
            <div class="kpi-value">{{ docsOverdueCount() }}</div>
            <div class="kpi-sparkline">
              <svg viewBox="0 0 88 36" preserveAspectRatio="none" fill="none">
                <polyline
                  points="0,14 13,14 26,14 39,14 52,20 65,20 78,20"
                  stroke="#F97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 2"/>
                <circle cx="78" cy="20" r="3" fill="#F97316"/>
              </svg>
            </div>
          </div>
          <div class="kpi-tip">
            <div class="kpi-tip-title"><i class="bi bi-file-earmark-text me-1"></i> Docs Overdue Review</div>
            <p>Controlled documents (work instructions, procedures, forms) that are <strong>past their scheduled review date</strong> and need to be approved or updated.</p>
            <p class="kpi-tip-note">Should be zero. Overdue docs risk audit findings. Click to review them.</p>
          </div>
        </div>

      </div>

      <!-- LPA row: My checks + Team L2 cross-verify side by side -->
      <div class="lpa-row">

        <!-- My LPA Due -->
        <div class="q-card lpa-card">
          <div class="lpa-card-header">
            <div class="lpa-icon-wrap"><i class="bi bi-clipboard-check"></i></div>
            <div class="lpa-header-text">
              <h2 class="lpa-title">My LPA Due</h2>
              <p class="lpa-sub">Layer 3 monthly checks</p>
            </div>
            <span class="chip chip-amber ms-auto">{{ myLpaDue().length }} pending</span>
          </div>
          <div class="lpa-list">
            @for (run of myLpaDue(); track run.id) {
              <div class="lpa-row-item" (click)="router.navigate(['/lpa/run', run.id])">
                <div class="layer-badge layer-l3">L3</div>
                <div class="lpa-item-info">
                  <span class="lpa-item-title">{{ run.zone }}</span>
                  <span class="lpa-item-sub">Due {{ run.dueDate }}</span>
                </div>
                <span class="status-tip" [attr.data-tip]="getStatusTip(run)">
                  <span class="chip {{ run.status === 'Overdue' ? 'chip-breached' : 'chip-warning' }}">
                    {{ run.status }}
                  </span>
                </span>
                <button class="btn btn-sm btn-primary lpa-btn"
                  (click)="$event.stopPropagation(); router.navigate(['/lpa/run', run.id])">
                  Start
                </button>
              </div>
            }
            @if (myLpaDue().length === 0) {
              <div class="lpa-empty">
                <i class="bi bi-check-circle text-success me-2"></i>All done
              </div>
            }
          </div>
        </div>

        <!-- Team L2 Cross-Verify -->
        <div class="q-card lpa-card">
          <div class="lpa-card-header">
            <div class="lpa-icon-wrap verify"><i class="bi bi-person-check-fill"></i></div>
            <div class="lpa-header-text">
              <h2 class="lpa-title">Team L2 — Cross-Verify</h2>
              <p class="lpa-sub">Supervisor checks in your areas</p>
            </div>
            <span class="chip {{ teamL2NotDoneCount() > 0 ? 'chip-amber' : 'chip-within-sla' }} ms-auto">
              {{ teamL2NotDoneCount() > 0 ? teamL2NotDoneCount() + ' not done' : 'All done' }}
            </span>
          </div>
          <div class="lpa-list">
            @for (item of teamL2Completions(); track item.run.id) {
              <div class="lpa-row-item"
                (click)="item.run.status === 'Completed' ? router.navigate(['/lpa/run', item.run.id]) : router.navigate(['/lpa'])">
                <div class="sup-avatar"
                  [style.background]="item.supervisorColor + '22'"
                  [style.color]="item.supervisorColor">
                  {{ item.supervisorInitials }}
                </div>
                <div class="lpa-item-info">
                  <span class="lpa-item-title">{{ item.supervisorName }}</span>
                  <span class="lpa-item-sub">{{ item.run.zone }} · L2</span>
                  @if (item.run.status === 'Completed' && item.run.completedDate) {
                    <span class="lpa-item-meta">Done {{ item.run.completedDate }}</span>
                  }
                  @if (item.run.status === 'Overdue') {
                    <span class="lpa-item-meta text-danger">Due {{ item.run.dueDate }}</span>
                  }
                </div>
                @if (item.run.status === 'Completed') {
                  <span class="chip {{ item.run.completionRate === 100 ? 'chip-within-sla' : 'chip-amber' }}">
                    {{ item.run.completionRate }}%
                  </span>
                  <button class="btn btn-sm btn-outline-primary lpa-btn"
                    (click)="$event.stopPropagation(); router.navigate(['/lpa/run', item.run.id])">
                    Review
                  </button>
                } @else if (item.run.status === 'In Progress') {
                  <span class="chip chip-amber">{{ item.run.completionRate }}%</span>
                } @else {
                  <span class="status-tip" [attr.data-tip]="getStatusTip(item.run)">
                    <span class="chip {{ item.run.status === 'Overdue' ? 'chip-breached' : 'chip-warning' }}">
                      {{ item.run.status }}
                    </span>
                  </span>
                }
              </div>
            }
            @if (teamL2Completions().length === 0) {
              <div class="lpa-empty">No supervisor LPA schedules in your areas</div>
            }
          </div>
        </div>

      </div>

      <!-- My Completed LPA Checks -->
      <div class="q-card lpa-card lpa-completed-card">
        <div class="lpa-card-header">
          <div class="lpa-icon-wrap completed"><i class="bi bi-check-circle-fill"></i></div>
          <div class="lpa-header-text">
            <h2 class="lpa-title">My Completed LPA Checks</h2>
            <p class="lpa-sub">Layer 3 monthly checks — your accountability trail</p>
          </div>
          <div class="ms-auto d-flex align-items-center gap-2">
            <span class="chip chip-green">{{ recentlyCompletedLpa().length }}</span>
            <a [routerLink]="['/lpa']" class="see-all-link">View all</a>
          </div>
        </div>
        <div class="lpa-completed-grid">
          @for (run of recentlyCompletedLpa(); track run.id) {
            <div class="lpa-row-item" [routerLink]="['/lpa/run', run.id]">
              <div class="layer-badge">{{ run.layer }}</div>
              <div class="lpa-item-info">
                <span class="lpa-item-title">{{ run.title }}</span>
                <span class="lpa-item-sub">{{ run.zone }} · Completed {{ run.completedDate | date:'MMM d' }}</span>
              </div>
              <span class="chip {{ run.completionRate === 100 ? 'chip-within-sla' : 'chip-amber' }}">
                {{ run.completionRate }}%
              </span>
              <button class="btn btn-sm btn-outline-primary lpa-btn"
                (click)="$event.stopPropagation(); router.navigate(['/lpa/run', run.id])">
                Review
              </button>
            </div>
          }
          @if (recentlyCompletedLpa().length === 0) {
            <div class="lpa-empty"><i class="bi bi-clock-history me-2"></i>No completed checks yet</div>
          }
        </div>
      </div>

      <!-- Main grid -->
      <div class="main-grid">

        <!-- LEFT: Needs My Attention -->
        <div class="grid-left">
          <div class="q-card attention-card">
            <div class="card-header-row">
              <h2 class="card-title">
                <i class="bi bi-bell-fill text-warning me-2" style="font-size: 0.9rem;"></i>
                Needs My Attention
              </h2>
              <span class="badge bg-danger">{{ workItems().length }}</span>
            </div>
            <table class="q-table attention-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Age</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (item of workItems(); track item.id) {
                  <tr class="attention-row" [routerLink]="item.route">
                    <td>
                      <span class="type-icon-wrap">
                        <i class="bi {{ getTypeIcon(item.type) }}" [style.color]="getTypeColor(item.type)"></i>
                      </span>
                    </td>
                    <td><span class="record-id">{{ item.entityId }}</span></td>
                    <td class="title-cell">{{ item.title }}</td>
                    <td>
                      <span class="chip {{ getAgeChip(item.dueCategory) }}">
                        {{ getAgeLabel(item) }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-sm action-btn {{ getActionBtnClass(item.dueCategory) }}"
                              (click)="$event.stopPropagation(); onAction(item)">
                        {{ item.actionLabel }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- RIGHT: Charts + Feed -->
        <div class="grid-right">

          <!-- NCR Trend Chart -->
          <div class="q-card chart-card">
            <div class="card-header-row mb-3">
              <h2 class="card-title">NCR Trend</h2>
              <span class="chart-period">Last 12 Weeks</span>
            </div>
            <div class="ncr-chart-wrap">
              <svg viewBox="0 0 280 120" class="ncr-chart-svg">
                <!-- Y axis labels -->
                <text x="16" y="14" class="chart-label" text-anchor="end">15</text>
                <text x="16" y="44" class="chart-label" text-anchor="end">10</text>
                <text x="16" y="74" class="chart-label" text-anchor="end">5</text>
                <text x="16" y="104" class="chart-label" text-anchor="end">0</text>
                <!-- Grid lines -->
                <line x1="20" y1="12" x2="278" y2="12" stroke="#E2E8F0" stroke-width="1"/>
                <line x1="20" y1="42" x2="278" y2="42" stroke="#E2E8F0" stroke-width="1"/>
                <line x1="20" y1="72" x2="278" y2="72" stroke="#E2E8F0" stroke-width="1"/>
                <line x1="20" y1="102" x2="278" y2="102" stroke="#E2E8F0" stroke-width="1"/>
                <!-- Bars -->
                @for (d of mock.ncrTrendWeeks; track d.week; let i = $index) {
                  <rect
                    [attr.x]="22 + i * 21"
                    [attr.y]="102 - (d.count * 6)"
                    width="14"
                    [attr.height]="d.count * 6"
                    [attr.fill]="i === 11 ? '#2563EB' : '#93C5FD'"
                    rx="2"
                  />
                  <text [attr.x]="29 + i * 21" y="115" class="chart-week-label" text-anchor="middle">{{ d.week }}</text>
                }
              </svg>
            </div>
          </div>

          <!-- Upcoming Audits -->
          <div class="q-card audit-card">
            <div class="card-header-row mb-3">
              <h2 class="card-title">Upcoming Audits</h2>
              <a [routerLink]="['/audits']" class="see-all-link">See all</a>
            </div>
            <div class="audit-list">
              @for (audit of upcomingAudits(); track audit.id) {
                <div class="audit-item" role="button" (click)="router.navigate(['/audits', audit.id])" style="cursor:pointer">
                  <div class="audit-avatar-sm" [style.background]="audit.auditorColor">
                    {{ audit.auditorInitials }}
                  </div>
                  <div class="audit-info">
                    <div class="audit-title">{{ audit.title }}</div>
                    <div class="audit-meta">
                      <span class="record-id">{{ audit.id }}</span>
                      <span class="mx-1 text-muted">·</span>
                      <span>{{ audit.auditor }}</span>
                    </div>
                  </div>
                  <span class="chip chip-blue">{{ audit.scheduledDate | date:'MMM d' }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Activity Feed -->
          <div class="q-card feed-card">
            <div class="card-header-row mb-3">
              <h2 class="card-title">Activity Feed</h2>
            </div>
            <div class="feed-list">
              @for (item of mock.activityFeed; track item.id) {
                <div class="feed-item" role="button" (click)="navigateFeedItem(item)" style="cursor:pointer">
                  <div class="feed-avatar" [style.background]="item.actorColor">{{ item.actorInitials }}</div>
                  <div class="feed-body">
                    <span class="feed-actor">{{ item.actor }}</span>
                    <span class="feed-action"> {{ item.action }} </span>
                    <span class="feed-entity">{{ item.entityId }}</span>
                    <div class="feed-time">{{ item.timeAgo }}</div>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>
      </div>

      <!-- Toast message -->
      @if (toastMsg()) {
        <div class="action-toast">
          <i class="bi bi-check-circle-fill me-2"></i>{{ toastMsg() }}
        </div>
      }

    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1280px; margin: 0 auto; }

    /* Greeting */
    .greeting-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .greeting-text { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0 0 0.375rem; }
    .greeting-meta { display: flex; align-items: center; gap: 0.625rem; }
    .meta-date { font-size: 0.8125rem; color: #64748B; }

    /* KPIs */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .kpi-card {
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 1.125rem 1.25rem;
      cursor: pointer;
      transition: box-shadow 150ms ease, transform 150ms ease;
      &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-1px); }
    }
    .kpi-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 4px; }
    .kpi-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; }
    .kpi-value { font-size: 2rem; font-weight: 800; color: #0F172A; line-height: 1.1; margin-bottom: 0.5rem; }
    .kpi-sparkline { height: 36px; svg { width: 100%; height: 100%; display: block; } }

    /* KPI tooltip */
    .kpi-tip-wrap { position: relative; }
    .kpi-tip {
      display: none;
      position: absolute;
      top: calc(100% + 10px);
      left: 50%;
      transform: translateX(-50%);
      z-index: 300;
      background: #1E293B;
      color: #E2E8F0;
      border-radius: 10px;
      padding: 12px 14px;
      width: 230px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      pointer-events: none;
      &::after {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-bottom-color: #1E293B;
      }
    }
    .kpi-tip-wrap:hover .kpi-tip { display: block; }
    .kpi-tip-title { font-size: 0.8rem; font-weight: 700; color: #fff; margin-bottom: 6px; }
    .kpi-tip p { font-size: 0.78rem; line-height: 1.5; margin: 0 0 6px; color: #CBD5E1; }
    .kpi-tip p:last-child { margin-bottom: 0; }
    .kpi-tip-note { font-size: 0.73rem !important; color: #94A3B8 !important; font-style: italic; }

    /* Main grid */
    .main-grid { display: grid; grid-template-columns: 65% 35%; gap: 1.25rem; align-items: start; }
    @media (max-width: 1100px) { .main-grid { grid-template-columns: 1fr; } }
    @media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .kpi-row { grid-template-columns: 1fr; } }

    /* Cards */
    .attention-card, .chart-card, .audit-card, .feed-card {
      padding: 1.25rem;
      margin-bottom: 1.25rem;
    }
    .grid-right .q-card:last-child { margin-bottom: 0; }
    .card-header-row { display: flex; align-items: center; justify-content: space-between; }
    .card-title { font-size: 0.9375rem; font-weight: 700; color: #0F172A; margin: 0; }
    .chart-period, .see-all-link { font-size: 0.75rem; color: #94A3B8; }
    .see-all-link { color: #2563EB; text-decoration: none; &:hover { text-decoration: underline; } }

    /* Attention table */
    .attention-table { margin-bottom: 0; }
    .attention-row { cursor: pointer; }
    .type-icon-wrap i { font-size: 1rem; }
    .title-cell { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.8125rem; }
    .action-btn { font-size: 0.75rem; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
    .action-btn-red { background: #FEE2E2 !important; color: #DC2626 !important; border: none !important; }
    .action-btn-amber { background: #FEF3C7 !important; color: #B45309 !important; border: none !important; }
    .action-btn-blue { background: #DBEAFE !important; color: #2563EB !important; border: none !important; }

    /* NCR Chart */
    .ncr-chart-wrap { overflow: hidden; }
    .ncr-chart-svg { width: 100%; height: 130px; display: block; }
    .chart-label { font-size: 9px; fill: #94A3B8; font-family: 'Inter', sans-serif; }
    .chart-week-label { font-size: 8px; fill: #94A3B8; font-family: 'Inter', sans-serif; }

    /* Upcoming Audits */
    .audit-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .audit-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid #F1F5F9; &:last-child { border-bottom: none; padding-bottom: 0; } }
    .audit-avatar-sm { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; color: #fff; flex-shrink: 0; }
    .audit-info { flex: 1; min-width: 0; }
    .audit-title { font-size: 0.8125rem; font-weight: 500; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .audit-meta { font-size: 0.75rem; color: #94A3B8; margin-top: 1px; }

    /* Activity feed */
    .feed-list { display: flex; flex-direction: column; gap: 0.625rem; }
    .feed-item { display: flex; align-items: flex-start; gap: 0.625rem; }
    .feed-avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px; color: #fff; flex-shrink: 0; margin-top: 1px; }
    .feed-body { flex: 1; font-size: 0.8125rem; }
    .feed-actor { font-weight: 600; color: #0F172A; }
    .feed-action { color: #64748B; }
    .feed-entity { color: #2563EB; font-weight: 500; }
    .feed-time { font-size: 0.75rem; color: #94A3B8; margin-top: 1px; }

    /* LPA row */
    .lpa-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem; }
    @media (max-width: 900px) { .lpa-row { grid-template-columns: 1fr; } }
    .lpa-card { padding: 1.125rem 1.25rem; }
    .lpa-card-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.875rem; padding-bottom: 0.75rem; border-bottom: 1px solid #E2E8F0; }
    .lpa-icon-wrap { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; background: #EDE9FE; color: #7C3AED; }
    .lpa-icon-wrap.verify    { background: #CFFAFE; color: #0891B2; }
    .lpa-icon-wrap.completed { background: #DCFCE7; color: #16A34A; }
    .lpa-completed-card { padding: 1.125rem 1.25rem; margin-bottom: 1.25rem; }
    .lpa-completed-grid { display: flex; flex-direction: column; }
    .see-all-link { font-size: 0.75rem; color: #2563EB; text-decoration: none; &:hover { text-decoration: underline; } }
    .lpa-header-text { min-width: 0; }
    .lpa-title { font-size: 0.9rem; font-weight: 700; color: #0F172A; margin: 0 0 0.1rem; }
    .lpa-sub   { font-size: 0.72rem; color: #94A3B8; margin: 0; }
    .lpa-list  { display: flex; flex-direction: column; }
    .lpa-row-item {
      display: flex; align-items: center; gap: 0.625rem;
      min-height: 46px; padding: 0.5rem 0;
      border-bottom: 1px solid #F1F5F9; cursor: pointer;
      &:last-child { border-bottom: none; }
      &:hover { background: #F8FAFC; margin: 0 -0.5rem; padding-left: 0.5rem; padding-right: 0.5rem; border-radius: 6px; }
    }
    .lpa-item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .lpa-item-title { font-size: 0.8125rem; font-weight: 500; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .lpa-item-sub  { font-size: 0.72rem; color: #94A3B8; }
    .lpa-item-meta { font-size: 0.68rem; color: #94A3B8; margin-top: 1px; }
    .text-danger   { color: #DC2626 !important; }
    .layer-badge { width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; flex-shrink: 0; background: #DCFCE7; color: #16A34A; }
    .sup-avatar  { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
    .lpa-btn { border-radius: 6px; font-size: 0.72rem; white-space: nowrap; flex-shrink: 0; }
    .lpa-empty { padding: 1.25rem 0; font-size: 0.8125rem; color: #64748B; text-align: center; }

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

    /* Toast */
    .action-toast {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      background: #0F172A;
      color: #fff;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      z-index: 400;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
  `]
})
export class QmDashboardComponent {
  readonly mock    = inject(MockDataService);
  readonly router  = inject(Router);
  private auth     = inject(AuthStore);

  readonly today    = new Date();
  readonly fullName = this.auth.fullName;
  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  });
  readonly workItems = computed(() => {
    const userId = this.auth.currentUser()?.id;
    return this.mock.siteWorkItems().filter(w => w.ownerId === userId).slice(0, 8);
  });
  readonly toastMsg = signal('');

  readonly openNcrCount = computed(() =>
    this.mock.getOpenNcrsForSite(this.mock.siteStore.currentSiteId())
  );
  readonly capaOnTimePct = computed(() =>
    this.mock.getCAPAOnTimePctForSite(this.mock.siteStore.currentSiteId())
  );
  readonly lpaCompletionPct = computed(() =>
    this.mock.getLPACompletionPctForSite(this.mock.siteStore.currentSiteId())
  );
  readonly docsOverdueCount = computed(() =>
    this.mock.siteDocuments().filter(d => d.status !== 'Draft' && d.daysUntilReview < 14).length
  );
  readonly upcomingAudits = computed(() =>
    this.mock.siteAudits().filter(a => a.status === 'Planned').slice(0, 3)
  );

  readonly myLpaDue = computed(() =>
    this.mock.getLpaDueToday(this.auth.fullName())
  );

  readonly teamL2Completions = computed(() =>
    this.mock.getTeamL2Completions(this.auth.fullName())
  );

  readonly teamL2NotDoneCount = computed(() =>
    this.teamL2Completions().filter(item => item.run.status !== 'Completed').length
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

  getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      'Document Approval': 'bi-file-earmark-text',
      'NCR Disposition': 'bi-exclamation-triangle',
      'CAPA Review': 'bi-tools',
      'LPA Run': 'bi-clipboard-check',
      'Finding Response': 'bi-search',
    };
    return map[type] ?? 'bi-circle';
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      'Document Approval': '#2563EB',
      'NCR Disposition': '#DC2626',
      'CAPA Review': '#059669',
      'LPA Run': '#7C3AED',
      'Finding Response': '#B45309',
    };
    return map[type] ?? '#64748B';
  }

  getAgeChip(cat: string): string {
    return cat === 'overdue' ? 'chip-breached' : cat === 'today' ? 'chip-warning' : 'chip-within-sla';
  }

  getAgeLabel(item: WorkItem): string {
    if (item.dueCategory === 'overdue') return `${item.ageDays}d overdue`;
    if (item.dueCategory === 'today') return 'Due today';
    return 'This week';
  }

  getActionBtnClass(cat: string): string {
    return cat === 'overdue' ? 'action-btn-red' : cat === 'today' ? 'action-btn-amber' : 'action-btn-blue';
  }

  onAction(item: WorkItem): void {
    this.toastMsg.set(`${item.actionLabel} action initiated for ${item.entityId}`);
    setTimeout(() => this.toastMsg.set(''), 3000);
  }

  navigateFeedItem(item: ActivityFeedItem): void {
    const prefixMap: Record<string, string> = {
      'Document': '/documents',
      'NCR': '/ncrs',
      'CAPA': '/capas',
    };
    const prefix = prefixMap[item.entityType];
    if (prefix) {
      this.router.navigate([prefix, item.entityId]);
    } else if (item.entityType === 'LPA') {
      this.router.navigate(['/lpa']);
    }
  }
}
