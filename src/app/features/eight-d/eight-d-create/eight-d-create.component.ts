import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EightDMockService } from '../../../shared/services/eight-d-mock.service';
import { EightD, EightDSourceType, EightDSeverity } from '../../../shared/interfaces/eight-d.models';

@Component({
  selector: 'app-eight-d-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-wrapper">

  <!-- ── Header ──────────────────────────────────────────────────────── -->
  <div class="page-header">
    <div>
      <div class="breadcrumb">
        <span class="bc-link" (click)="router.navigate(['/quality/8d'])">8D Problem Resolution</span>
        <i class="bi bi-chevron-right bc-sep"></i>
        <span class="bc-link" (click)="router.navigate(['/quality/8d/list'])">Register</span>
        <i class="bi bi-chevron-right bc-sep"></i>
        <span class="bc-current">New 8D Report</span>
      </div>
      <h1 class="page-title">Initiate 8D Problem Resolution</h1>
      <p class="page-sub">IATF 16949 §10.2 — Complete all required fields to open a new 8D report</p>
    </div>
  </div>

  <div class="layout">

    <!-- ── Form ─────────────────────────────────────────────────────── -->
    <div class="form-area">

      <!-- Section 1: Source -->
      <div class="form-card">
        <div class="card-header">
          <div class="step-num">1</div>
          <div>
            <div class="card-title">Problem Source</div>
            <div class="card-sub">Where did this problem originate?</div>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group full">
            <label class="lbl">Source Type <span class="req">*</span></label>
            <div class="source-chips">
              @for (s of sourceTypes; track s.value) {
                <button type="button" class="source-chip"
                        [class.chip-active]="form.sourceType === s.value"
                        (click)="form.sourceType = s.value">
                  <i class="bi" [ngClass]="s.icon"></i>
                  {{ s.label }}
                </button>
              }
            </div>
          </div>
          <div class="form-group">
            <label class="lbl">Linked Record ID</label>
            <input class="inp" [(ngModel)]="form.sourceId" placeholder="e.g. CMP-2026-0150" />
            <span class="hint">NCR, Complaint, Audit Finding, Warranty Claim, or CAPA number</span>
          </div>
          <div class="form-group">
            <label class="lbl">Customer / OEM</label>
            <select class="inp" [(ngModel)]="form.customer">
              <option value="">Select customer…</option>
              @for (c of customers; track c) { <option>{{ c }}</option> }
            </select>
          </div>
          <div class="form-group">
            <label class="lbl">Customer Reference No.</label>
            <input class="inp" [(ngModel)]="form.customerRef" placeholder="e.g. BOSCH-SQN-2026-0900" />
          </div>
          <div class="form-group">
            <label class="lbl">Customer Contact</label>
            <input class="inp" [(ngModel)]="form.customerContact" placeholder="Name — Title" />
          </div>
        </div>
      </div>

      <!-- Section 2: Product -->
      <div class="form-card">
        <div class="card-header">
          <div class="step-num">2</div>
          <div>
            <div class="card-title">Affected Product</div>
            <div class="card-sub">Identify the part, drawing, and manufacturing site</div>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="lbl">Product Name <span class="req">*</span></label>
            <select class="inp" [(ngModel)]="form.product">
              <option value="">Select product…</option>
              @for (p of products; track p) { <option>{{ p }}</option> }
            </select>
          </div>
          <div class="form-group">
            <label class="lbl">Part Number <span class="req">*</span></label>
            <input class="inp" [(ngModel)]="form.partNumber" placeholder="e.g. BPA-4417" />
          </div>
          <div class="form-group">
            <label class="lbl">Drawing Revision</label>
            <input class="inp" [(ngModel)]="form.drawingRev" placeholder="e.g. Rev D" />
          </div>
          <div class="form-group">
            <label class="lbl">Manufacturing Site <span class="req">*</span></label>
            <select class="inp" [(ngModel)]="form.site">
              <option value="">Select site…</option>
              <option value="Plant-1">Plant-1 — Markham, ON</option>
              <option value="Plant-2">Plant-2 — Windsor, ON</option>
              <option value="Plant-3">Plant-3 — Brampton, ON</option>
            </select>
          </div>
          <div class="form-group">
            <label class="lbl">Lot / Batch Number</label>
            <input class="inp" [(ngModel)]="form.lotNumber" placeholder="e.g. W4-0521" />
          </div>
          <div class="form-group">
            <label class="lbl">Quantity Affected <span class="req">*</span></label>
            <input class="inp" type="number" [(ngModel)]="form.qtyAffected" placeholder="0" min="0" />
          </div>
        </div>
      </div>

      <!-- Section 3: Problem -->
      <div class="form-card">
        <div class="card-header">
          <div class="step-num">3</div>
          <div>
            <div class="card-title">Problem Summary</div>
            <div class="card-sub">Describe the defect, severity, and initial impact</div>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group full">
            <label class="lbl">8D Title <span class="req">*</span></label>
            <input class="inp" [(ngModel)]="form.title"
                   placeholder="e.g. Torque out of specification — Bosch brake pedal assembly" />
            <span class="hint">Be specific: defect type, part, customer context</span>
          </div>
          <div class="form-group full">
            <label class="lbl">Defect Category <span class="req">*</span></label>
            <div class="defect-chips">
              @for (d of defectCategories; track d) {
                <button type="button" class="source-chip"
                        [class.chip-active]="form.defectCategory === d"
                        (click)="form.defectCategory = d">{{ d }}</button>
              }
            </div>
          </div>
          <div class="form-group">
            <label class="lbl">Severity <span class="req">*</span></label>
            <div class="sev-group">
              @for (s of severities; track s.value) {
                <button type="button" class="sev-btn sev-{{ s.value.toLowerCase() }}"
                        [class.sev-active]="form.severity === s.value"
                        (click)="form.severity = s.value">
                  {{ s.value }}
                  <span class="sev-desc">{{ s.desc }}</span>
                </button>
              }
            </div>
          </div>
          <div class="form-group">
            <label class="lbl">Target Closure Date <span class="req">*</span></label>
            <input class="inp" type="date" [(ngModel)]="form.dueDate" />
            <span class="hint">Typical: Critical ≤30d, Major ≤45d, Minor ≤60d</span>
          </div>
          <div class="form-group full">
            <label class="lbl">Initial Problem Description</label>
            <textarea class="inp textarea" rows="3" [(ngModel)]="form.description"
                      placeholder="Brief description of what was observed, where, and approximate impact…"></textarea>
          </div>
          <div class="form-group">
            <label class="lbl">Is Customer-Facing?</label>
            <div class="toggle-row">
              <button type="button" class="tog" [class.tog-on]="form.isCustomerFacing" (click)="form.isCustomerFacing = true">Yes</button>
              <button type="button" class="tog" [class.tog-off]="!form.isCustomerFacing" (click)="form.isCustomerFacing = false">No</button>
            </div>
          </div>
          <div class="form-group">
            <label class="lbl">Involves Supplier?</label>
            <div class="toggle-row">
              <button type="button" class="tog" [class.tog-on]="form.isSupplierFacing" (click)="form.isSupplierFacing = true">Yes</button>
              <button type="button" class="tog" [class.tog-off]="!form.isSupplierFacing" (click)="form.isSupplierFacing = false">No</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 4: Team Leader -->
      <div class="form-card">
        <div class="card-header">
          <div class="step-num">4</div>
          <div>
            <div class="card-title">Initial Assignment</div>
            <div class="card-sub">Assign team leader and champion for D1 team formation</div>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="lbl">8D Team Leader <span class="req">*</span></label>
            <select class="inp" [(ngModel)]="form.teamLeader">
              <option value="">Assign team leader…</option>
              @for (m of teamMembers; track m) { <option>{{ m }}</option> }
            </select>
          </div>
          <div class="form-group">
            <label class="lbl">Champion / Sponsor</label>
            <select class="inp" [(ngModel)]="form.champion">
              <option value="">Assign champion…</option>
              @for (m of teamMembers; track m) { <option>{{ m }}</option> }
            </select>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button type="button" class="btn-cancel" (click)="router.navigate(['/quality/8d/list'])">
          Cancel
        </button>
        <button type="button" class="btn-draft" (click)="saveDraft()">
          <i class="bi bi-floppy"></i> Save as Draft
        </button>
        <button type="button" class="btn-submit"
                [disabled]="!isValid()"
                (click)="submit()">
          <i class="bi bi-check-lg"></i> Open 8D Report
        </button>
      </div>

      @if (submitted()) {
        <div class="success-banner">
          <i class="bi bi-check-circle-fill" style="color:#059669;font-size:18px"></i>
          <div>
            <div class="suc-title">8D Report created — {{ newId() }}</div>
            <div class="suc-sub">Redirecting to workspace…</div>
          </div>
        </div>
      }

    </div>

    <!-- ── Guidance Sidebar ───────────────────────────────────────────── -->
    <aside class="guide-sidebar">

      <div class="guide-card">
        <div class="guide-title"><i class="bi bi-info-circle-fill"></i> 8D Severity Guide</div>
        <div class="guide-item">
          <span class="gi-badge sev-critical">Critical</span>
          <span class="gi-desc">Vehicle safety, regulatory non-compliance, production line stop at OEM, potential recall</span>
        </div>
        <div class="guide-item">
          <span class="gi-badge sev-major">Major</span>
          <span class="gi-desc">Customer rejection, warranty claim, significant rework cost, delivery impact</span>
        </div>
        <div class="guide-item">
          <span class="gi-badge sev-minor">Minor</span>
          <span class="gi-desc">Internal non-conformance, cosmetic issue, process variation within containment</span>
        </div>
      </div>

      <div class="guide-card">
        <div class="guide-title"><i class="bi bi-lightning-charge-fill"></i> IATF 16949 §10.2 Requirements</div>
        <ul class="guide-list">
          <li>Customer notification required within <strong>24 hours</strong> of Critical findings</li>
          <li>Containment actions (D3) must be implemented <strong>before</strong> root cause analysis begins</li>
          <li>All 8D reports must be retained for a minimum of <strong>15 years</strong></li>
          <li>Effectiveness verification required <strong>90 days</strong> after closure</li>
          <li>PFMEA and Control Plan must be reviewed and updated as part of D7</li>
        </ul>
      </div>

      <div class="guide-card">
        <div class="guide-title"><i class="bi bi-clock-history"></i> Typical Cycle Times</div>
        <div class="ct-row"><span class="ct-step">D1–D3</span><span class="ct-time">24–48 hours</span></div>
        <div class="ct-row"><span class="ct-step">D4</span><span class="ct-time">3–5 business days</span></div>
        <div class="ct-row"><span class="ct-step">D5–D6</span><span class="ct-time">7–14 days</span></div>
        <div class="ct-row"><span class="ct-step">D7–D8</span><span class="ct-time">5–10 days</span></div>
        <div class="ct-row ct-total"><span class="ct-step">Total (Critical)</span><span class="ct-time">≤ 30 days</span></div>
      </div>

    </aside>

  </div>
</div>
  `,
  styles: [`
    .page-wrapper {
      background: #F8FAFC; min-height: 100vh; padding: 24px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .page-header { margin-bottom: 20px; }
    .breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 12px; }
    .bc-link { color: #2563EB; cursor: pointer; }
    .bc-link:hover { text-decoration: underline; }
    .bc-sep { color: #CBD5E1; font-size: 10px; }
    .bc-current { color: #64748B; }
    .page-title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 13px; color: #64748B; margin: 0; }

    .layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
    @media (max-width: 960px) { .layout { grid-template-columns: 1fr; } }

    /* Form card */
    .form-card {
      background: #fff; border: 1px solid #E2E8F0; border-radius: 10px;
      padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .card-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
    .step-num {
      width: 28px; height: 28px; border-radius: 50%; background: #2563EB; color: #fff;
      font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .card-title { font-size: 15px; font-weight: 700; color: #0F172A; }
    .card-sub { font-size: 12px; color: #64748B; margin-top: 2px; }

    /* Form grid */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-group.full { grid-column: 1 / -1; }
    .lbl { font-size: 12px; font-weight: 600; color: #374151; }
    .req { color: #DC2626; }
    .inp {
      padding: 8px 10px; border: 1px solid #D1D5DB; border-radius: 7px;
      font-size: 13px; color: #0F172A; background: #fff; outline: none; width: 100%;
      box-sizing: border-box; transition: border-color 0.15s;
    }
    .inp:focus { border-color: #2563EB; box-shadow: 0 0 0 2px #DBEAFE; }
    .textarea { resize: vertical; min-height: 72px; }
    .hint { font-size: 11px; color: #94A3B8; }

    /* Source type chips */
    .source-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .source-chip {
      padding: 6px 12px; border: 1px solid #E2E8F0; border-radius: 7px;
      font-size: 12px; font-weight: 500; color: #374151; background: #fff; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: all 0.15s;
    }
    .source-chip:hover { border-color: #2563EB; color: #2563EB; }
    .chip-active { background: #EFF6FF; border-color: #2563EB; color: #2563EB; font-weight: 600; }

    /* Defect chips */
    .defect-chips { display: flex; gap: 6px; flex-wrap: wrap; }

    /* Severity */
    .sev-group { display: flex; gap: 8px; }
    .sev-btn {
      flex: 1; padding: 8px 10px; border-radius: 7px; border: 2px solid #E2E8F0;
      cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px;
      font-size: 12px; font-weight: 700; transition: all 0.15s; background: #fff;
    }
    .sev-desc { font-size: 10px; font-weight: 400; color: #94A3B8; text-align: center; }
    .sev-critical { color: #991B1B; }
    .sev-major    { color: #92400E; }
    .sev-minor    { color: #1D4ED8; }
    .sev-active.sev-btn.sev-critical { background: #FEE2E2; border-color: #DC2626; }
    .sev-active.sev-btn.sev-major    { background: #FEF3C7; border-color: #F59E0B; }
    .sev-active.sev-btn.sev-minor    { background: #DBEAFE; border-color: #2563EB; }

    /* Toggle */
    .toggle-row { display: flex; gap: 4px; }
    .tog {
      padding: 6px 14px; border: 1px solid #E2E8F0; border-radius: 6px;
      font-size: 12px; font-weight: 500; cursor: pointer; background: #fff; color: #64748B;
      transition: all 0.15s;
    }
    .tog-on  { background: #D1FAE5; border-color: #059669; color: #065F46; font-weight: 600; }
    .tog-off { background: #FEE2E2; border-color: #DC2626; color: #991B1B; font-weight: 600; }

    /* Actions */
    .form-actions { display: flex; align-items: center; gap: 10px; padding: 4px 0 8px; justify-content: flex-end; }
    .btn-cancel {
      background: transparent; color: #64748B; border: none; font-size: 13px; cursor: pointer; padding: 8px 14px;
    }
    .btn-draft {
      background: #fff; color: #374151; border: 1px solid #D1D5DB; border-radius: 7px;
      padding: 8px 14px; font-size: 13px; font-weight: 500; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: background 0.15s;
    }
    .btn-draft:hover { background: #F1F5F9; }
    .btn-submit {
      background: #2563EB; color: #fff; border: none; border-radius: 7px;
      padding: 9px 18px; font-size: 13px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: background 0.15s;
    }
    .btn-submit:hover:not(:disabled) { background: #1D4ED8; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Success banner */
    .success-banner {
      margin-top: 12px; padding: 14px 16px; background: #D1FAE5; border: 1px solid #6EE7B7;
      border-radius: 8px; display: flex; align-items: center; gap: 12px;
    }
    .suc-title { font-size: 13px; font-weight: 700; color: #065F46; }
    .suc-sub { font-size: 12px; color: #059669; }

    /* Guide sidebar */
    .guide-sidebar { display: flex; flex-direction: column; gap: 14px; }
    .guide-card {
      background: #fff; border: 1px solid #E2E8F0; border-radius: 10px;
      padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .guide-title {
      font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 12px;
      display: flex; align-items: center; gap: 7px;
    }
    .guide-item { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
    .gi-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; white-space: nowrap; flex-shrink: 0; }
    .gi-desc { font-size: 12px; color: #64748B; }
    .guide-list { margin: 0; padding-left: 16px; display: flex; flex-direction: column; gap: 6px; }
    .guide-list li { font-size: 12px; color: #475569; }

    .ct-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #F1F5F9; }
    .ct-row:last-child { border-bottom: none; }
    .ct-total { font-weight: 700; }
    .ct-step { font-size: 12px; color: #374151; font-weight: 600; }
    .ct-time { font-size: 12px; color: #64748B; }
  `]
})
export class EightDCreateComponent {
  readonly router = inject(Router);
  readonly svc = inject(EightDMockService);

  submitted = signal(false);
  newId = signal('');

  form = {
    sourceType: 'Customer Complaint' as EightDSourceType,
    sourceId: '',
    customer: '',
    customerRef: '',
    customerContact: '',
    product: '',
    partNumber: '',
    drawingRev: '',
    site: '',
    lotNumber: '',
    qtyAffected: null as number | null,
    title: '',
    defectCategory: '',
    severity: 'Major' as EightDSeverity,
    dueDate: '',
    description: '',
    isCustomerFacing: true,
    isSupplierFacing: false,
    teamLeader: '',
    champion: '',
  };

  readonly sourceTypes: { value: EightDSourceType; label: string; icon: string }[] = [
    { value: 'Customer Complaint', label: 'Customer Complaint', icon: 'bi-person-exclamation' },
    { value: 'Internal NCR',       label: 'Internal NCR',       icon: 'bi-exclamation-triangle' },
    { value: 'Supplier NCR',       label: 'Supplier NCR',       icon: 'bi-truck' },
    { value: 'Audit Finding',      label: 'Audit Finding',      icon: 'bi-clipboard-check' },
    { value: 'Warranty Claim',     label: 'Warranty Claim',     icon: 'bi-shield-exclamation' },
    { value: 'Manual',             label: 'Manual',             icon: 'bi-pencil' },
  ];

  readonly customers = ['Bosch', 'Continental', 'Magna', 'Lear', 'ZF', 'Valeo', 'Aptiv', 'BorgWarner', 'Denso', 'Internal'];

  readonly products = [
    'Brake Pedal Assembly', 'ABS Sensor Housing', 'Steering Knuckle',
    'Seat Bracket Assembly', 'Airbag Housing Cover', 'Wiring Harness Subassembly',
    'Brake Caliper Housing', 'Transmission Housing', 'Power Steering Pump',
  ];

  readonly defectCategories = [
    'Dimensional', 'Weld Quality', 'Assembly Error', 'Surface / Cosmetic',
    'Calibration', 'Documentation', 'Missing Component', 'Incorrect Labeling',
  ];

  readonly severities: { value: EightDSeverity; desc: string }[] = [
    { value: 'Critical', desc: 'Safety / Line stop / Recall' },
    { value: 'Major',    desc: 'Customer rejection / Warranty' },
    { value: 'Minor',    desc: 'Internal / Cosmetic' },
  ];

  readonly teamMembers = [
    'Maria Delgado', 'Dev Patel', 'James Okonkwo', 'Priya Nair',
    'Tom Braswell', 'Sarah Chen', 'Raj Sharma', 'Kim Nguyen',
  ];

  isValid(): boolean {
    return !!(this.form.sourceType && this.form.partNumber && this.form.product &&
              this.form.site && this.form.title && this.form.severity &&
              this.form.dueDate && this.form.teamLeader && (this.form.qtyAffected ?? 0) >= 0);
  }

  submit(): void {
    if (!this.isValid()) return;
    const id = `8D-2026-${String(Math.floor(Math.random() * 40) + 45).padStart(4, '0')}`;
    this.newId.set(id);
    this.submitted.set(true);
    setTimeout(() => this.router.navigate(['/quality/8d', id]), 1500);
  }

  saveDraft(): void {
    this.router.navigate(['/quality/8d/list']);
  }
}
