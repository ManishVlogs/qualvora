import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { DocumentFileStoreService } from '../../../shared/services/document-file-store.service';
import { DocRevision } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-document-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-outer">
      <div class="page-form">

        <!-- Header -->
        <div class="form-page-header">
          <button class="back-btn" (click)="cancel()">
            <i class="bi bi-arrow-left me-1"></i>
            {{ isEdit ? 'Back to Document' : 'Document Library' }}
          </button>
          <div class="form-title-row">
            <h1 class="form-title">{{ isEdit ? 'Revise Document' : 'New Document' }}</h1>
            @if (isEdit) {
              <span class="record-id ms-2">{{ docId }}</span>
              <span class="chip chip-in-approval chip-sm ms-2">Rev in progress</span>
            }
          </div>
        </div>

        <!-- Section 1: Metadata -->
        <div class="form-section">
          <div class="section-title">
            <span class="section-num">1</span>
            Document Metadata
          </div>

          <!-- Title -->
          <div class="form-field" [class.has-error]="touched['title'] && !formData.title">
            <label class="field-label">Document Title <span class="req">*</span></label>
            <input type="text" class="form-control field-input"
                   [(ngModel)]="formData.title"
                   (blur)="touch('title')"
                   placeholder="e.g. Weld Station 4 Work Instruction" />
            @if (touched['title'] && !formData.title) {
              <div class="field-error"><i class="bi bi-exclamation-circle me-1"></i>Title is required</div>
            }
          </div>

          <!-- Type + Tier (auto) -->
          <div class="field-row-2">
            <div class="form-field" [class.has-error]="touched['type'] && !formData.type">
              <label class="field-label">Document Type <span class="req">*</span></label>
              <select class="form-select field-input" [(ngModel)]="formData.type" (blur)="touch('type')" (change)="onTypeChange()">
                <option value="">Select type…</option>
                @for (t of docTypes; track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
              @if (touched['type'] && !formData.type) {
                <div class="field-error"><i class="bi bi-exclamation-circle me-1"></i>Document type is required</div>
              }
            </div>

            <div class="form-field">
              <label class="field-label">Tier <span class="auto-badge">Auto</span></label>
              <div class="readonly-field">
                @if (derivedTier()) {
                  <span class="tier-badge">T{{ derivedTier() }}</span>
                  <span class="tier-desc ms-2">{{ tierDesc() }}</span>
                } @else {
                  <span class="placeholder-text">Set after type selection</span>
                }
              </div>
            </div>
          </div>

          <!-- Site + Owner -->
          <div class="field-row-2">
            <div class="form-field" [class.has-error]="touched['site'] && !formData.site">
              <label class="field-label">Site <span class="req">*</span></label>
              <select class="form-select field-input" [(ngModel)]="formData.site" (blur)="touch('site')">
                <option value="">Select site…</option>
                @for (s of sites; track s) { <option [value]="s">{{ s }}</option> }
              </select>
              @if (touched['site'] && !formData.site) {
                <div class="field-error"><i class="bi bi-exclamation-circle me-1"></i>Site is required</div>
              }
            </div>

            <div class="form-field" [class.has-error]="touched['owner'] && !formData.owner">
              <label class="field-label">Owner <span class="req">*</span></label>
              <div class="owner-picker-wrap">
                <select class="form-select field-input" [(ngModel)]="formData.owner" (blur)="touch('owner')">
                  <option value="">Select owner…</option>
                  @for (u of users; track u) { <option [value]="u">{{ u }}</option> }
                </select>
                @if (formData.owner) {
                  <span class="owner-av" [style.background]="ownerColor(formData.owner)">
                    {{ ownerInitials(formData.owner) }}
                  </span>
                }
              </div>
              @if (touched['owner'] && !formData.owner) {
                <div class="field-error"><i class="bi bi-exclamation-circle me-1"></i>Owner is required</div>
              }
            </div>
          </div>

          <!-- Area/Station multi-select -->
          <div class="form-field">
            <label class="field-label">Area / Station</label>
            <div class="multi-check-group">
              @for (a of areas; track a) {
                <label class="check-item">
                  <input type="checkbox" [value]="a"
                         [checked]="formData.areas.includes(a)"
                         (change)="toggleArea(a)" />
                  {{ a }}
                </label>
              }
            </div>
          </div>

          <!-- Parts -->
          <div class="form-field">
            <label class="field-label">Parts</label>
            <input type="text" class="form-control field-input" [(ngModel)]="formData.parts"
                   placeholder="e.g. Part 1147, Part 4471 (comma-separated)" />
          </div>

          <!-- IATF Clauses -->
          <div class="form-field">
            <label class="field-label">IATF 16949 Clauses</label>
            <div class="clause-selector">
              <div class="selected-clauses">
                @for (c of formData.clauses; track c) {
                  <span class="clause-chip">
                    {{ c }}
                    <button class="chip-remove" (click)="removeClause(c)"><i class="bi bi-x"></i></button>
                  </span>
                }
              </div>
              <button class="btn btn-outline-secondary btn-sm clause-picker-btn"
                      (click)="showClausePicker.set(!showClausePicker())">
                <i class="bi bi-plus me-1"></i> Add Clauses
              </button>
            </div>
            @if (showClausePicker()) {
              <div class="clause-picker-dropdown">
                @for (c of availableClauses; track c) {
                  <label class="clause-pick-item">
                    <input type="checkbox" [checked]="formData.clauses.includes(c)"
                           (change)="toggleClause(c)" />
                    <span class="ms-2">{{ c }}</span>
                  </label>
                }
              </div>
            }
          </div>

          <!-- Review Cycle -->
          <div class="form-field">
            <label class="field-label">Review Cycle</label>
            <div class="radio-group">
              @for (r of reviewCycles; track r) {
                <label class="radio-item" [class.selected]="formData.reviewCycle === r">
                  <input type="radio" name="reviewCycle" [value]="r" [(ngModel)]="formData.reviewCycle" />
                  {{ r }} mo
                </label>
              }
            </div>
          </div>

          <!-- Change Summary (revision only) -->
          @if (isEdit) {
            <div class="form-field" [class.has-error]="touched['changeSummary'] && !formData.changeSummary">
              <label class="field-label">Change Summary <span class="req">*</span></label>
              <textarea class="form-control field-input" rows="3" [(ngModel)]="formData.changeSummary"
                        (blur)="touch('changeSummary')"
                        placeholder="Describe what changed in this revision and why…"></textarea>
              @if (touched['changeSummary'] && !formData.changeSummary) {
                <div class="field-error"><i class="bi bi-exclamation-circle me-1"></i>Change summary is required for revisions</div>
              }
            </div>
          }
        </div>

        <!-- Section 2: Content -->
        <div class="form-section">
          <div class="section-title">
            <span class="section-num">2</span>
            Document Content
          </div>

          <div class="content-tabs">
            <button class="content-tab" [class.active]="contentMode()==='upload'" (click)="contentMode.set('upload')">
              <i class="bi bi-cloud-upload me-1"></i> Upload File
            </button>
            <button class="content-tab" [class.active]="contentMode()==='write'" (click)="contentMode.set('write')">
              <i class="bi bi-pencil-square me-1"></i> Write Content
            </button>
          </div>

          @if (contentMode() === 'upload') {
            <div class="upload-zone" [class.drag-over]="dragOver()"
                 (dragover)="$event.preventDefault(); dragOver.set(true)"
                 (dragleave)="dragOver.set(false)"
                 (drop)="onDrop($event)">
              @if (!uploadedFile()) {
                <i class="bi bi-cloud-upload upload-icon"></i>
                <div class="upload-text">Drag & drop PDF or Word document</div>
                <div class="upload-sub">or</div>
                <label class="btn btn-outline-secondary btn-sm upload-btn">
                  Browse Files
                  <input type="file" class="hidden-input" accept=".pdf,.doc,.docx"
                         (change)="onFileSelect($event)" />
                </label>
                <div class="upload-hint">PDF, DOC, DOCX up to 50 MB</div>
              } @else {
                <i class="bi bi-file-earmark-check upload-success-icon"></i>
                <div class="upload-file-name">{{ uploadedFile() }}</div>
                <button class="btn btn-outline-danger btn-sm mt-2" (click)="uploadedFile.set('')">
                  <i class="bi bi-x me-1"></i> Remove
                </button>
              }
            </div>
          }

          @if (contentMode() === 'write') {
            <div class="rich-text-placeholder">
              <div class="rte-toolbar">
                <button class="rte-btn"><i class="bi bi-type-bold"></i></button>
                <button class="rte-btn"><i class="bi bi-type-italic"></i></button>
                <button class="rte-btn"><i class="bi bi-type-underline"></i></button>
                <div class="rte-divider"></div>
                <button class="rte-btn"><i class="bi bi-list-ul"></i></button>
                <button class="rte-btn"><i class="bi bi-list-ol"></i></button>
                <button class="rte-btn"><i class="bi bi-table"></i></button>
                <div class="rte-divider"></div>
                <button class="rte-btn"><i class="bi bi-image"></i></button>
                <button class="rte-btn"><i class="bi bi-link-45deg"></i></button>
              </div>
              <textarea class="rte-body" rows="12" placeholder="Write document content here…"></textarea>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="form-footer">
          <button class="btn btn-outline-secondary me-2" (click)="cancel()">Cancel</button>
          <button class="btn btn-outline-primary me-2" (click)="saveDraft()">
            <i class="bi bi-floppy me-1"></i> Save Draft
          </button>
          <button class="btn btn-success" (click)="submitForApproval()">
            <i class="bi bi-send me-1"></i> Submit for Approval
          </button>
        </div>
      </div>
    </div>

    @if (toast()) {
      <div class="action-toast"><i class="bi bi-check-circle-fill me-2"></i>{{ toast() }}</div>
    }
  `,
  styles: [`
    .page-outer { padding: 1.5rem; background: var(--q-content-bg, #F1F5F9); min-height: 100%; }
    .page-form { max-width: 720px; margin: 0 auto; }

    .form-page-header { margin-bottom: 1.5rem; }
    .back-btn { background: none; border: none; font-size: 0.8125rem; color: #64748B; cursor: pointer; padding: 0 0 0.625rem; display: flex; align-items: center; &:hover { color: #2563EB; } }
    .form-title-row { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
    .form-title { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0; }
    .chip-sm { font-size: 11px; padding: 2px 8px; }

    .form-section { background: #fff; border-radius: 12px; border: 1px solid #E2E8F0; padding: 1.5rem; margin-bottom: 1.25rem; }
    .section-title { display: flex; align-items: center; gap: 0.625rem; font-size: 1rem; font-weight: 700; color: #0F172A; margin-bottom: 1.25rem; }
    .section-num { width: 24px; height: 24px; background: #2563EB; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }

    .form-field { margin-bottom: 1.125rem; }
    .field-label { font-size: 0.8125rem; font-weight: 600; color: #334155; display: block; margin-bottom: 0.375rem; }
    .req { color: #DC2626; }
    .auto-badge { background: #F1F5F9; color: #64748B; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 600; margin-left: 4px; }
    .field-input { font-size: 0.875rem; border: 1.5px solid #E2E8F0; border-radius: 6px; transition: border-color 150ms; &:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); outline: none; } }
    .has-error .field-input, .has-error .form-select { border-color: #DC2626 !important; }
    .field-error { font-size: 0.75rem; color: #DC2626; margin-top: 0.25rem; display: flex; align-items: center; }
    .field-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .readonly-field { background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 6px; padding: 0.5rem 0.875rem; display: flex; align-items: center; min-height: 38px; }
    .tier-badge { background: #E0E7FF; color: #4338CA; border-radius: 4px; padding: 2px 6px; font-size: 11px; font-weight: 700; }
    .tier-desc { font-size: 0.8125rem; color: #64748B; }
    .placeholder-text { font-size: 0.8125rem; color: #94A3B8; }

    .owner-picker-wrap { position: relative; display: flex; align-items: center; }
    .owner-picker-wrap .form-select { padding-right: 2.5rem; }
    .owner-av { position: absolute; right: 0.5rem; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; color: #fff; pointer-events: none; }

    .multi-check-group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .check-item { display: flex; align-items: center; gap: 0.375rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 4px 10px; font-size: 0.8125rem; cursor: pointer; &:has(input:checked) { background: #EFF6FF; border-color: #BFDBFE; color: #1D4ED8; } }

    .clause-selector { display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem; }
    .selected-clauses { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .clause-chip { display: inline-flex; align-items: center; gap: 4px; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 20px; padding: 2px 6px 2px 10px; font-size: 0.8125rem; color: #1D4ED8; font-weight: 600; }
    .chip-remove { background: none; border: none; cursor: pointer; color: #93C5FD; padding: 0; line-height: 1; &:hover { color: #1D4ED8; } }
    .clause-picker-btn { font-size: 0.8125rem; }
    .clause-picker-dropdown { background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.5rem; margin-top: 0.375rem; display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .clause-pick-item { display: flex; align-items: center; background: #F8FAFC; border-radius: 4px; padding: 3px 8px; font-size: 0.8125rem; cursor: pointer; }

    .radio-group { display: flex; gap: 0.625rem; flex-wrap: wrap; }
    .radio-item { display: flex; align-items: center; gap: 0.375rem; background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 6px 14px; font-size: 0.875rem; cursor: pointer; &.selected { background: #EFF6FF; border-color: #2563EB; color: #1D4ED8; font-weight: 600; } input { display: none; } }

    /* Content tabs */
    .content-tabs { display: flex; border-bottom: 2px solid #E2E8F0; margin-bottom: 1rem; }
    .content-tab { padding: 0.5rem 1rem; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; font-size: 0.875rem; color: #64748B; cursor: pointer; display: flex; align-items: center; &.active { color: #2563EB; border-bottom-color: #2563EB; font-weight: 600; } &:hover:not(.active) { color: #2563EB; } }

    /* Upload zone */
    .upload-zone { border: 2px dashed #CBD5E1; border-radius: 10px; padding: 2.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; transition: border-color 150ms, background 150ms; cursor: default; &.drag-over { border-color: #2563EB; background: #EFF6FF; } }
    .upload-icon { font-size: 2.5rem; color: #CBD5E1; }
    .upload-text { font-size: 0.9375rem; font-weight: 500; color: #475569; }
    .upload-sub { font-size: 0.8125rem; color: #94A3B8; }
    .upload-btn { cursor: pointer; }
    .hidden-input { display: none; }
    .upload-hint { font-size: 0.75rem; color: #94A3B8; }
    .upload-success-icon { font-size: 2.5rem; color: #059669; }
    .upload-file-name { font-size: 0.9375rem; font-weight: 500; color: #059669; }

    /* Rich text */
    .rich-text-placeholder { border: 1.5px solid #E2E8F0; border-radius: 8px; overflow: hidden; }
    .rte-toolbar { display: flex; align-items: center; gap: 2px; padding: 0.5rem; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; flex-wrap: wrap; }
    .rte-btn { width: 30px; height: 30px; background: none; border: none; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748B; font-size: 0.875rem; &:hover { background: #E2E8F0; } }
    .rte-divider { width: 1px; height: 20px; background: #E2E8F0; margin: 0 4px; }
    .rte-body { width: 100%; padding: 0.875rem; border: none; outline: none; resize: none; font-size: 0.875rem; color: #334155; }

    /* Footer */
    .form-footer { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1rem 1.5rem; display: flex; justify-content: flex-end; align-items: center; }

    /* Toast */
    .action-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: #0F172A; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; z-index: 400; box-shadow: 0 4px 20px rgba(0,0,0,0.2); display: flex; align-items: center; }
  `]
})
export class DocumentCreateComponent {
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);
  private readonly mock = inject(MockDataService);
  private readonly fileStore = inject(DocumentFileStoreService);

  readonly isEdit = this.route.snapshot.url.some(s => s.path === 'edit');
  readonly docId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly contentMode = signal<'upload' | 'write'>('upload');
  readonly dragOver = signal(false);
  readonly uploadedFile = signal('');
  readonly selectedFile = signal<File | null>(null);
  readonly showClausePicker = signal(false);
  readonly toast = signal('');
  readonly touched: Record<string, boolean> = {};

  readonly docTypes = ['Work Instruction', 'Control Plan', 'Quality Procedure', 'Form', 'PFMEA', 'MSA Study'];
  readonly sites = ['Plant-1', 'Plant-2', 'Plant-3'];
  readonly users = ['Maria Delgado', 'Dev Patel', 'Sarah Chen', 'James Okonkwo', 'Priya Nair', 'Tom Braswell'];
  readonly areas = ['Weld Zone A', 'Weld Zone B', 'Stamping', 'Assembly Line 1', 'Assembly Line 2', 'Paint Shop', 'CMM Area'];
  readonly reviewCycles = [6, 12, 24, 36];
  readonly availableClauses = ['4.1', '4.2', '6.1', '7.1.5', '7.5.3', '8.2.3', '8.3.3', '8.4.1', '8.5.1', '8.5.6', '9.2', '10.2'];

  formData = {
    title: '', type: '', site: '', owner: '', parts: '',
    areas: [] as string[], clauses: [] as string[],
    reviewCycle: 12, changeSummary: '',
  };

  readonly derivedTier = computed(() => {
    const m: Record<string, number> = {
      'Quality Procedure': 2, 'Work Instruction': 3, 'Form': 4,
      'Control Plan': 3, 'PFMEA': 3, 'MSA Study': 3,
    };
    return this.formData.type ? (m[this.formData.type] ?? 3) : 0;
  });

  readonly tierDesc = computed(() => {
    const m: Record<number, string> = { 1: 'Quality Manual', 2: 'Procedures', 3: 'Work Instructions', 4: 'Records & Forms' };
    return m[this.derivedTier()] ?? '';
  });

  touch(field: string): void { this.touched[field] = true; }

  onTypeChange(): void { this.touch('type'); }

  toggleArea(a: string): void {
    const i = this.formData.areas.indexOf(a);
    if (i >= 0) this.formData.areas.splice(i, 1);
    else this.formData.areas.push(a);
  }

  toggleClause(c: string): void {
    const i = this.formData.clauses.indexOf(c);
    if (i >= 0) this.formData.clauses.splice(i, 1);
    else this.formData.clauses.push(c);
  }

  removeClause(c: string): void { this.formData.clauses = this.formData.clauses.filter(x => x !== c); }

  onDrop(e: DragEvent): void {
    e.preventDefault(); this.dragOver.set(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) { this.uploadedFile.set(f.name); this.selectedFile.set(f); }
  }

  onFileSelect(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) { this.uploadedFile.set(f.name); this.selectedFile.set(f); }
  }

  ownerInitials(owner: string): string {
    return owner.split(' ').map(n => n[0]).join('');
  }

  ownerColor(owner: string): string {
    const m: Record<string, string> = { 'Maria Delgado': '#2563EB', 'Dev Patel': '#7C3AED', 'Sarah Chen': '#0891B2', 'James Okonkwo': '#059669', 'Priya Nair': '#DC2626', 'Tom Braswell': '#B45309' };
    return m[owner] ?? '#64748B';
  }

  saveDraft(): void {
    this.toast.set('Draft saved');
    setTimeout(() => this.toast.set(''), 2500);
  }

  submitForApproval(): void {
    ['title', 'type', 'site', 'owner'].forEach(f => this.touch(f));
    if (this.isEdit) this.touch('changeSummary');
    if (!this.formData.title || !this.formData.type || !this.formData.site || !this.formData.owner) return;
    if (this.isEdit && !this.formData.changeSummary) return;
    const siteMap: Record<string, string> = { 'Plant-1': 'SITE-001', 'Plant-2': 'SITE-002', 'Plant-3': 'SITE-003' };
    const iniMap: Record<string, string> = { 'Maria Delgado': 'MD', 'Dev Patel': 'DP', 'Sarah Chen': 'SC', 'James Okonkwo': 'JO', 'Priya Nair': 'PN', 'Tom Braswell': 'TB' };
    if (this.isEdit && this.docId) {
      const existing = this.mock.documents().find(d => d.id === this.docId);
      if (existing) {
        const newRevLetter = String.fromCharCode(existing.revision.charCodeAt(0) + 1);
        const oldRevSnapshot: DocRevision = {
          rev: existing.revision,
          status: existing.status,
          releasedBy: existing.owner,
          releasedDate: existing.lastReviewed ?? undefined,
          changeSummary: existing.revisions?.[0]?.changeSummary ?? 'Initial revision',
          title: existing.title,
          owner: existing.owner,
          type: existing.type,
          reviewCycle: existing.reviewCycle,
          clauses: existing.clauses ? [...existing.clauses] : [],
          areas: existing.areas,
          siteId: existing.siteId,
        };
        const newRevEntry: DocRevision = {
          rev: newRevLetter,
          status: 'In Approval',
          changeSummary: this.formData.changeSummary,
          title: existing.title,
          owner: existing.owner,
          type: existing.type,
          reviewCycle: existing.reviewCycle,
          clauses: existing.clauses ? [...existing.clauses] : [],
          areas: existing.areas,
          siteId: existing.siteId,
        };
        this.mock.updateDocument(this.docId, {
          status: 'In Approval',
          revision: newRevLetter,
          revisions: [newRevEntry, oldRevSnapshot, ...(existing.revisions?.slice(1) ?? [])],
        });
      }
      const f = this.selectedFile();
      if (f) this.fileStore.store(this.docId, f);
    } else {
      const ownerInitials = iniMap[this.formData.owner] ?? this.formData.owner.split(' ').map(n => n[0]).join('');
      const newDoc = this.mock.addDocument({
        title: this.formData.title,
        type: this.formData.type as any,
        status: 'In Approval',
        owner: this.formData.owner,
        ownerInitials,
        revision: 'A',
        lastReviewed: '2026-06-13',
        nextReview: '2027-06-13',
        siteId: siteMap[this.formData.site] ?? 'SITE-001',
        daysUntilReview: 365,
        clauses: [...this.formData.clauses],
        areas: this.formData.areas.join(', '),
        parts: this.formData.parts,
        reviewCycle: this.formData.reviewCycle,
        history: [{
          id: 'H1',
          actor: this.formData.owner,
          actorInitials: ownerInitials,
          actorColor: this.ownerColor(this.formData.owner),
          action: 'submitted document for approval',
          detail: 'Rev A',
          timestamp: '13 Jun 2026',
        }],
      });
      const f = this.selectedFile();
      if (f) this.fileStore.store(newDoc.id, f);
    }
    this.toast.set('Document submitted for approval');
    setTimeout(() => { this.toast.set(''); this.router.navigate(['/documents']); }, 1800);
  }

  cancel(): void {
    if (this.docId) this.router.navigate(['/documents', this.docId]);
    else this.router.navigate(['/documents']);
  }
}
