import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { CAPA8D, CapaOnTimeStatus } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-capa-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">CAPA Register</h1>
          <p class="page-sub">{{ filteredCapas().length }} corrective &amp; preventive actions</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline-secondary btn-sm me-2" (click)="router.navigate(['/capas/aging'])">
            <i class="bi bi-columns-gap me-1"></i> Aging Board
          </button>
          <button class="btn btn-primary btn-sm" (click)="router.navigate(['/capas/new'])">
            <i class="bi bi-plus-lg me-1"></i> New CAPA
          </button>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="search-wrap">
          <i class="bi bi-search search-icon"></i>
          <input class="search-input" placeholder="Search ID or title…"
                 [ngModel]="searchQ()" (ngModelChange)="searchQ.set($event)" />
          @if (searchQ()) {
            <button class="search-clear" (click)="searchQ.set('')"><i class="bi bi-x"></i></button>
          }
        </div>

        <!-- Status dropdown -->
        <div class="dd-wrap" [class.open]="openDd() === 'status'">
          <button class="dd-btn" (click)="toggleDd('status')">
            {{ filters().status || 'Status' }} <i class="bi bi-chevron-down ms-1"></i>
          </button>
          @if (openDd() === 'status') {
            <div class="dd-menu">
              <button class="dd-item" (click)="setFilter('status', '')">All</button>
              @for (s of ['Open','Closed']; track s) {
                <button class="dd-item" (click)="setFilter('status', s)">{{ s }}</button>
              }
            </div>
          }
        </div>

        <!-- Source dropdown -->
        <div class="dd-wrap" [class.open]="openDd() === 'source'">
          <button class="dd-btn" (click)="toggleDd('source')">
            {{ filters().source || 'Source' }} <i class="bi bi-chevron-down ms-1"></i>
          </button>
          @if (openDd() === 'source') {
            <div class="dd-menu">
              <button class="dd-item" (click)="setFilter('source', '')">All Sources</button>
              @for (s of ['NCR','Customer Complaint','Audit','Internal']; track s) {
                <button class="dd-item" (click)="setFilter('source', s)">{{ s }}</button>
              }
            </div>
          }
        </div>

        <!-- Champion dropdown -->
        <div class="dd-wrap" [class.open]="openDd() === 'champion'">
          <button class="dd-btn" (click)="toggleDd('champion')">
            {{ filters().champion || 'Champion' }} <i class="bi bi-chevron-down ms-1"></i>
          </button>
          @if (openDd() === 'champion') {
            <div class="dd-menu">
              <button class="dd-item" (click)="setFilter('champion', '')">All Champions</button>
              @for (u of champions; track u) {
                <button class="dd-item" (click)="setFilter('champion', u)">{{ u }}</button>
              }
            </div>
          }
        </div>

        <!-- Toggles -->
        <label class="toggle-label">
          <input type="checkbox" class="toggle-check" [ngModel]="overdueOnly()" (ngModelChange)="overdueOnly.set($event)" />
          Overdue only
        </label>
        <label class="toggle-label">
          <input type="checkbox" class="toggle-check" [ngModel]="myCapas()" (ngModelChange)="myCapas.set($event)" />
          My CAPAs
        </label>

        @if (hasFilters()) {
          <button class="clear-btn" (click)="clearAll()">
            <i class="bi bi-x-circle me-1"></i>Clear
          </button>
        }
      </div>

      <!-- Table -->
      <div class="table-card">
        <table class="q-table">
          <thead>
            <tr>
              <th style="width:130px">ID</th>
              <th>Title</th>
              <th style="width:140px">Source</th>
              <th style="width:110px">D-Step</th>
              <th style="width:100px;text-align:center">Days in Step</th>
              <th style="width:100px">Due Date</th>
              <th style="width:100px;text-align:center">On-Time</th>
              <th style="width:130px">Champion</th>
              <th style="width:80px">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (c of filteredCapas(); track c.id) {
              <tr class="data-row" (click)="goTo(c)">
                <td>
                  <span class="record-id">{{ c.id }}</span>
                </td>
                <td>
                  <span class="row-title">{{ c.title }}</span>
                </td>
                <td>
                  <span class="source-chip source-{{ sourceClass(c.sourceType) }}">
                    {{ c.sourceType }}
                  </span>
                </td>
                <td>
                  <span class="dstep-badge">{{ c.activeStep }}</span>
                  <span class="dstep-label ms-1">{{ stepLabel(c.activeStep) }}</span>
                </td>
                <td style="text-align:center">
                  <span class="days-chip" [class.days-high]="c.daysInCurrentStep > 7">
                    {{ c.daysInCurrentStep }}d
                  </span>
                </td>
                <td>
                  <span class="date-text">{{ c.dueDate }}</span>
                </td>
                <td style="text-align:center">
                  <span class="ontime-chip ontime-{{ c.onTimeStatus }}">
                    @if (c.onTimeStatus === 'on-track') { On Track }
                    @if (c.onTimeStatus === 'at-risk') { At Risk }
                    @if (c.onTimeStatus === 'overdue') { Overdue }
                  </span>
                </td>
                <td>
                  <div class="champion-cell">
                    <span class="avatar-xs" [style.background]="c.championColor">{{ c.championInitials }}</span>
                    <span class="champion-name">{{ c.champion.split(' ')[0] }}</span>
                  </div>
                </td>
                <td>
                  <span class="status-chip" [class.chip-open]="c.status === 'Open'" [class.chip-closed]="c.status === 'Closed'">
                    {{ c.status }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="9" class="empty-state">
                  <i class="bi bi-funnel fs-4 d-block mb-2 text-muted"></i>
                  No CAPAs match the current filters.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Overlay to close dropdowns -->
      @if (openDd()) {
        <div class="overlay" (click)="openDd.set('')"></div>
      }

      <!-- Toast -->
      @if (toast()) {
        <div class="toast-pill">{{ toast() }}</div>
      }
    </div>
  `,
  styles: [`
    .page-wrapper { padding: 24px 32px; max-width: 1400px; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
    .page-title { font-size:1.5rem; font-weight:700; color:#0F172A; margin:0 0 2px; }
    .page-sub { font-size:.85rem; color:#64748B; margin:0; }
    .header-actions { display:flex; align-items:center; gap:8px; }

    .filter-bar {
      display:flex; align-items:center; gap:10px; flex-wrap:wrap;
      background:#fff; border:1px solid #E2E8F0; border-radius:8px;
      padding:10px 14px; margin-bottom:16px;
    }
    .search-wrap { position:relative; display:flex; align-items:center; }
    .search-icon { position:absolute; left:8px; color:#94A3B8; font-size:.8rem; }
    .search-input {
      border:1px solid #E2E8F0; border-radius:6px; padding:5px 28px 5px 28px;
      font-size:.85rem; width:220px; outline:none;
    }
    .search-input:focus { border-color:#2563EB; }
    .search-clear { position:absolute; right:6px; background:none; border:none; color:#94A3B8; cursor:pointer; padding:0; font-size:.9rem; }

    .dd-wrap { position:relative; }
    .dd-btn {
      border:1px solid #E2E8F0; border-radius:6px; background:#fff;
      padding:5px 10px; font-size:.82rem; cursor:pointer; white-space:nowrap; color:#374151;
    }
    .dd-btn:hover { background:#F8FAFC; }
    .dd-menu {
      position:absolute; top:calc(100% + 4px); left:0; z-index:200;
      background:#fff; border:1px solid #E2E8F0; border-radius:8px;
      box-shadow:0 4px 16px rgba(0,0,0,.1); min-width:160px; padding:4px 0;
    }
    .dd-item { display:block; width:100%; text-align:left; background:none; border:none; padding:7px 14px; font-size:.83rem; cursor:pointer; color:#374151; }
    .dd-item:hover { background:#F1F5F9; }

    .toggle-label { display:flex; align-items:center; gap:5px; font-size:.82rem; color:#475569; cursor:pointer; white-space:nowrap; }
    .toggle-check { accent-color:#2563EB; }
    .clear-btn { background:none; border:none; color:#DC2626; font-size:.82rem; cursor:pointer; padding:0 4px; }
    .overlay { position:fixed; inset:0; z-index:150; }

    .table-card { background:#fff; border:1px solid #E2E8F0; border-radius:10px; overflow:hidden; }
    .q-table { width:100%; border-collapse:collapse; }
    .q-table thead th {
      background:#F8FAFC; padding:10px 14px; font-size:.78rem; font-weight:600;
      text-transform:uppercase; letter-spacing:.04em; color:#64748B;
      border-bottom:1px solid #E2E8F0; white-space:nowrap;
    }
    .q-table tbody td { padding:11px 14px; border-bottom:1px solid #F1F5F9; vertical-align:middle; }
    .data-row { cursor:pointer; transition:background .12s; }
    .data-row:hover td { background:#F8FAFC; }
    .data-row:last-child td { border-bottom:none; }

    .record-id { font-family:monospace; font-size:.82rem; font-weight:600; color:#2563EB; }
    .row-title { font-size:.87rem; color:#1E293B; font-weight:500; }
    .date-text { font-size:.82rem; color:#475569; }

    .source-chip { font-size:.72rem; font-weight:600; padding:2px 8px; border-radius:99px; white-space:nowrap; }
    .source-ncr { background:#DBEAFE; color:#1D4ED8; }
    .source-customer { background:#FEF3C7; color:#92400E; }
    .source-audit { background:#F3E8FF; color:#6B21A8; }
    .source-internal { background:#F0FDF4; color:#166534; }

    .dstep-badge { background:#1E40AF; color:#fff; font-size:.72rem; font-weight:700; padding:1px 6px; border-radius:4px; }
    .dstep-label { font-size:.8rem; color:#64748B; }

    .days-chip { font-size:.78rem; background:#F1F5F9; color:#475569; padding:2px 7px; border-radius:99px; }
    .days-high { background:#FEF3C7; color:#92400E; }

    .ontime-chip { font-size:.75rem; font-weight:600; padding:2px 9px; border-radius:99px; white-space:nowrap; }
    .ontime-on-track { background:#D1FAE5; color:#065F46; }
    .ontime-at-risk { background:#FEF3C7; color:#92400E; }
    .ontime-overdue { background:#FEE2E2; color:#991B1B; }

    .champion-cell { display:flex; align-items:center; gap:6px; }
    .avatar-xs { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; color:#fff; font-size:.65rem; font-weight:700; flex-shrink:0; }
    .champion-name { font-size:.83rem; color:#374151; }

    .status-chip { font-size:.75rem; font-weight:600; padding:2px 9px; border-radius:99px; }
    .chip-open { background:#DBEAFE; color:#1D4ED8; }
    .chip-closed { background:#D1FAE5; color:#065F46; }

    .empty-state { text-align:center; padding:40px; color:#94A3B8; font-size:.9rem; }

    .toast-pill {
      position:fixed; bottom:24px; right:24px; z-index:9999;
      background:#1E293B; color:#fff; padding:10px 20px; border-radius:8px;
      font-size:.87rem; box-shadow:0 4px 16px rgba(0,0,0,.2);
    }
  `],
})
export class CapaListComponent {
  readonly router = inject(Router);
  private readonly mock = inject(MockDataService);

  searchQ = signal('');
  openDd = signal('');
  overdueOnly = signal(false);
  myCapas = signal(false);
  filters = signal({ status: '', source: '', champion: '' });
  toast = signal('');

  readonly champions = ['Dev Patel', 'Maria Delgado', 'Priya Nair', 'Tom Braswell', 'James Okonkwo', 'Sarah Chen'];

  readonly filteredCapas = computed(() => {
    const q = this.searchQ().toLowerCase();
    const f = this.filters();
    const oo = this.overdueOnly();
    const mc = this.myCapas();
    const siteId = this.mock.siteStore.currentSiteId();
    return this.mock.capas8d().filter((c: CAPA8D) => {
      if (c.siteId && c.siteId !== siteId) return false;
      if (q && !c.id.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q)) return false;
      if (f.status && c.status !== f.status) return false;
      if (f.source && c.sourceType !== f.source) return false;
      if (f.champion && c.champion !== f.champion) return false;
      if (oo && c.onTimeStatus !== 'overdue') return false;
      if (mc && c.champion !== 'Dev Patel') return false;
      return true;
    });
  });

  hasFilters(): boolean {
    const f = this.filters();
    return !!(this.searchQ() || f.status || f.source || f.champion || this.overdueOnly() || this.myCapas());
  }

  toggleDd(key: string): void {
    this.openDd.set(this.openDd() === key ? '' : key);
  }

  setFilter(key: string, val: string): void {
    this.filters.update(f => ({ ...f, [key]: val }));
    this.openDd.set('');
  }

  clearAll(): void {
    this.searchQ.set('');
    this.filters.set({ status: '', source: '', champion: '' });
    this.overdueOnly.set(false);
    this.myCapas.set(false);
  }

  goTo(c: CAPA8D): void {
    this.router.navigate(['/capas', c.id]);
  }

  sourceClass(type: string): string {
    if (type === 'NCR') return 'ncr';
    if (type === 'Customer Complaint') return 'customer';
    if (type === 'Audit') return 'audit';
    return 'internal';
  }

  stepLabel(step: string): string {
    const map: Record<string, string> = {
      D0: 'Initiation', D1: 'Team', D2: 'Problem', D3: 'Containment',
      D4: 'Root Cause', D5: 'Actions', D6: 'Implementation', D7: 'Effectiveness', D8: 'Lessons',
    };
    return map[step] ?? step;
  }
}
