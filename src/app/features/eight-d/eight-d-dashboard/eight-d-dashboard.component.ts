import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { EightDMockService } from '../../../shared/services/eight-d-mock.service';
import { EightDActivity } from '../../../shared/interfaces/eight-d.models';

@Component({
  selector: 'app-eight-d-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
<div class="page-wrapper">

  <!-- ── Page Header ──────────────────────────────────────────────────── -->
  <div class="page-header">
    <div>
      <h1 class="page-title">8D Problem Resolution</h1>
      <p class="page-sub">IATF 16949 §10.2 — Corrective Action Management · {{ today | date:'EEEE, MMMM d, y' }}</p>
    </div>
    <div class="header-actions">
      <button class="btn btn-outline-secondary btn-sm me-2" (click)="router.navigate(['/quality/8d/list'])">
        <i class="bi bi-list-ul me-1"></i> 8D Register
      </button>
      <button class="btn btn-primary btn-sm" (click)="router.navigate(['/quality/8d/new'])">
        <i class="bi bi-plus-lg me-1"></i> New 8D Report
      </button>
    </div>
  </div>

  <!-- ── KPI Cards ─────────────────────────────────────────────────────── -->
  <div class="kpi-row">

    <div class="kpi-card">
      <div class="kpi-icon-wrap kpi-blue">
        <i class="bi bi-folder2-open"></i>
      </div>
      <div class="kpi-body">
        <span class="kpi-label">Open 8D</span>
        <span class="kpi-value">{{ openCount() }}</span>
        <span class="kpi-sub">Active reports</span>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon-wrap kpi-red">
        <i class="bi bi-exclamation-circle"></i>
      </div>
      <div class="kpi-body">
        <span class="kpi-label">Overdue</span>
        <span class="kpi-value kpi-val-red">{{ overdueCount() }}</span>
        <span class="kpi-sub">Past due date</span>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon-wrap kpi-green">
        <i class="bi bi-check-circle"></i>
      </div>
      <div class="kpi-body">
        <span class="kpi-label">Closed This Month</span>
        <span class="kpi-value kpi-val-green">{{ closedThisMonthCount() }}</span>
        <span class="kpi-sub">June 2026</span>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon-wrap kpi-amber">
        <i class="bi bi-clock"></i>
      </div>
      <div class="kpi-body">
        <span class="kpi-label">Effectiveness Pending</span>
        <span class="kpi-value kpi-val-amber">{{ effectivenessPendingCount() }}</span>
        <span class="kpi-sub">Awaiting verification</span>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon-wrap kpi-orange">
        <i class="bi bi-person-exclamation"></i>
      </div>
      <div class="kpi-body">
        <span class="kpi-label">Customer Escalations</span>
        <span class="kpi-value kpi-val-orange">{{ customerEscalationsCount() }}</span>
        <span class="kpi-sub">Customer-facing open</span>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon-wrap kpi-teal">
        <i class="bi bi-truck"></i>
      </div>
      <div class="kpi-body">
        <span class="kpi-label">Supplier 8D</span>
        <span class="kpi-value kpi-val-teal">{{ supplierCount() }}</span>
        <span class="kpi-sub">Supplier-facing</span>
      </div>
    </div>

  </div>

  <!-- ── Charts Row 1 ───────────────────────────────────────────────────── -->
  <div class="charts-row">

    <!-- Open vs Closed Trend -->
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Open vs Closed — 6 Month Trend</span>
        <span class="chart-sub">Jan – Jun 2026</span>
      </div>
      <div class="chart-legend-row">
        <span class="legend-dot" style="background:#2563EB"></span><span class="legend-lbl">Open</span>
        <span class="legend-dot" style="background:#10B981;margin-left:12px"></span><span class="legend-lbl">Closed</span>
      </div>
      <svg viewBox="0 0 480 200" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
        <!-- Y gridlines -->
        <line x1="48" y1="20" x2="460" y2="20" stroke="#E2E8F0" stroke-width="1"/>
        <line x1="48" y1="60" x2="460" y2="60" stroke="#E2E8F0" stroke-width="1"/>
        <line x1="48" y1="100" x2="460" y2="100" stroke="#E2E8F0" stroke-width="1"/>
        <line x1="48" y1="140" x2="460" y2="140" stroke="#E2E8F0" stroke-width="1"/>
        <line x1="48" y1="160" x2="460" y2="160" stroke="#CBD5E1" stroke-width="1"/>
        <!-- Y axis labels -->
        <text x="40" y="164" text-anchor="end" font-size="11" fill="#64748B">0</text>
        <text x="40" y="144" text-anchor="end" font-size="11" fill="#64748B">1</text>
        <text x="40" y="104" text-anchor="end" font-size="11" fill="#64748B">3</text>
        <text x="40" y="64" text-anchor="end" font-size="11" fill="#64748B">5</text>
        <text x="40" y="24" text-anchor="end" font-size="11" fill="#64748B">7</text>
        <!-- Jan: open=2, closed=1 -->
        <rect x="58" y="120" width="18" height="40" rx="2" fill="#2563EB"/>
        <rect x="78" y="140" width="18" height="20" rx="2" fill="#10B981"/>
        <!-- Feb: open=3, closed=2 -->
        <rect x="128" y="100" width="18" height="60" rx="2" fill="#2563EB"/>
        <rect x="148" y="120" width="18" height="40" rx="2" fill="#10B981"/>
        <!-- Mar: open=4, closed=3 -->
        <rect x="198" y="80" width="18" height="80" rx="2" fill="#2563EB"/>
        <rect x="218" y="100" width="18" height="60" rx="2" fill="#10B981"/>
        <!-- Apr: open=5, closed=2 -->
        <rect x="268" y="60" width="18" height="100" rx="2" fill="#2563EB"/>
        <rect x="288" y="120" width="18" height="40" rx="2" fill="#10B981"/>
        <!-- May: open=6, closed=3 -->
        <rect x="338" y="40" width="18" height="120" rx="2" fill="#2563EB"/>
        <rect x="358" y="100" width="18" height="60" rx="2" fill="#10B981"/>
        <!-- Jun: open=4, closed=2 -->
        <rect x="408" y="80" width="18" height="80" rx="2" fill="#2563EB"/>
        <rect x="428" y="120" width="18" height="40" rx="2" fill="#10B981"/>
        <!-- X axis labels -->
        <text x="76" y="178" text-anchor="middle" font-size="11" fill="#64748B">Jan</text>
        <text x="146" y="178" text-anchor="middle" font-size="11" fill="#64748B">Feb</text>
        <text x="216" y="178" text-anchor="middle" font-size="11" fill="#64748B">Mar</text>
        <text x="286" y="178" text-anchor="middle" font-size="11" fill="#64748B">Apr</text>
        <text x="356" y="178" text-anchor="middle" font-size="11" fill="#64748B">May</text>
        <text x="426" y="178" text-anchor="middle" font-size="11" fill="#64748B">Jun</text>
      </svg>
    </div>

    <!-- Root Cause Categories -->
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Root Cause Categories</span>
        <span class="chart-sub">All time</span>
      </div>
      <svg viewBox="0 0 440 210" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
        <!-- Equipment Failure: 3 -->
        <text x="10" y="42" font-size="11" fill="#64748B">Equipment Failure</text>
        <rect x="160" y="28" width="192" height="18" rx="3" fill="#2563EB"/>
        <text x="357" y="42" font-size="11" fill="#0F172A" font-weight="600">3</text>
        <!-- Process Failure: 2 -->
        <text x="10" y="80" font-size="11" fill="#64748B">Process Failure</text>
        <rect x="160" y="66" width="128" height="18" rx="3" fill="#2563EB"/>
        <text x="293" y="80" font-size="11" fill="#0F172A" font-weight="600">2</text>
        <!-- Human Error: 1 -->
        <text x="10" y="118" font-size="11" fill="#64748B">Human Error</text>
        <rect x="160" y="104" width="64" height="18" rx="3" fill="#2563EB"/>
        <text x="229" y="118" font-size="11" fill="#0F172A" font-weight="600">1</text>
        <!-- Training Gap: 1 -->
        <text x="10" y="156" font-size="11" fill="#64748B">Training Gap</text>
        <rect x="160" y="142" width="64" height="18" rx="3" fill="#2563EB"/>
        <text x="229" y="156" font-size="11" fill="#0F172A" font-weight="600">1</text>
        <!-- Documentation Gap: 1 -->
        <text x="10" y="194" font-size="11" fill="#64748B">Documentation Gap</text>
        <rect x="160" y="180" width="64" height="18" rx="3" fill="#2563EB"/>
        <text x="229" y="194" font-size="11" fill="#0F172A" font-weight="600">1</text>
      </svg>
    </div>

  </div>

  <!-- ── Charts Row 2 ───────────────────────────────────────────────────── -->
  <div class="charts-row">

    <!-- 8D Aging Analysis -->
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">8D Aging Analysis</span>
        <span class="chart-sub">By severity band</span>
      </div>
      <div class="chart-legend-row">
        <span class="legend-dot" style="background:#DC2626"></span><span class="legend-lbl">Critical</span>
        <span class="legend-dot" style="background:#F59E0B;margin-left:12px"></span><span class="legend-lbl">Major</span>
        <span class="legend-dot" style="background:#2563EB;margin-left:12px"></span><span class="legend-lbl">Minor</span>
      </div>
      <svg viewBox="0 0 480 200" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
        <!-- Y gridlines -->
        <line x1="48" y1="20" x2="460" y2="20" stroke="#E2E8F0" stroke-width="1"/>
        <line x1="48" y1="73" x2="460" y2="73" stroke="#E2E8F0" stroke-width="1"/>
        <line x1="48" y1="126" x2="460" y2="126" stroke="#E2E8F0" stroke-width="1"/>
        <line x1="48" y1="160" x2="460" y2="160" stroke="#CBD5E1" stroke-width="1"/>
        <text x="40" y="164" text-anchor="end" font-size="11" fill="#64748B">0</text>
        <text x="40" y="130" text-anchor="end" font-size="11" fill="#64748B">1</text>
        <text x="40" y="77" text-anchor="end" font-size="11" fill="#64748B">2</text>
        <text x="40" y="24" text-anchor="end" font-size="11" fill="#64748B">3</text>
        <!-- 0-14d: Crit=1, Maj=1, Min=1 -->
        <rect x="58" y="107" width="18" height="53" rx="2" fill="#DC2626"/>
        <rect x="78" y="107" width="18" height="53" rx="2" fill="#F59E0B"/>
        <rect x="98" y="107" width="18" height="53" rx="2" fill="#2563EB"/>
        <!-- 15-30d: Crit=1, Maj=2, Min=0 -->
        <rect x="188" y="107" width="18" height="53" rx="2" fill="#DC2626"/>
        <rect x="208" y="54" width="18" height="106" rx="2" fill="#F59E0B"/>
        <!-- 31-60d: Crit=1, Maj=1, Min=0 -->
        <rect x="318" y="107" width="18" height="53" rx="2" fill="#DC2626"/>
        <rect x="338" y="107" width="18" height="53" rx="2" fill="#F59E0B"/>
        <!-- 60+d: Crit=1, Maj=0, Min=1 -->
        <rect x="398" y="107" width="18" height="53" rx="2" fill="#DC2626"/>
        <rect x="418" y="107" width="18" height="53" rx="2" fill="#2563EB"/>
        <!-- X labels -->
        <text x="88" y="178" text-anchor="middle" font-size="11" fill="#64748B">0–14d</text>
        <text x="208" y="178" text-anchor="middle" font-size="11" fill="#64748B">15–30d</text>
        <text x="338" y="178" text-anchor="middle" font-size="11" fill="#64748B">31–60d</text>
        <text x="418" y="178" text-anchor="middle" font-size="11" fill="#64748B">60+d</text>
      </svg>
    </div>

    <!-- Top Defect Categories Donut -->
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Top Defect Categories</span>
        <span class="chart-sub">Percentage of open 8D reports</span>
      </div>
      <div class="donut-wrap">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="donut-svg">
          <!-- Donut segments: total=100%, r=70, cx=100,cy=100, circumference=439.82 -->
          <!-- Dimensional 28% = 123.15 offset=0 -->
          <circle cx="100" cy="100" r="70" fill="none" stroke="#2563EB" stroke-width="32"
            stroke-dasharray="123.15 316.67" stroke-dashoffset="0" transform="rotate(-90 100 100)"/>
          <!-- Weld Quality 22% = 96.76 offset=-123.15 -->
          <circle cx="100" cy="100" r="70" fill="none" stroke="#7C3AED" stroke-width="32"
            stroke-dasharray="96.76 343.06" stroke-dashoffset="-123.15" transform="rotate(-90 100 100)"/>
          <!-- Assembly Error 18% = 79.17 offset=-219.91 -->
          <circle cx="100" cy="100" r="70" fill="none" stroke="#0891B2" stroke-width="32"
            stroke-dasharray="79.17 360.65" stroke-dashoffset="-219.91" transform="rotate(-90 100 100)"/>
          <!-- Calibration 14% = 61.57 offset=-299.08 -->
          <circle cx="100" cy="100" r="70" fill="none" stroke="#059669" stroke-width="32"
            stroke-dasharray="61.57 378.25" stroke-dashoffset="-299.08" transform="rotate(-90 100 100)"/>
          <!-- Documentation 12% = 52.78 offset=-360.65 -->
          <circle cx="100" cy="100" r="70" fill="none" stroke="#F59E0B" stroke-width="32"
            stroke-dasharray="52.78 387.04" stroke-dashoffset="-360.65" transform="rotate(-90 100 100)"/>
          <!-- Other 6% = 26.39 offset=-413.43 -->
          <circle cx="100" cy="100" r="70" fill="none" stroke="#94A3B8" stroke-width="32"
            stroke-dasharray="26.39 413.43" stroke-dashoffset="-413.43" transform="rotate(-90 100 100)"/>
          <text x="100" y="96" text-anchor="middle" font-size="22" font-weight="700" fill="#0F172A">8</text>
          <text x="100" y="114" text-anchor="middle" font-size="11" fill="#64748B">categories</text>
        </svg>
        <div class="donut-legend">
          <div class="dl-item"><span class="dl-dot" style="background:#2563EB"></span><span class="dl-lbl">Dimensional</span><span class="dl-pct">28%</span></div>
          <div class="dl-item"><span class="dl-dot" style="background:#7C3AED"></span><span class="dl-lbl">Weld Quality</span><span class="dl-pct">22%</span></div>
          <div class="dl-item"><span class="dl-dot" style="background:#0891B2"></span><span class="dl-lbl">Assembly Error</span><span class="dl-pct">18%</span></div>
          <div class="dl-item"><span class="dl-dot" style="background:#059669"></span><span class="dl-lbl">Calibration</span><span class="dl-pct">14%</span></div>
          <div class="dl-item"><span class="dl-dot" style="background:#F59E0B"></span><span class="dl-lbl">Documentation</span><span class="dl-pct">12%</span></div>
          <div class="dl-item"><span class="dl-dot" style="background:#94A3B8"></span><span class="dl-lbl">Other</span><span class="dl-pct">6%</span></div>
        </div>
      </div>
    </div>

  </div>

  <!-- ── Three-Panel Row ────────────────────────────────────────────────── -->
  <div class="panels-row">

    <!-- Recent Activity -->
    <div class="panel-card">
      <div class="panel-header">
        <span class="panel-title">Recent Activity</span>
        <span class="panel-sub">Latest across all 8D reports</span>
      </div>
      <div class="activity-list">
        @for (item of recentActivity(); track item.id) {
          <div class="activity-item">
            <span class="av-dot" [style.background]="item.actorColor">{{ item.actorInitials }}</span>
            <div class="av-body">
              <span class="av-action">{{ item.action }}</span>
              <span class="av-sub">{{ item.actor }} · {{ item.timeAgo }}</span>
              @if (item.detail) {
                <span class="av-detail">{{ item.detail }}</span>
              }
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Overdue Actions -->
    <div class="panel-card">
      <div class="panel-header">
        <span class="panel-title">Overdue Reports</span>
        <span class="panel-badge-red">{{ overdueRecords().length }}</span>
      </div>
      @if (overdueRecords().length === 0) {
        <div class="empty-panel">
          <i class="bi bi-check2-circle" style="font-size:28px;color:#10B981"></i>
          <p>No overdue reports</p>
        </div>
      }
      @for (r of overdueRecords(); track r.id) {
        <div class="overdue-item" (click)="router.navigate(['/quality/8d', r.id])">
          <span class="record-id-sm">{{ r.id }}</span>
          <div class="overdue-body">
            <span class="overdue-title">{{ r.title.slice(0, 55) }}...</span>
            <span class="overdue-meta">Due {{ r.dueDate }} · {{ r.activeStep }}</span>
          </div>
          <span class="avatar-xs" [style.background]="r.ownerColor">{{ r.ownerInitials }}</span>
        </div>
      }
    </div>

    <!-- Customer Escalations -->
    <div class="panel-card">
      <div class="panel-header">
        <span class="panel-title">Customer Escalations</span>
        <span class="panel-badge-orange">{{ customerEscalations().length }}</span>
      </div>
      @if (customerEscalations().length === 0) {
        <div class="empty-panel">
          <i class="bi bi-check2-circle" style="font-size:28px;color:#10B981"></i>
          <p>No active customer escalations</p>
        </div>
      }
      @for (r of customerEscalations(); track r.id) {
        <div class="esc-item" (click)="router.navigate(['/quality/8d', r.id])">
          <div class="esc-left">
            <span class="sev-badge sev-{{ r.severity.toLowerCase() }}">{{ r.severity }}</span>
            <div class="esc-body">
              <span class="esc-customer">{{ r.customer }}</span>
              <span class="esc-title">{{ r.title.slice(0, 50) }}...</span>
            </div>
          </div>
          <div class="esc-right">
            <span class="days-open">{{ r.daysOpen }}d</span>
            <button class="btn-view" (click)="router.navigate(['/quality/8d', r.id]); $event.stopPropagation()">View</button>
          </div>
        </div>
      }
    </div>

  </div>

</div>
  `,
  styles: [`
    .page-wrapper {
      background: #F8FAFC;
      min-height: 100vh;
      padding: 24px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .page-title {
      font-size: 22px;
      font-weight: 700;
      color: #0F172A;
      margin: 0 0 4px;
      letter-spacing: -0.3px;
    }
    .page-sub {
      font-size: 13px;
      color: #64748B;
      margin: 0;
    }
    .header-actions {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    /* ── KPI Cards ── */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 14px;
      margin-bottom: 20px;
    }
    @media (max-width: 1200px) {
      .kpi-row { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 700px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
    }
    .kpi-card {
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .kpi-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .kpi-blue  { background: #DBEAFE; color: #2563EB; }
    .kpi-red   { background: #FEE2E2; color: #DC2626; }
    .kpi-green { background: #D1FAE5; color: #059669; }
    .kpi-amber { background: #FEF3C7; color: #B45309; }
    .kpi-orange{ background: #FFEDD5; color: #EA580C; }
    .kpi-teal  { background: #CCFBF1; color: #0F766E; }
    .kpi-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .kpi-label { font-size: 11px; font-weight: 500; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-value { font-size: 26px; font-weight: 700; color: #0F172A; line-height: 1.1; }
    .kpi-sub   { font-size: 11px; color: #94A3B8; }
    .kpi-val-red    { color: #DC2626; }
    .kpi-val-green  { color: #059669; }
    .kpi-val-amber  { color: #B45309; }
    .kpi-val-orange { color: #EA580C; }
    .kpi-val-teal   { color: #0F766E; }

    /* ── Charts ── */
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    @media (max-width: 900px) {
      .charts-row { grid-template-columns: 1fr; }
    }
    .chart-card {
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .chart-header {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 8px;
    }
    .chart-title {
      font-size: 14px;
      font-weight: 600;
      color: #0F172A;
    }
    .chart-sub {
      font-size: 12px;
      color: #94A3B8;
    }
    .chart-legend-row {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .legend-lbl {
      font-size: 12px;
      color: #64748B;
    }
    .chart-svg {
      width: 100%;
      height: auto;
    }

    /* Donut */
    .donut-wrap {
      display: flex;
      align-items: center;
      gap: 20px;
      padding-top: 8px;
    }
    .donut-svg {
      width: 160px;
      height: 160px;
      flex-shrink: 0;
    }
    .donut-legend {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dl-item {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .dl-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dl-lbl {
      font-size: 12px;
      color: #475569;
      flex: 1;
    }
    .dl-pct {
      font-size: 12px;
      font-weight: 600;
      color: #0F172A;
    }

    /* ── Panels Row ── */
    .panels-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 1000px) {
      .panels-row { grid-template-columns: 1fr; }
    }
    .panel-card {
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      overflow: hidden;
    }
    .panel-header {
      padding: 16px 16px 12px;
      border-bottom: 1px solid #F1F5F9;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .panel-title {
      font-size: 14px;
      font-weight: 600;
      color: #0F172A;
    }
    .panel-sub {
      font-size: 12px;
      color: #94A3B8;
    }
    .panel-badge-red {
      background: #FEE2E2;
      color: #DC2626;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .panel-badge-orange {
      background: #FFEDD5;
      color: #EA580C;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
    }

    /* Activity */
    .activity-list {
      padding: 8px 0;
    }
    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 16px;
      border-bottom: 1px solid #F8FAFC;
      cursor: default;
    }
    .activity-item:last-child { border-bottom: none; }
    .av-dot {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    .av-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .av-action {
      font-size: 13px;
      font-weight: 600;
      color: #0F172A;
    }
    .av-sub {
      font-size: 11px;
      color: #94A3B8;
    }
    .av-detail {
      font-size: 12px;
      color: #64748B;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 260px;
    }

    /* Overdue */
    .overdue-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-bottom: 1px solid #F8FAFC;
      cursor: pointer;
      transition: background 0.15s;
    }
    .overdue-item:last-child { border-bottom: none; }
    .overdue-item:hover { background: #FFF7ED; }
    .record-id-sm {
      font-size: 11px;
      font-weight: 700;
      color: #2563EB;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      white-space: nowrap;
    }
    .overdue-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .overdue-title {
      font-size: 12px;
      color: #0F172A;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .overdue-meta {
      font-size: 11px;
      color: #DC2626;
      font-weight: 500;
    }
    .avatar-xs {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }

    /* Escalations */
    .esc-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid #F8FAFC;
      cursor: pointer;
      transition: background 0.15s;
    }
    .esc-item:last-child { border-bottom: none; }
    .esc-item:hover { background: #FFF7ED; }
    .esc-left {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      min-width: 0;
    }
    .sev-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .sev-critical { background: #FEE2E2; color: #991B1B; }
    .sev-major    { background: #FEF3C7; color: #92400E; }
    .sev-minor    { background: #DBEAFE; color: #1D4ED8; }
    .esc-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .esc-customer {
      font-size: 11px;
      font-weight: 700;
      color: #0F172A;
    }
    .esc-title {
      font-size: 11px;
      color: #64748B;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }
    .esc-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
    }
    .days-open {
      font-size: 13px;
      font-weight: 700;
      color: #DC2626;
    }
    .btn-view {
      font-size: 11px;
      font-weight: 600;
      color: #2563EB;
      background: #EFF6FF;
      border: none;
      border-radius: 5px;
      padding: 2px 8px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-view:hover { background: #DBEAFE; }

    /* Empty state */
    .empty-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      color: #94A3B8;
      gap: 8px;
    }
    .empty-panel p {
      margin: 0;
      font-size: 13px;
    }

    /* Buttons */
    .btn-primary {
      background: #2563EB;
      border-color: #2563EB;
      color: #fff;
    }
    .btn-primary:hover { background: #1D4ED8; border-color: #1D4ED8; color: #fff; }
  `]
})
export class EightDDashboardComponent {
  readonly router = inject(Router);
  readonly svc = inject(EightDMockService);
  readonly today = new Date();

  // ── KPI computed signals ───────────────────────────────────────────────
  readonly openCount = computed(() =>
    this.svc.records().filter(r =>
      r.status === 'Open' || r.status === 'Draft' || r.status === 'Pending Closure'
    ).length
  );

  readonly overdueCount = computed(() =>
    this.svc.records().filter(r => r.onTimeStatus === 'overdue').length
  );

  readonly closedThisMonthCount = computed(() =>
    this.svc.records().filter(r =>
      r.status === 'Closed' && r.closedAt && r.closedAt.includes('2026-06')
    ).length
  );

  readonly effectivenessPendingCount = computed(() =>
    this.svc.records().filter(r => r.effectivenessPending === true).length
  );

  readonly customerEscalationsCount = computed(() =>
    this.svc.records().filter(r => r.isCustomerFacing && r.status !== 'Closed').length
  );

  readonly supplierCount = computed(() =>
    this.svc.records().filter(r => r.isSupplierFacing).length
  );

  // ── Panel computed signals ─────────────────────────────────────────────
  readonly recentActivity = computed((): EightDActivity[] => {
    const all: EightDActivity[] = [];
    for (const record of this.svc.records()) {
      if (record.activity) {
        all.push(...record.activity);
      }
    }
    return all
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  });

  readonly overdueRecords = computed(() =>
    this.svc.records().filter(r => r.onTimeStatus === 'overdue')
  );

  readonly customerEscalations = computed(() =>
    this.svc.records().filter(r => r.isCustomerFacing && r.status !== 'Closed')
  );
}
