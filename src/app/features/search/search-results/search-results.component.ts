import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SearchService } from '../../../core/search/search.service';

interface SearchResult {
  id: string;
  type: 'Document' | 'NCR' | 'CAPA' | 'Audit' | 'Finding' | 'People';
  title: string;
  snippet: string;
  status: string;
  date: string;
  route: string;
}

const ALL: SearchResult[] = [
  { id:'DOC-0042', type:'Document', title:'Torque Verification WI', snippet:'Work instruction for weld torque verification — Rev C released 2026-05-14', status:'Released', date:'2026-05-14', route:'/documents/DOC-0042' },
  { id:'DOC-0018', type:'Document', title:'Control Plan – BIW Brackets', snippet:'Control plan for body-in-white bracket assembly process. Includes dimensional checks.', status:'Released', date:'2026-05-01', route:'/documents/DOC-0018' },
  { id:'DOC-0031', type:'Document', title:'Weld Process PFMEA', snippet:'PFMEA for weld zone A and B covering failure modes for MIG and spot weld.', status:'In Approval', date:'2026-04-18', route:'/documents/DOC-0031' },
  { id:'DOC-0009', type:'Document', title:'Assembly Line Quality Procedure', snippet:'Quality procedure for assembly line inspection and final release criteria.', status:'Released', date:'2026-03-12', route:'/documents/DOC-0009' },
  { id:'NCR-2026-0147', type:'NCR', title:'Bracket dimensional OOT – Station 4', snippet:'Part BKT-M8-002 found out of tolerance at weld station 4. Qty: 14. Source: Internal.', status:'Open', date:'2026-06-13', route:'/ncrs/NCR-2026-0147' },
  { id:'NCR-2026-0139', type:'NCR', title:'Surface defect on weld panel', snippet:'Surface pitting defect found on WLD-PANEL-007 during in-process inspection. Qty: 7.', status:'Under Review', date:'2026-06-09', route:'/ncrs/NCR-2026-0139' },
  { id:'NCR-2026-0133', type:'NCR', title:'Assembly torque deviation – Line 2', snippet:'Torque values below specification on 6 assemblies at Line 2. Rework initiated.', status:'Closed', date:'2026-06-01', route:'/ncrs/NCR-2026-0133' },
  { id:'CAPA-2026-0032', type:'CAPA', title:'Weld Station 6 process control gap', snippet:'Root cause: inadequate setup verification procedure. Champion: Dev Patel.', status:'Open', date:'2026-05-28', route:'/capas/CAPA-2026-0032' },
  { id:'CAPA-2026-0023', type:'CAPA', title:'Assembly torque corrective action', snippet:'D4 root cause analysis completed. Permanent actions in progress. Champion: Tom Braswell.', status:'Open', date:'2026-05-15', route:'/capas/CAPA-2026-0023' },
  { id:'AUD-2026-011', type:'Audit', title:'Q3 Production Process Audit', snippet:'Process audit covering Weld Zone A and Assembly Line 2 — 2 findings raised.', status:'Completed', date:'2026-07-10', route:'/audits/AUD-2026-011' },
  { id:'AUD-2026-007', type:'Audit', title:'Customer Requirements Audit', snippet:'OEM CSR flow-down audit — Ford Q1 and Stellantis requirements.', status:'In Progress', date:'2026-06-10', route:'/audits/AUD-2026-007' },
  { id:'FND-2026-0061', type:'Finding', title:'Setup approval missing — 8.5.1', snippet:'Major nonconformity: setup records for weld station 6 lacked QE sign-off on 3 of 5 runs.', status:'Open', date:'2026-07-10', route:'/findings/FND-2026-0061' },
];

const TYPE_ICONS: Record<string, string> = {
  Document: 'bi-file-earmark-text', NCR: 'bi-exclamation-triangle', CAPA: 'bi-tools',
  Audit: 'bi-clipboard-check', Finding: 'bi-flag', People: 'bi-person',
};
const TYPE_COLORS: Record<string, string> = {
  Document: '#2563EB', NCR: '#DC2626', CAPA: '#059669', Audit: '#7C3AED', Finding: '#D97706', People: '#0891B2',
};

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="results-layout">

      <!-- Left facets -->
      <aside class="facets-panel">
        <h3 class="facet-heading">Filter</h3>

        <div class="facet-section">
          <div class="facet-label">Status</div>
          @for (s of statusOptions; track s) {
            <label class="facet-check">
              <input type="checkbox" [checked]="activeStatuses().has(s)" (change)="toggleStatus(s)" />
              <span>{{ s }}</span>
            </label>
          }
        </div>

        <div class="facet-section">
          <div class="facet-label">Site</div>
          @for (site of ['Plant-1', 'Plant-2', 'Plant-3']; track site) {
            <label class="facet-check">
              <input type="checkbox" [checked]="activeSites().has(site)" (change)="toggleSite(site)" />
              <span>{{ site }}</span>
            </label>
          }
        </div>

        <div class="facet-section">
          <div class="facet-label">Date Range</div>
          <select class="facet-select" [value]="dateRange()" (change)="dateRange.set($any($event.target).value)">
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="ytd">Year to Date</option>
          </select>
        </div>

        <button class="btn btn-sm btn-outline-secondary w-100 mt-2" (click)="clearFilters()">
          <i class="bi bi-x-circle me-1"></i>Clear Filters
        </button>
      </aside>

      <!-- Results -->
      <main class="results-main">

        <!-- Search bar (repeat) -->
        <div class="results-search-bar q-card mb-3">
          <i class="bi bi-search rsb-icon"></i>
          <input class="rsb-input" [value]="queryText()" (input)="queryText.set($any($event.target).value)" placeholder="Search…" />
          @if (queryText()) {
            <button class="rsb-clear" (click)="queryText.set('')"><i class="bi bi-x-circle-fill"></i></button>
          }
          <span class="rsb-count">{{ filteredResults().length }} result{{ filteredResults().length !== 1 ? 's' : '' }}</span>
        </div>

        <!-- Type tabs -->
        <div class="tab-bar mb-3">
          @for (tab of typeTabs; track tab) {
            <button class="tab-btn" [class.active]="activeType() === tab" (click)="activeType.set(tab)">
              {{ tab }}
              <span class="tab-count">{{ typeCount(tab) }}</span>
            </button>
          }
        </div>

        <!-- Result cards -->
        @if (filteredResults().length > 0) {
          @for (r of filteredResults(); track r.id) {
            <div class="result-card q-card" (click)="router.navigate([r.route])">
              <div class="rc-left">
                <div class="type-icon-wrap" [style.background]="typeColors[r.type] + '22'">
                  <i class="bi {{ typeIcons[r.type] }}" [style.color]="typeColors[r.type]"></i>
                </div>
              </div>
              <div class="rc-body">
                <div class="rc-top">
                  <span class="rc-id">{{ r.id }}</span>
                  <span class="type-chip" [style.background]="typeColors[r.type] + '22'" [style.color]="typeColors[r.type]">{{ r.type }}</span>
                  <span class="status-chip status-{{ r.status.toLowerCase().replace(' ', '-') }}">{{ r.status }}</span>
                </div>
                <div class="rc-title">{{ r.title }}</div>
                <div class="rc-snippet">{{ r.snippet }}</div>
              </div>
              <div class="rc-date">{{ r.date | date:'MMM d, y' }}</div>
            </div>
          }
        } @else {
          <!-- Empty state -->
          <div class="empty-state q-card">
            <i class="bi bi-search empty-icon"></i>
            @if (queryText()) {
              <h3>Nothing for "{{ queryText() }}"</h3>
              <p>Check the site filter or try a different spelling.</p>
            } @else {
              <h3>No results</h3>
              <p>Try adjusting your filters or entering a search term.</p>
            }
          </div>
        }

      </main>
    </div>
  `,
  styles: [`
    .results-layout { display: flex; gap: 1.5rem; padding: 1.5rem; min-height: calc(100vh - 60px); }

    /* Facets */
    .facets-panel { width: 220px; min-width: 200px; flex-shrink: 0; }
    .facet-heading { font-size: 0.875rem; font-weight: 700; color: #0F172A; margin: 0 0 1rem; }
    .facet-section { margin-bottom: 1.25rem; }
    .facet-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94A3B8; margin-bottom: 0.5rem; }
    .facet-check { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #334155; margin-bottom: 0.375rem; cursor: pointer; }
    .facet-check input { accent-color: #2563EB; }
    .facet-select { width: 100%; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.375rem 0.625rem; font-size: 0.8125rem; color: #334155; outline: none; background: #fff; }

    /* Results */
    .results-main { flex: 1; min-width: 0; }
    .results-search-bar { display: flex; align-items: center; gap: 0.625rem; padding: 0.75rem 1rem; }
    .rsb-icon { color: #94A3B8; }
    .rsb-input { flex: 1; border: none; outline: none; font-size: 0.9375rem; background: transparent; color: #0F172A; }
    .rsb-input::placeholder { color: #94A3B8; }
    .rsb-clear { background: none; border: none; color: #94A3B8; cursor: pointer; padding: 0; }
    .rsb-count { font-size: 0.8125rem; color: #94A3B8; white-space: nowrap; }

    .tab-bar { display: flex; gap: 0.25rem; border-bottom: 2px solid #E2E8F0; flex-wrap: wrap; }
    .tab-btn { background: none; border: none; padding: 0.5rem 0.875rem; font-size: 0.8125rem; color: #64748B; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; display: flex; align-items: center; gap: 0.375rem; }
    .tab-btn.active { color: #2563EB; border-bottom-color: #2563EB; font-weight: 600; }
    .tab-count { background: #E2E8F0; color: #475569; border-radius: 20px; padding: 0.05rem 0.4rem; font-size: 0.65rem; font-weight: 700; }

    .result-card { padding: 0.875rem 1.25rem; display: flex; align-items: flex-start; gap: 1rem; cursor: pointer; margin-bottom: 0.75rem; &:hover { border-color: #CBD5E1; box-shadow: 0 2px 12px rgba(0,0,0,0.08); } }
    .rc-left { flex-shrink: 0; }
    .type-icon-wrap { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.0625rem; }
    .rc-body { flex: 1; min-width: 0; }
    .rc-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; flex-wrap: wrap; }
    .rc-id { font-family: monospace; font-size: 0.8rem; color: #64748B; }
    .type-chip { border-radius: 20px; padding: 0.1rem 0.5rem; font-size: 0.7rem; font-weight: 700; }
    .status-chip { border-radius: 20px; padding: 0.1rem 0.5rem; font-size: 0.7rem; font-weight: 600; background: #F1F5F9; color: #475569; }
    .status-open { background: #FEE2E2; color: #DC2626; }
    .status-released { background: #DCFCE7; color: #166534; }
    .status-completed { background: #DCFCE7; color: #166534; }
    .status-in-progress { background: #FEF9C3; color: #713F12; }
    .status-in-approval { background: #FEF9C3; color: #713F12; }
    .status-closed { background: #F1F5F9; color: #475569; }
    .rc-title { font-size: 0.9375rem; font-weight: 600; color: #0F172A; margin-bottom: 0.25rem; }
    .rc-snippet { font-size: 0.8125rem; color: #64748B; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .rc-date { font-size: 0.75rem; color: #94A3B8; white-space: nowrap; flex-shrink: 0; }

    .empty-state { padding: 3rem; text-align: center; color: #94A3B8; display: flex; flex-direction: column; align-items: center; }
    .empty-icon { font-size: 2.5rem; margin-bottom: 1rem; display: block; }
    .empty-state h3 { font-size: 1.125rem; font-weight: 700; color: #334155; margin-bottom: 0.5rem; }
    .empty-state p { font-size: 0.875rem; max-width: 300px; margin: 0; }
  `],
})
export class SearchResultsComponent implements OnInit {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly searchService = inject(SearchService);

  readonly typeIcons = TYPE_ICONS;
  readonly typeColors = TYPE_COLORS;
  readonly typeTabs = ['All', 'Documents', 'NCRs', 'CAPAs', 'Audits', 'Findings', 'People'];
  readonly statusOptions = ['Open', 'In Progress', 'In Approval', 'Released', 'Completed', 'Closed'];

  readonly queryText = signal('');
  readonly activeType = signal('All');
  readonly activeStatuses = signal<Set<string>>(new Set());
  readonly activeSites = signal<Set<string>>(new Set());
  readonly dateRange = signal('all');

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('q') ?? '';
    const type = this.route.snapshot.queryParamMap.get('type') ?? 'All';
    this.queryText.set(q);
    this.activeType.set(type || 'All');
  }

  typeCount(tab: string): number {
    if (tab === 'All') return ALL.length;
    const t = tab.endsWith('s') ? tab.slice(0, -1) : tab;
    return ALL.filter(r => r.type === t || r.type === tab).length;
  }

  toggleStatus(s: string): void {
    this.activeStatuses.update(set => { const n = new Set(set); n.has(s) ? n.delete(s) : n.add(s); return n; });
  }
  toggleSite(s: string): void {
    this.activeSites.update(set => { const n = new Set(set); n.has(s) ? n.delete(s) : n.add(s); return n; });
  }
  clearFilters(): void { this.activeStatuses.set(new Set()); this.activeSites.set(new Set()); this.dateRange.set('all'); }

  readonly filteredResults = computed(() => {
    const q = this.queryText().toLowerCase().trim();
    const tab = this.activeType();
    const statuses = this.activeStatuses();
    return ALL.filter(r => {
      if (q && !r.id.toLowerCase().includes(q) && !r.title.toLowerCase().includes(q) && !r.snippet.toLowerCase().includes(q)) return false;
      if (tab !== 'All' && r.type !== tab && r.type + 's' !== tab) return false;
      if (statuses.size > 0 && !statuses.has(r.status)) return false;
      return true;
    });
  });
}
