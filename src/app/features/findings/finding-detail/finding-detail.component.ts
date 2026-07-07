import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { AuditFindingDetail } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-finding-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">

      @if (finding(); as f) {

        <!-- Breadcrumb -->
        <nav class="breadcrumb-nav">
          <a [routerLink]="['/audits']" class="bc-link">Audits</a>
          <i class="bi bi-chevron-right bc-sep"></i>
          <a [routerLink]="['/audits', f.auditId]" class="bc-link">{{ f.auditId }}</a>
          <i class="bi bi-chevron-right bc-sep"></i>
          <span class="bc-current">{{ f.id }}</span>
        </nav>

        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <div class="header-badges">
              <span class="grade-badge grade-{{ f.grade.toLowerCase() }}">{{ f.grade }}</span>
              <span class="status-badge status-{{ f.status.toLowerCase() }}">{{ f.status }}</span>
              <span class="clause-badge">{{ f.clauseRef }}</span>
            </div>
            <h1>{{ f.id }}</h1>
          </div>
          <div class="header-actions">
            <span class="chip chip-blue">SCR-055</span>
            @if (f.status === 'Open') {
              <button class="btn btn-outline-secondary ms-2">
                <i class="bi bi-pencil me-1"></i>Edit
              </button>
              <button class="btn btn-primary ms-1">
                <i class="bi bi-check-lg me-1"></i>Submit Response
              </button>
            }
          </div>
        </div>

        <!-- Two-column layout -->
        <div class="detail-layout">

          <!-- Left: Finding details -->
          <div class="detail-main">

            <div class="q-card mb-3">
              <h3 class="section-h3">Description</h3>
              <p class="finding-desc">{{ f.description }}</p>
            </div>

            <div class="q-card mb-3">
              <h3 class="section-h3">Owner & Timeline</h3>
              <div class="meta-grid">
                <div class="meta-item">
                  <div class="meta-label">Owner</div>
                  <div class="avatar-name">
                    <div class="avatar-sm" [style.background]="f.ownerColor">{{ f.ownerInitials }}</div>
                    <span class="meta-val">{{ f.owner }}</span>
                  </div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Due Date</div>
                  <div class="meta-val" [class.overdue]="f.ageInDays > 14">{{ f.dueDate | date:'MMM d, yyyy' }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Age</div>
                  <div class="meta-val">{{ f.ageInDays === 0 ? 'Raised today' : f.ageInDays + ' days open' }}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">Evidence</div>
                  <div class="meta-val">{{ f.evidenceCount }} file(s)</div>
                </div>
                @if (f.capaId) {
                  <div class="meta-item">
                    <div class="meta-label">Linked CAPA</div>
                    <a class="capa-link" [routerLink]="['/capas', f.capaId]">{{ f.capaId }}</a>
                  </div>
                }
              </div>
            </div>

            <!-- Evidence section -->
            <div class="q-card">
              <div class="section-header-row">
                <h3 class="section-h3">Evidence</h3>
                <button class="btn btn-sm btn-outline-secondary">
                  <i class="bi bi-paperclip me-1"></i>Attach
                </button>
              </div>
              @if (f.evidenceCount === 0) {
                <div class="empty-evidence">No evidence attached yet.</div>
              } @else {
                <div class="evidence-list">
                  @for (n of evidencePlaceholders(); track n) {
                    <div class="evidence-item">
                      <i class="bi bi-file-earmark-image evidence-icon"></i>
                      <span class="evidence-name">evidence_{{ n }}.jpg</span>
                      <button class="btn btn-xs btn-link ms-auto"><i class="bi bi-download"></i></button>
                    </div>
                  }
                </div>
              }
            </div>

          </div>

          <!-- Right: Resolution panel -->
          <aside class="resolution-panel">

            <div class="q-card mb-3">
              <h3 class="section-h3">Resolution Status</h3>
              <div class="status-stepper">
                @for (step of resolutionSteps; track step.key) {
                  <div class="step-item" [class.done]="isStepDone(f.status, step.key)" [class.active]="f.status === step.key">
                    <div class="step-dot">
                      @if (isStepDone(f.status, step.key)) { <i class="bi bi-check-lg"></i> }
                    </div>
                    <div class="step-label">{{ step.label }}</div>
                  </div>
                }
              </div>
            </div>

            <div class="q-card mb-3">
              <h3 class="section-h3">Response</h3>
              @if (f.response) {
                <p class="response-text">{{ f.response }}</p>
              } @else {
                <textarea class="response-textarea" placeholder="Describe the corrective action taken or planned…" rows="5"></textarea>
                <button class="btn btn-primary btn-sm mt-2 w-100">Submit Response</button>
              }
            </div>

            @if (f.capaId) {
              <div class="q-card capa-card">
                <h3 class="section-h3">Linked CAPA</h3>
                <div class="capa-ref-block" [routerLink]="['/capas', f.capaId]">
                  <i class="bi bi-tools capa-icon"></i>
                  <div>
                    <div class="capa-id">{{ f.capaId }}</div>
                    <div class="capa-sub">Click to open 8D process</div>
                  </div>
                  <i class="bi bi-chevron-right ms-auto"></i>
                </div>
              </div>
            } @else {
              <div class="q-card">
                <h3 class="section-h3">CAPA</h3>
                <p class="no-capa">No CAPA linked to this finding.</p>
                <button class="btn btn-sm btn-outline-primary w-100">
                  <i class="bi bi-plus-lg me-1"></i>Create CAPA
                </button>
              </div>
            }

          </aside>

        </div>

      } @else {
        <div class="q-card not-found">Finding not found.</div>
      }

    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1280px; margin: 0 auto; }
    .breadcrumb-nav { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 1rem; font-size: 0.8125rem; }
    .bc-link { color: #2563EB; text-decoration: none; &:hover { text-decoration: underline; } }
    .bc-sep { color: #CBD5E1; font-size: 0.625rem; }
    .bc-current { color: #64748B; }

    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
    .header-left h1 { font-size: 1.375rem; font-weight: 700; margin: 0 0 0.25rem; font-family: monospace; color: #0F172A; }
    .header-badges { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.5rem; }
    .header-actions { display: flex; align-items: center; gap: 0.375rem; }

    .grade-badge { border-radius: 20px; padding: 0.2rem 0.75rem; font-size: 0.75rem; font-weight: 700; }
    .grade-major { background: #FEE2E2; color: #DC2626; }
    .grade-minor { background: #FEF9C3; color: #713F12; }
    .grade-ofi { background: #DBEAFE; color: #1E40AF; }

    .status-badge { border-radius: 20px; padding: 0.2rem 0.75rem; font-size: 0.75rem; font-weight: 600; }
    .status-open { background: #FEE2E2; color: #DC2626; }
    .status-submitted { background: #FEF9C3; color: #713F12; }
    .status-verified { background: #DBEAFE; color: #1E40AF; }
    .status-closed { background: #DCFCE7; color: #166534; }

    .clause-badge { background: #EDE9FE; color: #5B21B6; border-radius: 6px; padding: 0.2rem 0.625rem; font-size: 0.75rem; font-weight: 600; font-family: monospace; }

    .detail-layout { display: grid; grid-template-columns: 1fr 320px; gap: 1.25rem; align-items: start; }
    @media (max-width: 900px) { .detail-layout { grid-template-columns: 1fr; } }

    .section-h3 { font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.75rem; }
    .finding-desc { font-size: 0.9375rem; color: #334155; line-height: 1.6; margin: 0; }

    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .meta-item {}
    .meta-label { font-size: 0.7rem; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.25rem; }
    .meta-val { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .meta-val.overdue { color: #DC2626; }
    .avatar-name { display: flex; align-items: center; gap: 0.5rem; }
    .avatar-sm { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .capa-link { font-size: 0.875rem; font-weight: 600; color: #2563EB; text-decoration: none; &:hover { text-decoration: underline; } }

    .section-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .empty-evidence { font-size: 0.875rem; color: #94A3B8; text-align: center; padding: 1rem 0; }
    .evidence-list { display: flex; flex-direction: column; gap: 0.375rem; }
    .evidence-item { display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0.75rem; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0; }
    .evidence-icon { color: #2563EB; font-size: 1rem; }
    .evidence-name { font-size: 0.875rem; color: #334155; }
    .btn-xs { padding: 0.125rem 0.375rem; font-size: 0.75rem; }

    /* Resolution stepper */
    .status-stepper { display: flex; flex-direction: column; gap: 0; }
    .step-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; position: relative; }
    .step-item:not(:last-child)::after { content: ''; position: absolute; left: 11px; top: calc(50% + 10px); width: 2px; height: calc(100% - 8px); background: #E2E8F0; }
    .step-dot { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #E2E8F0; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; color: #fff; flex-shrink: 0; z-index: 1; }
    .step-item.done .step-dot { background: #22C55E; border-color: #22C55E; }
    .step-item.active .step-dot { border-color: #2563EB; background: #DBEAFE; }
    .step-label { font-size: 0.875rem; color: #475569; }
    .step-item.active .step-label { font-weight: 700; color: #0F172A; }
    .step-item.done .step-label { color: #22C55E; }

    .response-text { font-size: 0.875rem; color: #334155; line-height: 1.6; margin: 0; }
    .response-textarea { width: 100%; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.875rem; resize: vertical; outline: none; &:focus { border-color: #2563EB; } }

    .capa-ref-block { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px; cursor: pointer; &:hover { background: #E0F2FE; } }
    .capa-icon { font-size: 1.125rem; color: #0891B2; }
    .capa-id { font-size: 0.875rem; font-weight: 700; color: #0F172A; }
    .capa-sub { font-size: 0.75rem; color: #64748B; }
    .no-capa { font-size: 0.875rem; color: #94A3B8; margin-bottom: 0.75rem; }

    .not-found { padding: 2rem; text-align: center; color: #94A3B8; }
  `],
})
export class FindingDetailComponent {
  readonly mock = inject(MockDataService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly finding = computed<AuditFindingDetail | undefined>(() => {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    return this.mock.getAuditFindingDetail(id);
  });

  readonly evidencePlaceholders = computed<number[]>(() =>
    Array.from<number>({ length: this.finding()?.evidenceCount ?? 0 }).map((_, i) => i + 1)
  );

  readonly resolutionSteps = [
    { key: 'Open', label: 'Open' },
    { key: 'Submitted', label: 'Response Submitted' },
    { key: 'Verified', label: 'Evidence Verified' },
    { key: 'Closed', label: 'Closed' },
  ];

  isStepDone(currentStatus: string, stepKey: string): boolean {
    const order = ['Open', 'Submitted', 'Verified', 'Closed'];
    return order.indexOf(currentStatus) > order.indexOf(stepKey);
  }
}
