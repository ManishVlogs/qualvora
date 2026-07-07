import { Component, inject, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentStorageService } from '../../../shared/services/document-storage.service';
import { DocumentFileStoreService } from '../../../shared/services/document-file-store.service';
import { DocRevision } from '../../../shared/interfaces/models';

interface DiffRow {
  field: string;
  oldVal: string;
  newVal: string;
  changed: boolean;
}

@Component({
  selector: 'app-document-compare',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">

      @if (!doc()) {
        <div class="q-card p-4 text-center text-muted">Document not found.</div>
      } @else if (allRevisions().length < 2) {
        <div class="q-card p-4 text-center text-muted">
          Only one revision exists — nothing to compare.
        </div>
      } @else {

        <!-- Header -->
        <div class="cmp-header q-card shadow-sm mb-3">
          <button class="back-btn" (click)="router.navigate(['/documents', docId])">
            <i class="bi bi-arrow-left me-1"></i> Back to Document
          </button>
          <div class="cmp-title-row">
            <h1 class="cmp-title">
              Comparing Rev {{ leftRev()?.rev ?? '?' }} vs Rev {{ rightRev()?.rev ?? '?' }}
            </h1>
            <span class="cmp-doc-name">{{ doc()!.title }} — {{ doc()!.id }}</span>
          </div>

          <!-- Revision selectors -->
          <div class="rev-selectors">
            <label class="sel-label">Left revision</label>
            <select class="form-select form-select-sm sel-input"
                    [ngModel]="selectedLeft()"
                    (ngModelChange)="selectedLeft.set($event)">
              @for (r of allRevisions(); track r.rev) {
                <option [value]="r.rev">Rev {{ r.rev }} — {{ r.status }}</option>
              }
            </select>
            <i class="bi bi-arrow-left-right sel-arrow"></i>
            <label class="sel-label">Right revision</label>
            <select class="form-select form-select-sm sel-input"
                    [ngModel]="selectedRight()"
                    (ngModelChange)="selectedRight.set($event)">
              @for (r of allRevisions(); track r.rev) {
                <option [value]="r.rev">Rev {{ r.rev }} — {{ r.status }}</option>
              }
            </select>
          </div>
        </div>

        @if (selectedLeft() === selectedRight()) {
          <div class="q-card p-3 mb-3 text-center text-muted">
            Select two different revisions to compare.
          </div>
        } @else {

          <!-- Two-pane preview -->
          <div class="panes-row">
            <!-- Left pane -->
            <div class="pane-card q-card">
              <div class="pane-header" [class.pane-header-blue]="leftRev()?.rev === currentRev()" [class.pane-header-gray]="leftRev()?.rev !== currentRev()">
                <span class="pane-rev">Rev {{ leftRev()?.rev }}</span>
                <span class="chip chip-sm {{ chipClass(leftRev()?.status) }}">{{ leftRev()?.status }}</span>
                @if (leftRev()?.rev === currentRev()) {
                  <span class="current-badge">Current</span>
                }
                <span class="pane-date ms-auto">{{ leftRev()?.releasedDate ?? '—' }}</span>
              </div>
              <div class="pdf-placeholder">
                @if (leftRev()?.rev === currentRev() && pdfUrl()) {
                  <iframe [src]="pdfUrl()!" class="pane-pdf-iframe" title="Document PDF viewer" aria-label="PDF document viewer"></iframe>
                } @else {
                  <div class="pdf-bg">
                    <i class="bi bi-file-earmark-pdf pdf-icon"></i>
                    <span class="pdf-label">Rev {{ leftRev()?.rev }} · {{ doc()!.title }}</span>
                    @if (leftRev()?.rev !== currentRev()) {
                      <span class="pdf-archive-note">Historical archive</span>
                    }
                  </div>
                }
                <div class="pane-change-overlay">
                  <span class="pane-change-text">{{ leftRev()?.changeSummary }}</span>
                </div>
              </div>
            </div>

            <!-- Right pane -->
            <div class="pane-card q-card">
              <div class="pane-header" [class.pane-header-blue]="rightRev()?.rev === currentRev()" [class.pane-header-gray]="rightRev()?.rev !== currentRev()">
                <span class="pane-rev">Rev {{ rightRev()?.rev }}</span>
                <span class="chip chip-sm {{ chipClass(rightRev()?.status) }}">{{ rightRev()?.status }}</span>
                @if (rightRev()?.rev === currentRev()) {
                  <span class="current-badge">Current</span>
                }
                <span class="pane-date ms-auto">{{ rightRev()?.releasedDate ?? '—' }}</span>
              </div>
              <div class="pdf-placeholder">
                @if (rightRev()?.rev === currentRev() && pdfUrl()) {
                  <iframe [src]="pdfUrl()!" class="pane-pdf-iframe" title="Document PDF viewer" aria-label="PDF document viewer"></iframe>
                } @else {
                  <div class="pdf-bg">
                    <i class="bi bi-file-earmark-pdf pdf-icon"></i>
                    <span class="pdf-label">Rev {{ rightRev()?.rev }} · {{ doc()!.title }}</span>
                    @if (rightRev()?.rev !== currentRev()) {
                      <span class="pdf-archive-note">Historical archive</span>
                    }
                  </div>
                }
                <div class="pane-change-overlay">
                  <span class="pane-change-text">{{ rightRev()?.changeSummary }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Metadata diff -->
          <div class="q-card meta-diff-card">
            <div class="meta-diff-header">Changed Fields</div>
            <table class="meta-diff-table">
              <thead>
                <tr>
                  <th style="width:160px">Field</th>
                  <th>Rev {{ leftRev()?.rev }}</th>
                  <th>Rev {{ rightRev()?.rev }}</th>
                </tr>
              </thead>
              <tbody>
                @for (row of diffRows(); track row.field) {
                  <tr [class.changed-row]="row.changed">
                    <td class="field-col">{{ row.field }}</td>
                    <td [class.old-val]="row.changed">{{ row.oldVal }}</td>
                    <td [class.new-val]="row.changed">
                      {{ row.newVal }}
                      @if (row.changed) { <span class="diff-badge ms-1">Changed</span> }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Change summary (newer side) -->
          @if (newerRev(); as nr) {
            <div class="q-card change-summary-card">
              <div class="cs-header">Change Summary (Rev {{ nr.rev }})</div>
              <p class="cs-text">{{ nr.changeSummary }}</p>
              <div class="cs-meta">
                <span><i class="bi bi-person me-1"></i>Changed by: {{ nr.releasedBy ?? '—' }}</span>
                <span><i class="bi bi-calendar me-1"></i>Revision Date: {{ nr.releasedDate ?? '—' }}</span>
              </div>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1300px; margin: 0 auto; }
    .cmp-header { padding: 1rem 1.25rem; }
    .back-btn { background: none; border: none; font-size: 0.8125rem; color: #64748B; cursor: pointer; padding: 0 0 0.625rem; display: flex; align-items: center; &:hover { color: #2563EB; } }
    .cmp-title-row { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
    .cmp-title { font-size: 1.25rem; font-weight: 700; color: #0F172A; margin: 0; }
    .cmp-doc-name { font-size: 0.875rem; color: #64748B; }

    .rev-selectors { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .sel-label { font-size: 0.8125rem; color: #64748B; white-space: nowrap; margin: 0; }
    .sel-input { width: 220px; }
    .sel-arrow { font-size: 1rem; color: #94A3B8; }

    .panes-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .pane-card { overflow: hidden; }
    .pane-header { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; font-size: 0.875rem; }
    .pane-header-gray { background: #F8FAFC; border-bottom: 1px solid #E2E8F0; }
    .pane-header-blue { background: #EFF6FF; border-bottom: 1px solid #BFDBFE; }
    .pane-rev { font-weight: 700; font-size: 1rem; color: #0F172A; }
    .pane-date { font-size: 0.8125rem; color: #64748B; }
    .chip-sm { font-size: 11px; padding: 2px 8px; }
    .current-badge { background: #DCFCE7; color: #166534; border-radius: 4px; padding: 2px 7px; font-size: 11px; font-weight: 600; }

    .pdf-placeholder { position: relative; height: 280px; background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 4px; margin: 1rem; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-direction: column; gap: 0.5rem; }
    .pdf-bg { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: #94A3B8; }
    .pdf-icon { font-size: 3rem; color: #CBD5E1; }
    .pdf-label { font-size: 0.8125rem; }
    .pdf-archive-note { font-size: 0.75rem; color: #94A3B8; background: #F1F5F9; border-radius: 4px; padding: 2px 8px; }
    .pane-pdf-iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
    .pane-change-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(255,255,255,0.92); border-top: 1px solid #E2E8F0; padding: 0.5rem 0.75rem; }
    .pane-change-text { font-size: 0.8125rem; color: #475569; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .meta-diff-card { margin-bottom: 1rem; overflow: hidden; }
    .meta-diff-header { padding: 0.75rem 1.25rem; font-weight: 700; font-size: 0.875rem; color: #0F172A; border-bottom: 1px solid #F1F5F9; }
    .meta-diff-table { width: 100%; border-collapse: collapse; }
    .meta-diff-table th { padding: 0.5rem 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #64748B; border-bottom: 1px solid #E2E8F0; background: #F8FAFC; }
    .meta-diff-table td { padding: 0.625rem 1rem; font-size: 0.875rem; color: #334155; border-bottom: 1px solid #F1F5F9; }
    .field-col { font-weight: 500; color: #475569; }
    .changed-row { background: #FFFBEB; }
    .old-val { text-decoration: line-through; color: #94A3B8; }
    .new-val { font-weight: 600; color: #0F172A; }
    .diff-badge { background: #FEF3C7; color: #92400E; border-radius: 4px; padding: 1px 5px; font-size: 10px; font-weight: 600; }

    .change-summary-card { padding: 1.25rem; }
    .cs-header { font-weight: 700; font-size: 0.875rem; color: #0F172A; margin-bottom: 0.625rem; }
    .cs-text { font-size: 0.875rem; color: #475569; line-height: 1.6; margin-bottom: 0.75rem; }
    .cs-meta { display: flex; gap: 1.5rem; font-size: 0.8125rem; color: #64748B; }
  `]
})
export class DocumentCompareComponent {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly docStorage = inject(DocumentStorageService);
  private readonly fileStore = inject(DocumentFileStoreService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly docId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly doc = this.docStorage.getById(this.docId);

  readonly pdfBlobUrl = signal<string | null>(null);
  readonly pdfUrl = computed((): SafeResourceUrl | null => {
    const url = this.pdfBlobUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  readonly allRevisions = computed((): DocRevision[] => {
    const d = this.doc();
    if (!d) return [];
    if (d.revisions?.length) return d.revisions;
    // Synthesise a single revision from the current document state when no history exists
    return [{
      rev: d.revision,
      status: d.status,
      releasedBy: d.owner,
      releasedDate: d.lastReviewed ?? undefined,
      changeSummary: 'Initial revision',
    }];
  });

  readonly currentRev = computed(() => this.allRevisions()[0]?.rev ?? '');

  // Mutable signals driven by query params initially, then user selection
  readonly selectedLeft = signal(this.route.snapshot.queryParamMap.get('rev1') ?? '');
  readonly selectedRight = signal(this.route.snapshot.queryParamMap.get('rev2') ?? '');

  constructor() {
    // Default to latest two revisions when query params are absent or invalid
    const revs = this.allRevisions();
    if (revs.length >= 2) {
      const revIds = revs.map(r => r.rev);
      if (!revIds.includes(this.selectedLeft())) this.selectedLeft.set(revs[1].rev);
      if (!revIds.includes(this.selectedRight())) this.selectedRight.set(revs[0].rev);
    }
    this.fileStore.load(this.docId).then(url => { if (url) this.pdfBlobUrl.set(url); });
  }

  readonly leftRev = computed(() =>
    this.allRevisions().find(r => r.rev === this.selectedLeft())
  );

  readonly rightRev = computed(() =>
    this.allRevisions().find(r => r.rev === this.selectedRight())
  );

  /** The newer of the two selected revisions (earlier in the array = more recent) */
  readonly newerRev = computed((): DocRevision | undefined => {
    const revs = this.allRevisions();
    const li = revs.findIndex(r => r.rev === this.selectedLeft());
    const ri = revs.findIndex(r => r.rev === this.selectedRight());
    if (li === -1 || ri === -1) return undefined;
    return li < ri ? this.leftRev() : this.rightRev();
  });

  readonly diffRows = computed((): DiffRow[] => {
    const l = this.leftRev();
    const r = this.rightRev();
    if (!l || !r) return [];
    const d = this.doc();

    const lTitle    = l.title       ?? d?.title  ?? '—';
    const rTitle    = r.title       ?? d?.title  ?? '—';
    const lOwner    = l.owner       ?? d?.owner  ?? '—';
    const rOwner    = r.owner       ?? d?.owner  ?? '—';
    const lType     = l.type        ?? d?.type   ?? '—';
    const rType     = r.type        ?? d?.type   ?? '—';
    const lCycle    = (l.reviewCycle ?? d?.reviewCycle) != null ? `${l.reviewCycle ?? d?.reviewCycle} months` : '—';
    const rCycle    = (r.reviewCycle ?? d?.reviewCycle) != null ? `${r.reviewCycle ?? d?.reviewCycle} months` : '—';
    const lClauses  = (l.clauses    ?? d?.clauses  ?? []).join(', ') || '—';
    const rClauses  = (r.clauses    ?? d?.clauses  ?? []).join(', ') || '—';
    const lAreas    = l.areas       ?? d?.areas  ?? '—';
    const rAreas    = r.areas       ?? d?.areas  ?? '—';

    return [
      { field: 'Status',        oldVal: l.status,               newVal: r.status,               changed: l.status !== r.status },
      { field: 'Title',         oldVal: lTitle,                 newVal: rTitle,                 changed: lTitle !== rTitle },
      { field: 'Document Type', oldVal: lType,                  newVal: rType,                  changed: lType !== rType },
      { field: 'Owner',         oldVal: lOwner,                 newVal: rOwner,                 changed: lOwner !== rOwner },
      { field: 'Areas',         oldVal: lAreas,                 newVal: rAreas,                 changed: lAreas !== rAreas },
      { field: 'Review Cycle',  oldVal: lCycle,                 newVal: rCycle,                 changed: lCycle !== rCycle },
      { field: 'IATF Clauses',  oldVal: lClauses,               newVal: rClauses,               changed: lClauses !== rClauses },
      { field: 'Released By',   oldVal: l.releasedBy  ?? '—',   newVal: r.releasedBy  ?? '—',   changed: l.releasedBy !== r.releasedBy },
      { field: 'Released Date', oldVal: l.releasedDate ?? '—',  newVal: r.releasedDate ?? '—',  changed: l.releasedDate !== r.releasedDate },
      { field: 'Change Notes',  oldVal: l.changeSummary,        newVal: r.changeSummary,        changed: l.changeSummary !== r.changeSummary },
    ];
  });

  chipClass(status: string | undefined): string {
    const map: Record<string, string> = {
      'Draft': 'chip-draft',
      'In Approval': 'chip-approval',
      'Released': 'chip-released',
      'Superseded': 'chip-superseded',
      'Obsolete': 'chip-obsolete',
    };
    return map[status ?? ''] ?? 'chip-minor';
  }
}
