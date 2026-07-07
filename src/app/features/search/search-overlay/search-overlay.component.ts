import { Component, inject, signal, computed, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SearchService } from '../../../core/search/search.service';

interface SearchResult {
  id: string;
  type: 'Document' | 'NCR' | 'CAPA' | 'Audit' | 'Finding';
  title: string;
  meta: string;
  status: string;
  route: string;
}

const ALL_RESULTS: SearchResult[] = [
  { id: 'DOC-0042', type: 'Document', title: 'Torque Verification WI', meta: 'Work Instruction · Rev C', status: 'Released', route: '/documents/DOC-0042' },
  { id: 'DOC-0018', type: 'Document', title: 'Control Plan – BIW Brackets', meta: 'Control Plan · Rev B', status: 'Released', route: '/documents/DOC-0018' },
  { id: 'DOC-0031', type: 'Document', title: 'Weld Process PFMEA', meta: 'PFMEA · Rev A', status: 'In Approval', route: '/documents/DOC-0031' },
  { id: 'DOC-0009', type: 'Document', title: 'Assembly Line Quality Procedure', meta: 'Quality Procedure · Rev D', status: 'Released', route: '/documents/DOC-0009' },
  { id: 'NCR-2026-0147', type: 'NCR', title: 'Bracket dimensional OOT – Station 4', meta: 'Part: BKT-M8-002', status: 'Open', route: '/ncrs/NCR-2026-0147' },
  { id: 'NCR-2026-0139', type: 'NCR', title: 'Surface defect on weld panel', meta: 'Part: WLD-PANEL-007', status: 'Under Review', route: '/ncrs/NCR-2026-0139' },
  { id: 'CAPA-2026-0032', type: 'CAPA', title: 'Weld Station 6 process control gap', meta: 'Champion: Dev Patel', status: 'Open', route: '/capas/CAPA-2026-0032' },
  { id: 'AUD-2026-011', type: 'Audit', title: 'Q3 Production Process Audit', meta: 'Process · 2026-07-10', status: 'Completed', route: '/audits/AUD-2026-011' },
  { id: 'AUD-2026-007', type: 'Audit', title: 'Customer Requirements Audit', meta: 'Customer · 2026-06-10', status: 'In Progress', route: '/audits/AUD-2026-007' },
  { id: 'FND-2026-0061', type: 'Finding', title: 'Setup approval missing — 8.5.1', meta: 'AUD-2026-011 · Major', status: 'Open', route: '/findings/FND-2026-0061' },
];

const RECENT_RECORDS: SearchResult[] = ALL_RESULTS.slice(0, 5);
const RECENT_SEARCHES = ['NCR-2026-0147', 'bracket', 'CAPA weld'];

const TYPE_COLORS: Record<string, string> = {
  Document: '#2563EB', NCR: '#DC2626', CAPA: '#059669', Audit: '#7C3AED', Finding: '#D97706',
};

const DIRECT_ROUTES: Record<string, string> = {
  'NCR-2026-0147': '/ncrs/NCR-2026-0147',
  'DOC-0042': '/documents/DOC-0042',
  'CAPA-2026-0032': '/capas/CAPA-2026-0032',
  'AUD-2026-011': '/audits/AUD-2026-011',
};

@Component({
  selector: 'app-search-overlay',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (search.isOpen()) {
      <div class="overlay-backdrop" (click)="close()">
        <div class="overlay-modal" (click)="$event.stopPropagation()" role="dialog" aria-label="Search">

          <!-- Search input -->
          <div class="search-input-row">
            <i class="bi bi-search si-icon"></i>
            <input #searchInput
                   class="si-input"
                   placeholder="Search records, docs, IDs…"
                   [value]="query()"
                   (input)="onInput($any($event.target).value)"
                   (keydown)="onKeydown($event)"
                   autocomplete="off"
                   spellcheck="false" />
            @if (query()) {
              <button class="si-clear" (click)="clearQuery()"><i class="bi bi-x-circle-fill"></i></button>
            }
            <button class="si-close" (click)="close()"><kbd>Esc</kbd></button>
          </div>

          <div class="overlay-body">
            @if (!query()) {
              <!-- Empty state: recent records + recent searches -->
              <div class="section-label">Recent Records</div>
              @for (r of recentRecords; track r.id; let i = $index) {
                <div class="result-row" [class.highlighted]="highlightedIndex() === i" (click)="navigate(r.route)" (mouseenter)="highlightedIndex.set(i)">
                  <span class="type-dot" [style.background]="typeColors[r.type]"></span>
                  <span class="result-id">{{ r.id }}</span>
                  <span class="result-title">{{ r.title }}</span>
                  <span class="result-status status-chip">{{ r.status }}</span>
                  <i class="bi bi-arrow-return-left row-enter-hint"></i>
                </div>
              }
              <div class="section-label mt-2">Recent Searches</div>
              <div class="recent-searches">
                @for (s of recentSearches; track s) {
                  <button class="recent-chip" (click)="onInput(s)">
                    <i class="bi bi-clock-history me-1"></i>{{ s }}
                  </button>
                }
              </div>
            } @else {
              <!-- Results grouped by type -->
              @for (group of groupedResults(); track group.type) {
                <div class="result-group">
                  <div class="group-header">
                    <span class="group-type">{{ group.type }}s</span>
                    <span class="group-count">{{ group.items.length }}</span>
                  </div>
                  @for (r of group.items; track r.id; let i = $index) {
                    <div class="result-row"
                         [class.highlighted]="highlightedIndex() === flatIndex(group.type, i)"
                         (click)="navigate(r.route)"
                         (mouseenter)="highlightedIndex.set(flatIndex(group.type, i))">
                      <span class="type-dot" [style.background]="typeColors[r.type]"></span>
                      <span class="result-id">{{ r.id }}</span>
                      <span class="result-title">{{ r.title }}</span>
                      <span class="result-meta">{{ r.meta }}</span>
                      <i class="bi bi-arrow-return-left row-enter-hint"></i>
                    </div>
                  }
                  <button class="view-all-link" (click)="viewAll(group.type)">
                    View all {{ group.type }} results <i class="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
              }
              @if (groupedResults().length === 0) {
                <div class="no-results">
                  <i class="bi bi-search no-results-icon"></i>
                  <p>No results for <strong>"{{ query() }}"</strong></p>
                  <p class="no-results-sub">Try a different term or check the spelling.</p>
                </div>
              }
            }
          </div>

          <!-- Footer hint -->
          <div class="overlay-footer">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> open</span>
            <span><kbd>Esc</kbd> close</span>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .overlay-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,0.55); z-index: 2000;
      display: flex; align-items: flex-start; justify-content: center; padding-top: 10vh;
    }
    .overlay-modal {
      background: #fff; border-radius: 16px; width: 640px; max-width: calc(100vw - 2rem);
      max-height: 70vh; display: flex; flex-direction: column;
      box-shadow: 0 25px 80px rgba(0,0,0,0.25);
      animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }

    .search-input-row {
      display: flex; align-items: center; gap: 0.625rem;
      padding: 0.875rem 1rem; border-bottom: 1px solid #E2E8F0;
    }
    .si-icon { font-size: 1.125rem; color: #94A3B8; flex-shrink: 0; }
    .si-input {
      flex: 1; border: none; outline: none; font-size: 1.0625rem; color: #0F172A;
      background: transparent; min-width: 0;
    }
    .si-input::placeholder { color: #94A3B8; }
    .si-clear { background: none; border: none; color: #94A3B8; cursor: pointer; font-size: 0.9rem; padding: 0; }
    .si-close { background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 6px; padding: 0.1rem 0.5rem; font-size: 0.7rem; cursor: pointer; color: #64748B; }

    .overlay-body { flex: 1; overflow-y: auto; padding: 0.75rem 0; }

    .section-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94A3B8; padding: 0 1rem 0.375rem; }
    .result-row {
      display: flex; align-items: center; gap: 0.625rem;
      padding: 0.5rem 1rem; cursor: pointer;
    }
    .result-row.highlighted { background: #F0F9FF; }
    .type-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .result-id { font-size: 0.8125rem; font-family: monospace; color: #64748B; min-width: 140px; white-space: nowrap; }
    .result-title { font-size: 0.875rem; font-weight: 500; color: #0F172A; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .result-meta { font-size: 0.75rem; color: #94A3B8; white-space: nowrap; }
    .result-status { font-size: 0.7rem; white-space: nowrap; }
    .status-chip { background: #F1F5F9; color: #475569; border-radius: 20px; padding: 0.1rem 0.5rem; font-weight: 600; }
    .row-enter-hint { font-size: 0.75rem; color: #CBD5E1; margin-left: auto; flex-shrink: 0; }

    .recent-searches { display: flex; gap: 0.5rem; flex-wrap: wrap; padding: 0.375rem 1rem; }
    .recent-chip { background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 20px; padding: 0.25rem 0.75rem; font-size: 0.8125rem; color: #475569; cursor: pointer; }
    .recent-chip:hover { background: #E2E8F0; }

    .result-group { margin-bottom: 0.5rem; }
    .group-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem 0.25rem; }
    .group-type { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94A3B8; }
    .group-count { background: #E2E8F0; color: #475569; border-radius: 20px; padding: 0.05rem 0.5rem; font-size: 0.7rem; font-weight: 600; }
    .view-all-link { background: none; border: none; color: #2563EB; font-size: 0.8125rem; cursor: pointer; padding: 0.25rem 1rem 0.5rem; display: block; width: 100%; text-align: left; }
    .view-all-link:hover { text-decoration: underline; }

    .no-results { padding: 2.5rem; text-align: center; color: #64748B; }
    .no-results-icon { font-size: 2.5rem; color: #CBD5E1; display: block; margin-bottom: 0.75rem; }
    .no-results-sub { font-size: 0.875rem; color: #94A3B8; margin: 0; }

    .overlay-footer {
      border-top: 1px solid #E2E8F0; padding: 0.5rem 1rem;
      display: flex; gap: 1rem; font-size: 0.75rem; color: #94A3B8;
    }
    kbd { background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 4px; padding: 0.05rem 0.35rem; font-size: 0.7rem; color: #475569; font-family: inherit; }
    .mt-2 { margin-top: 0.75rem; }
  `],
})
export class SearchOverlayComponent implements AfterViewInit {
  readonly search = inject(SearchService);
  private readonly router = inject(Router);

  readonly typeColors = TYPE_COLORS;
  readonly recentRecords = RECENT_RECORDS;
  readonly recentSearches = RECENT_SEARCHES;
  readonly highlightedIndex = signal(-1);

  @ViewChild('searchInput') inputRef!: ElementRef<HTMLInputElement>;

  ngAfterViewInit(): void {
    // focus handled via effect when isOpen changes
  }

  readonly query = this.search.query;

  readonly groupedResults = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return [];
    const matched = ALL_RESULTS.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.meta.toLowerCase().includes(q)
    );
    const types = ['Document', 'NCR', 'CAPA', 'Audit', 'Finding'] as const;
    return types
      .map(type => ({ type, items: matched.filter(r => r.type === type) }))
      .filter(g => g.items.length > 0);
  });

  // Flat index for arrow key navigation across groups
  private get flatResults(): SearchResult[] {
    return this.groupedResults().flatMap(g => g.items);
  }

  flatIndex(type: string, indexInGroup: number): number {
    let offset = 0;
    for (const g of this.groupedResults()) {
      if (g.type === type) return offset + indexInGroup;
      offset += g.items.length;
    }
    return -1;
  }

  onInput(value: string): void {
    this.search.query.set(value);
    this.highlightedIndex.set(-1);
  }

  clearQuery(): void {
    this.search.query.set('');
    this.highlightedIndex.set(-1);
    this.inputRef?.nativeElement.focus();
  }

  close(): void {
    this.search.close();
  }

  onKeydown(e: KeyboardEvent): void {
    const results = this.query() ? this.flatResults : this.recentRecords;
    const max = results.length - 1;

    if (e.key === 'Escape') { this.close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.highlightedIndex.update(i => Math.min(i + 1, max));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.highlightedIndex.update(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const q = this.query().trim();
      // exact ID match — direct navigate
      if (DIRECT_ROUTES[q.toUpperCase()] || DIRECT_ROUTES[q]) {
        this.navigate(DIRECT_ROUTES[q.toUpperCase()] ?? DIRECT_ROUTES[q]);
        return;
      }
      const idx = this.highlightedIndex();
      const item = results[idx >= 0 ? idx : 0];
      if (item) this.navigate(item.route);
      else if (q) this.navigateToSearch(q);
    }
  }

  navigate(route: string): void {
    this.close();
    this.router.navigate([route]);
  }

  navigateToSearch(q: string): void {
    this.close();
    this.router.navigate(['/search'], { queryParams: { q } });
  }

  viewAll(type: string): void {
    this.close();
    this.router.navigate(['/search'], { queryParams: { q: this.query(), type } });
  }

  // Called by shell to focus after open
  focusInput(): void {
    setTimeout(() => this.inputRef?.nativeElement.focus(), 50);
  }
}
