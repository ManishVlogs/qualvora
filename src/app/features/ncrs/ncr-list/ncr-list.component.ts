import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { NCR, NcrStatus } from '../../../shared/interfaces/models';

interface ActiveFilter { key: string; label: string; value: string; }

@Component({
  selector: 'app-ncr-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Non-Conformance Reports</h1>
          <p class="page-sub">{{ mock.siteStore.currentSite() }} — {{ mock.siteNcrs().length }} NCRs</p>
        </div>
        <button class="btn btn-primary new-btn" (click)="router.navigate(['/ncrs/new'])">
          <i class="bi bi-plus-lg me-1"></i> Log NCR
        </button>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="filter-bar-left">
          <div class="search-wrap">
            <i class="bi bi-search search-icon"></i>
            <input class="filter-input search-input" placeholder="Search NCRs…"
                   [(ngModel)]="searchQuery" (ngModelChange)="searchSig.set(searchQuery)" />
            @if (searchQuery) {
              <button class="clear-search" (click)="searchQuery=''; searchSig.set('')">
                <i class="bi bi-x"></i>
              </button>
            }
          </div>

          @for (dd of dropdowns; track dd.key) {
            <div class="dropdown-wrap">
              <button class="filter-btn" [class.active]="filterValues()[dd.key]"
                      (click)="toggleDropdown(dd.key)">
                {{ dd.label }}
                @if (filterValues()[dd.key]) { <span class="filter-dot"></span> }
                <i class="bi bi-chevron-down ms-1 small"></i>
              </button>
              @if (openDropdown() === dd.key) {
                <div class="filter-dropdown">
                  @for (opt of dd.options; track opt) {
                    <button class="filter-dd-item" [class.selected]="filterValues()[dd.key]===opt"
                            (click)="setFilter(dd.key, opt)">
                      @if (filterValues()[dd.key]===opt) { <i class="bi bi-check me-2"></i> }
                      @if (dd.key==='status') {
                        <span class="chip chip-sm {{ statusChipClass(opt) }}">{{ opt }}</span>
                      } @else { {{ opt }} }
                    </button>
                  }
                  @if (filterValues()[dd.key]) {
                    <button class="filter-dd-clear" (click)="setFilter(dd.key, '')">Clear</button>
                  }
                </div>
              }
            </div>
          }

          <!-- Customer flag toggle -->
          <label class="cust-toggle" [class.active]="customerOnly()">
            <input type="checkbox" [checked]="customerOnly()" (change)="customerOnly.set(!customerOnly())" />
            <i class="bi bi-c-circle me-1"></i> Customer only
          </label>
        </div>

        <div class="filter-bar-right">
          @if (activeFilters().length > 0) {
            <button class="btn-clear-all" (click)="clearAll()">
              <i class="bi bi-x me-1"></i> Clear all
            </button>
          }
        </div>
      </div>

      <!-- Active filter chips -->
      @if (activeFilters().length > 0) {
        <div class="active-filters">
          @for (f of activeFilters(); track f.key) {
            <span class="active-chip">
              <span class="active-chip-label">{{ f.label }}:</span>
              {{ f.value }}
              <button class="active-chip-remove" (click)="removeFilter(f.key)">
                <i class="bi bi-x"></i>
              </button>
            </span>
          }
        </div>
      }

      <!-- Table -->
      <div class="q-card table-card">
        <div class="table-meta">
          <span class="result-count">{{ filteredNCRs().length }} records</span>
          <span class="ms-auto text-muted-sm">
            <span class="legend-dot red"></span> >5d
            <span class="legend-dot amber ms-2"></span> 3–5d
            <span class="legend-dot green ms-2"></span> &lt;3d
          </span>
        </div>
        <div class="table-scroll">
          <table class="q-table ncr-table">
            <thead>
              <tr>
                <th style="width:140px">ID</th>
                <th style="width:110px">Part</th>
                <th style="width:120px">Defect Code</th>
                <th style="width:100px">Qty Def.</th>
                <th style="width:100px">Source</th>
                <th style="width:130px">Disposition</th>
                <th style="width:80px">Age</th>
                <th style="width:36px" class="text-center">C</th>
                <th style="width:100px" class="action-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (ncr of filteredNCRs(); track ncr.id) {
                <tr class="ncr-row" (click)="navigate(ncr)">
                  <td>
                    <div class="id-cell">
                      <span class="record-id">{{ ncr.id }}</span>
                      <span class="chip chip-sm ms-1 {{ statusChipClass(ncr.status) }}">{{ ncr.status }}</span>
                    </div>
                    <div class="ncr-title-sub">{{ ncr.title | slice:0:42 }}{{ ncr.title.length>42?'…':'' }}</div>
                  </td>
                  <td class="part-cell">{{ ncr.partNumber ?? '—' }}</td>
                  <td>
                    @if (ncr.defectCode) {
                      <span class="defect-badge">{{ ncr.defectCode }}</span>
                    } @else { <span class="text-muted-sm">—</span> }
                  </td>
                  <td class="text-center">
                    @if (ncr.qtyDefective != null) {
                      <span class="qty-val">{{ ncr.qtyDefective }}</span>
                    } @else { <span class="text-muted-sm">—</span> }
                  </td>
                  <td><span class="source-badge source-{{ ncr.source.toLowerCase().replace(' ','-') }}">{{ ncr.source }}</span></td>
                  <td>
                    @if (ncr.disposition) {
                      <span class="disp-badge">{{ ncr.disposition }}</span>
                    } @else { <span class="text-muted-sm pending">Pending</span> }
                  </td>
                  <td>
                    <span class="chip chip-sm {{ ageChipClass(ncr.ageInDays) }}">
                      {{ ncr.ageInDays }}d
                    </span>
                  </td>
                  <td class="text-center">
                    @if (ncr.isCustomerFacing) {
                      <span class="c-badge" title="Customer-facing">C</span>
                    }
                  </td>
                  <td class="action-col">
                    <div class="row-actions">
                      <button class="row-action-btn" title="Disposition"
                              (click)="$event.stopPropagation(); router.navigate(['/ncrs', ncr.id])">
                        <i class="bi bi-check2-circle"></i>
                      </button>
                      <button class="row-action-btn" title="Escalate to CAPA"
                              (click)="$event.stopPropagation(); onEscalate(ncr)">
                        <i class="bi bi-arrow-up-right"></i>
                      </button>
                      <button class="row-action-btn" title="More"
                              (click)="$event.stopPropagation()">
                        <i class="bi bi-three-dots"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
              @if (filteredNCRs().length === 0) {
                <tr>
                  <td colspan="9" class="empty-row">
                    <i class="bi bi-search me-2"></i> No NCRs match the current filters
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Overlay -->
    @if (openDropdown()) {
      <div class="dd-overlay" (click)="openDropdown.set('')"></div>
    }

    <!-- Toast -->
    @if (toast()) {
      <div class="action-toast"><i class="bi bi-check-circle-fill me-2"></i>{{ toast() }}</div>
    }
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem; }
    .page-title { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0 0 0.2rem; }
    .page-sub { font-size: 0.875rem; color: #64748B; margin: 0; }
    .new-btn { background: #2563EB; border: none; font-weight: 600; font-size: 0.875rem; padding: 0.5rem 1rem; border-radius: 8px; }

    .filter-bar { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .filter-bar-left, .filter-bar-right { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .search-wrap { position: relative; display: flex; align-items: center; }
    .search-icon { position: absolute; left: 0.625rem; color: #94A3B8; font-size: 0.875rem; pointer-events: none; }
    .search-input { padding-left: 2rem !important; width: 200px; }
    .clear-search { position: absolute; right: 0.5rem; background: none; border: none; color: #94A3B8; cursor: pointer; padding: 0; }
    .filter-input { height: 34px; border: 1.5px solid #E2E8F0; border-radius: 6px; font-size: 0.8125rem; padding: 0 0.75rem; outline: none; &:focus { border-color: #2563EB; } }
    .filter-btn { height: 34px; background: #fff; border: 1.5px solid #E2E8F0; border-radius: 6px; font-size: 0.8125rem; padding: 0 0.75rem; cursor: pointer; color: #475569; display: flex; align-items: center; gap: 0.25rem; white-space: nowrap; &:hover { border-color: #CBD5E1; } &.active { border-color: #2563EB; color: #2563EB; background: #EFF6FF; } }
    .filter-dot { width: 6px; height: 6px; border-radius: 50%; background: #2563EB; }
    .btn-clear-all { background: none; border: none; font-size: 0.8125rem; color: #94A3B8; cursor: pointer; padding: 4px 8px; display: flex; align-items: center; &:hover { color: #475569; } }

    .cust-toggle { display: flex; align-items: center; gap: 0.25rem; height: 34px; padding: 0 0.75rem; border: 1.5px solid #E2E8F0; border-radius: 6px; font-size: 0.8125rem; color: #475569; cursor: pointer; background: #fff; transition: all 150ms; input { display: none; } &.active { border-color: #EA580C; color: #EA580C; background: #FFF7ED; } }

    .dropdown-wrap { position: relative; }
    .filter-dropdown { position: absolute; top: calc(100% + 4px); left: 0; background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); min-width: 160px; z-index: 300; padding: 4px 0; }
    .filter-dd-item { display: flex; align-items: center; width: 100%; padding: 0.4rem 0.75rem; background: none; border: none; text-align: left; font-size: 0.8125rem; color: #334155; cursor: pointer; &:hover { background: #F8FAFC; } &.selected { font-weight: 600; color: #2563EB; } }
    .filter-dd-clear { display: block; width: 100%; padding: 0.375rem 0.75rem; background: none; border: none; border-top: 1px solid #F1F5F9; text-align: left; font-size: 0.75rem; color: #94A3B8; cursor: pointer; margin-top: 4px; &:hover { color: #475569; } }
    .dd-overlay { position: fixed; inset: 0; z-index: 299; }

    .active-filters { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 0.875rem; }
    .active-chip { display: inline-flex; align-items: center; gap: 0.25rem; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 20px; padding: 2px 6px 2px 10px; font-size: 0.75rem; color: #1D4ED8; }
    .active-chip-label { font-weight: 600; }
    .active-chip-remove { background: none; border: none; cursor: pointer; color: #93C5FD; padding: 0; &:hover { color: #1D4ED8; } }

    .table-card { overflow: hidden; }
    .table-meta { padding: 0.625rem 1.25rem; border-bottom: 1px solid #F1F5F9; display: flex; align-items: center; }
    .result-count { font-size: 0.8125rem; color: #64748B; }
    .text-muted-sm { font-size: 0.8125rem; color: #94A3B8; }
    .legend-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; &.red { background: #DC2626; } &.amber { background: #B45309; } &.green { background: #059669; } }
    .table-scroll { overflow-x: auto; }
    .ncr-table { width: 100%; }
    .ncr-row { cursor: pointer; &:hover { background: #F8FAFC; } &:hover .row-actions { opacity: 1; pointer-events: auto; } }

    .id-cell { display: flex; align-items: center; flex-wrap: wrap; gap: 2px; }
    .ncr-title-sub { font-size: 11px; color: #94A3B8; margin-top: 2px; white-space: nowrap; }
    .chip-sm { font-size: 10px; padding: 1px 6px; }
    .part-cell { font-family: monospace; font-size: 0.8125rem; color: #475569; }
    .defect-badge { background: #F8FAFC; border: 1px solid #E2E8F0; color: #475569; font-size: 11px; border-radius: 4px; padding: 1px 6px; font-family: monospace; }
    .qty-val { font-weight: 600; font-size: 0.875rem; color: #0F172A; }
    .source-badge { font-size: 11px; border-radius: 4px; padding: 2px 6px; font-weight: 500; }
    .source-internal { background: #F1F5F9; color: #475569; }
    .source-customer { background: #FFF7ED; color: #C2410C; }
    .source-supplier { background: #EFF6FF; color: #1E40AF; }
    .source-audit { background: #F5F3FF; color: #6D28D9; }
    .disp-badge { background: #DCFCE7; color: #166534; font-size: 11px; border-radius: 4px; padding: 2px 6px; }
    .pending { font-style: italic; }
    .c-badge { width: 20px; height: 20px; background: #EA580C; color: #fff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; }
    .action-col { text-align: right; }
    .row-actions { display: flex; justify-content: flex-end; gap: 4px; opacity: 0; pointer-events: none; transition: opacity 120ms; }
    .row-action-btn { width: 28px; height: 28px; border: 1px solid #E2E8F0; background: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748B; font-size: 0.875rem; &:hover { border-color: #2563EB; color: #2563EB; background: #EFF6FF; } }
    .empty-row { text-align: center; padding: 2.5rem; color: #94A3B8; font-size: 0.875rem; }
    .action-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: #0F172A; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; z-index: 400; display: flex; align-items: center; }
  `]
})
export class NcrListComponent {
  readonly router = inject(Router);
  readonly mock = inject(MockDataService);

  searchQuery = '';
  readonly searchSig = signal('');
  readonly openDropdown = signal('');
  readonly customerOnly = signal(false);
  readonly toast = signal('');

  private filters = signal<Record<string, string>>({ status: '', source: '', part: '', defect: '' });

  filterValues() { return this.filters(); }

  readonly dropdowns = [
    { key: 'status', label: 'Status', options: ['Open', 'Under Review', 'Dispositioned', 'Closed', 'Voided'] },
    { key: 'source', label: 'Source', options: ['Internal', 'Customer', 'Supplier', 'Audit'] },
    { key: 'defect', label: 'Defect Code', options: ['WLD-001', 'DIM-003', 'MAT-002', 'SRF-005', 'TRQ-001', 'CTG-004', 'LBL-002', 'HRD-003', 'DOC-001', 'CAL-002', 'ENV-001'] },
  ];

  readonly filteredNCRs = computed(() => {
    const q = this.searchSig().toLowerCase();
    const f = this.filters();
    const custOnly = this.customerOnly();
    return this.mock.siteNcrs().filter(n => {
      if (f['status'] && n.status !== f['status']) return false;
      if (f['source'] && n.source !== f['source']) return false;
      if (f['defect'] && n.defectCode !== f['defect']) return false;
      if (custOnly && !n.isCustomerFacing) return false;
      if (q && !n.id.toLowerCase().includes(q) && !n.title.toLowerCase().includes(q) && !(n.partNumber ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  });

  readonly activeFilters = computed<ActiveFilter[]>(() => {
    const f: ActiveFilter[] = [];
    if (this.searchSig()) f.push({ key: 'search', label: 'Search', value: this.searchSig() });
    const fv = this.filters();
    if (fv['status']) f.push({ key: 'status', label: 'Status', value: fv['status'] });
    if (fv['source']) f.push({ key: 'source', label: 'Source', value: fv['source'] });
    if (fv['defect']) f.push({ key: 'defect', label: 'Defect Code', value: fv['defect'] });
    if (this.customerOnly()) f.push({ key: 'customer', label: 'Customer', value: 'Facing only' });
    return f;
  });

  toggleDropdown(key: string): void {
    this.openDropdown.set(this.openDropdown() === key ? '' : key);
  }

  setFilter(key: string, val: string): void {
    this.filters.update(f => ({ ...f, [key]: val }));
    this.openDropdown.set('');
  }

  removeFilter(key: string): void {
    if (key === 'search') { this.searchQuery = ''; this.searchSig.set(''); }
    else if (key === 'customer') this.customerOnly.set(false);
    else this.filters.update(f => ({ ...f, [key]: '' }));
  }

  clearAll(): void {
    this.searchQuery = ''; this.searchSig.set('');
    this.filters.set({ status: '', source: '', part: '', defect: '' });
    this.customerOnly.set(false);
  }

  navigate(ncr: NCR): void { this.router.navigate(['/ncrs', ncr.id]); }

  onEscalate(ncr: NCR): void {
    this.toast.set(`CAPA escalation initiated for ${ncr.id}`);
    setTimeout(() => this.toast.set(''), 3000);
  }

  statusChipClass(s: string): string {
    const m: Record<string, string> = {
      'Open': 'chip-major', 'Under Review': 'chip-in-approval',
      'Dispositioned': 'chip-released', 'Closed': 'chip-released',
      'Voided': 'chip-superseded',
    };
    return m[s] ?? '';
  }

  ageChipClass(d: number): string {
    if (d > 5) return 'chip-breached';
    if (d >= 3) return 'chip-warning';
    return 'chip-within-sla';
  }
}
