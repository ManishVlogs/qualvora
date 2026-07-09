import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../../shared/services/mock-data.service';

@Component({
  selector: 'app-director-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">

      <div class="page-header">
        <div>
          <h1>Director Dashboard</h1>
          <p>Quality Director — Sarah Chen · All Sites</p>
        </div>
        <div class="ph-actions">
          <span class="chip chip-purple">SCR-010c</span>
          <a class="btn btn-sm btn-outline-primary" [routerLink]="['/lpa']">
            <i class="bi bi-layers-half me-1"></i>LPA Dashboard
          </a>
        </div>
      </div>

      <!-- KPI Row -->
      <div class="kpi-row">
        <div class="kpi-card kpi-danger">
          <div class="kpi-icon"><i class="bi bi-currency-dollar"></i></div>
          <div class="kpi-label">COPQ This Month</div>
          <div class="kpi-value">$34,200</div>
          <div class="kpi-delta chip chip-red">+12% vs prior month</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon"><i class="bi bi-graph-up-arrow"></i></div>
          <div class="kpi-label">CAPA On-Time by Site</div>
          <div class="kpi-value">{{ capaOnTimePct }}%</div>
          <div class="kpi-delta chip chip-amber">Plant-1 lagging</div>
        </div>
        <div class="kpi-card kpi-warning">
          <div class="kpi-icon"><i class="bi bi-person-exclamation"></i></div>
          <div class="kpi-label">Open Customer Complaints</div>
          <div class="kpi-value">{{ openComplaintsCount }}</div>
          <div class="kpi-delta chip chip-red">2 with CAPAs</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon"><i class="bi bi-clipboard2-check"></i></div>
          <div class="kpi-label">Audit Program Complete</div>
          <div class="kpi-value">{{ auditStats.completed }}/{{ auditStats.total }}</div>
          <div class="kpi-delta chip chip-amber">{{ auditStats.completed }} completed</div>
        </div>
      </div>

      <div class="main-grid">

        <!-- Site Comparison Table -->
        <div class="q-card comparison-card">
          <div class="card-header-row mb-3">
            <h2 class="card-title">Site Quality Comparison</h2>
            <span class="chip chip-blue">3 Sites</span>
          </div>
          <table class="q-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Open NCRs</th>
                <th>CAPA On-Time</th>
                <th>LPA Completion</th>
                <th>Audit Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (site of siteData; track site.name) {
                <tr>
                  <td><strong>{{ site.name }}</strong><br><small class="text-muted">{{ site.location }}</small></td>
                  <td>
                    <span class="chip {{ site.openNcrs > 8 ? 'chip-red' : site.openNcrs > 4 ? 'chip-amber' : 'chip-green' }}">
                      {{ site.openNcrs }}
                    </span>
                  </td>
                  <td>
                    <div class="progress-row">
                      <div class="mini-progress">
                        <div class="mini-progress-bar {{ site.capaOnTime >= 80 ? 'bar-green' : site.capaOnTime >= 70 ? 'bar-amber' : 'bar-red' }}"
                             [style.width.%]="site.capaOnTime"></div>
                      </div>
                      <span class="progress-pct">{{ site.capaOnTime }}%</span>
                    </div>
                  </td>
                  <td>
                    <div class="progress-row">
                      <div class="mini-progress">
                        <div class="mini-progress-bar bar-blue" [style.width.%]="site.lpaCompletion"></div>
                      </div>
                      <span class="progress-pct">{{ site.lpaCompletion }}%</span>
                    </div>
                  </td>
                  <td><strong>{{ site.auditScore }}</strong>/100</td>
                  <td>
                    <span class="chip {{ site.status === 'On Track' ? 'chip-green' : site.status === 'At Risk' ? 'chip-amber' : 'chip-red' }}">
                      {{ site.status }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="right-col">

          <!-- Complaint Trend Chart -->
          <div class="q-card chart-card">
            <div class="card-header-row mb-3">
              <h2 class="card-title">Customer Complaint Trend</h2>
              <span class="chart-period">Last 8 Months</span>
            </div>
            <svg viewBox="0 0 240 100" class="trend-svg">
              <!-- Grid -->
              <line x1="0" y1="80" x2="240" y2="80" stroke="#E2E8F0" stroke-width="1"/>
              <line x1="0" y1="50" x2="240" y2="50" stroke="#E2E8F0" stroke-width="1"/>
              <line x1="0" y1="20" x2="240" y2="20" stroke="#E2E8F0" stroke-width="1"/>
              <!-- Area fill -->
              <path d="M10,72 L40,60 L70,65 L100,48 L130,55 L160,40 L190,50 L220,44 L220,80 L10,80 Z"
                    fill="#DBEAFE" opacity="0.6"/>
              <!-- Line -->
              <polyline points="10,72 40,60 70,65 100,48 130,55 160,40 190,50 220,44"
                        fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- Dots -->
              @for (pt of complaintTrend; track pt.month) {
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5" fill="#2563EB"/>
              }
              <!-- X labels -->
              @for (pt of complaintTrend; track pt.month) {
                <text [attr.x]="pt.x" y="95" text-anchor="middle" class="chart-label-sm">{{ pt.month }}</text>
              }
            </svg>
          </div>

          <!-- Escalations Feed -->
          <div class="q-card escalations-card">
            <div class="card-header-row mb-3">
              <h2 class="card-title">Escalations</h2>
              <span class="badge" style="background:#FEE2E2;color:#DC2626;font-size:11px;padding:3px 8px;border-radius:12px;font-weight:600;">{{ escalations.length }} Active</span>
            </div>
            <div class="escalation-list">
              @for (e of escalations; track e.id) {
                <div class="escalation-item" [routerLink]="e.route">
                  <div class="esc-icon">
                    <i class="bi bi-exclamation-circle-fill" [style.color]="e.color"></i>
                  </div>
                  <div class="esc-info">
                    <div class="esc-title">{{ e.title }}</div>
                    <div class="esc-meta">
                      <span class="record-id">{{ e.id }}</span>
                      <span class="mx-1 text-muted">·</span>
                      <span>{{ e.site }}</span>
                      <span class="mx-1 text-muted">·</span>
                      <span>{{ e.ageText }}</span>
                    </div>
                  </div>
                  <span class="chip {{ e.severity === 'Major' ? 'chip-major' : 'chip-minor' }}">
                    {{ e.severity }}
                  </span>
                </div>
              }
            </div>
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
    .ph-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
    @media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
    .kpi-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 1.125rem 1.25rem; }
    .kpi-icon { font-size: 1.25rem; color: #94A3B8; margin-bottom: 0.375rem; }
    .kpi-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; margin-bottom: 0.375rem; }
    .kpi-value { font-size: 1.75rem; font-weight: 800; color: #0F172A; margin-bottom: 0.5rem; }

    .main-grid { display: grid; grid-template-columns: 1fr 360px; gap: 1.25rem; align-items: start; }
    @media (max-width: 1100px) { .main-grid { grid-template-columns: 1fr; } }
    .comparison-card { padding: 1.25rem; }
    .right-col { display: flex; flex-direction: column; gap: 1.25rem; }
    .chart-card, .escalations-card { padding: 1.25rem; }
    .card-header-row { display: flex; align-items: center; justify-content: space-between; }
    .card-title { font-size: 0.9375rem; font-weight: 700; color: #0F172A; margin: 0; }
    .chart-period { font-size: 0.75rem; color: #94A3B8; }

    .progress-row { display: flex; align-items: center; gap: 0.5rem; }
    .mini-progress { flex: 1; height: 6px; background: #F1F5F9; border-radius: 3px; overflow: hidden; }
    .mini-progress-bar { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
    .bar-green { background: #16A34A; }
    .bar-amber { background: #F59E0B; }
    .bar-red { background: #DC2626; }
    .bar-blue { background: #2563EB; }
    .progress-pct { font-size: 0.75rem; font-weight: 600; color: #334155; white-space: nowrap; }

    .trend-svg { width: 100%; height: 100px; display: block; }
    .chart-label-sm { font-size: 8px; fill: #94A3B8; font-family: 'Inter', sans-serif; }

    .escalation-list { display: flex; flex-direction: column; gap: 0; }
    .escalation-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid #F1F5F9; cursor: pointer; &:last-child { border-bottom: none; } &:hover { background: #F8FAFC; margin: 0 -0.25rem; padding-left: 0.25rem; padding-right: 0.25rem; } }
    .esc-icon { font-size: 1.25rem; flex-shrink: 0; }
    .esc-info { flex: 1; min-width: 0; }
    .esc-title { font-size: 0.8125rem; font-weight: 500; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .esc-meta { font-size: 0.75rem; color: #94A3B8; margin-top: 1px; }
  `]
})
export class DirectorDashboardComponent {
  readonly mock = inject(MockDataService);

  readonly capaOnTimePct = this.mock.getCAPAOnTimePct();
  readonly openComplaintsCount = this.mock.getOpenComplaintsCount();
  readonly auditStats = this.mock.getAuditCompletionStats();
  readonly siteData = this.mock.getSiteData();
  readonly escalations = this.mock.getEscalations();

  readonly complaintTrend = [
    { month: 'Nov', x: 10, y: 72 }, { month: 'Dec', x: 40, y: 60 }, { month: 'Jan', x: 70, y: 65 },
    { month: 'Feb', x: 100, y: 48 }, { month: 'Mar', x: 130, y: 55 }, { month: 'Apr', x: 160, y: 40 },
    { month: 'May', x: 190, y: 50 }, { month: 'Jun', x: 220, y: 44 },
  ];
}

//test comment
//test comment 2 UAT1
//test 3 