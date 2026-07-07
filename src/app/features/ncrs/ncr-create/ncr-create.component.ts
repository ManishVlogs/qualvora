import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../shared/services/mock-data.service';

const DEFECT_GROUPS = [
  { group: 'Recent', codes: ['WLD-001', 'DIM-003', 'CTG-004'] },
  { group: 'Dimensional', codes: ['DIM-001', 'DIM-002', 'DIM-003', 'DIM-004'] },
  { group: 'Welding', codes: ['WLD-001', 'WLD-002', 'WLD-003'] },
  { group: 'Material', codes: ['MAT-001', 'MAT-002', 'MAT-003'] },
  { group: 'Surface / Finish', codes: ['SRF-001', 'SRF-002', 'SRF-003', 'SRF-004', 'SRF-005'] },
  { group: 'Coating', codes: ['CTG-001', 'CTG-002', 'CTG-003', 'CTG-004'] },
  { group: 'Documentation', codes: ['DOC-001', 'DOC-002'] },
  { group: 'Calibration', codes: ['CAL-001', 'CAL-002'] },
  { group: 'Torque / Fastener', codes: ['TRQ-001', 'TRQ-002'] },
  { group: 'Label / Packaging', codes: ['LBL-001', 'LBL-002'] },
  { group: 'Hardness / Mechanical', codes: ['HRD-001', 'HRD-002', 'HRD-003'] },
];

const PARTS = ['BPIL-0044', 'HNG-1147', 'COIL-C7', 'ROOF-INN-2', 'SRAIL-M10', 'PKG-88-4712',
  'IPBKT-0077', 'DOOR-OUT-R', 'HT-0612', 'BIW-DOOR-L', 'HOOD-INN-2', '6622-B', 'BKTS-3390',
  'Part 1147', 'Part 4471', 'Part 4472', 'Part 9847-A'];

@Component({
  selector: 'app-ncr-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-outer">
      <div class="page-form">

        <!-- Header -->
        <div class="form-page-header">
          <button class="back-btn" (click)="router.navigate(['/ncrs'])">
            <i class="bi bi-arrow-left me-1"></i> NCR List
          </button>
          <h1 class="form-title">Log Non-Conformance Report</h1>
        </div>

        <!-- Section 1: Identification -->
        <div class="form-section">
          <div class="section-title"><span class="section-num">1</span>Identification</div>

          <!-- Part typeahead -->
          <div class="form-field" [class.has-error]="touched['part'] && !formData.part">
            <label class="field-label">Part Number / Part Name <span class="req">*</span></label>
            <div class="typeahead-wrap">
              <input type="text" class="form-control field-input" [(ngModel)]="formData.part"
                     (input)="onPartInput()" (blur)="touch('part'); showPartSugg.set(false)"
                     placeholder="Type to search parts…" autocomplete="off" />
              @if (showPartSugg() && partSuggestions().length > 0) {
                <div class="typeahead-dropdown">
                  @for (p of partSuggestions(); track p) {
                    <button class="typeahead-item" (mousedown)="selectPart(p)">
                      <i class="bi bi-box me-2 text-muted"></i>{{ p }}
                    </button>
                  }
                </div>
              }
            </div>
            @if (touched['part'] && !formData.part) {
              <div class="field-error"><i class="bi bi-exclamation-circle me-1"></i>Part is required</div>
            }
          </div>

          <!-- Defect code grouped dropdown -->
          <div class="form-field" [class.has-error]="touched['defectCode'] && !formData.defectCode">
            <label class="field-label">Defect Code <span class="req">*</span></label>
            <div class="dropdown-wrap">
              <button class="defect-picker-btn" [class.has-value]="formData.defectCode"
                      (click)="showDefectPicker.set(!showDefectPicker())" type="button">
                @if (formData.defectCode) {
                  <span class="defect-badge">{{ formData.defectCode }}</span>
                } @else {
                  <span class="placeholder-text">Select defect code…</span>
                }
                <i class="bi bi-chevron-down ms-auto"></i>
              </button>
              @if (showDefectPicker()) {
                <div class="defect-dropdown">
                  @for (grp of DEFECT_GROUPS; track grp.group) {
                    <div class="defect-group-label">{{ grp.group }}</div>
                    @for (code of grp.codes; track code) {
                      <button class="defect-dd-item" [class.selected]="formData.defectCode===code"
                              (click)="formData.defectCode=code; showDefectPicker.set(false); touch('defectCode')">
                        @if (formData.defectCode===code) { <i class="bi bi-check me-2 text-primary"></i> }
                        <span class="defect-code-tag">{{ code }}</span>
                      </button>
                    }
                  }
                </div>
              }
            </div>
            @if (touched['defectCode'] && !formData.defectCode) {
              <div class="field-error"><i class="bi bi-exclamation-circle me-1"></i>Defect code is required</div>
            }
          </div>

          <!-- Qty row -->
          <div class="field-row-2">
            <div class="form-field" [class.has-error]="touched['qtyDefective'] && formData.qtyDefective == null">
              <label class="field-label">Qty Defective <span class="req">*</span></label>
              <input type="number" min="0" class="form-control field-input" [(ngModel)]="formData.qtyDefective"
                     (blur)="touch('qtyDefective')" placeholder="0" />
              @if (touched['qtyDefective'] && formData.qtyDefective == null) {
                <div class="field-error"><i class="bi bi-exclamation-circle me-1"></i>Required</div>
              }
            </div>
            <div class="form-field">
              <label class="field-label">Qty Inspected</label>
              <input type="number" min="0" class="form-control field-input" [(ngModel)]="formData.qtyInspected"
                     placeholder="0" />
            </div>
          </div>

          <!-- Source radio -->
          <div class="form-field" [class.has-error]="touched['source'] && !formData.source">
            <label class="field-label">Source <span class="req">*</span></label>
            <div class="radio-group">
              @for (s of sources; track s) {
                <label class="radio-item" [class.selected]="formData.source===s">
                  <input type="radio" name="source" [value]="s" [(ngModel)]="formData.source"
                         (change)="touch('source')" />
                  <i class="bi {{ sourceIcon(s) }} me-1"></i>{{ s }}
                </label>
              }
            </div>
            @if (touched['source'] && !formData.source) {
              <div class="field-error"><i class="bi bi-exclamation-circle me-1"></i>Source is required</div>
            }
          </div>
        </div>

        <!-- Section 2: Context -->
        <div class="form-section">
          <div class="section-title"><span class="section-num">2</span>Context</div>

          @if (formData.source === 'Customer') {
            <div class="field-row-2">
              <div class="form-field">
                <label class="field-label">Customer</label>
                <select class="form-select field-input" [(ngModel)]="formData.customer">
                  <option value="">Select customer…</option>
                  @for (c of customers; track c) { <option [value]="c">{{ c }}</option> }
                </select>
              </div>
              <div class="form-field">
                <label class="field-label">Customer Reference #</label>
                <input type="text" class="form-control field-input" [(ngModel)]="formData.customerRef"
                       placeholder="e.g. FORD-CR-44821" />
              </div>
            </div>
          }

          <div class="field-row-3">
            <div class="form-field">
              <label class="field-label">Area / Station</label>
              <select class="form-select field-input" [(ngModel)]="formData.area">
                <option value="">Select area…</option>
                @for (a of areas; track a) { <option [value]="a">{{ a }}</option> }
              </select>
            </div>
            <div class="form-field">
              <label class="field-label">Shift</label>
              <select class="form-select field-input" [(ngModel)]="formData.shift">
                <option value="">—</option>
                <option value="Day">Day</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
              </select>
            </div>
            <div class="form-field">
              <label class="field-label">Lot / Serial #</label>
              <input type="text" class="form-control field-input" [(ngModel)]="formData.lot"
                     placeholder="e.g. LOT-442" />
            </div>
          </div>

          <div class="form-field">
            <label class="field-label">Immediate Action Taken</label>
            <textarea class="form-control field-input" rows="3" [(ngModel)]="formData.immediateAction"
                      placeholder="Describe any immediate containment or notification actions…"></textarea>
          </div>
        </div>

        <!-- Section 3: Cost Estimates -->
        <div class="form-section">
          <div class="section-title"><span class="section-num">3</span>Cost Estimates <span class="optional-badge">Optional</span></div>
          <div class="field-row-2">
            <div class="form-field">
              <label class="field-label">Estimated Scrap Cost ($)</label>
              <div class="input-prefix-wrap">
                <span class="input-prefix">$</span>
                <input type="number" min="0" class="form-control field-input input-with-prefix" [(ngModel)]="formData.scrapCost" placeholder="0.00" />
              </div>
            </div>
            <div class="form-field">
              <label class="field-label">Estimated Rework Hours</label>
              <div class="input-prefix-wrap">
                <input type="number" min="0" class="form-control field-input" [(ngModel)]="formData.reworkHours" placeholder="0.0" />
                <span class="input-suffix">hrs</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 4: Attachments -->
        <div class="form-section">
          <div class="section-title"><span class="section-num">4</span>Attachments</div>
          <div class="photo-upload-zone" (click)="addMockPhoto()">
            <i class="bi bi-camera upload-icon"></i>
            <div class="upload-text">Click to add photos or drag files here</div>
            <div class="upload-sub">JPG, PNG, PDF up to 10 MB each</div>
          </div>
          @if (attachments().length > 0) {
            <div class="photo-grid">
              @for (p of attachments(); track p) {
                <div class="photo-thumb">
                  <i class="bi bi-image thumb-icon"></i>
                  <span class="thumb-name">{{ p }}</span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="form-footer">
          <button class="btn btn-outline-secondary me-2" (click)="router.navigate(['/ncrs'])">Cancel</button>
          <button class="btn btn-outline-primary me-2" (click)="saveDraft()">
            <i class="bi bi-floppy me-1"></i> Save Draft
          </button>
          <button class="btn btn-danger submit-btn" (click)="submitForReview()">
            <i class="bi bi-send me-1"></i> Submit for Review
          </button>
        </div>
      </div>
    </div>

    @if (showDefectPicker()) {
      <div class="dd-overlay" (click)="showDefectPicker.set(false)"></div>
    }
    @if (toast()) {
      <div class="action-toast"><i class="bi bi-check-circle-fill me-2"></i>{{ toast() }}</div>
    }
  `,
  styles: [`
    .page-outer { padding: 1.5rem; background: var(--q-content-bg, #F1F5F9); min-height: 100%; }
    .page-form { max-width: 720px; margin: 0 auto; }
    .form-page-header { margin-bottom: 1.5rem; }
    .back-btn { background: none; border: none; font-size: 0.8125rem; color: #64748B; cursor: pointer; padding: 0 0 0.625rem; display: flex; align-items: center; &:hover { color: #2563EB; } }
    .form-title { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0; }

    .form-section { background: #fff; border-radius: 12px; border: 1px solid #E2E8F0; padding: 1.5rem; margin-bottom: 1.25rem; }
    .section-title { display: flex; align-items: center; gap: 0.625rem; font-size: 1rem; font-weight: 700; color: #0F172A; margin-bottom: 1.25rem; }
    .section-num { width: 24px; height: 24px; background: #DC2626; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
    .optional-badge { background: #F1F5F9; color: #64748B; border-radius: 4px; padding: 1px 6px; font-size: 11px; font-weight: 600; margin-left: 4px; }

    .form-field { margin-bottom: 1.125rem; }
    .field-label { font-size: 0.8125rem; font-weight: 600; color: #334155; display: block; margin-bottom: 0.375rem; }
    .req { color: #DC2626; }
    .field-input { font-size: 0.875rem; border: 1.5px solid #E2E8F0; border-radius: 6px; transition: border-color 150ms; &:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); outline: none; } }
    .has-error .field-input, .has-error .defect-picker-btn { border-color: #DC2626 !important; }
    .field-error { font-size: 0.75rem; color: #DC2626; margin-top: 0.25rem; display: flex; align-items: center; }
    .field-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }

    /* Typeahead */
    .typeahead-wrap { position: relative; }
    .typeahead-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); z-index: 300; max-height: 200px; overflow-y: auto; }
    .typeahead-item { display: flex; align-items: center; width: 100%; padding: 0.4rem 0.75rem; background: none; border: none; text-align: left; font-size: 0.875rem; color: #334155; cursor: pointer; &:hover { background: #EFF6FF; } }
    .text-muted { color: #94A3B8; }

    /* Defect picker */
    .dropdown-wrap { position: relative; }
    .defect-picker-btn { width: 100%; height: 38px; border: 1.5px solid #E2E8F0; border-radius: 6px; padding: 0 0.875rem; background: #fff; font-size: 0.875rem; display: flex; align-items: center; cursor: pointer; transition: border-color 150ms; &:hover { border-color: #CBD5E1; } &.has-value { border-color: #2563EB; } }
    .placeholder-text { color: #94A3B8; }
    .defect-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 310; max-height: 280px; overflow-y: auto; }
    .defect-group-label { padding: 0.375rem 0.75rem 0.125rem; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94A3B8; }
    .defect-dd-item { display: flex; align-items: center; width: 100%; padding: 0.3rem 0.75rem; background: none; border: none; text-align: left; font-size: 0.875rem; cursor: pointer; &:hover { background: #F8FAFC; } &.selected { background: #EFF6FF; } }
    .defect-code-tag { font-family: monospace; font-size: 0.875rem; color: #334155; }
    .defect-badge { background: #F1F5F9; border: 1px solid #E2E8F0; color: #475569; font-size: 0.875rem; border-radius: 4px; padding: 1px 8px; font-family: monospace; }
    .dd-overlay { position: fixed; inset: 0; z-index: 299; }

    /* Radio */
    .radio-group { display: flex; gap: 0.625rem; flex-wrap: wrap; }
    .radio-item { display: flex; align-items: center; gap: 0.375rem; background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 6px 14px; font-size: 0.875rem; cursor: pointer; &.selected { background: #FEF2F2; border-color: #DC2626; color: #DC2626; font-weight: 600; } input { display: none; } }

    /* Cost estimates */
    .input-prefix-wrap { display: flex; align-items: center; gap: 0; }
    .input-prefix { background: #F8FAFC; border: 1.5px solid #E2E8F0; border-right: none; border-radius: 6px 0 0 6px; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #64748B; }
    .input-with-prefix { border-radius: 0 6px 6px 0 !important; }
    .input-suffix { background: #F8FAFC; border: 1.5px solid #E2E8F0; border-left: none; border-radius: 0 6px 6px 0; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #64748B; }

    /* Photos */
    .photo-upload-zone { border: 2px dashed #CBD5E1; border-radius: 10px; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.375rem; cursor: pointer; transition: all 150ms; &:hover { border-color: #2563EB; background: #F8FAFC; } }
    .upload-icon { font-size: 2rem; color: #CBD5E1; }
    .upload-text { font-size: 0.9375rem; font-weight: 500; color: #475569; }
    .upload-sub { font-size: 0.8125rem; color: #94A3B8; }
    .photo-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
    .photo-thumb { width: 80px; height: 80px; background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
    .thumb-icon { font-size: 1.5rem; color: #94A3B8; }
    .thumb-name { font-size: 9px; color: #94A3B8; text-align: center; padding: 0 4px; }

    .form-footer { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1rem 1.5rem; display: flex; justify-content: flex-end; }
    .submit-btn { background: #DC2626; border: none; color: #fff; font-weight: 600; &:hover { background: #B91C1C; } }
    .action-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: #0F172A; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; z-index: 400; display: flex; align-items: center; }
  `]
})
export class NcrCreateComponent {
  readonly router = inject(Router);
  private readonly mock = inject(MockDataService);

  readonly DEFECT_GROUPS = DEFECT_GROUPS;
  readonly showPartSugg = signal(false);
  readonly showDefectPicker = signal(false);
  readonly attachments = signal<string[]>([]);
  readonly toast = signal('');
  readonly touched: Record<string, boolean> = {};

  readonly sources = ['Internal', 'Incoming', 'Customer'];
  readonly customers = ['Ford Motor Company', 'GM', 'Stellantis', 'Toyota', 'BMW Group', 'Rivian', 'Stellantis', 'Mercedes-Benz'];
  readonly areas = ['Weld Zone A', 'Weld Zone B', 'Stamping', 'Assembly Line 1', 'Assembly Line 2', 'Paint Shop', 'Incoming', 'CMM Area', 'Heat Treat', 'Shipping', 'Quality'];

  formData = {
    part: '', defectCode: '', qtyDefective: null as number | null,
    qtyInspected: null as number | null, source: '',
    customer: '', customerRef: '', area: '', shift: '', lot: '',
    immediateAction: '', scrapCost: null as number | null, reworkHours: null as number | null,
  };

  readonly partSuggestions = computed(() => {
    const q = this.formData.part.toLowerCase();
    if (!q) return PARTS.slice(0, 8);
    return PARTS.filter(p => p.toLowerCase().includes(q)).slice(0, 8);
  });

  touch(f: string): void { this.touched[f] = true; }

  onPartInput(): void { this.showPartSugg.set(true); }

  selectPart(p: string): void { this.formData.part = p; this.showPartSugg.set(false); this.touch('part'); }

  sourceIcon(s: string): string {
    return s === 'Internal' ? 'bi-building' : s === 'Incoming' ? 'bi-box-arrow-in-down' : 'bi-person-lines-fill';
  }

  addMockPhoto(): void {
    const names = ['photo_001.jpg', 'defect_close.jpg', 'measurement.png', 'lot_label.jpg', 'setup_sheet.pdf'];
    const existing = this.attachments().length;
    if (existing < names.length) this.attachments.update(a => [...a, names[existing]]);
  }

  saveDraft(): void {
    this.toast.set('Draft saved');
    setTimeout(() => this.toast.set(''), 2500);
  }

  submitForReview(): void {
    ['part', 'defectCode', 'source'].forEach(f => this.touch(f));
    this.touched['qtyDefective'] = true;
    if (!this.formData.part || !this.formData.defectCode || !this.formData.source) return;
    const ncr = this.mock.addNcr({
      title: `Non-conformance – ${this.formData.part} (${this.formData.defectCode})`,
      description: this.formData.immediateAction || `NCR logged for part ${this.formData.part}, defect code ${this.formData.defectCode}.`,
      status: 'Under Review',
      severity: 'Minor',
      owner: 'Maria Delgado', ownerInitials: 'MD', ownerColor: '#2563EB',
      siteId: 'SITE-001',
      createdAt: '2026-06-13',
      dueDate: '2026-06-27',
      source: this.formData.source as 'Internal' | 'Customer' | 'Supplier' | 'Audit',
      ageInDays: 0,
      partNumber: this.formData.part,
      defectCode: this.formData.defectCode,
      qtyDefective: this.formData.qtyDefective ?? 0,
      qtyInspected: this.formData.qtyInspected ?? 0,
      area: this.formData.area || undefined,
      shift: this.formData.shift || undefined,
      lot: this.formData.lot || undefined,
      customer: this.formData.customer || undefined,
      customerRef: this.formData.customerRef || undefined,
      isCustomerFacing: !!this.formData.customer,
    });
    this.toast.set(`${ncr.id} created and submitted for review`);
    setTimeout(() => { this.toast.set(''); this.router.navigate(['/ncrs', ncr.id]); }, 2000);
  }
}
