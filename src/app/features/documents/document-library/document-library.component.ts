import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { QDocument, DocumentStatus } from '../../../shared/interfaces/models';
import { AuthStore } from '../../../core/auth/stores/auth.store';

interface ActiveFilter { key: string; label: string; value: string; }

@Component({
  selector: 'app-document-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Document Library</h1>
          <p class="page-sub">{{ pageSubtitle() }}</p>
        </div>
        <div class="d-flex gap-2">
          @if (canAuthorDocs()) {
            <button class="btn btn-outline-secondary btn-sm"
                    title="View documents that have been retired — kept for audit traceability"
                    (click)="router.navigate(['/documents/obsolete'])">
              <i class="bi bi-archive me-1"></i> Obsolete
            </button>
          }
          @if (canAdminDocs()) {
            <button class="btn btn-outline-secondary btn-sm"
                    title="Bulk import multiple documents from a CSV template"
                    (click)="router.navigate(['/documents/import'])">
              <i class="bi bi-upload me-1"></i> Import
            </button>
          }
          @if (canAuthorDocs()) {
            <button class="btn btn-primary new-btn"
                    title="Create a new controlled document and submit it for approval"
                    (click)="router.navigate(['/documents/new'])">
              <i class="bi bi-plus-lg me-1"></i> New Document
            </button>
          }
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="filter-bar-left">
          <!-- Search -->
          <div class="search-wrap">
            <i class="bi bi-search search-icon"></i>
            <input class="filter-input search-input" placeholder="Search documents…"
                   [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" />
            @if (searchQuery) {
              <button class="clear-search" (click)="searchQuery=''; onSearch()">
                <i class="bi bi-x"></i>
              </button>
            }
          </div>

          <!-- Status -->
          <div class="dropdown-wrap">
            <button class="filter-btn" [class.active]="statusFilter()"
                    (click)="toggleDropdown('status')">
              Status @if (statusFilter()) { <span class="filter-dot"></span> }
              <i class="bi bi-chevron-down ms-1 small"></i>
            </button>
            @if (openDropdown() === 'status') {
              <div class="filter-dropdown">
                @for (s of statusOptions; track s) {
                  <button class="filter-dd-item" [class.selected]="statusFilter()===s"
                          (click)="statusFilter.set(s); openDropdown.set('')">
                    @if (statusFilter()===s) { <i class="bi bi-check me-2"></i> }
                    <span class="chip chip-sm {{ statusChipClass(s) }}">{{ s }}</span>
                  </button>
                }
                @if (statusFilter()) {
                  <button class="filter-dd-clear" (click)="statusFilter.set(''); openDropdown.set('')">
                    Clear
                  </button>
                }
              </div>
            }
          </div>

          <!-- Type -->
          <div class="dropdown-wrap">
            <button class="filter-btn" [class.active]="typeFilter()"
                    (click)="toggleDropdown('type')">
              Type @if (typeFilter()) { <span class="filter-dot"></span> }
              <i class="bi bi-chevron-down ms-1 small"></i>
            </button>
            @if (openDropdown() === 'type') {
              <div class="filter-dropdown">
                @for (t of typeOptions; track t) {
                  <button class="filter-dd-item" [class.selected]="typeFilter()===t"
                          (click)="typeFilter.set(t); openDropdown.set('')">
                    @if (typeFilter()===t) { <i class="bi bi-check me-2"></i> } {{ t }}
                  </button>
                }
                @if (typeFilter()) {
                  <button class="filter-dd-clear" (click)="typeFilter.set(''); openDropdown.set('')">
                    Clear
                  </button>
                }
              </div>
            }
          </div>

          <!-- Owner -->
          <div class="dropdown-wrap">
            <button class="filter-btn" [class.active]="ownerFilter()"
                    (click)="toggleDropdown('owner')">
              Owner @if (ownerFilter()) { <span class="filter-dot"></span> }
              <i class="bi bi-chevron-down ms-1 small"></i>
            </button>
            @if (openDropdown() === 'owner') {
              <div class="filter-dropdown">
                @for (o of ownerOptions(); track o) {
                  <button class="filter-dd-item" [class.selected]="ownerFilter()===o"
                          (click)="ownerFilter.set(o); openDropdown.set('')">
                    @if (ownerFilter()===o) { <i class="bi bi-check me-2"></i> } {{ o }}
                  </button>
                }
                @if (ownerFilter()) {
                  <button class="filter-dd-clear" (click)="ownerFilter.set(''); openDropdown.set('')">
                    Clear
                  </button>
                }
              </div>
            }
          </div>
        </div>

        <div class="filter-bar-right">
          <!-- Saved Views -->
          <div class="dropdown-wrap">
            <button class="filter-btn" (click)="toggleDropdown('views')">
              <i class="bi bi-bookmark me-1"></i> Saved Views
              <i class="bi bi-chevron-down ms-1 small"></i>
            </button>
            @if (openDropdown() === 'views') {
              <div class="filter-dropdown filter-dropdown-right">
                @for (v of savedViews; track v) {
                  <button class="filter-dd-item" (click)="applySavedView(v); openDropdown.set('')">
                    <i class="bi bi-bookmark me-2"></i> {{ v }}
                  </button>
                }
              </div>
            }
          </div>

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
          <span class="result-count">{{ filteredDocs().length }} documents</span>
        </div>
        <div class="table-scroll">
          <table class="q-table doc-table">
            <thead>
              <tr>
                <th style="width:110px">ID</th>
                <th>Title</th>
                <th style="width:140px">Type</th>
                <th style="width:60px">Tier</th>
                <th style="width:55px">Rev</th>
                <th style="width:120px">Status</th>
                <th style="width:120px">Owner</th>
                <th style="width:115px">Review Due</th>
                <th style="width:130px">Clauses</th>
                <th style="width:100px" class="action-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (doc of filteredDocs(); track doc.id) {
                <tr class="doc-row" (click)="navigate(doc)">
                  <td><span class="record-id">{{ doc.id }}</span></td>
                  <td class="title-cell" [title]="doc.title">{{ doc.title }}</td>
                  <td>
                    <span class="type-badge">{{ doc.type }}</span>
                  </td>
                  <td class="text-center">
                    <span class="tier-badge">T{{ tierFor(doc.type) }}</span>
                  </td>
                  <td class="text-center fw-600">Rev {{ doc.revision }}</td>
                  <td><span class="chip chip-sm {{ statusChipClass(doc.status) }}">{{ doc.status }}</span></td>
                  <td>
                    <div class="owner-cell">
                      <span class="owner-av" [style.background]="ownerColor(doc.owner)">{{ doc.ownerInitials }}</span>
                      <span class="owner-nm">{{ doc.owner.split(' ')[0] }}</span>
                    </div>
                  </td>
                  <td>
                    <span [class]="reviewDueClass(doc)">{{ reviewDueLabel(doc) }}</span>
                  </td>
                  <td>
                    <div class="clause-chips">
                      @for (c of clausesFor(doc.id); track c) {
                        <span class="clause-chip">{{ c }}</span>
                      }
                    </div>
                  </td>
                  <td class="action-col">
                    @if (canAuthorDocs()) {
                      <div class="row-actions">
                        <button class="row-action-btn"
                                title="Start a new revision of this document"
                                (click)="$event.stopPropagation(); router.navigate(['/documents', doc.id, 'edit'])">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="row-action-btn"
                                title="Send this document to users and track acknowledgments"
                                (click)="$event.stopPropagation(); router.navigate(['/documents', doc.id, 'distribution'])">
                          <i class="bi bi-send"></i>
                        </button>
                        <button class="row-action-btn" title="More actions"
                                (click)="$event.stopPropagation()">
                          <i class="bi bi-three-dots"></i>
                        </button>
                      </div>
                    }
                  </td>
                </tr>
              }
              @if (filteredDocs().length === 0) {
                <tr>
                  <td colspan="10" class="empty-row">
                    <i class="bi bi-search me-2"></i> No documents match the current filters
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Overlay to close dropdowns -->
    @if (openDropdown()) {
      <div class="dd-overlay" (click)="openDropdown.set('')"></div>
    }
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem; }
    .page-title { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0 0 0.2rem; }
    .page-sub { font-size: 0.875rem; color: #64748B; margin: 0; }
    .new-btn { background: #2563EB; border: none; font-weight: 600; font-size: 0.875rem; padding: 0.5rem 1rem; border-radius: 8px; }

    /* Filter bar */
    .filter-bar { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .filter-bar-left, .filter-bar-right { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .search-wrap { position: relative; display: flex; align-items: center; }
    .search-icon { position: absolute; left: 0.625rem; color: #94A3B8; font-size: 0.875rem; pointer-events: none; }
    .search-input { padding-left: 2rem !important; width: 220px; }
    .clear-search { position: absolute; right: 0.5rem; background: none; border: none; color: #94A3B8; cursor: pointer; padding: 0; line-height: 1; }
    .filter-input { height: 34px; border: 1.5px solid #E2E8F0; border-radius: 6px; font-size: 0.8125rem; padding: 0 0.75rem; outline: none; &:focus { border-color: #2563EB; } }
    .filter-btn { height: 34px; background: #fff; border: 1.5px solid #E2E8F0; border-radius: 6px; font-size: 0.8125rem; padding: 0 0.75rem; cursor: pointer; color: #475569; display: flex; align-items: center; gap: 0.25rem; white-space: nowrap; transition: border-color 150ms; &:hover { border-color: #CBD5E1; } &.active { border-color: #2563EB; color: #2563EB; background: #EFF6FF; } }
    .filter-dot { width: 6px; height: 6px; border-radius: 50%; background: #2563EB; display: inline-block; }
    .btn-clear-all { background: none; border: none; font-size: 0.8125rem; color: #94A3B8; cursor: pointer; padding: 4px 8px; display: flex; align-items: center; &:hover { color: #475569; } }

    /* Dropdowns */
    .dropdown-wrap { position: relative; }
    .filter-dropdown { position: absolute; top: calc(100% + 4px); left: 0; background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); min-width: 160px; z-index: 300; padding: 4px 0; }
    .filter-dropdown-right { left: auto; right: 0; }
    .filter-dd-item { display: flex; align-items: center; width: 100%; padding: 0.4rem 0.75rem; background: none; border: none; text-align: left; font-size: 0.8125rem; color: #334155; cursor: pointer; &:hover { background: #F8FAFC; } &.selected { font-weight: 600; color: #2563EB; } }
    .filter-dd-clear { display: block; width: 100%; padding: 0.375rem 0.75rem; background: none; border: none; border-top: 1px solid #F1F5F9; text-align: left; font-size: 0.75rem; color: #94A3B8; cursor: pointer; margin-top: 4px; &:hover { color: #475569; } }
    .dd-overlay { position: fixed; inset: 0; z-index: 299; }

    /* Active filter chips */
    .active-filters { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 0.875rem; }
    .active-chip { display: inline-flex; align-items: center; gap: 0.25rem; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 20px; padding: 2px 6px 2px 10px; font-size: 0.75rem; color: #1D4ED8; }
    .active-chip-label { font-weight: 600; }
    .active-chip-remove { background: none; border: none; cursor: pointer; color: #93C5FD; padding: 0; line-height: 1; display: flex; align-items: center; &:hover { color: #1D4ED8; } }

    /* Table */
    .table-card { overflow: hidden; }
    .table-meta { padding: 0.625rem 1.25rem; border-bottom: 1px solid #F1F5F9; display: flex; align-items: center; }
    .result-count { font-size: 0.8125rem; color: #64748B; }
    .table-scroll { overflow-x: auto; }
    .doc-table { width: 100%; }
    .doc-row { cursor: pointer; &:hover { background: #F8FAFC; } &:hover .row-actions { opacity: 1; pointer-events: auto; } }
    .title-cell { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; color: #0F172A; }
    .type-badge { font-size: 11px; background: #F1F5F9; color: #475569; border-radius: 4px; padding: 2px 6px; white-space: nowrap; }
    .tier-badge { font-size: 11px; background: #E0E7FF; color: #4338CA; border-radius: 4px; padding: 2px 6px; font-weight: 700; }
    .fw-600 { font-weight: 600; font-size: 0.8125rem; }
    .owner-cell { display: flex; align-items: center; gap: 0.375rem; }
    .owner-av { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .owner-nm { font-size: 0.8125rem; color: #475569; }
    .clause-chips { display: flex; gap: 3px; flex-wrap: wrap; }
    .clause-chip { font-size: 10px; background: #F1F5F9; color: #64748B; border-radius: 4px; padding: 1px 5px; }
    .review-due-ok { font-size: 0.8125rem; color: #059669; }
    .review-due-warn { font-size: 0.8125rem; color: #B45309; font-weight: 600; }
    .review-due-over { font-size: 0.8125rem; color: #DC2626; font-weight: 600; }
    .review-due-none { font-size: 0.8125rem; color: #94A3B8; }
    .chip-sm { font-size: 11px; padding: 2px 8px; }

    /* Row actions */
    .action-col { text-align: right; }
    .row-actions { display: flex; justify-content: flex-end; gap: 4px; opacity: 0; pointer-events: none; transition: opacity 120ms; }
    .row-action-btn { width: 28px; height: 28px; border: 1px solid #E2E8F0; background: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748B; font-size: 0.875rem; &:hover { border-color: #2563EB; color: #2563EB; background: #EFF6FF; } }
    .empty-row { text-align: center; padding: 2.5rem; color: #94A3B8; font-size: 0.875rem; }
  `]
})
export class DocumentLibraryComponent {
  readonly router = inject(Router);
  private mock = inject(MockDataService);
  private auth = inject(AuthStore);

  searchQuery = '';
  readonly statusFilter = signal<string>('');
  readonly typeFilter = signal<string>('');
  readonly ownerFilter = signal<string>('');
  readonly openDropdown = signal<string>('');

  // Role guards
  readonly canAuthorDocs = computed(() =>
    this.auth.hasRole('QE') || this.auth.hasRole('ME') ||
    this.auth.hasRole('QM') || this.auth.hasRole('Director') || this.auth.hasRole('PM')
  );
  readonly canAdminDocs = computed(() =>
    this.auth.hasRole('QM') || this.auth.hasRole('Director')
  );

  // Dynamic page subtitle
  readonly pageSubtitle = computed(() => {
    const isReadOnly = this.auth.hasRole('Operator') || this.auth.hasRole('QT');
    const siteId = this.auth.currentUser()?.siteId;
    const siteName = this.mock.sites.find(s => s.id === siteId)?.name ?? '';
    if (isReadOnly) return `Procedures and work instructions${siteName ? ' · ' + siteName : ''}`;
    return `Controlled documents${siteName ? ' · ' + siteName : ' across all sites'}`;
  });

  readonly statusOptions: DocumentStatus[] = ['Released', 'Draft', 'In Approval', 'Superseded', 'Obsolete'];
  readonly typeOptions = ['Work Instruction', 'Control Plan', 'Quality Procedure', 'Form', 'PFMEA', 'MSA Study'];
  readonly ownerOptions = computed(() => [...new Set(this.mock.siteDocuments().map(d => d.owner))].sort());
  readonly savedViews = ['My Documents', 'Due for Review', 'In Approval', 'Recently Updated'];

  readonly searchSig = signal<string>('');

  readonly filteredDocs = computed(() => {
    const q = this.searchSig().toLowerCase();
    const s = this.statusFilter();
    const t = this.typeFilter();
    const o = this.ownerFilter();
    return this.mock.siteDocuments().filter(d => {
      if (s && d.status !== s) return false;
      if (t && d.type !== t) return false;
      if (o && d.owner !== o) return false;
      if (q && !d.title.toLowerCase().includes(q) && !d.id.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  readonly activeFilters = computed<ActiveFilter[]>(() => {
    const f: ActiveFilter[] = [];
    if (this.searchSig()) f.push({ key: 'search', label: 'Search', value: this.searchSig() });
    if (this.statusFilter()) f.push({ key: 'status', label: 'Status', value: this.statusFilter() });
    if (this.typeFilter()) f.push({ key: 'type', label: 'Type', value: this.typeFilter() });
    if (this.ownerFilter()) f.push({ key: 'owner', label: 'Owner', value: this.ownerFilter() });
    return f;
  });

  onSearch(): void { this.searchSig.set(this.searchQuery); }

  toggleDropdown(key: string): void {
    this.openDropdown.set(this.openDropdown() === key ? '' : key);
  }

  removeFilter(key: string): void {
    if (key === 'search') { this.searchQuery = ''; this.searchSig.set(''); }
    else if (key === 'status') this.statusFilter.set('');
    else if (key === 'type') this.typeFilter.set('');
    else if (key === 'owner') this.ownerFilter.set('');
  }

  clearAll(): void {
    this.searchQuery = ''; this.searchSig.set('');
    this.statusFilter.set(''); this.typeFilter.set(''); this.ownerFilter.set('');
  }

  applySavedView(view: string): void {
    this.clearAll();
    if (view === 'In Approval') this.statusFilter.set('In Approval');
    else if (view === 'Due for Review') this.statusFilter.set('Released');
    else if (view === 'My Documents') this.ownerFilter.set(this.auth.fullName());
  }

  navigate(doc: QDocument): void { this.router.navigate(['/documents', doc.id]); }

  statusChipClass(s: string): string {
    const m: Record<string, string> = {
      'Released': 'chip-released', 'Draft': 'chip-draft',
      'In Approval': 'chip-in-approval', 'Superseded': 'chip-superseded',
      'Obsolete': 'chip-obsolete',
    };
    return m[s] ?? '';
  }

  tierFor(type: string): number {
    const t: Record<string, number> = {
      'Quality Procedure': 2, 'Work Instruction': 3, 'Form': 4,
      'Control Plan': 3, 'PFMEA': 3, 'MSA Study': 3,
    };
    return t[type] ?? 3;
  }

  ownerColor(owner: string): string {
    const u = this.mock.users.find(u => u.fullName === owner);
    return u?.avatarColor ?? '#64748B';
  }

  clausesFor(id: string): string[] {
    const m: Record<string, string[]> = {
      'DOC-0001': ['8.5.1'], 'DOC-0003': ['8.5.1', '8.5.6'],
      'DOC-0007': ['9.2'], 'DOC-0012': ['7.1.5'], 'DOC-0018': ['8.3.3'],
      'DOC-0021': ['8.4.3'], 'DOC-0024': ['8.5.6', '10.2'],
      'DOC-0030': ['8.5.1'], 'DOC-0033': ['8.5.1'], 'DOC-0042': ['8.5.1'],
      'DOC-0048': ['8.5.1'], 'DOC-0037': ['7.1.5'], 'DOC-0041': ['8.4.1'],
    };
    return m[id] ?? [];
  }

  reviewDueLabel(doc: QDocument): string {
    if (!doc.nextReview) return '—';
    const d = doc.daysUntilReview;
    if (d < 0) return `${Math.abs(d)}d overdue`;
    if (d === 0) return 'Today';
    if (d <= 14) return `${d}d`;
    return doc.nextReview;
  }

  reviewDueClass(doc: QDocument): string {
    if (!doc.nextReview) return 'review-due-none';
    const d = doc.daysUntilReview;
    if (d < 0) return 'review-due-over';
    if (d <= 14) return 'review-due-warn';
    return 'review-due-ok';
  }
}
