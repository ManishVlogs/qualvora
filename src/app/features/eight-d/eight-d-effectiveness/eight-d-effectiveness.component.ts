import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { EightDMockService } from '../../../shared/services/eight-d-mock.service';

@Component({
  selector: 'app-eight-d-effectiveness',
  standalone: true,
  imports: [CommonModule],
  template: `
@if (record(); as r) {
<div class="page-wrapper">

  <!-- Header -->
  <div class="page-header">
    <div>
      <div class="breadcrumb">
        <span class="bc-link" (click)="router.navigate(['/quality/8d/list'])">8D Register</span>
        <i class="bi bi-chevron-right bc-sep"></i>
        <span class="bc-link" (click)="router.navigate(['/quality/8d', r.id])">{{ r.id }}</span>
        <i class="bi bi-chevron-right bc-sep"></i>
        <span class="bc-current">Effectiveness Verification</span>
      </div>
      <h1 class="page-title">Effectiveness Verification</h1>
      <p class="page-sub">IATF 16949 §10.2.6 — Post-closure effectiveness monitoring</p>
    </div>
    <button class="btn-back" (click)="router.navigate(['/quality/8d', r.id])">
      <i class="bi bi-arrow-left"></i> Back to Workspace
    </button>
  </div>

  <!-- Record summary -->
  <div class="record-summary">
    <div class="rs-left">
      <span class="rs-id">{{ r.id }}</span>
      <span class="rs-sev sev-{{ r.severity.toLowerCase() }}">{{ r.severity }}</span>
      <span class="rs-status status-closed">{{ r.status }}</span>
    </div>
    <div class="rs-title">{{ r.title }}</div>
    <div class="rs-meta">
      <span>{{ r.product }} · {{ r.partNumber }}</span>
      <span class="sep">·</span>
      <span>{{ r.customer }}</span>
      <span class="sep">·</span>
      <span>Closed {{ r.closedAt }}</span>
    </div>
  </div>

  @if (r.effectiveness; as eff) {

    <!-- Result Banner -->
    <div class="result-banner" [class.banner-pass]="eff.result === 'Pass'" [class.banner-fail]="eff.result === 'Fail'">
      <div class="rb-icon">
        <i class="bi" [class.bi-shield-fill-check]="eff.result === 'Pass'"
                      [class.bi-shield-fill-x]="eff.result === 'Fail'"
                      [class.bi-shield-fill-exclamation]="eff.result === 'Pending'"></i>
      </div>
      <div class="rb-body">
        <div class="rb-title">
          @if (eff.result === 'Pass') { Effectiveness Verified — PASS }
          @if (eff.result === 'Fail') { Effectiveness Verification — FAIL — 8D Reopen Required }
          @if (eff.result === 'Pending') { Effectiveness Verification Pending }
        </div>
        <div class="rb-sub">
          Verified by {{ eff.auditor }} on {{ eff.verificationDate }} · Method: {{ eff.method }}
        </div>
      </div>
      @if (eff.result === 'Pass') {
        <div class="rb-badge">✓ Confirmed Effective</div>
      }
    </div>

    <!-- Verification details grid -->
    <div class="details-grid">

      <div class="detail-card">
        <div class="dc-label">Verification Date</div>
        <div class="dc-value">{{ eff.verificationDate }}</div>
      </div>

      <div class="detail-card">
        <div class="dc-label">Auditor / Verifier</div>
        <div class="dc-value">
          <div class="person-row">
            <span class="av" [style.background]="eff.auditorColor">{{ eff.auditorInitials }}</span>
            <span>{{ eff.auditor }}</span>
          </div>
        </div>
      </div>

      <div class="detail-card">
        <div class="dc-label">Verification Method</div>
        <div class="dc-value">{{ eff.method }}</div>
      </div>

      <div class="detail-card">
        <div class="dc-label">Defect Recurrence</div>
        <div class="dc-value">
          <span class="recurrence" [class.rec-none]="!eff.defectReoccurrence" [class.rec-yes]="eff.defectReoccurrence">
            <i class="bi" [class.bi-check-circle-fill]="!eff.defectReoccurrence"
                          [class.bi-x-circle-fill]="eff.defectReoccurrence"></i>
            {{ eff.defectReoccurrence ? 'Defect Recurred — Action Required' : 'No Recurrence Detected' }}
          </span>
        </div>
      </div>

      @if (eff.nextVerificationDate) {
        <div class="detail-card">
          <div class="dc-label">Next Verification Due</div>
          <div class="dc-value">{{ eff.nextVerificationDate }}</div>
        </div>
      }

    </div>

    @if (eff.notes) {
      <div class="section-title">Verification Notes</div>
      <div class="notes-card">{{ eff.notes }}</div>
    }

    @if (eff.customerFeedback) {
      <div class="section-title">Customer Feedback</div>
      <div class="feedback-card">
        <i class="bi bi-building" style="font-size:18px;color:#0891B2;flex-shrink:0"></i>
        <div>{{ eff.customerFeedback }}</div>
      </div>
    }

    <!-- D8 reference -->
    @if (r.d8) {
      <div class="section-title">D8 Closure Summary</div>
      <div class="d8-ref-card">
        <div class="d8r-label">Closure Summary</div>
        <div class="d8r-value">{{ r.d8.closureSummary }}</div>
        @if (r.d8.lessonsLearned) {
          <div class="d8r-label" style="margin-top:12px">Lessons Learned</div>
          <div class="d8r-value">{{ r.d8.lessonsLearned }}</div>
        }
        <div class="d8r-footer">
          <span>Closed by: {{ r.d8.closedBy ?? 'N/A' }}</span>
          <span class="sep">·</span>
          <span>Customer Approval: <strong>{{ r.d8.customerApproval }}</strong></span>
          @if (r.d8.customerApprovedBy) {
            <span class="sep">·</span>
            <span>{{ r.d8.customerApprovedBy }}</span>
          }
        </div>
      </div>
    }

    <!-- IATF compliance note -->
    <div class="compliance-note">
      <i class="bi bi-patch-check-fill" style="color:#2563EB;font-size:16px;flex-shrink:0"></i>
      <div>
        <div class="cn-title">IATF 16949 §10.2.6 Compliance</div>
        <div class="cn-body">
          Effectiveness verification completed within the required monitoring period.
          This record satisfies the requirement for post-correction effectiveness verification.
          All documentation is retained per the 15-year record retention requirement.
        </div>
      </div>
    </div>

  } @else {
    <!-- No effectiveness record yet -->
    <div class="pending-state">
      <div class="ps-icon"><i class="bi bi-hourglass-split"></i></div>
      <div class="ps-title">Effectiveness Verification Pending</div>
      <div class="ps-body">
        This 8D has been closed but the 90-day post-closure effectiveness verification has not yet been completed.
        Schedule a verification audit to confirm corrective actions remain effective and the defect has not recurred.
      </div>
      <div class="ps-timeline">
        <div class="pst-item">
          <span class="pst-label">8D Closed</span>
          <span class="pst-val">{{ r.closedAt ?? 'N/A' }}</span>
        </div>
        <div class="pst-item">
          <span class="pst-label">Verification Due (90d)</span>
          <span class="pst-val pst-due">{{ effectivenessDueDate(r.closedAt) }}</span>
        </div>
      </div>
    </div>
  }

</div>
} @else {
  <div class="not-found">
    <i class="bi bi-exclamation-circle" style="font-size:32px;color:#CBD5E1"></i>
    <p>8D record not found.</p>
    <button class="btn-back" (click)="router.navigate(['/quality/8d/list'])">Back to Register</button>
  </div>
}
  `,
  styles: [`
    .page-wrapper {
      background: #F8FAFC; min-height: 100vh; padding: 24px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 900px;
    }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 12px; flex-wrap: wrap; }
    .breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 12px; }
    .bc-link { color: #2563EB; cursor: pointer; }
    .bc-link:hover { text-decoration: underline; }
    .bc-sep { color: #CBD5E1; font-size: 10px; }
    .bc-current { color: #64748B; }
    .page-title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .page-sub { font-size: 13px; color: #64748B; margin: 0; }
    .btn-back {
      background: #fff; color: #374151; border: 1px solid #D1D5DB; border-radius: 7px;
      padding: 8px 14px; font-size: 13px; font-weight: 500; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: background 0.15s; flex-shrink: 0;
    }
    .btn-back:hover { background: #F1F5F9; }

    /* Record summary */
    .record-summary {
      background: #fff; border: 1px solid #E2E8F0; border-radius: 10px;
      padding: 14px 16px; margin-bottom: 16px;
    }
    .rs-left { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .rs-id { font-size: 12px; font-weight: 700; color: #2563EB; font-family: monospace; }
    .rs-sev, .rs-status { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
    .sev-critical { background: #FEE2E2; color: #991B1B; }
    .sev-major    { background: #FEF3C7; color: #92400E; }
    .sev-minor    { background: #DBEAFE; color: #1D4ED8; }
    .status-closed{ background: #D1FAE5; color: #065F46; }
    .rs-title { font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 4px; }
    .rs-meta { font-size: 12px; color: #64748B; display: flex; gap: 6px; flex-wrap: wrap; }
    .sep { color: #CBD5E1; }

    /* Result banner */
    .result-banner {
      display: flex; align-items: center; gap: 16px; border-radius: 10px;
      padding: 16px 20px; margin-bottom: 20px;
    }
    .banner-pass { background: #D1FAE5; border: 1px solid #6EE7B7; }
    .banner-fail { background: #FEE2E2; border: 1px solid #FCA5A5; }
    .rb-icon { font-size: 32px; flex-shrink: 0; }
    .banner-pass .rb-icon { color: #059669; }
    .banner-fail .rb-icon { color: #DC2626; }
    .rb-body { flex: 1; }
    .rb-title { font-size: 16px; font-weight: 700; color: #0F172A; }
    .banner-pass .rb-title { color: #065F46; }
    .banner-fail .rb-title { color: #991B1B; }
    .rb-sub { font-size: 12px; margin-top: 3px; }
    .banner-pass .rb-sub { color: #059669; }
    .banner-fail .rb-sub { color: #DC2626; }
    .rb-badge {
      background: #059669; color: #fff; font-size: 12px; font-weight: 700;
      padding: 5px 12px; border-radius: 6px; white-space: nowrap;
    }

    /* Details grid */
    .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .detail-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; }
    .dc-label { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; }
    .dc-value { font-size: 13px; font-weight: 600; color: #0F172A; }
    .person-row { display: flex; align-items: center; gap: 8px; }
    .av { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .recurrence { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }
    .rec-none { color: #059669; }
    .rec-yes  { color: #DC2626; }

    /* Section title */
    .section-title { font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 8px; }

    .notes-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #374151; line-height: 1.6; margin-bottom: 4px; }
    .feedback-card { background: #F0FDFA; border: 1px solid #99F6E4; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #374151; line-height: 1.6; display: flex; align-items: flex-start; gap: 10px; margin-bottom: 4px; }

    .d8-ref-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; }
    .d8r-label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 5px; }
    .d8r-value { font-size: 13px; color: #374151; line-height: 1.6; }
    .d8r-footer { margin-top: 12px; font-size: 12px; color: #64748B; display: flex; gap: 8px; flex-wrap: wrap; }

    /* Compliance note */
    .compliance-note {
      display: flex; align-items: flex-start; gap: 12px;
      background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px;
      padding: 14px 16px; margin-top: 16px;
    }
    .cn-title { font-size: 13px; font-weight: 700; color: #1E40AF; margin-bottom: 4px; }
    .cn-body { font-size: 12px; color: #1D4ED8; line-height: 1.5; }

    /* Pending state */
    .pending-state {
      background: #fff; border: 1px solid #E2E8F0; border-radius: 10px;
      padding: 32px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center;
    }
    .ps-icon { font-size: 36px; color: #F59E0B; }
    .ps-title { font-size: 17px; font-weight: 700; color: #0F172A; }
    .ps-body { font-size: 13px; color: #64748B; line-height: 1.6; max-width: 520px; }
    .ps-timeline { display: flex; gap: 24px; margin-top: 8px; }
    .pst-item { display: flex; flex-direction: column; gap: 3px; }
    .pst-label { font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; }
    .pst-val { font-size: 14px; font-weight: 700; color: #0F172A; }
    .pst-due { color: #B45309; }

    .not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 12px; color: #94A3B8; }
  `]
})
export class EightDEffectivenessComponent {
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly svc = inject(EightDMockService);

  readonly record = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.svc.getById(id) : undefined;
  });

  effectivenessDueDate(closedAt?: string): string {
    if (!closedAt) return 'N/A';
    const d = new Date(closedAt);
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  }
}
