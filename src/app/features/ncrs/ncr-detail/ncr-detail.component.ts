import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { DispositionType } from '../../../shared/interfaces/models';
import { AuthStore } from '../../../core/auth/stores/auth.store';

type NcrTab = 'overview' | 'containment' | 'disposition' | 'capa' | 'attachments' | 'history';

@Component({
  selector: 'app-ncr-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">

      <!-- Header card -->
      <div class="ncr-header q-card shadow-sm mb-3">
        <button class="back-btn" (click)="router.navigate(['/ncrs'])">
          <i class="bi bi-arrow-left me-1"></i> NCR List
        </button>

        <div class="header-row">
          <div class="header-left">
            <div class="header-id-row">
              <span class="record-id">{{ ncr?.id }}</span>
              <span class="chip ms-2 {{ statusChipClass(ncr?.status ?? '') }}">{{ ncr?.status }}</span>
              @if (ncr?.isCustomerFacing) {
                <span class="c-badge ms-2" data-tip="Customer-facing">C</span>
              }
              @if (ncr?.severity) {
                <span class="sev-badge ms-2 sev-{{ ncr!.severity.toLowerCase() }}">{{ ncr!.severity }}</span>
              }
            </div>
            <h1 class="ncr-title">{{ ncr?.title }}</h1>
            <div class="ncr-meta-row">
              @if (ncr?.partNumber) {
                <span class="meta-item"><i class="bi bi-box me-1"></i>{{ ncr!.partNumber }}</span>
                <span class="meta-sep">·</span>
              }
              @if (ncr?.defectCode) {
                <span class="meta-item"><span class="defect-badge">{{ ncr!.defectCode }}</span></span>
                <span class="meta-sep">·</span>
              }
              @if (ncr?.qtyDefective != null) {
                <span class="meta-item">Qty: <strong>{{ ncr!.qtyDefective }}</strong></span>
                <span class="meta-sep">·</span>
              }
              <span class="meta-item">
                Age: <span class="chip chip-sm {{ ageChip(ncr?.ageInDays ?? 0) }}">{{ ncr?.ageInDays }}d</span>
              </span>
              @if (ncr?.customer) {
                <span class="meta-sep">·</span>
                <span class="meta-item meta-orange"><i class="bi bi-building me-1"></i>{{ ncr!.customer }}</span>
              }
            </div>
          </div>
          <div class="header-actions">
            @if (ncr.status === 'Closed') {
              <!-- Closed — read-only badge -->
              <span class="ncr-closed-badge">
                <i class="bi bi-check-circle-fill me-1"></i> NCR Closed
              </span>
            } @else if (ncr.status === 'Voided') {
              <span class="ncr-voided-badge">
                <i class="bi bi-slash-circle me-1"></i> Voided
              </span>
            } @else if (ncr.status === 'Dispositioned') {
              <!-- Dispositioned → next step is Close -->
              @if (canDisposition()) {
                <button class="btn btn-success btn-sm me-2"
                        data-tip="The disposition is done. Click here to officially close this NCR and complete the audit record."
                        (click)="showCloseModal.set(true)">
                  <i class="bi bi-lock-fill me-1"></i> Close NCR
                </button>
              }
              <button class="btn btn-outline-secondary btn-sm me-2"
                      data-tip="Open a Corrective Action to permanently fix the root cause and prevent this defect from happening again."
                      (click)="onEscalate()">
                <i class="bi bi-arrow-up-right me-1"></i> Escalate to CAPA
              </button>
              <button class="btn btn-outline-danger btn-sm me-2"
                      data-tip="Cancel this NCR if the disposition was made in error. This cannot be undone."
                      (click)="onVoid()">
                <i class="bi bi-slash-circle me-1"></i> Void
              </button>
            } @else {
              <!-- Open / Under Review — normal actions -->
              <button class="btn btn-primary btn-sm me-2"
                      data-tip="Decide what happens to the defective parts — rework, scrap, use-as-is, etc. Go here after containment is in place."
                      (click)="activeTab.set('disposition')">
                <i class="bi bi-check2-circle me-1"></i> Disposition
              </button>
              <button class="btn btn-outline-secondary btn-sm me-2"
                      data-tip="Open a Corrective Action to permanently find and fix the root cause of this defect."
                      (click)="onEscalate()">
                <i class="bi bi-arrow-up-right me-1"></i> Escalate to CAPA
              </button>
              <button class="btn btn-outline-danger btn-sm me-2"
                      data-tip="Cancel this NCR if it was logged in error. This cannot be undone."
                      (click)="onVoid()">
                <i class="bi bi-slash-circle me-1"></i> Void
              </button>
            }
            <button class="btn btn-outline-secondary btn-sm icon-btn"
                    data-tip="Download a PDF summary of this NCR for offline use or sharing.">
              <i class="bi bi-download"></i>
            </button>
          </div>
        </div>

        <!-- Tab rail -->
        <div class="tab-rail">
          @for (tab of tabs; track tab.key) {
            <button class="tab-btn" [class.active]="activeTab() === tab.key"
                    [attr.data-tip]="tab.tooltip"
                    (click)="activeTab.set(tab.key)">
              <i class="bi {{ tab.icon }} me-1"></i> {{ tab.label }}
            </button>
          }
        </div>
      </div>

      <!-- TAB: Overview -->
      @if (activeTab() === 'overview') {
        <div class="overview-grid">
          <!-- Left: Detail fields -->
          <div class="q-card detail-card">
            <div class="detail-section-title">NCR Details</div>
            @for (row of overviewRows; track row.label) {
              <div class="detail-row">
                <span class="detail-key">{{ row.label }}</span>
                <span class="detail-val" [innerHTML]="row.value"></span>
              </div>
            }
            <div class="detail-divider"></div>
            <div class="detail-section-title">Description</div>
            <p class="description-text">{{ ncr?.description }}</p>
          </div>

          <!-- Right: Status timeline card -->
          <div class="q-card status-card">
            <div class="detail-section-title">Status Timeline</div>
            <div class="status-timeline">
              @for (ev of statusTimeline; track ev.step; let last = $last) {
                <div class="st-item">
                  <div class="st-icon-wrap">
                    <div class="st-dot" [class.st-done]="ev.done" [class.st-active]="ev.active" [class.st-future]="!ev.done && !ev.active">
                      @if (ev.done) { <i class="bi bi-check-lg"></i> }
                      @else if (ev.active) { <i class="bi bi-circle-fill" style="font-size:6px"></i> }
                    </div>
                    @if (!last) { <div class="st-line" [class.st-line-done]="ev.done"></div> }
                  </div>
                  <div class="st-content">
                    <div class="st-label" [class.st-label-active]="ev.active">{{ ev.label }}</div>
                    @if (ev.date) { <div class="st-date">{{ ev.date }}</div> }
                    @if (ev.note) { <div class="st-note">{{ ev.note }}</div> }
                  </div>
                </div>
              }
            </div>

            @if (ncr?.mrbRequired) {
              <div class="mrb-badge">
                <i class="bi bi-people me-2"></i>
                <span>MRB Review Required</span>
                <button class="btn btn-sm btn-outline-warning ms-auto"
                        (click)="router.navigate(['/ncrs/mrb'])">
                  View MRB Queue
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB: Containment -->
      @if (activeTab() === 'containment') {
        <div class="q-card">
          <div class="tab-inner-header">
            <div>
              <span class="fw-600">Containment Actions ({{ containmentActions().length }})</span>
              <div class="cont-hint">Immediate steps taken to stop the defect from reaching customers or the next station.</div>
            </div>
            @if (!isNcrLocked() && !showAddContainmentForm()) {
              <button class="btn btn-outline-primary btn-sm"
                      data-tip="Record a new immediate action to contain this defect."
                      (click)="addContainment()">
                <i class="bi bi-plus me-1"></i> Add Action
              </button>
            }
            @if (isNcrLocked()) {
              <span class="locked-badge" [attr.data-tip]="ncr.status + ' — no further changes can be made to this NCR.'">
                <i class="bi bi-lock-fill me-1"></i> {{ ncr.status }} — read only
              </span>
            }
          </div>

          @if (!isNcrLocked() && showAddContainmentForm()) {
            <div class="add-cont-form">
              <div class="add-cont-form-title">
                <i class="bi bi-shield-exclamation me-1" style="color:#2563EB"></i>
                New Containment Action
              </div>

              <!-- Row 1: Action Type (required) -->
              <div class="add-cont-field">
                <label class="add-cont-field-label">
                  Action Type <span class="req">*</span>
                  <span class="field-hint">What category of containment is this?</span>
                </label>
                <select class="form-select form-select-sm" [(ngModel)]="newContainmentType">
                  <option value="" disabled>— Select action type —</option>
                  @for (t of containmentActionTypes; track t) {
                    <option [value]="t">{{ t }}</option>
                  }
                </select>
              </div>

              <!-- Row 2: Description (required) -->
              <div class="add-cont-field">
                <label class="add-cont-field-label">
                  Action Description <span class="req">*</span>
                  <span class="field-hint">Describe exactly what you are doing — be specific enough for an auditor.</span>
                </label>
                <textarea class="form-control form-control-sm add-cont-textarea"
                          rows="2"
                          [(ngModel)]="newContainmentWhat"
                          placeholder="e.g. All parts from Lot 24B moved to red hold bin 3 at Line A QC station. Tagged with NCR-2026-0151."></textarea>
              </div>

              <!-- Row 3: Due Date + Location + Qty -->
              <div class="add-cont-row3">
                <div class="add-cont-field add-cont-field--inline">
                  <label class="add-cont-field-label">
                    Due Date <span class="req">*</span>
                    <span class="field-hint">When must this be completed?</span>
                  </label>
                  <input type="date" class="form-control form-control-sm"
                         [(ngModel)]="newContainmentDueDate" />
                </div>
                <div class="add-cont-field add-cont-field--inline">
                  <label class="add-cont-field-label">
                    Location / Area
                    <span class="field-hint optional-label">(optional)</span>
                  </label>
                  <input type="text" class="form-control form-control-sm"
                         [(ngModel)]="newContainmentLocation"
                         placeholder="e.g. Line A — Hold Bin 3" />
                </div>
                <div class="add-cont-field add-cont-field--inline">
                  <label class="add-cont-field-label">
                    Qty Contained
                    <span class="field-hint optional-label">(optional)</span>
                  </label>
                  <input type="number" class="form-control form-control-sm"
                         [(ngModel)]="newContainmentQty"
                         placeholder="—" min="0" />
                  @if (containmentQtyOverWarning) {
                    <div class="field-warning">
                      <i class="bi bi-exclamation-triangle-fill me-1"></i>
                      Qty Contained ({{ newContainmentQty }}) exceeds NCR quantity ({{ ncr?.qtyDefective }}). Confirm this is intentional — e.g. precautionary batch hold.
                    </div>
                  }
                </div>
              </div>

              <!-- Actions -->
              <div class="add-cont-actions">
                <span class="add-cont-required-note"><span class="req">*</span> Required fields</span>
                <button class="btn btn-sm btn-outline-secondary" (click)="cancelContainment()">Cancel</button>
                <button class="btn btn-sm btn-primary" [disabled]="!containmentFormValid" (click)="saveContainment()">
                  <i class="bi bi-check2 me-1"></i>Save Action
                </button>
              </div>
            </div>
          }

          @if (containmentActions().length === 0) {
            <div class="cont-empty">
              <i class="bi bi-shield-check" style="font-size:2rem;color:#CBD5E1"></i>
              <div class="cont-empty-title">No containment actions yet</div>
              <div class="cont-empty-sub">Click <strong>+ Add Action</strong> to record a step — e.g. quarantine parts, stop line, sort inventory.</div>
            </div>
          } @else {
            <table class="q-table cont-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th style="width:130px">Owner</th>
                  <th style="width:80px">Qty</th>
                  <th style="width:120px">Due Date</th>
                  <th style="width:110px">Status</th>
                  <th style="width:140px"></th>
                </tr>
              </thead>
              <tbody>
                @for (a of containmentActions(); track a.id) {
                  <tr [class.verified-row]="a.status === 'Verified'">
                    <td>
                      <div class="action-text">{{ a.what }}</div>
                      @if (a.location) {
                        <div class="action-location"><i class="bi bi-geo-alt me-1"></i>{{ a.location }}</div>
                      }
                    </td>
                    <td>
                      <div class="owner-cell">
                        <span class="av-sm" [style.background]="a.ownerColor">{{ a.ownerInitials }}</span>
                        {{ a.owner.split(' ')[0] }}
                      </div>
                    </td>
                    <td class="text-center">{{ a.qty ?? '—' }}</td>
                    <td class="text-muted-sm">{{ a.completedDate ? ('✓ ' + a.completedDate) : (a.dueDate ?? '—') }}</td>
                    <td>
                      @if (a.status === 'Verified') {
                        <span class="chip chip-sm chip-released"><i class="bi bi-check me-1"></i>Verified</span>
                      } @else {
                        <span class="chip chip-sm chip-in-approval">Open</span>
                      }
                    </td>
                    <td class="text-right">
                      @if (a.status === 'Open' && !isNcrLocked()) {
                        @if (authStore.fullName() !== a.owner && canVerifyContainment()) {
                          <button class="btn btn-sm btn-outline-success verify-btn"
                                  data-tip="Confirm this action was completed and effective."
                                  (click)="markVerified(a.id)">
                            <i class="bi bi-check2 me-1"></i>Verify
                          </button>
                        } @else if (authStore.fullName() === a.owner) {
                          <span class="sod-chip" data-tip="You added this action. A QE, QS, QM or Manager must verify it — not the same person who created it.">
                            <i class="bi bi-hourglass-split me-1"></i>Awaiting peer review
                          </span>
                        } @else {
                          <span class="sod-chip sod-chip--role" data-tip="Your role (Operator / QT) cannot approve quality containment actions. A Supervisor or Manager must verify.">
                            <i class="bi bi-lock me-1"></i>Supervisor required
                          </span>
                        }
                        @if (authStore.fullName() === a.owner) {
                          <button class="btn btn-sm btn-link text-danger ms-1 p-1"
                                  data-tip="Remove this action."
                                  (click)="deleteContainmentAction(a.id)">
                            <i class="bi bi-trash"></i>
                          </button>
                        }
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }

      <!-- TAB: Disposition -->
      @if (activeTab() === 'disposition') {
        <div class="q-card disposition-card">
          <div class="tab-inner-header">
            <div>
              <span class="fw-600">Disposition Decision</span>
              <div class="cont-hint">Choose what to do with the defective parts. This decision is permanently recorded in the audit trail.</div>
            </div>
            @if (ncr?.disposition) {
              <span class="chip chip-released chip-sm"><i class="bi bi-check me-1"></i>{{ ncr!.disposition }}</span>
            }
          </div>

          @if (!canDisposition()) {
            <!-- Role lock for Operators / QT -->
            <div class="disp-locked">
              <i class="bi bi-lock-fill" style="font-size:2rem;color:#CBD5E1"></i>
              <div class="disp-locked-title">Disposition requires Supervisor or Manager role</div>
              <div class="disp-locked-sub">You are logged in as <strong>{{ authStore.currentUser()?.jobTitle ?? 'Operator' }}</strong>. A Quality Engineer, Quality Supervisor, Quality Manager, or Plant Director must make this decision.</div>
            </div>
          } @else if (ncr.status === 'Dispositioned' || ncr.status === 'Closed' || ncr.status === 'Voided') {
            <!-- Already dispositioned or locked — read-only view -->
            <div class="disp-done-banner" [style.background]="ncr.status === 'Voided' ? '#F9FAFB' : '#F0FDF4'"
                 [style.borderColor]="ncr.status === 'Voided' ? '#D1D5DB' : '#86EFAC'"
                 [style.color]="ncr.status === 'Voided' ? '#6B7280' : '#166534'">
              <i class="bi me-2" [class.bi-check-circle-fill]="ncr.status !== 'Voided'" [class.bi-slash-circle]="ncr.status === 'Voided'"></i>
              @if (ncr.status === 'Voided') {
                This NCR has been <strong>voided</strong>. No further actions can be taken.
              } @else if (ncr.status === 'Closed') {
                This NCR is <strong>closed</strong>. Disposition was <strong>{{ ncr!.disposition }}</strong>. The record is locked — raise a new NCR if a fresh issue is found.
              } @else {
                Dispositioned as <strong>{{ ncr!.disposition }}</strong>. Complete the disposition action, then click <strong>Close NCR</strong> in the header to finish.
              }
            </div>
          } @else {
            <div class="disp-body">

              <!-- Disposition type cards -->
              <div class="disp-type-section">
                <label class="disp-section-label">
                  Step 1 — Select Disposition Type <span class="req">*</span>
                  <span class="field-hint">Hover over each option for guidance on when to use it.</span>
                </label>
                <div class="disp-radio-group">
                  @for (d of dispositionTypes; track d.value) {
                    <label class="disp-radio-item" [class.selected]="selectedDisposition() === d.value"
                           [attr.data-tip]="d.tooltip">
                      <input type="radio" name="disp" [value]="d.value"
                             [checked]="selectedDisposition() === d.value"
                             (change)="selectedDisposition.set(d.value)" />
                      <div class="disp-radio-content">
                        <div class="disp-type-header">
                          <i class="bi {{ d.icon }} me-2" [style.color]="d.color"></i>
                          <span class="disp-type-name">{{ d.value }}</span>
                        </div>
                        <span class="disp-type-desc">{{ d.desc }}</span>
                      </div>
                    </label>
                  }
                </div>
              </div>

              <!-- Step 2: Contextual fields per type -->
              @if (selectedDisposition()) {
                <div class="disp-context-section">
                  <div class="disp-section-label">Step 2 — Provide Details</div>

                  <!-- Use-As-Is -->
                  @if (selectedDisposition() === 'Use-As-Is') {
                    <div class="disp-context-hint">
                      <i class="bi bi-info-circle me-1"></i>
                      Use-As-Is means the part has a defect but it is safe to ship or use. You must explain <em>why</em> the defect is acceptable — this justification is reviewed by auditors.
                    </div>
                    <div class="disp-field">
                      <label class="add-cont-field-label">Engineering Justification <span class="req">*</span>
                        <span class="field-hint">Explain why the deviation does not affect function, safety, or customer requirements.</span>
                      </label>
                      <textarea class="form-control form-control-sm" rows="3"
                                [(ngModel)]="dispositionJustification"
                                placeholder="e.g. Dimensional deviation of 0.02mm is within customer-approved tolerance band per ECN-4421. No impact on assembly fit or function confirmed by engineering review dated 2026-06-24."></textarea>
                    </div>
                    <div class="esign-trigger mt-2">
                      <div class="esign-notice">
                        <i class="bi bi-shield-lock me-2"></i>
                        Use-As-Is requires a <strong>Quality Manager electronic signature</strong> before it is final. Click below after entering your justification.
                      </div>
                      <button class="btn btn-outline-primary btn-sm mt-2"
                              [disabled]="!dispositionJustification.trim()"
                              data-tip="Sign with your password to confirm this Use-As-Is decision. Recorded permanently in the audit trail."
                              (click)="showESignModal.set(true)">
                        <i class="bi bi-pen me-1"></i> Sign &amp; Confirm Use-As-Is
                      </button>
                    </div>
                  }

                  <!-- Rework -->
                  @if (selectedDisposition() === 'Rework') {
                    <div class="disp-context-hint">
                      <i class="bi bi-info-circle me-1"></i>
                      Describe the rework steps to be performed. After rework, the part must pass a re-inspection before it can proceed to the next station or be shipped.
                    </div>
                    <div class="disp-fields-row">
                      <div class="disp-field" style="flex:2">
                        <label class="add-cont-field-label">Rework Instructions <span class="req">*</span>
                          <span class="field-hint">What must be done to bring the part back to spec?</span>
                        </label>
                        <textarea class="form-control form-control-sm" rows="2"
                                  [(ngModel)]="dispReworkInstructions"
                                  placeholder="e.g. Re-torque fastener to 25 Nm per WI-045. Re-inspect thread engagement after rework."></textarea>
                      </div>
                      <div class="disp-field">
                        <label class="add-cont-field-label">Target Completion Date <span class="req">*</span>
                          <span class="field-hint">When must rework be finished?</span>
                        </label>
                        <input type="date" class="form-control form-control-sm" [(ngModel)]="dispDueDate" />
                      </div>
                      <div class="disp-field">
                        <label class="add-cont-field-label">Qty to Rework
                          <span class="field-hint optional-label">(optional)</span>
                        </label>
                        <input type="number" class="form-control form-control-sm" [(ngModel)]="dispQty" placeholder="—" min="0" />
                      </div>
                    </div>
                  }

                  <!-- Repair -->
                  @if (selectedDisposition() === 'Repair') {
                    <div class="disp-context-hint">
                      <i class="bi bi-info-circle me-1"></i>
                      Repair restores function but the part will not fully meet the original drawing spec. An engineering authorization number is required to prove the repair was reviewed and approved.
                    </div>
                    <div class="disp-fields-row">
                      <div class="disp-field" style="flex:2">
                        <label class="add-cont-field-label">Repair Method <span class="req">*</span>
                          <span class="field-hint">Describe what repair will be performed.</span>
                        </label>
                        <textarea class="form-control form-control-sm" rows="2"
                                  [(ngModel)]="dispReworkInstructions"
                                  placeholder="e.g. Fill surface porosity with approved repair compound per MET-017. Sand flush and re-coat."></textarea>
                      </div>
                      <div class="disp-field">
                        <label class="add-cont-field-label">Engineering Auth Ref <span class="req">*</span>
                          <span class="field-hint">ECN, memo, or email ref authorizing this repair.</span>
                        </label>
                        <input type="text" class="form-control form-control-sm" [(ngModel)]="dispEngAuth"
                               placeholder="e.g. ECN-4421 / ENG-MEMO-220" />
                      </div>
                    </div>
                  }

                  <!-- Scrap -->
                  @if (selectedDisposition() === 'Scrap') {
                    <div class="disp-context-hint">
                      <i class="bi bi-info-circle me-1"></i>
                      Scrapped parts must be physically destroyed or permanently marked so they cannot re-enter the production flow. Record the quantity so inventory can be reconciled and replacement ordered.
                    </div>
                    <div class="disp-fields-row">
                      <div class="disp-field">
                        <label class="add-cont-field-label">Qty to Scrap <span class="req">*</span>
                          <span class="field-hint">How many parts are being scrapped?</span>
                        </label>
                        <input type="number" class="form-control form-control-sm" [(ngModel)]="dispQty" placeholder="Enter quantity" min="1" style="max-width:160px" />
                      </div>
                      <div class="disp-field" style="flex:2">
                        <label class="add-cont-field-label">Scrap Authorization / Notes
                          <span class="field-hint optional-label">(optional)</span>
                        </label>
                        <input type="text" class="form-control form-control-sm" [(ngModel)]="dispEngAuth"
                               placeholder="e.g. Authorized by QM on 2026-06-24 per NCR meeting" />
                      </div>
                    </div>
                  }

                  <!-- Return to Supplier -->
                  @if (selectedDisposition() === 'Return to Supplier') {
                    <div class="disp-context-hint">
                      <i class="bi bi-info-circle me-1"></i>
                      Contact the supplier first to get a Return Merchandise Authorization (RMA) number before shipping parts back. Without an RMA the supplier may refuse the return. Include the NCR number on all return labels.
                    </div>
                    <div class="disp-fields-row">
                      <div class="disp-field" style="flex:2">
                        <label class="add-cont-field-label">Supplier Name <span class="req">*</span>
                          <span class="field-hint">Which supplier is the defect being returned to?</span>
                        </label>
                        <input type="text" class="form-control form-control-sm" [(ngModel)]="dispSupplier"
                               placeholder="e.g. Acme Stamping Co." />
                      </div>
                      <div class="disp-field">
                        <label class="add-cont-field-label">RMA / Return Ref Number <span class="req">*</span>
                          <span class="field-hint">Authorization number from the supplier.</span>
                        </label>
                        <input type="text" class="form-control form-control-sm" [(ngModel)]="dispRmaNumber"
                               placeholder="e.g. RMA-20240624-001" />
                      </div>
                      <div class="disp-field">
                        <label class="add-cont-field-label">Qty to Return
                          <span class="field-hint optional-label">(optional)</span>
                        </label>
                        <input type="number" class="form-control form-control-sm" [(ngModel)]="dispQty" placeholder="—" min="0" />
                      </div>
                    </div>
                  }

                  <!-- Regrade -->
                  @if (selectedDisposition() === 'Regrade') {
                    <div class="disp-context-hint">
                      <i class="bi bi-info-circle me-1"></i>
                      The part will be relabelled and used in a different application that accepts the deviation. The part must be clearly marked with the new grade to prevent it from being mixed with conforming stock.
                    </div>
                    <div class="disp-fields-row">
                      <div class="disp-field" style="flex:2">
                        <label class="add-cont-field-label">New Grade / Target Application <span class="req">*</span>
                          <span class="field-hint">What spec or product will this part be used for instead?</span>
                        </label>
                        <input type="text" class="form-control form-control-sm" [(ngModel)]="dispNewGrade"
                               placeholder="e.g. Grade B — approved for non-critical interior bracket per DR-0088" />
                      </div>
                      <div class="disp-field">
                        <label class="add-cont-field-label">Engineering Auth Ref <span class="req">*</span>
                          <span class="field-hint">Document or approval reference for this regrade.</span>
                        </label>
                        <input type="text" class="form-control form-control-sm" [(ngModel)]="dispEngAuth"
                               placeholder="e.g. DR-0088 / ENG-NOTE-44" />
                      </div>
                    </div>
                  }
                </div>
              }

              <div class="disp-footer">
                @if (!selectedDisposition()) {
                  <span class="disp-footer-hint">Select a disposition type above to continue.</span>
                }
                @if (selectedDisposition() && selectedDisposition() !== 'Use-As-Is') {
                  <button class="btn btn-primary save-disp-btn"
                          data-tip="Save this disposition decision. It will be recorded in the audit trail with your name and timestamp."
                          (click)="saveDisposition()">
                    <i class="bi bi-floppy me-1"></i> Save Disposition
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB: Linked CAPA -->
      @if (activeTab() === 'capa') {
        <div class="q-card capa-tab-card">
          @if (linkedCapa) {
            <div class="capa-card">
              <!-- Header: ID · status · on-time · completion % -->
              <div class="capa-card-header">
                <span class="record-id">{{ linkedCapa.id }}</span>
                <span class="chip chip-sm ms-2"
                      [class.chip-in-approval]="linkedCapa.status === 'Open'"
                      [class.chip-released]="linkedCapa.status === 'Closed'"
                      [attr.data-tip]="linkedCapa.status === 'Open' ? 'CAPA is actively being worked — root cause investigation is underway.' : 'CAPA is closed and effectiveness has been verified.'">
                  {{ linkedCapa.status }}
                </span>
                <span class="capa-ontime ms-2"
                      [class.capa-ontime--ok]="linkedCapa.onTime"
                      [class.capa-ontime--late]="!linkedCapa.onTime"
                      [attr.data-tip]="linkedCapa.onTime ? 'Progressing on schedule relative to the due date.' : 'Behind schedule — team lead should review blockers immediately.'">
                  <i class="bi {{ linkedCapa.onTime ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill' }} me-1"></i>
                  {{ linkedCapa.onTime ? 'On Track' : 'Overdue' }}
                </span>
                <span class="ms-auto text-muted-sm"
                      data-tip="Percentage of corrective action steps completed so far.">
                  {{ linkedCapa.completionPct }}% complete
                </span>
              </div>

              <div class="capa-card-title">{{ linkedCapa.title }}</div>

              <!-- Champion -->
              <div class="capa-owner-row">
                <div class="capa-avatar"
                     data-tip="CAPA Champion — the individual accountable for driving the corrective action process to on-time closure.">
                  {{ linkedCapa.ownerInitials }}
                </div>
                <div>
                  <span class="capa-owner-name">{{ linkedCapa.owner }}</span>
                  <span class="capa-owner-label">Champion</span>
                </div>
              </div>

              <!-- Step dots -->
              <div class="capa-steps-row"
                   [attr.data-tip]="'Step ' + linkedCapa.stepNumber + ' of ' + linkedCapa.totalSteps + ' — currently in: ' + linkedCapa.currentStep">
                @for (n of capaStepDots; track n) {
                  <div class="capa-step-dot"
                       [class.done]="n < linkedCapa.stepNumber"
                       [class.active]="n === linkedCapa.stepNumber">
                  </div>
                }
                <span class="capa-step-label ms-2">{{ linkedCapa.currentStep }}</span>
              </div>

              <!-- Progress bar -->
              <div class="capa-progress">
                <div class="progress capa-bar">
                  <div class="progress-bar bg-primary" [style.width.%]="linkedCapa.completionPct"></div>
                </div>
              </div>

              <div class="capa-meta-row">
                <span data-tip="Scheduled closure date — tracked against SLA. Overdue CAPAs are flagged for Quality Manager review.">
                  <i class="bi bi-calendar me-1"></i>Due {{ linkedCapa.dueDate }}
                </span>
                <span data-tip="Current active phase of the corrective action process.">
                  <i class="bi bi-layers me-1"></i>Step {{ linkedCapa.stepNumber }} / {{ linkedCapa.totalSteps }}
                </span>
              </div>

              <div class="capa-actions mt-2">
                <button class="btn btn-primary btn-sm"
                        data-tip="Open the CAPA workspace to view root cause analysis, corrective action plan, and effectiveness verification."
                        (click)="router.navigate(['/capas', linkedCapa.id])">
                  <i class="bi bi-arrow-right me-1"></i> Go to CAPA
                </button>
              </div>
            </div>
          } @else {
            <!-- Empty state with escalation guidance -->
            <div class="capa-empty-panel">

              <!-- Escalation criteria reference box -->
              <div class="capa-criteria-box">
                <div class="capa-criteria-title">
                  <i class="bi bi-shield-check me-1"></i> When to Escalate — ISO 9001 §10.2
                </div>
                @for (c of escalationCriteria; track c.label) {
                  <div class="capa-criteria-row" [attr.data-tip]="c.tip">
                    <i class="bi {{ c.icon }} me-2" [style.color]="c.color"></i>
                    <span>{{ c.label }}</span>
                    <span class="capa-esc-badge ms-auto" [style.color]="c.badgeColor">{{ c.badge }}</span>
                  </div>
                }
              </div>

              <!-- Icon + message + CTA -->
              <div class="empty-capa">
                <i class="bi bi-diagram-3 empty-icon"></i>
                <p>No CAPA linked to this NCR yet.</p>
                @if (ncr.status === 'Voided') {
                  <p class="esc-locked-note">
                    <i class="bi bi-slash-circle me-1"></i>
                    Voided NCR — escalation is not applicable.
                  </p>
                } @else if (canEscalateToCapa()) {
                  @if (ncr.status === 'Closed') {
                    <p class="esc-retrospective-note">
                      <i class="bi bi-info-circle me-1"></i>
                      NCR is closed — this will create a <strong>retrospective CAPA</strong> for root cause analysis.
                    </p>
                  } @else if (ncrNeedsEscalation) {
                    <p class="esc-hint">
                      <i class="bi bi-exclamation-triangle-fill me-1"></i>{{ ncr.severity }} severity — CAPA escalation is recommended
                    </p>
                  }
                  <button class="btn btn-outline-primary btn-sm"
                          data-tip="Initiate a formal Corrective & Preventive Action to investigate root cause, implement a permanent fix, and verify effectiveness. Required for Major NCRs per ISO 9001 §10.2."
                          (click)="onEscalate()">
                    <i class="bi bi-arrow-up-right me-1"></i> Escalate to CAPA
                  </button>
                } @else {
                  <p class="esc-locked-note">
                    <i class="bi bi-lock-fill me-1"></i>
                    NCR is closed — contact your Quality Manager to initiate a retrospective CAPA.
                  </p>
                }
              </div>

            </div>
          }
        </div>
      }

      <!-- TAB: Attachments -->
      @if (activeTab() === 'attachments') {
        <div class="q-card attach-card">
          <div class="tab-inner-header">
            <span>Attachments ({{ attachments().length }})</span>
            @if (!isNcrLocked()) {
              <button class="btn btn-outline-primary btn-sm"
                      data-tip="Upload a photo, PDF, or any file related to this defect.">
                <i class="bi bi-upload me-1"></i> Upload
              </button>
            } @else {
              <span class="locked-badge" [attr.data-tip]="ncr.status + ' — attachments are read-only.'">
                <i class="bi bi-lock-fill me-1"></i> Read only
              </span>
            }
          </div>
          <div class="attach-grid">
            @for (a of attachments(); track a.name) {
              <div class="attach-thumb">
                <div class="thumb-preview">
                  <i class="bi {{ a.icon }} thumb-big-icon" [style.color]="a.color"></i>
                </div>
                <div class="thumb-name">{{ a.name }}</div>
                <div class="thumb-meta">{{ a.size }}</div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB: History -->
      @if (activeTab() === 'history') {
        <div class="q-card history-card">
          <div class="tab-inner-header"><span>Audit Trail — {{ history().length }} events</span></div>
          <div class="history-timeline">
            @for (h of history(); track h.id; let last = $last) {
              <div class="history-item">
                <div class="history-avatar" [style.background]="h.color">{{ h.initials }}</div>
                <div class="history-content">
                  <div class="history-action">
                    <span class="history-actor">{{ h.actor }}</span> {{ h.action }}
                    @if (h.detail) { <span class="history-detail">{{ h.detail }}</span> }
                  </div>
                  <div class="history-time">{{ h.timestamp }}</div>
                </div>
                @if (!last) { <div class="history-line"></div> }
              </div>
            }
          </div>
        </div>
      }
    </div>

    <!-- E-Sign Modal -->
    @if (showESignModal()) {
      <div class="modal-overlay" (click)="showESignModal.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header-row">
            <i class="bi bi-shield-lock-fill" style="font-size:1.5rem;color:#2563EB"></i>
            <h2 class="modal-title">Electronic Signature</h2>
          </div>
          <div class="esign-statement">
            I am approving a <strong>Use-As-Is</strong> disposition for <strong>{{ ncr?.id }}</strong> as Quality Manager of <strong>Plant-1</strong>.
          </div>
          <div class="modal-field">
            <label class="field-label">Password</label>
            <input type="password" class="form-control" placeholder="Enter your password…" [(ngModel)]="signPassword" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline-secondary" (click)="showESignModal.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="confirmUseAsIs()">
              <i class="bi bi-patch-check me-1"></i> Confirm Signature
            </button>
          </div>
        </div>
      </div>
    }

    @if (showCloseModal()) {
      <div class="modal-overlay" (click)="showCloseModal.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header-row">
            <i class="bi bi-lock-fill" style="font-size:1.5rem;color:#059669"></i>
            <h2 class="modal-title">Close NCR</h2>
          </div>
          <div class="close-ncr-info">
            <div class="close-ncr-row">
              <span class="close-ncr-key">NCR</span>
              <strong>{{ ncr.id }}</strong>
            </div>
            <div class="close-ncr-row">
              <span class="close-ncr-key">Disposition</span>
              <strong>{{ ncr.disposition }}</strong>
            </div>
          </div>
          <div class="close-ncr-notice">
            <i class="bi bi-info-circle me-2"></i>
            Closing this NCR confirms that the <strong>{{ ncr.disposition }}</strong> disposition has been physically executed
            and all affected parts have been handled. This is the final step — the NCR will be locked for editing.
          </div>
          <div class="modal-field">
            <label class="field-label">
              Closing Note <span class="req">*</span>
              <span class="field-hint" style="font-weight:400;color:#94A3B8;margin-left:6px">Briefly confirm what was done to execute the disposition.</span>
            </label>
            <textarea class="form-control" rows="3" [(ngModel)]="closeNote"
                      [placeholder]="'e.g. ' + getClosingPlaceholder()"></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline-secondary" (click)="showCloseModal.set(false)">Cancel</button>
            <button class="btn btn-success" [disabled]="!closeNote.trim()" (click)="closeNcr()">
              <i class="bi bi-lock-fill me-1"></i> Confirm &amp; Close NCR
            </button>
          </div>
        </div>
      </div>
    }

    @if (showEscalateModal()) {
      <div class="modal-overlay" (click)="showEscalateModal.set(false)">
        <div class="modal-card esc-modal" (click)="$event.stopPropagation()">
          <div class="modal-header-row">
            <i class="bi bi-diagram-3" style="font-size:1.5rem;color:#2563EB"></i>
            <h2 class="modal-title">Escalate to CAPA</h2>
          </div>

          <!-- Source NCR summary -->
          <div class="esc-source-row">
            <div class="esc-source-item">
              <span class="esc-source-label">Source NCR</span>
              <strong>{{ ncr.id }}</strong>
            </div>
            <div class="esc-source-item">
              <span class="esc-source-label">Severity</span>
              <span class="sev-badge sev-{{ ncr.severity.toLowerCase() }}">{{ ncr.severity }}</span>
            </div>
            <div class="esc-source-item">
              <span class="esc-source-label">Site</span>
              <strong>{{ ncr.siteId }}</strong>
            </div>
          </div>

          <!-- Regulatory note -->
          <div class="esc-iso-note">
            <i class="bi bi-shield-check me-2"></i>
            A CAPA will be opened using the <strong>8D methodology</strong> — D0 (Problem Statement) will be
            pre-filled from this NCR. ISO 9001 §10.2 requires root cause analysis and documented
            effectiveness verification.
          </div>

          <!-- CAPA Title -->
          <div class="modal-field">
            <label class="field-label">
              CAPA Title <span class="req">*</span>
              <span class="field-hint">Describe the problem to be permanently resolved.</span>
            </label>
            <input class="form-control" type="text" [(ngModel)]="escalateTitle"
                   placeholder="e.g. Weld porosity root cause investigation — Station 4" />
          </div>

          <!-- Champion -->
          <div class="modal-field">
            <label class="field-label">
              Champion <span class="req">*</span>
              <span class="field-hint">The individual accountable for driving this CAPA to closure.</span>
            </label>
            <select class="form-control" [ngModel]="escalateChampion" (ngModelChange)="onEscalateChampionChange($event)">
              <option value="">— Select Champion —</option>
              @for (u of escalateSiteUsers; track u.id) {
                <option [value]="u.fullName">{{ u.fullName }}</option>
              }
            </select>
          </div>

          <!-- Due Date -->
          <div class="modal-field">
            <label class="field-label">
              Target Closure Date <span class="req">*</span>
              <span class="field-hint">{{ ncr.severity === 'Major' ? '30-day SLA for Major NCRs.' : '60-day SLA for Minor / OFI NCRs.' }}</span>
            </label>
            <input class="form-control" type="date" [(ngModel)]="escalateDueDate" />
          </div>

          <div class="modal-actions">
            <button class="btn btn-outline-secondary" (click)="showEscalateModal.set(false)">Cancel</button>
            <button class="btn btn-primary"
                    [disabled]="!escalateTitle.trim() || !escalateChampion.trim() || !escalateDueDate"
                    (click)="confirmEscalate()">
              <i class="bi bi-arrow-up-right me-1"></i> Create CAPA &amp; Link
            </button>
          </div>
        </div>
      </div>
    }

    @if (toast()) {
      <div class="action-toast"><i class="bi bi-check-circle-fill me-2"></i>{{ toast() }}</div>
    }
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1300px; margin: 0 auto; }
    .ncr-header { padding: 1.25rem 1.25rem 0; }
    .back-btn { background: none; border: none; font-size: 0.8125rem; color: #64748B; cursor: pointer; padding: 0 0 0.75rem; display: flex; align-items: center; &:hover { color: #2563EB; } }
    .header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .header-id-row { display: flex; align-items: center; margin-bottom: 0.375rem; flex-wrap: wrap; gap: 4px; }
    .ncr-title { font-size: 1.125rem; font-weight: 700; color: #0F172A; margin: 0 0 0.5rem; }
    .ncr-meta-row { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
    .meta-item { font-size: 0.8125rem; color: #64748B; display: flex; align-items: center; }
    .meta-orange { color: #EA580C; }
    .meta-sep { color: #CBD5E1; }
    .chip-sm { font-size: 11px; padding: 2px 8px; }
    .c-badge { width: 20px; height: 20px; background: #EA580C; color: #fff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; }
    .sev-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 700; }
    .sev-major { background: #FEE2E2; color: #DC2626; }
    .sev-minor { background: #FEF3C7; color: #B45309; }
    .sev-ofi { background: #F1F5F9; color: #64748B; }
    .defect-badge { background: #F8FAFC; border: 1px solid #E2E8F0; color: #475569; font-size: 11px; border-radius: 4px; padding: 1px 6px; font-family: monospace; }
    .header-actions { display: flex; align-items: center; flex-shrink: 0; flex-wrap: wrap; gap: 4px; }
    .icon-btn { padding: 0.375rem 0.625rem; }
    .tab-rail { display: flex; flex-wrap: wrap; gap: 2px; border-top: 1px solid #F1F5F9; margin-top: 0.5rem; overflow: visible; }
    .tab-btn { padding: 0.75rem 1rem; font-size: 0.875rem; color: #64748B; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; display: flex; align-items: center; white-space: nowrap; transition: color 150ms, border-color 150ms; &:hover { color: #2563EB; } &.active { color: #2563EB; border-bottom-color: #2563EB; font-weight: 600; } }
    .tab-inner-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; border-bottom: 1px solid #F1F5F9; font-size: 0.875rem; font-weight: 500; color: #334155; }
    .req { color: #DC2626; }

    /* Overview */
    .overview-grid { display: grid; grid-template-columns: 65fr 35fr; gap: 1rem; }
    .detail-card { padding: 1.25rem; }
    .detail-section-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94A3B8; margin-bottom: 0.75rem; }
    .detail-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #F8FAFC; }
    .detail-key { font-size: 0.8125rem; color: #64748B; }
    .detail-val { font-size: 0.8125rem; font-weight: 500; color: #0F172A; text-align: right; }
    .detail-divider { height: 1px; background: #F1F5F9; margin: 0.875rem 0; }
    .description-text { font-size: 0.875rem; color: #475569; line-height: 1.6; margin: 0; }

    /* Status timeline */
    .status-card { padding: 1.25rem; }
    .status-timeline { display: flex; flex-direction: column; }
    .st-item { display: flex; gap: 0.75rem; }
    .st-icon-wrap { display: flex; flex-direction: column; align-items: center; }
    .st-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; flex-shrink: 0; }
    .st-done { background: #DCFCE7; color: #166534; border: 2px solid #86EFAC; }
    .st-active { background: #2563EB; color: #fff; border: none; }
    .st-future { background: #F1F5F9; color: #94A3B8; border: 2px solid #E2E8F0; }
    .st-line { width: 2px; flex: 1; min-height: 20px; margin: 4px 0; }
    .st-line-done { background: #86EFAC; }
    .st-content { flex: 1; padding-bottom: 1.25rem; }
    .st-label { font-size: 0.875rem; font-weight: 500; color: #475569; }
    .st-label-active { color: #0F172A; font-weight: 700; }
    .st-date { font-size: 0.75rem; color: #94A3B8; margin-top: 2px; }
    .st-note { font-size: 0.75rem; color: #64748B; margin-top: 2px; font-style: italic; }
    .mrb-badge { background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 0.625rem 0.875rem; font-size: 0.8125rem; color: #92400E; display: flex; align-items: center; margin-top: 1rem; }

    /* Containment */
    .cont-hint { font-size: 0.75rem; color: #94A3B8; margin-top: 2px; }
    .fw-600 { font-weight: 600; }
    .add-cont-form { border-top: 1px solid #E2E8F0; padding: 1.25rem; background: #F8FAFC; display: flex; flex-direction: column; gap: 0.875rem; }
    .add-cont-form-title { font-size: 0.9375rem; font-weight: 700; color: #0F172A; }
    .add-cont-field { display: flex; flex-direction: column; gap: 4px; }
    .add-cont-field--inline { flex: 1; min-width: 140px; }
    .add-cont-field-label { font-size: 0.75rem; font-weight: 700; color: #374151; display: flex; align-items: center; gap: 6px; }
    .field-hint { font-size: 0.6875rem; font-weight: 400; color: #94A3B8; }
    .field-warning { font-size: 0.6875rem; color: #B45309; background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 4px; padding: 4px 8px; margin-top: 2px; line-height: 1.4; }
    .optional-label { color: #94A3B8; font-weight: 400; }
    .add-cont-textarea { font-size: 0.875rem; resize: vertical; min-height: 60px; }
    .add-cont-row3 { display: flex; gap: 1rem; flex-wrap: wrap; }
    .add-cont-actions { display: flex; align-items: center; gap: 0.5rem; justify-content: flex-end; padding-top: 0.25rem; border-top: 1px solid #E2E8F0; }
    .add-cont-required-note { font-size: 0.75rem; color: #94A3B8; margin-right: auto; }
    .cont-empty { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2.5rem 1rem; text-align: center; }
    .cont-empty-title { font-size: 0.9375rem; font-weight: 600; color: #475569; }
    .cont-empty-sub { font-size: 0.8125rem; color: #94A3B8; max-width: 360px; }
    .cont-table td { font-size: 0.875rem; }
    .verified-row { background: #F0FDF4; }
    .action-text { font-weight: 500; color: #0F172A; }
    .action-location { font-size: 0.75rem; color: #64748B; margin-top: 2px; }
    .owner-cell { display: flex; align-items: center; gap: 0.375rem; }
    .av-sm { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .text-center { text-align: center; }
    .text-muted-sm { font-size: 0.8125rem; color: #94A3B8; }
    .text-right { text-align: right; }
    .verify-btn { font-size: 11px; padding: 2px 8px; }
    .sod-chip { font-size: 11px; color: #92400E; background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 4px; padding: 2px 7px; white-space: nowrap; cursor: default; display: inline-flex; align-items: center; }
    .sod-chip--role { color: #6B21A8; background: #F3E8FF; border-color: #E9D5FF; }
    .locked-badge { font-size: 0.75rem; font-weight: 600; color: #64748B; background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 20px; padding: 3px 10px; display: inline-flex; align-items: center; cursor: default; white-space: nowrap; }

    /* Disposition */
    .disposition-card { overflow: visible; }
    .disp-locked { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2.5rem 1rem; text-align: center; }
    .disp-locked-title { font-size: 0.9375rem; font-weight: 600; color: #475569; }
    .disp-locked-sub { font-size: 0.8125rem; color: #94A3B8; max-width: 420px; }
    .disp-done-banner { margin: 1.25rem; padding: 0.875rem 1rem; background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; font-size: 0.875rem; color: #166534; display: flex; align-items: center; }
    .disp-body { padding: 1.25rem; }
    .disp-section-label { font-size: 0.8125rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .disp-radio-group { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.625rem; }
    .disp-radio-item { border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 0.75rem 1rem; cursor: pointer; transition: all 150ms; input { display: none; } &:hover { border-color: #93C5FD; background: #F8FAFF; } &.selected { border-color: #2563EB; background: #EFF6FF; } }
    .disp-radio-content { display: flex; flex-direction: column; }
    .disp-type-header { display: flex; align-items: center; margin-bottom: 4px; }
    .disp-type-name { font-size: 0.875rem; font-weight: 700; color: #0F172A; }
    .disp-type-desc { font-size: 0.75rem; color: #64748B; line-height: 1.4; }
    .disp-context-section { margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid #F1F5F9; display: flex; flex-direction: column; gap: 0.875rem; }
    .disp-context-hint { background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3px solid #2563EB; border-radius: 6px; padding: 0.625rem 0.875rem; font-size: 0.8125rem; color: #475569; line-height: 1.55; }
    .disp-fields-row { display: flex; gap: 0.875rem; flex-wrap: wrap; }
    .disp-field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 160px; }
    .esign-trigger { display: flex; flex-direction: column; gap: 0.5rem; }
    .esign-notice { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 0.75rem; font-size: 0.8125rem; color: #1D4ED8; display: flex; align-items: flex-start; }
    .mrb-members { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
    .mrb-member { display: flex; align-items: center; gap: 0.375rem; background: #F1F5F9; border-radius: 20px; padding: 3px 10px 3px 4px; font-size: 0.8125rem; }
    .disp-footer { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #F1F5F9; display: flex; align-items: center; gap: 0.75rem; }
    .disp-footer-hint { font-size: 0.8125rem; color: #94A3B8; }
    .save-disp-btn { background: #2563EB; border: none; color: #fff; font-weight: 600; &:disabled { opacity: 0.5; } }
    .field-label { font-size: 0.8125rem; font-weight: 600; color: #334155; display: block; margin-bottom: 0.375rem; }

    /* Linked CAPA — card (when linked) */
    .capa-tab-card { padding: 1.5rem; }
    .capa-card { border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.25rem; }
    .capa-card-header { display: flex; align-items: center; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 0.625rem; }
    .capa-card-title { font-size: 1rem; font-weight: 600; color: #0F172A; margin-bottom: 0.75rem; }
    .capa-ontime { display: inline-flex; align-items: center; font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
    .capa-ontime--ok  { color: #059669; background: #ECFDF5; }
    .capa-ontime--late { color: #DC2626; background: #FEF2F2; }
    .capa-owner-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.875rem; }
    .capa-avatar { width: 28px; height: 28px; border-radius: 50%; background: #2563EB; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; cursor: default; }
    .capa-owner-name { font-size: 0.8125rem; font-weight: 600; color: #334155; }
    .capa-owner-label { font-size: 0.75rem; color: #94A3B8; margin-left: 0.375rem; }
    .capa-steps-row { display: flex; align-items: center; gap: 6px; margin-bottom: 0.75rem; cursor: default; }
    .capa-step-dot { width: 10px; height: 10px; border-radius: 50%; background: #E2E8F0; border: 2px solid #CBD5E1; flex-shrink: 0; transition: background 0.2s; }
    .capa-step-dot.done { background: #2563EB; border-color: #2563EB; }
    .capa-step-dot.active { background: #fff; border-color: #2563EB; box-shadow: 0 0 0 3px #DBEAFE; }
    .capa-step-label { font-size: 0.75rem; color: #64748B; }
    .capa-bar { height: 6px; border-radius: 3px; margin-bottom: 0.625rem; }
    .capa-meta-row { display: flex; gap: 1.25rem; font-size: 0.8125rem; color: #64748B; cursor: default; }
    .capa-actions { }

    /* Linked CAPA — empty state + escalation guidance */
    .capa-empty-panel { display: flex; flex-direction: column; gap: 1.5rem; }
    .capa-criteria-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3px solid #2563EB; border-radius: 10px; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .capa-criteria-title { font-size: 0.8125rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem; }
    .capa-criteria-row { display: flex; align-items: center; font-size: 0.8125rem; color: #475569; padding: 0.3125rem 0; border-bottom: 1px solid #F1F5F9; cursor: default; &:last-child { border-bottom: none; } }
    .capa-esc-badge { font-size: 0.75rem; font-weight: 700; }
    .empty-capa { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 160px; color: #94A3B8; gap: 0.75rem; }
    .empty-icon { font-size: 3rem; color: #CBD5E1; }
    .empty-capa p { font-size: 0.875rem; margin: 0; }
    .esc-hint { font-size: 0.8125rem !important; color: #92400E !important; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; padding: 0.375rem 0.75rem; }
    .esc-locked-note { font-size: 0.8125rem !important; color: #64748B !important; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 0.375rem 0.75rem; margin: 0; }
    .esc-retrospective-note { font-size: 0.8125rem !important; color: #1D4ED8 !important; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 0.375rem 0.75rem; margin: 0; }

    /* Attachments */
    .attach-card { overflow: hidden; }
    .attach-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; padding: 1.25rem; }
    .attach-thumb { width: 120px; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; cursor: pointer; &:hover { border-color: #2563EB; } }
    .thumb-preview { height: 80px; background: #F8FAFC; display: flex; align-items: center; justify-content: center; }
    .thumb-big-icon { font-size: 2.5rem; }
    .thumb-name { font-size: 11px; color: #475569; padding: 4px 6px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .thumb-meta { font-size: 10px; color: #94A3B8; padding: 0 6px 6px; }

    /* History */
    .history-card { padding: 0; }
    .history-timeline { padding: 1.25rem; }
    .history-item { display: flex; gap: 0.75rem; position: relative; }
    .history-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .history-content { flex: 1; padding-bottom: 1.5rem; }
    .history-action { font-size: 0.875rem; color: #334155; }
    .history-actor { font-weight: 600; color: #0F172A; margin-right: 0.25rem; }
    .history-detail { font-weight: 600; color: #2563EB; margin-left: 0.25rem; }
    .history-time { font-size: 0.75rem; color: #94A3B8; margin-top: 0.125rem; }
    .history-line { position: absolute; left: 15px; top: 38px; width: 2px; height: calc(100% - 14px); background: #E2E8F0; }

    /* Tooltips — shown below the element to avoid overflow clipping */
    [data-tip] { position: relative; }
    [data-tip]::after {
      content: attr(data-tip);
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: #1E293B;
      color: #F1F5F9;
      font-size: 0.6875rem;
      font-weight: 400;
      line-height: 1.5;
      padding: 0.4rem 0.7rem;
      border-radius: 6px;
      width: max-content;
      max-width: 240px;
      white-space: normal;
      text-align: center;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    [data-tip]::before {
      content: '';
      position: absolute;
      top: calc(100% + 2px);
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-bottom-color: #1E293B;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 9999;
    }
    [data-tip]:hover::after,
    [data-tip]:hover::before { opacity: 1; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 500; display: flex; align-items: center; justify-content: center; }
    .modal-card { background: #fff; border-radius: 12px; padding: 1.75rem; max-width: 480px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
    .modal-header-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .modal-title { font-size: 1.125rem; font-weight: 700; color: #0F172A; margin: 0; }
    .esign-statement { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 0.875rem; font-size: 0.875rem; color: #1D4ED8; line-height: 1.6; margin-bottom: 1.25rem; }
    .modal-field { margin-bottom: 1.25rem; }
    .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }

    /* Escalation modal */
    .esc-modal { max-width: 520px; }
    .esc-source-row { display: flex; gap: 1.25rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .esc-source-item { display: flex; flex-direction: column; gap: 2px; }
    .esc-source-label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94A3B8; }
    .esc-iso-note { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.8125rem; color: #1D4ED8; line-height: 1.6; margin-bottom: 1.25rem; }
    .field-hint { display: block; font-size: 0.75rem; font-weight: 400; color: #94A3B8; margin-top: 2px; }
    .req { color: #DC2626; margin-left: 2px; }

    /* Toast */
    .action-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: #0F172A; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; z-index: 600; display: flex; align-items: center; }
    .ncr-closed-badge { display: inline-flex; align-items: center; font-size: 0.8125rem; font-weight: 700; color: #166534; background: #DCFCE7; border: 1.5px solid #86EFAC; border-radius: 20px; padding: 0.3rem 0.875rem; }
    .ncr-voided-badge { display: inline-flex; align-items: center; font-size: 0.8125rem; font-weight: 700; color: #6B7280; background: #F3F4F6; border: 1.5px solid #D1D5DB; border-radius: 20px; padding: 0.3rem 0.875rem; }
    .close-ncr-info { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 0.75rem; }
    .close-ncr-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }
    .close-ncr-key { font-size: 0.75rem; font-weight: 600; color: #94A3B8; width: 80px; flex-shrink: 0; text-transform: uppercase; letter-spacing: 0.04em; }
    .close-ncr-notice { background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 0.75rem; font-size: 0.8125rem; color: #166534; display: flex; align-items: flex-start; margin-bottom: 0.75rem; }
  `]
})
export class NcrDetailComponent {
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly mock = inject(MockDataService);
  protected authStore = inject(AuthStore);

  private static readonly VERIFIER_ROLES = ['QE', 'QS', 'ME', 'QM', 'PM', 'Director'];

  readonly ncrId = this.route.snapshot.paramMap.get('id') ?? 'NCR-2026-0147';
  readonly activeTab = signal<NcrTab>('overview');

  readonly isNcrLocked = computed(() => {
    const s = this.mock.ncrs().find(n => n.id === this.ncrId)?.status;
    return s === 'Closed' || s === 'Voided';
  });

  readonly canVerifyContainment = computed(() => {
    const roles = this.authStore.currentUser()?.roles ?? [];
    return NcrDetailComponent.VERIFIER_ROLES.some(r => roles.includes(r));
  });
  readonly toast = signal('');
  readonly showESignModal = signal(false);
  readonly showCloseModal = signal(false);
  readonly showMRBPicker = signal(false);
  readonly showAddContainmentForm = signal(false);
  closeNote = '';
  newContainmentWhat = '';
  newContainmentQty: number | null = null;
  newContainmentType = '';
  newContainmentDueDate = '';
  newContainmentLocation = '';

  readonly containmentActionTypes = [
    'Sort — 100% manual sort of suspect inventory',
    'Quarantine — Isolate and hold suspect material',
    'Stop Shipment — Hold outgoing product at dock',
    '100% Inspection — Add inspection point at process',
    'Rework — Rework before further use or shipment',
    'Customer Notification — Alert customer of potential escape',
    'Supplier Notification — Alert supplier of incoming defect',
    'Line Stop — Halt production until defect is resolved',
    'Other',
  ];

  dispositionJustification = '';
  signPassword = '';

  get ncr() { return this.mock.ncrs().find(n => n.id === this.ncrId) ?? this.mock.ncrs()[this.mock.ncrs().length - 1]; }

  readonly containmentActions = computed(() => this.mock.containmentActions().filter(a => a.ncrId === this.ncrId));

  readonly selectedDisposition = signal<DispositionType>(
    (this.mock.ncrs().find(n => n.id === this.ncrId) ?? this.mock.ncrs()[this.mock.ncrs().length - 1])?.disposition ?? ''
  );

  readonly tabs = [
    { key: 'overview' as NcrTab,     label: 'Overview',     icon: 'bi-info-circle',    tooltip: 'See all NCR details, field values, and the current status timeline.' },
    { key: 'containment' as NcrTab,  label: 'Containment',  icon: 'bi-shield-check',   tooltip: 'Add and track immediate actions taken to stop the defect from reaching customers or the next station.' },
    { key: 'disposition' as NcrTab,  label: 'Disposition',  icon: 'bi-check2-circle',  tooltip: 'Decide what to do with the defective parts — rework, scrap, use-as-is, etc.' },
    { key: 'capa' as NcrTab,         label: 'Linked CAPA',  icon: 'bi-diagram-3',      tooltip: 'View the CAPA (Corrective & Preventive Action) linked to this NCR. CAPA drives root cause investigation and permanent fix to prevent recurrence — required for Major NCRs per ISO 9001 §10.2.' },
    { key: 'attachments' as NcrTab,  label: 'Attachments',  icon: 'bi-paperclip',      tooltip: 'Upload photos, inspection reports, or any evidence related to this NCR.' },
    { key: 'history' as NcrTab,      label: 'History',      icon: 'bi-journal-text',   tooltip: 'Full audit trail — every change made to this NCR, who made it, and when.' },
  ];

  readonly dispositionTypes = [
    {
      value: 'Use-As-Is' as DispositionType, icon: 'bi-check-circle-fill', color: '#059669',
      desc: 'Accept the part as-is with engineering justification',
      tooltip: 'The part does not fully meet spec but is safe to use. Engineering must provide written justification. Requires Quality Manager e-signature. Use this only when the deviation has no impact on function or safety.',
    },
    {
      value: 'Rework' as DispositionType, icon: 'bi-tools', color: '#2563EB',
      desc: 'Fix the defect and bring back to full specification',
      tooltip: 'Additional work can be done to bring the part back to spec. After rework, the part must pass re-inspection before it can be used. The most common disposition for fixable defects.',
    },
    {
      value: 'Repair' as DispositionType, icon: 'bi-wrench-adjustable', color: '#7C3AED',
      desc: 'Restore function but may not meet original spec fully',
      tooltip: 'Repair restores the part to a working condition but it may still deviate slightly from the drawing. Unlike Rework, the part will not be 100% to spec. Requires an engineering authorization reference.',
    },
    {
      value: 'Scrap' as DispositionType, icon: 'bi-trash3-fill', color: '#DC2626',
      desc: 'Part cannot be used — remove from inventory and destroy',
      tooltip: 'The defect cannot be corrected. The part must be physically destroyed or permanently marked as scrap so it cannot accidentally be used. Replacement must be scheduled.',
    },
    {
      value: 'Return to Supplier' as DispositionType, icon: 'bi-arrow-return-left', color: '#B45309',
      desc: 'Send defective parts back to the supplier with formal notice',
      tooltip: 'The defect originated from the supplier. Parts are packaged and returned with a formal rejection notice. You will need a Return Merchandise Authorization (RMA) number from the supplier before shipping.',
    },
    {
      value: 'Regrade' as DispositionType, icon: 'bi-arrow-down-circle-fill', color: '#0891B2',
      desc: 'Use in a lower-grade application that accepts the deviation',
      tooltip: 'The part cannot meet its original spec but fits a different product or application with lower requirements. Must be documented and approved — the part must be clearly relabelled to prevent mixing.',
    },
  ];

  readonly canDisposition = computed(() => {
    const roles = this.authStore.currentUser()?.roles ?? [];
    return NcrDetailComponent.VERIFIER_ROLES.some(r => roles.includes(r));
  });

  dispReworkInstructions = '';
  dispDueDate = '';
  dispQty: number | null = null;
  dispEngAuth = '';
  dispSupplier = '';
  dispRmaNumber = '';
  dispNewGrade = '';

  readonly mrbMembers = ['Maria Delgado', 'Dev Patel', 'Sarah Chen'];

  get linkedCapa() {
    return this.ncr?.capaId ? this.mock.capas.find(c => c.id === this.ncr!.capaId) : null;
  }

  get capaStepDots(): number[] {
    return this.linkedCapa ? Array.from({ length: this.linkedCapa.totalSteps }, (_, i) => i + 1) : [];
  }

  get ncrNeedsEscalation(): boolean {
    return this.ncr.severity === 'Major' || this.ncr.isCustomerFacing === true;
  }

  // Voided NCRs were logged in error — no escalation ever.
  // Closed NCRs allow retrospective CAPA only for senior quality roles (ISO 9001 §10.2 trend review).
  readonly canEscalateToCapa = computed(() => {
    const status = this.ncr.status;
    if (status === 'Voided') return false;
    if (status === 'Closed') {
      const roles = this.authStore.currentUser()?.roles ?? [];
      return ['QM', 'QE', 'Director'].some(r => roles.includes(r as any));
    }
    return true;
  });

  readonly escalationCriteria = [
    { icon: 'bi-exclamation-triangle-fill', color: '#DC2626', label: 'Major severity NCR', badge: 'Required', badgeColor: '#DC2626', tip: 'Per ISO 9001 §10.2 — any Major NCR must have a documented CAPA to identify root cause and implement a permanent fix to prevent recurrence.' },
    { icon: 'bi-arrow-repeat', color: '#B45309', label: 'Recurring defect (same code ≥2 occurrences)', badge: 'Required', badgeColor: '#DC2626', tip: 'A defect that reoccurs indicates systemic process failure. Containment alone is insufficient — root cause investigation via CAPA is mandatory.' },
    { icon: 'bi-building', color: '#2563EB', label: 'Customer-facing or external escape', badge: 'Required', badgeColor: '#DC2626', tip: 'Any defect that reached a customer requires formal corrective action with documented effectiveness verification (IATF 16949 §10.2.3).' },
    { icon: 'bi-lightbulb', color: '#059669', label: 'Minor or OFI, isolated, non-recurring', badge: 'Optional', badgeColor: '#64748B', tip: 'Minor one-off defects may be resolved with containment only. CAPA is still recommended when root cause is unknown or process risk is elevated.' },
  ];

  get overviewRows() {
    const n = this.ncr;
    if (!n) return [];
    return [
      { label: 'Source', value: n.source },
      { label: 'Area / Station', value: n.area ?? '—' },
      { label: 'Shift', value: n.shift ?? '—' },
      { label: 'Lot / Serial', value: n.lot ?? '—' },
      { label: 'Qty Inspected', value: n.qtyInspected?.toString() ?? '—' },
      { label: 'Qty Defective', value: `<strong style="color:#DC2626">${n.qtyDefective ?? '—'}</strong>` },
      { label: 'Customer', value: n.customer ?? '—' },
      { label: 'Customer Ref', value: n.customerRef ?? '—' },
      { label: 'Site', value: n.siteId },
      { label: 'Created', value: n.createdAt },
      { label: 'Due Date', value: n.dueDate },
    ];
  }

  get statusTimeline() {
    return [
      { step: 1, label: 'NCR Opened', done: true, active: false, date: this.ncr?.createdAt, note: '' },
      { step: 2, label: 'Under Review', done: this.ncr?.status !== 'Open', active: this.ncr?.status === 'Under Review', date: '', note: '' },
      { step: 3, label: 'Containment Verified', done: this.containmentActions().length > 0 && this.containmentActions().every(a => a.status === 'Verified'), active: this.containmentActions().some(a => a.status === 'Open'), date: '', note: '' },
      { step: 4, label: 'Dispositioned', done: this.ncr?.status === 'Closed', active: this.ncr?.status === 'Dispositioned', date: this.ncr?.disposition ?? '', note: this.ncr?.status === 'Dispositioned' ? 'Awaiting closure' : '' },
      { step: 5, label: 'Closed', done: this.ncr?.status === 'Closed', active: false, date: '', note: '' },
    ];
  }

  readonly attachments = computed(() => this.mock.getNcrAttachments(this.ncrId));

  readonly history = computed(() => this.mock.getNcrEvents(this.ncrId));

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('');
  }

  statusChipClass(s: string): string {
    const m: Record<string, string> = { 'Open': 'chip-major', 'Under Review': 'chip-in-approval', 'Dispositioned': 'chip-released', 'Closed': 'chip-released', 'Voided': 'chip-superseded' };
    return m[s] ?? '';
  }

  ageChip(d: number): string {
    if (d > 5) return 'chip-breached';
    if (d >= 3) return 'chip-warning';
    return 'chip-within-sla';
  }

  markVerified(id: string): void {
    this.mock.updateContainmentAction(id, { status: 'Verified', completedDate: '2026-06-13' });
    this.toast.set('Containment action verified');
    setTimeout(() => this.toast.set(''), 2500);
  }

  addContainment(): void {
    this.newContainmentWhat = '';
    this.newContainmentQty = null;
    this.newContainmentType = '';
    this.newContainmentDueDate = '';
    this.newContainmentLocation = '';
    this.showAddContainmentForm.set(true);
  }

  get containmentFormValid(): boolean {
    return !!this.newContainmentWhat.trim() && !!this.newContainmentType && !!this.newContainmentDueDate;
  }

  get containmentQtyOverWarning(): boolean {
    return this.newContainmentQty != null &&
           this.ncr?.qtyDefective != null &&
           this.newContainmentQty > this.ncr.qtyDefective;
  }

  saveContainment(): void {
    if (!this.containmentFormValid) return;
    const text = this.newContainmentWhat.trim();
    const user = this.authStore.currentUser();
    const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';
    const typeShort = this.newContainmentType.split(' — ')[0];
    this.mock.addContainmentAction({
      ncrId: this.ncrId,
      what: `[${typeShort}] ${text}`,
      owner: this.authStore.fullName(),
      ownerInitials: initials,
      ownerColor: user?.avatarColor ?? '#64748B',
      qty: this.newContainmentQty ?? undefined,
      dueDate: this.newContainmentDueDate,
      location: this.newContainmentLocation || undefined,
      status: 'Open',
    });
    this.mock.addNcrEvent({
      ncrId: this.ncrId,
      actor: this.authStore.fullName(),
      initials,
      color: user?.avatarColor ?? '#64748B',
      action: 'Added containment action',
      detail: `[${typeShort}] ${text}${this.newContainmentLocation ? ' @ ' + this.newContainmentLocation : ''} — due ${this.newContainmentDueDate}`,
      timestamp: new Date().toLocaleString(),
    });
    this.showAddContainmentForm.set(false);
    this.toast.set('Containment action saved');
    setTimeout(() => this.toast.set(''), 2500);
  }

  cancelContainment(): void {
    this.showAddContainmentForm.set(false);
  }

  deleteContainmentAction(id: string): void {
    this.mock.deleteContainmentAction(id);
  }

  saveDisposition(): void {
    const d = this.selectedDisposition();
    const user = this.authStore.currentUser();
    const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';
    let detail = d;
    if (d === 'Rework' && this.dispReworkInstructions) detail += ` — ${this.dispReworkInstructions}`;
    if (d === 'Repair' && this.dispEngAuth) detail += ` — Eng Auth: ${this.dispEngAuth}`;
    if (d === 'Scrap' && this.dispQty) detail += ` — Qty: ${this.dispQty}`;
    if (d === 'Return to Supplier') { if (this.dispSupplier) detail += ` — ${this.dispSupplier}`; if (this.dispRmaNumber) detail += ` RMA: ${this.dispRmaNumber}`; }
    if (d === 'Regrade' && this.dispNewGrade) detail += ` → ${this.dispNewGrade}`;
    this.mock.updateNcr(this.ncrId, { disposition: d, status: 'Dispositioned' });
    this.mock.addNcrEvent({ ncrId: this.ncrId, actor: this.authStore.fullName(), initials, color: user?.avatarColor ?? '#64748B', action: 'Dispositioned NCR', detail, timestamp: new Date().toLocaleString() });
    this.toast.set(`Disposition saved: ${d}`);
    setTimeout(() => this.toast.set(''), 3000);
  }

  confirmUseAsIs(): void {
    const user = this.authStore.currentUser();
    const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';
    this.showESignModal.set(false);
    this.mock.updateNcr(this.ncrId, { disposition: 'Use-As-Is', status: 'Dispositioned' });
    this.mock.addNcrEvent({ ncrId: this.ncrId, actor: this.authStore.fullName(), initials, color: user?.avatarColor ?? '#64748B', action: 'Dispositioned NCR — Use-As-Is (e-signed)', detail: this.dispositionJustification, timestamp: new Date().toLocaleString() });
    this.toast.set(`Use-As-Is confirmed for ${this.ncrId} — e-signed by ${this.authStore.fullName()}`);
    setTimeout(() => this.toast.set(''), 3000);
  }

  getClosingPlaceholder(): string {
    const d = this.ncr?.disposition;
    if (d === 'Use-As-Is') return 'Parts released from hold bin and cleared for use per engineering approval.';
    if (d === 'Rework') return 'Rework completed on all affected parts. Re-inspection passed on 2026-06-24.';
    if (d === 'Repair') return 'Repair performed per ECN-4421. Parts re-inspected and approved by QE.';
    if (d === 'Scrap') return 'All affected parts physically scrapped and removed from inventory. Replacement ordered.';
    if (d === 'Return to Supplier') return 'Parts packaged and shipped to supplier with RMA label. Tracking number logged.';
    if (d === 'Regrade') return 'Parts relabelled as Grade B and transferred to alternate stock location.';
    return 'Describe how the disposition was physically executed and confirm parts are handled.';
  }

  closeNcr(): void {
    if (!this.closeNote.trim()) return;
    const user = this.authStore.currentUser();
    const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';
    this.mock.updateNcr(this.ncrId, { status: 'Closed' });
    this.mock.addNcrEvent({
      ncrId: this.ncrId,
      actor: this.authStore.fullName(),
      initials,
      color: user?.avatarColor ?? '#64748B',
      action: 'NCR Closed',
      detail: this.closeNote.trim(),
      timestamp: new Date().toLocaleString(),
    });
    this.showCloseModal.set(false);
    this.closeNote = '';
    this.toast.set(`${this.ncrId} closed successfully`);
    setTimeout(() => this.toast.set(''), 3000);
  }

  // ── Escalation modal ──────────────────────────────────────────────────────
  readonly showEscalateModal = signal(false);
  escalateTitle = '';
  escalateChampion = '';
  escalateChampionInitials = '';
  escalateChampionColor = '';
  escalateDueDate = '';

  private suggestDueDate(): string {
    const days = this.ncr.severity === 'Major' ? 30 : 60;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  get escalateSiteUsers() {
    return this.mock.users.filter(u => u.siteId === this.ncr.siteId);
  }

  onEscalateChampionChange(name: string): void {
    const user = this.mock.users.find(u => u.fullName === name && u.siteId === this.ncr.siteId);
    this.escalateChampion = name;
    this.escalateChampionInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : name.slice(0, 2).toUpperCase();
    this.escalateChampionColor = user?.avatarColor ?? '#2563EB';
  }

  onEscalate(): void {
    const user = this.authStore.currentUser();
    this.escalateTitle = this.ncr.title;
    this.escalateChampion = this.authStore.fullName();
    this.escalateChampionInitials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';
    this.escalateChampionColor = user?.avatarColor ?? '#2563EB';
    this.escalateDueDate = this.suggestDueDate();
    this.showEscalateModal.set(true);
  }

  confirmEscalate(): void {
    if (!this.escalateTitle.trim() || !this.escalateChampion.trim() || !this.escalateDueDate) return;

    const capaId = this.mock.addCapa({
      title: this.escalateTitle.trim(),
      ncrId: this.ncrId,
      siteId: this.ncr.siteId,
      dueDate: this.escalateDueDate,
      champion: this.escalateChampion.trim(),
      championInitials: this.escalateChampionInitials,
      championColor: this.escalateChampionColor,
      severity: this.ncr.severity,
    });

    const user = this.authStore.currentUser();
    const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';
    this.mock.updateNcr(this.ncrId, { capaId });
    this.mock.addNcrEvent({
      ncrId: this.ncrId,
      actor: this.authStore.fullName(),
      initials,
      color: user?.avatarColor ?? '#64748B',
      action: 'escalated NCR to CAPA',
      detail: capaId,
      timestamp: new Date().toLocaleString(),
    });

    this.showEscalateModal.set(false);
    this.activeTab.set('capa');
    this.toast.set(`${capaId} created and linked to ${this.ncrId}`);
    setTimeout(() => this.toast.set(''), 4000);
  }

  onVoid(): void {
    const user = this.authStore.currentUser();
    const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';
    this.mock.updateNcr(this.ncrId, { status: 'Voided' });
    this.mock.addNcrEvent({
      ncrId: this.ncrId,
      actor: this.authStore.fullName(),
      initials,
      color: user?.avatarColor ?? '#64748B',
      action: 'NCR Voided',
      timestamp: new Date().toLocaleString(),
    });
    this.toast.set(`${this.ncrId} voided`);
    setTimeout(() => this.toast.set(''), 2500);
  }
}
