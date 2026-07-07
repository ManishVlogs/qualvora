import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { AuthStore } from '../../../core/auth/stores/auth.store';

@Component({
  selector: 'app-document-approve',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <!-- Page header -->
      <button class="back-btn" title="Return to the document without approving or rejecting"
              (click)="router.navigate(['/documents', docId])">
        <i class="bi bi-arrow-left me-1"></i> Back to Document
      </button>

      <!-- Approval banner -->
      <div class="approval-header q-card shadow-sm mb-3">
        <div class="ah-left">
          <span class="record-id me-2">{{ docId }}</span>
          <span class="chip chip-in-approval">In Approval</span>
        </div>
        <h1 class="doc-title">{{ docTitle() }}</h1>
        <div class="doc-meta">
          <span>Rev {{ docRevision() }}</span><span class="sep">·</span>
          <span>{{ docType() }}</span><span class="sep">·</span>
          <span>Tier {{ docTier() }}</span><span class="sep">·</span>
          <span>{{ siteName() }}</span>
        </div>
      </div>

      <!-- Split layout -->
      <div class="approve-grid">

        <!-- Left: Doc preview 55% -->
        <div class="q-card preview-card">
          <div class="preview-toolbar">
            <span class="preview-label"><i class="bi bi-file-earmark-pdf me-1 text-danger"></i>DOC-0048-RevA.pdf</span>
            @if (showChanges()) {
              <span class="changes-badge"><i class="bi bi-subtract me-1"></i>Changes from Rev — highlighted</span>
            }
          </div>
          <div class="preview-area">
            <div class="pdf-mock-lg">
              <i class="bi bi-file-earmark-pdf pdf-icon"></i>
              <div class="pdf-label">Document Preview</div>
              <div class="pdf-sub">Rev A · 8 pages</div>
              @if (showChanges()) {
                <div class="changes-note mt-3">
                  <i class="bi bi-info-circle me-1"></i>
                  This is the initial revision — no prior version to compare.
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right: Decision panel 45% -->
        <div class="decision-panel">
          <!-- Step indicator -->
          <div class="q-card step-card mb-3"
               title="You are at the final approval step. Review the document on the left, then Approve or Reject.">
            <div class="step-indicator">
              <div class="step-done-dot">
                <i class="bi bi-check-lg"></i>
              </div>
              <div class="step-line-sm"></div>
              <div class="step-current-dot">2</div>
            </div>
            <div class="step-label">
              <span class="step-current-text">Step 2 of 2 — Awaiting your approval</span>
              <span class="step-role-text">{{ approverRole() }} Sign-off</span>
            </div>
          </div>

          <!-- Prior comment -->
          <div class="q-card prior-comment mb-3">
            <div class="prior-header">
              <span class="av-sm" [style.background]="authorColor()">{{ authorInitials() }}</span>
              <span class="prior-name">{{ authorName() }}</span>
              <span class="prior-role">Author — Step 1</span>
              <span class="prior-badge chip chip-released chip-sm ms-auto">Submitted</span>
            </div>
            <div class="prior-text">
              "Initial release of the Torque Verification Work Instruction for Plant-1 stamping operations.
              Covers all M10 and M12 fasteners in chassis assembly zone. Aligns with IATF 8.5.1
              and customer-specific requirements (CSR-FORD-2024)."
            </div>
            <div class="prior-date">Submitted 12 Jun 2026, 08:47</div>
          </div>

          <!-- Show changes toggle -->
          <div class="show-changes-row mb-3">
            <label class="toggle-label"
                   title="Highlight sections that changed from the previous revision to focus your review">
              <div class="toggle-wrap">
                <input type="checkbox" class="toggle-input"
                       [checked]="showChanges()"
                       (change)="showChanges.set(!showChanges())">
                <span class="toggle-slider"></span>
              </div>
              Show Changes from Previous Revision
            </label>
          </div>

          <!-- Action buttons -->
          <button class="btn btn-approve"
                  title="Approve this document — you will be asked to provide your electronic signature"
                  (click)="showESignModal.set(true)">
            <i class="bi bi-patch-check me-2"></i>
            Approve
          </button>
          <button class="btn btn-reject mt-2"
                  title="Reject and return to the author with your comments — the author must revise and resubmit"
                  (click)="showRejectModal.set(true)">
            <i class="bi bi-x-circle me-2"></i>
            Reject with Comment
          </button>
        </div>
      </div>
    </div>

    <!-- E-Signature Modal -->
    @if (showESignModal()) {
      <div class="modal-overlay" (click)="showESignModal.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header-row">
            <i class="bi bi-shield-lock-fill modal-shield-icon"></i>
            <h2 class="modal-title">Electronic Signature Required</h2>
          </div>
          <div class="esign-statement">
            I am approving <strong>{{ docId }} Rev {{ docRevision() }}</strong> for release as
            <strong>{{ approverRole() }}</strong> of <strong>{{ siteName() }}</strong>.
          </div>
          <div class="esign-field-row">
            <label class="esign-label">Full Name</label>
            <div class="esign-readonly">{{ approverName() }}</div>
          </div>
          <div class="esign-field-row">
            <label class="esign-label">Password <span class="required">*</span></label>
            <input type="password" class="form-control" [(ngModel)]="signPassword"
                   placeholder="Enter your password to confirm" />
          </div>
          <div class="esign-timestamp">
            <i class="bi bi-clock me-1"></i>
            Timestamp: 13 Jun 2026, {{ currentTime() }}
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline-secondary" (click)="showESignModal.set(false)">Cancel</button>
            <button class="btn btn-primary confirm-btn" (click)="confirmApproval()">
              <i class="bi bi-patch-check me-1"></i> Confirm Signature
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Reject Modal -->
    @if (showRejectModal()) {
      <div class="modal-overlay" (click)="showRejectModal.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header-row">
            <i class="bi bi-x-circle-fill modal-reject-icon"></i>
            <h2 class="modal-title">Reject Document</h2>
          </div>
          <p class="reject-sub">
            The document will be returned to the author with your comment.
            The author must revise and resubmit.
          </p>
          <div class="form-group">
            <label class="form-label">Rejection Comment <span class="required">*</span></label>
            <textarea class="form-control" rows="4" [(ngModel)]="rejectComment"
                      placeholder="Describe what needs to be corrected…"
                      [class.is-invalid]="rejectSubmitAttempted() && !rejectComment"></textarea>
            @if (rejectSubmitAttempted() && !rejectComment) {
              <div class="invalid-feedback">Comment is required for rejection.</div>
            }
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline-secondary" (click)="showRejectModal.set(false); rejectSubmitAttempted.set(false)">Cancel</button>
            <button class="btn btn-danger confirm-btn" (click)="confirmRejection()">
              <i class="bi bi-x-circle me-1"></i> Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Toast -->
    @if (toast()) {
      <div class="action-toast"><i class="bi bi-check-circle-fill me-2"></i>{{ toast() }}</div>
    }
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1300px; margin: 0 auto; }
    .back-btn { background: none; border: none; font-size: 0.8125rem; color: #64748B; cursor: pointer; padding: 0 0 0.75rem; display: flex; align-items: center; &:hover { color: #2563EB; } }
    .approval-header { padding: 1.25rem; margin-top: 0; }
    .ah-left { display: flex; align-items: center; margin-bottom: 0.5rem; }
    .doc-title { font-size: 1.125rem; font-weight: 700; color: #0F172A; margin: 0 0 0.375rem; }
    .doc-meta { font-size: 0.8125rem; color: #64748B; display: flex; gap: 0.375rem; align-items: center; }
    .sep { color: #CBD5E1; }

    .approve-grid { display: grid; grid-template-columns: 55fr 45fr; gap: 1rem; }

    /* Preview */
    .preview-card { overflow: hidden; }
    .preview-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 0.625rem 1rem; border-bottom: 1px solid #F1F5F9; background: #F8FAFC; font-size: 0.8125rem; }
    .preview-label { font-weight: 500; color: #475569; display: flex; align-items: center; }
    .changes-badge { background: #FEF3C7; color: #92400E; border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 600; display: flex; align-items: center; }
    .preview-area { height: 540px; display: flex; align-items: center; justify-content: center; background: #F1F5F9; }
    .pdf-mock-lg { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: #94A3B8; }
    .pdf-icon { font-size: 4rem; color: #CBD5E1; }
    .pdf-label { font-size: 1rem; font-weight: 500; color: #64748B; }
    .pdf-sub { font-size: 0.8125rem; }
    .changes-note { font-size: 0.8125rem; color: #94A3B8; display: flex; align-items: center; }

    /* Decision panel */
    .step-card { padding: 1rem; display: flex; align-items: center; gap: 0.875rem; }
    .step-indicator { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .step-done-dot { width: 28px; height: 28px; background: #DCFCE7; border: 2px solid #86EFAC; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #166534; font-size: 0.875rem; }
    .step-line-sm { width: 24px; height: 2px; background: #E2E8F0; }
    .step-current-dot { width: 28px; height: 28px; background: #2563EB; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.875rem; font-weight: 700; }
    .step-label { display: flex; flex-direction: column; }
    .step-current-text { font-size: 0.875rem; font-weight: 700; color: #0F172A; }
    .step-role-text { font-size: 0.75rem; color: #64748B; }

    /* Prior comment */
    .prior-comment { padding: 1rem; }
    .prior-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.625rem; }
    .av-sm { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; color: #fff; }
    .prior-name { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .prior-role { font-size: 0.75rem; color: #94A3B8; }
    .chip-sm { font-size: 11px; padding: 2px 8px; }
    .prior-text { font-size: 0.8125rem; color: #475569; line-height: 1.6; font-style: italic; background: #F8FAFC; border-radius: 6px; padding: 0.75rem; }
    .prior-date { font-size: 0.75rem; color: #94A3B8; margin-top: 0.375rem; }

    /* Toggle */
    .show-changes-row { }
    .toggle-label { display: flex; align-items: center; gap: 0.625rem; font-size: 0.875rem; color: #475569; cursor: pointer; }
    .toggle-wrap { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
    .toggle-input { opacity: 0; width: 0; height: 0; position: absolute; }
    .toggle-slider { position: absolute; inset: 0; background: #E2E8F0; border-radius: 10px; transition: 200ms; cursor: pointer; &::before { content: ''; position: absolute; width: 14px; height: 14px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: 200ms; } }
    .toggle-input:checked + .toggle-slider { background: #2563EB; }
    .toggle-input:checked + .toggle-slider::before { transform: translateX(16px); }

    /* Action buttons */
    .btn-approve { width: 100%; height: 52px; background: #059669; border: none; color: #fff; font-size: 1rem; font-weight: 700; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; &:hover { background: #047857; } }
    .btn-reject { width: 100%; height: 48px; background: none; border: 2px solid #DC2626; color: #DC2626; font-size: 0.9375rem; font-weight: 600; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; &:hover { background: #FEF2F2; } }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 500; display: flex; align-items: center; justify-content: center; }
    .modal-card { background: #fff; border-radius: 12px; padding: 1.75rem; max-width: 480px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
    .modal-header-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .modal-title { font-size: 1.125rem; font-weight: 700; color: #0F172A; margin: 0; }
    .modal-shield-icon { font-size: 1.5rem; color: #2563EB; }
    .modal-reject-icon { font-size: 1.5rem; color: #DC2626; }
    .esign-statement { background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 0.875rem; font-size: 0.875rem; color: #166534; line-height: 1.6; margin-bottom: 1.25rem; }
    .esign-field-row { margin-bottom: 1rem; }
    .esign-label { font-size: 0.8125rem; font-weight: 600; color: #334155; display: block; margin-bottom: 0.375rem; }
    .esign-readonly { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 0.5rem 0.875rem; font-size: 0.875rem; color: #0F172A; font-weight: 600; }
    .required { color: #DC2626; }
    .esign-timestamp { font-size: 0.8125rem; color: #94A3B8; margin-bottom: 1.25rem; display: flex; align-items: center; }
    .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
    .confirm-btn { min-width: 160px; }
    .reject-sub { font-size: 0.875rem; color: #64748B; margin-bottom: 1rem; }
    .form-label { font-size: 0.8125rem; font-weight: 600; color: #334155; margin-bottom: 0.375rem; }

    /* Toast */
    .action-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: #0F172A; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; z-index: 600; box-shadow: 0 4px 20px rgba(0,0,0,0.2); display: flex; align-items: center; }
  `]
})
export class DocumentApproveComponent {
  readonly router = inject(Router);
  private readonly mock = inject(MockDataService);
  private readonly auth = inject(AuthStore);
  readonly docId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? 'DOC-0048';

  readonly showESignModal = signal(false);
  readonly showRejectModal = signal(false);
  readonly showChanges = signal(false);
  readonly toast = signal('');
  readonly rejectSubmitAttempted = signal(false);

  signPassword = '';
  rejectComment = '';

  // Dynamic document details
  private readonly doc = computed(() => this.mock.documents().find(d => d.id === this.docId));
  readonly docTitle = computed(() => this.doc()?.title ?? 'Document');
  readonly docRevision = computed(() => this.doc()?.revision ?? 'A');
  readonly docType = computed(() => this.doc()?.type ?? 'Work Instruction');
  readonly docTier = computed(() => {
    const tiers: Record<string, number> = {
      'Work Instruction': 3, 'Control Plan': 2, 'Quality Procedure': 2,
      'PFMEA': 2, 'MSA Study': 3, 'Form': 4,
    };
    return tiers[this.docType()] ?? 3;
  });
  readonly siteName = computed(() => {
    const siteId = this.auth.currentUser()?.siteId ?? this.doc()?.siteId;
    return this.mock.sites.find(s => s.id === siteId)?.name ?? 'Your Site';
  });

  // Dynamic approver details from AuthStore
  readonly approverName = computed(() => this.auth.fullName() || 'Approver');
  readonly approverRole = computed(() => {
    const roles = this.auth.currentUser()?.roles ?? [];
    if (roles.includes('Director')) return 'Plant Director';
    if (roles.includes('QM')) return 'Quality Manager';
    if (roles.includes('PM')) return 'Production Manager';
    if (roles.includes('QE')) return 'Quality Engineer';
    return 'Approver';
  });

  // Author details — the document owner is the author
  readonly authorName = computed(() => this.doc()?.owner ?? 'Author');
  readonly authorInitials = computed(() => this.doc()?.ownerInitials ?? '?');
  readonly authorColor = computed(() => {
    const initials = this.doc()?.ownerInitials;
    return this.mock.users.find(u => u.initials === initials)?.avatarColor ?? '#64748B';
  });

  currentTime(): string {
    return '14:23';
  }

  confirmApproval(): void {
    this.showESignModal.set(false);
    this.signPassword = '';
    this.mock.updateDocument(this.docId, { status: 'Released' });
    this.toast.set(`${this.docId} Rev ${this.docRevision()} approved and released`);
    setTimeout(() => {
      this.toast.set('');
      this.router.navigate(['/documents', this.docId]);
    }, 2000);
  }

  confirmRejection(): void {
    this.rejectSubmitAttempted.set(true);
    if (!this.rejectComment) return;
    this.showRejectModal.set(false);
    this.rejectSubmitAttempted.set(false);
    this.mock.updateDocument(this.docId, { status: 'Draft' });
    this.toast.set(`${this.docId} rejected — author notified`);
    setTimeout(() => {
      this.toast.set('');
      this.router.navigate(['/documents', this.docId]);
    }, 2000);
  }
}
