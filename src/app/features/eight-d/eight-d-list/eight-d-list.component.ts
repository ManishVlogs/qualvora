import { Component, inject, computed, signal, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EightDMockService } from '../../../shared/services/eight-d-mock.service';
import { EightDStatus, EightDSeverity } from '../../../shared/interfaces/eight-d.models';

@Pipe({ name: 'statusClass', standalone: true })
export class StatusClassPipe implements PipeTransform {
  transform(status: string): string {
    if (status === 'Pending Closure') return 'pending';
    return status.toLowerCase();
  }
}

@Component({
  selector: 'app-eight-d-list',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusClassPipe],
  template: `
<div class="page-wrapper">

  <!-- ── Header ──────────────────────────────────────────────────────── -->
  <div class="page-header">
    <div>
      <h1 class="page-title">8D Register</h1>
      <p class="page-sub">IATF 16949 §10.2 — All Problem Resolution Reports · {{ svc.records().length }} total records</p>
    </div>
    <div class="header-actions">
      <button class="btn-outline" (click)="router.navigate(['/quality/8d'])">
        <i class="bi bi-speedometer2"></i> Dashboard
      </button>
      <button class="btn-primary" (click)="router.navigate(['/quality/8d/new'])">
        <i class="bi bi-plus-lg"></i> New 8D Report
      </button>
    </div>
  </div>

  <!-- ── Filter Bar ───────────────────────────────────────────────────── -->
  <div class="filter-bar">
    <div class="search-wrap">
      <i class="bi bi-search search-icon"></i>
      <input class="search-input" placeholder="Search by ID, title, customer, part number…"
             [(ngModel)]="searchTermVal" (ngModelChange)="searchTerm.set($event)" />
    </div>
    <div class="filter-chips">
      <select class="filter-select" [(ngModel)]="statusFilterVal" (ngModelChange)="statusFilter.set($event)">
        <option value="">All Statuses</option>
        <option value="Draft">Draft</option>
        <option value="Open">Open</option>
        <option value="Pending Closure">Pending Closure</option>
        <option value="Closed">Closed</option>
        <option value="Cancelled">Cancelled</option>
      </select>
      <select class="filter-select" [(ngModel)]="severityFilterVal" (ngModelChange)="severityFilter.set($event)">
        <option value="">All Severities</option>
        <option value="Critical">Critical</option>
        <option value="Major">Major</option>
        <option value="Minor">Minor</option>
      </select>
      <select class="filter-select" [(ngModel)]="sourceFilterVal" (ngModelChange)="sourceFilter.set($event)">
        <option value="">All Sources</option>
        <option value="Customer Complaint">Customer Complaint</option>
        <option value="Internal NCR">Internal NCR</option>
        <option value="Supplier NCR">Supplier NCR</option>
        <option value="Audit Finding">Audit Finding</option>
        <option value="Warranty Claim">Warranty Claim</option>
      </select>
    </div>
    <span class="result-count">{{ filtered().length }} record{{ filtered().length !== 1 ? 's' : '' }}</span>
  </div>

  <!-- ── Table ────────────────────────────────────────────────────────── -->
  <div class="table-card">
    <table class="reg-table">
      <thead>
        <tr>
          <th>8D ID</th>
          <th>Title / Part</th>
          <th>Sev.</th>
          <th>Status</th>
          <th>Step</th>
          <th>Progress</th>
          <th>Customer</th>
          <th>Owner</th>
          <th>Due Date</th>
          <th>Age</th>
          <th>On-Time</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @if (filtered().length === 0) {
          <tr><td colspan="12" class="empty-row">
            <i class="bi bi-search" style="font-size:22px;color:#CBD5E1"></i>
            No records match your filters.
          </td></tr>
        }
        @for (r of filtered(); track r.id) {
          <tr class="data-row" (click)="router.navigate(['/quality/8d', r.id])">
            <td><span class="record-id">{{ r.id }}</span></td>
            <td>
              <span class="rec-title">{{ r.title }}</span>
              <span class="rec-product">{{ r.product }} · {{ r.partNumber }}</span>
            </td>
            <td><span class="badge-sev sev-{{ r.severity.toLowerCase() }}">{{ r.severity }}</span></td>
            <td><span class="badge-status status-{{ r.status | statusClass }}">{{ r.status }}</span></td>
            <td><span class="step-chip">{{ r.activeStep }}</span></td>
            <td>
              <div class="prog-wrap">
                <div class="prog-bar">
                  <div class="prog-fill"
                       [style.width.%]="r.completionPct"
                       [class.fill-green]="r.completionPct === 100"
                       [class.fill-amber]="r.completionPct >= 50 && r.completionPct < 100"
                       [class.fill-blue]="r.completionPct < 50"></div>
                </div>
                <span class="prog-pct">{{ r.completionPct }}%</span>
              </div>
            </td>
            <td class="cust-cell">{{ r.customer ?? '—' }}</td>
            <td>
              <div class="owner-cell">
                <span class="owner-av" [style.background]="r.ownerColor">{{ r.ownerInitials }}</span>
                <span class="owner-name">{{ r.owner.split(' ')[0] }}</span>
              </div>
            </td>
            <td [class.due-past]="isPastDue(r.dueDate) && r.status !== 'Closed'">{{ r.dueDate }}</td>
            <td><span class="age-val">{{ r.daysOpen }}d</span></td>
            <td>
              <span class="ot-{{ r.onTimeStatus }}" [title]="r.onTimeStatus">
                <i class="bi"
                   [class.bi-check-circle-fill]="r.onTimeStatus === 'on-track'"
                   [class.bi-exclamation-circle-fill]="r.onTimeStatus === 'at-risk'"
                   [class.bi-x-circle-fill]="r.onTimeStatus === 'overdue'"></i>
              </span>
            </td>
            <td>
              <button class="btn-view" (click)="router.navigate(['/quality/8d', r.id]); $event.stopPropagation()">
                Open <i class="bi bi-arrow-right"></i>
              </button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>

  <!-- ── Summary Footer ───────────────────────────────────────────────── -->
  <div class="summary-row">
    <div class="summary-item">
      <span class="sum-label">Open</span>
      <span class="sum-val sum-blue">{{ countByStatus('Open') }}</span>
    </div>
    <div class="summary-item">
      <span class="sum-label">Pending Closure</span>
      <span class="sum-val sum-amber">{{ countByStatus('Pending Closure') }}</span>
    </div>
    <div class="summary-item">
      <span class="sum-label">Closed</span>
      <span class="sum-val sum-green">{{ countByStatus('Closed') }}</span>
    </div>
    <div class="summary-item">
      <span class="sum-label">Overdue</span>
      <span class="sum-val sum-red">{{ countByOnTime('overdue') }}</span>
    </div>
    <div class="summary-item">
      <span class="sum-label">Critical</span>
      <span class="sum-val sum-red">{{ countBySeverity('Critical') }}</span>
    </div>
    <div class="summary-item">
      <span class="sum-label">Customer-Facing</span>
      <span class="sum-val sum-orange">{{ countCustomerFacing() }}</span>
    </div>
  </div>

</div>
  `,
  styles: [`
    .page-wrapper {
      background: #F8FAFC; min-height: 100vh; padding: 24px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
    }
    .page-title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 13px; color: #64748B; margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .btn-primary {
      background: #2563EB; color: #fff; border: none; border-radius: 7px;
      padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: background 0.15s;
    }
    .btn-primary:hover { background: #1D4ED8; }
    .btn-outline {
      background: #fff; color: #374151; border: 1px solid #D1D5DB; border-radius: 7px;
      padding: 8px 12px; font-size: 13px; font-weight: 500; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: background 0.15s;
    }
    .btn-outline:hover { background: #F1F5F9; }

    /* Filters */
    .filter-bar {
      display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap;
    }
    .search-wrap { position: relative; flex: 1; min-width: 220px; }
    .search-icon {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      color: #94A3B8; font-size: 13px; pointer-events: none;
    }
    .search-input {
      width: 100%; padding: 7px 10px 7px 30px; border: 1px solid #E2E8F0; border-radius: 7px;
      font-size: 13px; color: #0F172A; background: #fff; outline: none; box-sizing: border-box;
    }
    .search-input:focus { border-color: #2563EB; }
    .filter-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-select {
      padding: 6px 10px; border: 1px solid #E2E8F0; border-radius: 7px;
      font-size: 13px; color: #374151; background: #fff; cursor: pointer; outline: none;
    }
    .result-count { font-size: 12px; color: #94A3B8; white-space: nowrap; margin-left: auto; }

    /* Table */
    .table-card {
      background: #fff; border: 1px solid #E2E8F0; border-radius: 10px;
      overflow: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 16px;
    }
    .reg-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .reg-table thead tr { background: #F8FAFC; border-bottom: 1px solid #E2E8F0; }
    .reg-table th {
      padding: 9px 12px; font-size: 11px; font-weight: 700; color: #64748B;
      text-transform: uppercase; letter-spacing: 0.4px; text-align: left; white-space: nowrap;
    }
    .data-row { border-bottom: 1px solid #F1F5F9; cursor: pointer; transition: background 0.12s; }
    .data-row:last-child { border-bottom: none; }
    .data-row:hover { background: #F8FAFC; }
    .reg-table td { padding: 9px 12px; vertical-align: middle; }
    .empty-row {
      text-align: center; padding: 48px 16px !important; color: #94A3B8;
      font-size: 13px;
    }

    .record-id {
      font-size: 11px; font-weight: 700; color: #2563EB;
      font-family: 'JetBrains Mono', 'Fira Code', monospace; white-space: nowrap;
    }
    .rec-title {
      display: block; font-size: 12px; font-weight: 600; color: #0F172A;
      max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .rec-product { font-size: 11px; color: #94A3B8; display: block; }

    .badge-sev { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
    .sev-critical { background: #FEE2E2; color: #991B1B; }
    .sev-major    { background: #FEF3C7; color: #92400E; }
    .sev-minor    { background: #DBEAFE; color: #1D4ED8; }

    .badge-status { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
    .status-open     { background: #DBEAFE; color: #1D4ED8; }
    .status-draft    { background: #F1F5F9; color: #64748B; }
    .status-pending  { background: #FEF3C7; color: #92400E; }
    .status-closed   { background: #D1FAE5; color: #065F46; }
    .status-cancelled{ background: #F1F5F9; color: #94A3B8; }

    .step-chip {
      background: #EFF6FF; color: #2563EB; font-size: 11px; font-weight: 700;
      padding: 2px 8px; border-radius: 4px;
    }

    .prog-wrap { display: flex; align-items: center; gap: 6px; }
    .prog-bar { flex: 1; height: 5px; background: #E2E8F0; border-radius: 99px; overflow: hidden; min-width: 50px; }
    .prog-fill { height: 100%; border-radius: 99px; }
    .fill-green { background: #10B981; }
    .fill-amber { background: #F59E0B; }
    .fill-blue  { background: #2563EB; }
    .prog-pct { font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap; }

    .cust-cell { font-size: 12px; color: #374151; white-space: nowrap; }
    .owner-cell { display: flex; align-items: center; gap: 6px; }
    .owner-av {
      width: 24px; height: 24px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #fff; flex-shrink: 0;
    }
    .owner-name { font-size: 12px; color: #374151; }
    .due-past { color: #DC2626 !important; font-weight: 600; }
    .age-val { font-size: 12px; color: #64748B; }

    .ot-on-track { color: #10B981; font-size: 14px; }
    .ot-at-risk  { color: #F59E0B; font-size: 14px; }
    .ot-overdue  { color: #DC2626; font-size: 14px; }

    .btn-view {
      background: #EFF6FF; color: #2563EB; border: none; border-radius: 5px;
      padding: 4px 10px; font-size: 11px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 4px; white-space: nowrap; transition: background 0.15s;
    }
    .btn-view:hover { background: #DBEAFE; }

    /* Summary */
    .summary-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .summary-item {
      background: #fff; border: 1px solid #E2E8F0; border-radius: 8px;
      padding: 10px 16px; display: flex; flex-direction: column; gap: 2px; min-width: 100px;
    }
    .sum-label { font-size: 11px; color: #64748B; font-weight: 500; }
    .sum-val { font-size: 20px; font-weight: 700; line-height: 1.2; }
    .sum-blue   { color: #2563EB; }
    .sum-amber  { color: #B45309; }
    .sum-green  { color: #059669; }
    .sum-red    { color: #DC2626; }
    .sum-orange { color: #EA580C; }
  `]
})
export class EightDListComponent {
  readonly router = inject(Router);
  readonly svc = inject(EightDMockService);

  searchTermVal = '';
  statusFilterVal = '';
  severityFilterVal = '';
  sourceFilterVal = '';

  readonly searchTerm = signal('');
  readonly statusFilter = signal('');
  readonly severityFilter = signal('');
  readonly sourceFilter = signal('');

  readonly filtered = computed(() => {
    const q = this.searchTerm().toLowerCase();
    const st = this.statusFilter();
    const sv = this.severityFilter();
    const so = this.sourceFilter();
    return this.svc.records().filter(r => {
      if (q && !r.id.toLowerCase().includes(q) &&
          !r.title.toLowerCase().includes(q) &&
          !(r.customer ?? '').toLowerCase().includes(q) &&
          !r.partNumber.toLowerCase().includes(q)) return false;
      if (st && r.status !== st) return false;
      if (sv && r.severity !== sv) return false;
      if (so && r.sourceType !== so) return false;
      return true;
    });
  });

  isPastDue(date: string): boolean { return new Date(date) < new Date(); }
  countByStatus(s: EightDStatus) { return this.svc.records().filter(r => r.status === s).length; }
  countBySeverity(s: EightDSeverity) { return this.svc.records().filter(r => r.severity === s).length; }
  countByOnTime(s: string) { return this.svc.records().filter(r => r.onTimeStatus === s).length; }
  countCustomerFacing() { return this.svc.records().filter(r => r.isCustomerFacing).length; }
}
