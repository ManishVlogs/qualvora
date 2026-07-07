import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MockDataService } from '../../../shared/services/mock-data.service';

interface ScarSection { key: string; label: string; enabled: boolean; }

const VERSIONS = [
  { date: '2026-06-13', version: 'v2', note: 'Updated D4 root cause' },
  { date: '2026-06-07', version: 'v1', note: 'Initial submission' },
];

@Component({
  selector: 'app-capa-scar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (capa(); as c) {
    <div class="scar-layout">

      <!-- Header -->
      <div class="scar-header">
        <button class="back-btn" (click)="router.navigate(['/capas', c.id])">
          <i class="bi bi-arrow-left me-1"></i> Back to {{ c.id }}
        </button>
        <div class="header-row">
          <div>
            <h1 class="page-title">SCAR Response Generator</h1>
            <p class="page-sub">{{ c.id }} · Supplier Corrective Action Response</p>
          </div>
          <button class="btn btn-primary" (click)="downloadScar(c)">
            <i class="bi bi-download me-1"></i> Download PDF
          </button>
        </div>
      </div>

      <!-- Split body -->
      <div class="scar-body">

        <!-- Left: Form -->
        <div class="scar-form">
          <h2 class="section-heading">Response Details</h2>

          <div class="form-group mb-3">
            <label class="form-label">Customer <span class="req">*</span></label>
            <input class="form-control form-control-sm" [(ngModel)]="formCustomer" />
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Customer Reference <span class="req">*</span></label>
            <input class="form-control form-control-sm" [(ngModel)]="formCustomerRef" />
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Response Date</label>
            <input type="date" class="form-control form-control-sm" [(ngModel)]="formDate" />
          </div>

          <hr class="my-3" />
          <h2 class="section-heading">Include Sections</h2>
          <div class="section-toggles">
            @for (sec of sections; track sec.key) {
              <label class="toggle-row">
                <input type="checkbox" [(ngModel)]="sec.enabled" style="accent-color:#2563EB" />
                <span class="toggle-label-text">{{ sec.label }}</span>
              </label>
            }
          </div>

          <hr class="my-3" />
          <h2 class="section-heading">Version History</h2>
          <table class="ver-table">
            <thead><tr><th>Date</th><th>Version</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              @for (v of versions; track v.version) {
                <tr>
                  <td>{{ v.date }}</td>
                  <td><span class="ver-badge">{{ v.version }}</span></td>
                  <td>{{ v.note }}</td>
                  <td>
                    <button class="btn btn-link btn-sm p-0" style="font-size:.78rem" (click)="downloadVersion(v.version, c.id)">
                      <i class="bi bi-download me-1"></i>Download
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Right: PDF preview -->
        <div class="scar-preview">
          <div class="preview-label">
            <i class="bi bi-eye me-1"></i> Live Preview
          </div>
          <div class="pdf-paper">
            <!-- PDF header -->
            <div class="pdf-header">
              <div class="pdf-logo">QUALVORA</div>
              <div class="pdf-header-right">
                <div class="pdf-title">Supplier Corrective Action Response</div>
                <div class="pdf-meta">{{ formDate || '2026-06-13' }} · {{ formCustomerRef || 'Ref –' }}</div>
              </div>
            </div>

            <div class="pdf-divider"></div>

            <!-- CAPA info block -->
            <div class="pdf-info-block">
              <div class="pdf-info-row"><span>CAPA ID:</span><strong>{{ c.id }}</strong></div>
              <div class="pdf-info-row"><span>Customer:</span><strong>{{ formCustomer || '–' }}</strong></div>
              <div class="pdf-info-row"><span>Champion:</span><strong>{{ c.champion }}</strong></div>
              <div class="pdf-info-row"><span>Due Date:</span><strong>{{ c.dueDate }}</strong></div>
            </div>

            <!-- Dynamic sections -->
            @if (isEnabled('d1')) {
              <div class="pdf-section">
                <div class="pdf-sec-title">D1 · Problem Response Team</div>
                @for (m of (c.d1?.team ?? []); track m.id) {
                  <div class="pdf-row">{{ m.name }} — {{ m.role }}</div>
                }
                @if (!(c.d1?.team?.length)) {
                  <div class="pdf-row pdf-placeholder">Team not yet defined</div>
                }
              </div>
            }

            @if (isEnabled('d2')) {
              <div class="pdf-section">
                <div class="pdf-sec-title">D2 · Problem Description</div>
                <p class="pdf-body">{{ c.d2?.problemStatement || 'Problem statement not yet recorded.' }}</p>
              </div>
            }

            @if (isEnabled('d3')) {
              <div class="pdf-section">
                <div class="pdf-sec-title">D3 · Containment Actions</div>
                @for (a of (c.d3?.actions ?? []); track a.id) {
                  <div class="pdf-row">
                    <span class="pdf-dot" [class.green]="a.verified"></span>
                    {{ a.action }} ({{ a.owner }})
                    @if (a.verified) { <span class="pdf-verified">✓ Verified {{ a.verifiedDate }}</span> }
                  </div>
                }
                @if (!(c.d3?.actions?.length)) {
                  <div class="pdf-row pdf-placeholder">No containment actions recorded</div>
                }
              </div>
            }

            @if (isEnabled('d4')) {
              <div class="pdf-section">
                <div class="pdf-sec-title">D4 · Root Cause Analysis</div>
                <p class="pdf-body"><strong>Root Cause:</strong> {{ c.d4?.rootCauseStatement || 'Not yet determined.' }}</p>
                @if (c.d4?.escapePoint) {
                  <p class="pdf-body"><strong>Escape Point:</strong> {{ c.d4!.escapePoint }}</p>
                }
              </div>
            }

            @if (isEnabled('d56')) {
              <div class="pdf-section">
                <div class="pdf-sec-title">D5/D6 · Corrective Actions &amp; Implementation</div>
                @for (a of (c.d5?.actions ?? []); track a.id) {
                  <div class="pdf-row"><span class="pdf-dot"></span>{{ a.description }} — {{ a.owner }} ({{ a.due }})</div>
                }
                @if (!(c.d5?.actions?.length)) {
                  <div class="pdf-row pdf-placeholder">Corrective actions pending</div>
                }
              </div>
            }

            @if (isEnabled('d7')) {
              <div class="pdf-section">
                <div class="pdf-sec-title">D7 · Effectiveness Verification</div>
                <p class="pdf-body">{{ c.d7?.results || 'Effectiveness verification pending.' }}</p>
                @if (c.d7?.approvedBy) {
                  <p class="pdf-body"><strong>Approved by:</strong> {{ c.d7!.approvedBy }} on {{ c.d7!.approvedAt }}</p>
                }
              </div>
            }

            @if (isEnabled('attach')) {
              <div class="pdf-section">
                <div class="pdf-sec-title">Attachments</div>
                <div class="pdf-row pdf-placeholder">No attachments in this demo</div>
              </div>
            }

            <div class="pdf-footer">
              Generated by Qualvora CAPA Module · {{ formDate || '2026-06-13' }} · DRAFT
            </div>
          </div>
        </div>

      </div>
    </div>
    }

    @if (!capa()) {
      <div style="padding:40px;text-align:center;color:#94A3B8">CAPA not found.</div>
    }

    @if (toast()) {
      <div class="toast-pill">{{ toast() }}</div>
    }
  `,
  styles: [`
    .scar-layout { display:flex; flex-direction:column; height:100%; }
    .scar-header { background:#fff; border-bottom:1px solid #E2E8F0; padding:16px 32px; flex-shrink:0; }
    .back-btn { background:none; border:none; color:#2563EB; font-size:.82rem; cursor:pointer; padding:0 0 10px; display:flex; align-items:center; }
    .header-row { display:flex; align-items:flex-start; justify-content:space-between; }
    .page-title { font-size:1.3rem; font-weight:700; color:#0F172A; margin:0 0 2px; }
    .page-sub { font-size:.83rem; color:#64748B; margin:0; }
    .req { color:#DC2626; }

    .scar-body { flex:1; display:flex; overflow:hidden; }

    /* Form pane */
    .scar-form { width:45%; padding:24px 28px; overflow-y:auto; background:#fff; border-right:1px solid #E2E8F0; }
    .section-heading { font-size:.95rem; font-weight:700; color:#1E293B; margin:0 0 14px; }
    .form-group { display:flex; flex-direction:column; gap:4px; }
    .form-label { font-size:.78rem; font-weight:600; color:#374151; }

    .section-toggles { display:flex; flex-direction:column; gap:8px; }
    .toggle-row { display:flex; align-items:center; gap:8px; cursor:pointer; }
    .toggle-label-text { font-size:.85rem; color:#374151; }

    .ver-table { width:100%; border-collapse:collapse; }
    .ver-table th { background:#F8FAFC; padding:7px 10px; font-size:.75rem; font-weight:600; color:#64748B; border:1px solid #E2E8F0; }
    .ver-table td { padding:6px 10px; border:1px solid #E2E8F0; font-size:.82rem; }
    .ver-badge { background:#EFF6FF; color:#1D4ED8; font-size:.72rem; font-weight:700; padding:1px 6px; border-radius:4px; }

    /* PDF preview */
    .scar-preview { flex:1; background:#E2E8F0; overflow-y:auto; padding:24px; display:flex; flex-direction:column; align-items:center; }
    .preview-label { font-size:.78rem; color:#64748B; margin-bottom:12px; display:flex; align-items:center; align-self:flex-start; }

    .pdf-paper {
      background:#fff; width:100%; max-width:660px;
      border-radius:4px; box-shadow:0 2px 16px rgba(0,0,0,.12);
      padding:36px 40px; font-size:.82rem; color:#1E293B; line-height:1.6;
    }
    .pdf-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:16px; }
    .pdf-logo { font-size:1.3rem; font-weight:800; color:#1E40AF; letter-spacing:.05em; }
    .pdf-header-right { text-align:right; }
    .pdf-title { font-size:.9rem; font-weight:700; color:#0F172A; }
    .pdf-meta { font-size:.77rem; color:#64748B; }
    .pdf-divider { height:2px; background:#1E40AF; margin-bottom:16px; }

    .pdf-info-block { background:#F8FAFC; border-radius:6px; padding:12px 14px; margin-bottom:16px; display:grid; grid-template-columns:1fr 1fr; gap:4px; }
    .pdf-info-row { font-size:.8rem; color:#374151; display:flex; gap:6px; }
    .pdf-info-row span { color:#64748B; min-width:80px; }

    .pdf-section { margin-bottom:16px; }
    .pdf-sec-title { font-size:.8rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#1E40AF; border-bottom:1px solid #DBEAFE; padding-bottom:4px; margin-bottom:8px; }
    .pdf-row { font-size:.8rem; padding:2px 0; display:flex; align-items:center; gap:6px; }
    .pdf-body { font-size:.8rem; color:#374151; margin:0 0 4px; }
    .pdf-placeholder { color:#94A3B8; font-style:italic; }
    .pdf-dot { width:6px; height:6px; border-radius:50%; background:#CBD5E1; flex-shrink:0; }
    .pdf-dot.green { background:#059669; }
    .pdf-verified { font-size:.72rem; color:#059669; margin-left:4px; }
    .pdf-footer { margin-top:24px; padding-top:12px; border-top:1px solid #E2E8F0; font-size:.72rem; color:#94A3B8; text-align:center; }

    .toast-pill {
      position:fixed; bottom:24px; right:24px; z-index:9999;
      background:#1E293B; color:#fff; padding:10px 20px; border-radius:8px;
      font-size:.87rem; box-shadow:0 4px 16px rgba(0,0,0,.2);
    }
  `],
})
export class CapaScarComponent {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly mock = inject(MockDataService);

  formCustomer = 'Stellantis';
  formCustomerRef = 'STLA-QN-0938';
  formDate = '2026-06-13';
  toast = signal('');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly versions = VERSIONS;

  sections: ScarSection[] = [
    { key: 'd1', label: 'D1 – Problem Response Team', enabled: true },
    { key: 'd2', label: 'D2 – Problem Description', enabled: true },
    { key: 'd3', label: 'D3 – Containment Actions', enabled: true },
    { key: 'd4', label: 'D4 – Root Cause Analysis', enabled: true },
    { key: 'd56', label: 'D5/D6 – Corrective Actions & Implementation', enabled: true },
    { key: 'd7', label: 'D7 – Effectiveness Verification', enabled: false },
    { key: 'attach', label: 'Attachments List', enabled: false },
  ];

  readonly capa = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.mock.getCapa8d(id) : undefined;
  });

  isEnabled(key: string): boolean {
    return this.sections.find(s => s.key === key)?.enabled ?? false;
  }

  downloadScar(c: { id: string }): void {
    this.showToast(`SCAR_${c.id}_v2.pdf downloaded`);
  }

  downloadVersion(ver: string, id: string): void {
    this.showToast(`SCAR_${id}_${ver}.pdf downloaded`);
  }

  showToast(msg: string): void {
    this.toast.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 3000);
  }
}
