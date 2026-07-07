import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { AuthStore } from '../../../core/auth/stores/auth.store';
import {
  CAPA8D, DStep, CapaTeamMember, CapaContainmentRow, CapaActionRow,
} from '../../../shared/interfaces/models';

type Tab = 'activity';

const STEPS: { key: DStep; label: string; icon: string }[] = [
  { key: 'D0', label: 'Initiation',      icon: 'bi-flag' },
  { key: 'D1', label: 'Team',            icon: 'bi-people' },
  { key: 'D2', label: 'Problem',         icon: 'bi-exclamation-triangle' },
  { key: 'D3', label: 'Containment',     icon: 'bi-shield-check' },
  { key: 'D4', label: 'Root Cause',      icon: 'bi-diagram-3' },
  { key: 'D5', label: 'Actions',         icon: 'bi-list-check' },
  { key: 'D6', label: 'Implementation',  icon: 'bi-gear' },
  { key: 'D7', label: 'Effectiveness',   icon: 'bi-graph-up-arrow' },
  { key: 'D8', label: 'Lessons',         icon: 'bi-book' },
];

@Component({
  selector: 'app-capa-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (capa(); as c) {
    <div class="ws-layout">

      <!-- ── Header Card ── -->
      <div class="ws-header shadow-sm">
        <button class="back-btn" (click)="router.navigate(['/capas'])">
          <i class="bi bi-arrow-left me-1"></i> CAPA Register
        </button>

        <div class="header-body">
          <div class="header-left">
            <div class="header-id-row">
              <span class="record-id">{{ c.id }}</span>
              <span class="status-chip ms-2" [class.chip-open]="c.status === 'Open'" [class.chip-closed]="c.status === 'Closed'">
                {{ c.status }}
              </span>
              <span class="ontime-chip ms-2 ontime-{{ c.onTimeStatus }}">
                @if (c.onTimeStatus === 'on-track') { On Track }
                @if (c.onTimeStatus === 'at-risk') { At Risk }
                @if (c.onTimeStatus === 'overdue') { Overdue }
              </span>
            </div>
            <h1 class="capa-title">{{ c.title }}</h1>
            <div class="header-meta">
              <span class="meta-item">
                <span class="source-chip source-{{ sourceClass(c.sourceType) }}" style="cursor:pointer"
                      (click)="navToSource(c)">
                  <i class="bi bi-link-45deg me-1"></i>from {{ c.source }}
                </span>
              </span>
              <span class="meta-sep">·</span>
              <span class="meta-item"><i class="bi bi-calendar3 me-1"></i>Due {{ c.dueDate }}</span>
              <span class="meta-sep">·</span>
              <span class="countdown-chip" [class.amber]="c.onTimeStatus === 'at-risk'" [class.red]="c.onTimeStatus === 'overdue'">
                {{ daysRemaining(c) }}
              </span>
            </div>
          </div>

          <div class="header-right">
            <div class="champion-row">
              <span class="avatar-md" [style.background]="c.championColor">{{ c.championInitials }}</span>
              <span class="champion-name">{{ c.champion }}</span>
              <span class="role-label">Champion</span>
            </div>
            <div class="team-avatars">
              @for (av of c.teamAvatars; track av.initials) {
                <span class="avatar-sm" [style.background]="av.color" [title]="av.initials">{{ av.initials }}</span>
              }
              @if (teamExtra(c) > 0) {
                <span class="avatar-sm avatar-more" title="More team members">+{{ teamExtra(c) }}</span>
              }
              <span class="team-label">Team</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Two-column body ── -->
      <div class="ws-body">

        <!-- Left pane: Discipline nav -->
        <div class="left-pane">
          <p class="pane-section-label">Disciplines</p>
          @for (step of steps; track step.key) {
            <button class="step-row"
                    [class.step-active]="activeStep() === step.key"
                    [class.step-done]="isCompleted(c, step.key)"
                    [class.step-future]="isFuture(c, step.key)"
                    (click)="activeStep.set(step.key)">
              <span class="step-icon">
                @if (isCompleted(c, step.key)) {
                  <i class="bi bi-check-circle-fill" style="color:#059669"></i>
                } @else if (activeStep() === step.key) {
                  <i class="bi bi-arrow-right-circle-fill" style="color:#fff"></i>
                } @else {
                  <i class="bi bi-circle" style="color:#CBD5E1"></i>
                }
              </span>
              <span class="step-label">{{ step.key }} · {{ step.label }}</span>
              @if (activeStep() === step.key) {
                <span class="days-badge ms-auto">{{ c.daysInCurrentStep }}d</span>
              }
            </button>
          }
        </div>

        <!-- Right pane: Step content -->
        <div class="right-pane">

          <!-- Future step lock banner -->
          @if (isFuture(c, activeStep())) {
            <div class="lock-banner">
              <i class="bi bi-lock-fill me-2"></i>
              Complete {{ prevStep(activeStep()) }} before this step.
            </div>
          }

          <!-- Role-based view-only notice -->
          @if (!canEditCapa(c) && !isFuture(c, activeStep())) {
            <div class="role-lock-notice">
              <i class="bi bi-eye-fill"></i>
              <div>
                <strong>View-Only Access — {{ roleDisplayName }}</strong>
                <span class="rln-sub">
                  Your role ({{ roleDisplayName }}) can view this CAPA but cannot edit it or advance workflow steps.
                  The CAPA Champion, a Quality Engineer (QE/QS), or a Quality Manager (QM) is required to make changes.
                </span>
              </div>
            </div>
          }

          <!-- D0 Initiation -->
          @if (activeStep() === 'D0') {
            <div class="step-content">
              <h2 class="step-heading">D0 · Initiation</h2>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Title <span class="req">*</span></label>
                  <input class="form-control form-control-sm" [ngModel]="c.d0?.title ?? c.title" (ngModelChange)="patchD0(c,'title',$event)"
                         [readonly]="!canEditCapa(c)"
                         data-tip="CAPA title as it will appear in reports and audit records." />
                </div>
                <div class="form-group">
                  <label class="form-label">Source</label>
                  <input class="form-control form-control-sm" [ngModel]="c.d0?.source ?? c.source" (ngModelChange)="patchD0(c,'source',$event)"
                         readonly
                         data-tip="Auto-populated from the originating NCR, complaint, or audit finding." />
                </div>
                <div class="form-group">
                  <label class="form-label">Champion <span class="req">*</span></label>
                  <select class="form-select form-select-sm" [ngModel]="c.d0?.champion ?? c.champion" (ngModelChange)="patchD0Champion(c, $event)"
                          [disabled]="!canEditCapa(c)"
                          data-tip="The Champion is accountable for this CAPA from initiation to closure. Must have authority to implement corrective actions.">
                    <option value="">— Select Champion —</option>
                    @for (u of siteUsers(); track u) { <option>{{ u }}</option> }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Severity</label>
                  <select class="form-select form-select-sm" [ngModel]="c.d0?.severity ?? ''" (ngModelChange)="patchD0(c,'severity',$event)"
                          [disabled]="!canEditCapa(c)"
                          data-tip="Major: customer impact or potential safety risk. Minor: internal process deviation. OFI: Opportunity for Improvement.">
                    <option value="">Select…</option>
                    <option>Major</option><option>Minor</option><option>OFI</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Customer</label>
                  <input class="form-control form-control-sm" [ngModel]="c.d0?.customer ?? ''" (ngModelChange)="patchD0(c,'customer',$event)"
                         [readonly]="!canEditCapa(c)"
                         data-tip="Required if this is a customer-facing issue. Used for customer-specific reporting." />
                </div>
                <div class="form-group">
                  <label class="form-label">Customer Ref</label>
                  <input class="form-control form-control-sm" [ngModel]="c.d0?.customerRef ?? ''" (ngModelChange)="patchD0(c,'customerRef',$event)"
                         [readonly]="!canEditCapa(c)"
                         data-tip="Customer-issued reference number (e.g. 8D request number, deviation ref)." />
                </div>
                <div class="form-group">
                  <label class="form-label">Due Date <span class="req">*</span></label>
                  <input type="date" class="form-control form-control-sm" [ngModel]="c.d0?.dueDate ?? c.dueDate" (ngModelChange)="patchD0(c,'dueDate',$event)"
                         [readonly]="!canEditCapa(c)"
                         data-tip="Target completion date for the full 8D. Typically 60–90 days from NCR date per IATF 16949." />
                </div>
              </div>
              <div class="step-footer">
                <button class="btn btn-primary btn-sm"
                        [disabled]="!c.d0?.title || !(c.d0?.champion ?? c.champion) || !canEditCapa(c)"
                        [title]="!canEditCapa(c) ? 'Only the CAPA Champion, QE, QS, or QM can advance this step.' : 'Mark D0 complete and proceed to team assembly (D1).'"
                        (click)="markComplete(c, 'D0')">
                  Mark D0 Complete
                </button>
              </div>
            </div>
          }

          <!-- D1 Team -->
          @if (activeStep() === 'D1' && !isFuture(c, 'D1')) {
            <div class="step-content">
              <h2 class="step-heading">D1 · Team Assembly</h2>
              <p class="step-hint">Assemble a cross-functional team. Include at minimum a Champion, Quality Engineer, and relevant process owner. Per 8D methodology, the team must have the authority and knowledge to solve the problem.</p>
              <div class="form-group mb-3">
                <label class="form-label">Champion</label>
                <div class="champion-readonly-row"
                     data-tip="Champion is assigned in D0 Initiation. To change the Champion, update D0.">
                  <span class="avatar-sm-inline" [style.background]="c.championColor">{{ c.championInitials }}</span>
                  <span class="champion-readonly-name">{{ c.champion }}</span>
                  <span class="champion-readonly-badge">Set in D0</span>
                </div>
              </div>
              <p class="form-label mb-2">Team Members</p>
              <table class="inner-table mb-2">
                <thead><tr><th>Name</th><th>Role / Discipline</th><th></th></tr></thead>
                <tbody>
                  @for (m of teamMembers(c); track m.id) {
                    <tr>
                      <td>
                        <select class="form-select form-select-sm"
                                [ngModel]="m.name" (ngModelChange)="updateTeamMember(c, m.id, 'name', $event)"
                                [disabled]="!canEditCapa(c)">
                          <option value="">— Select member —</option>
                          @for (u of availableUsersForRow(c, m.id); track u) { <option>{{ u }}</option> }
                          @if (m.name && !availableUsersForRow(c, m.id).includes(m.name)) {
                            <option [value]="m.name">{{ m.name }}</option>
                          }
                        </select>
                      </td>
                      <td>
                        <select class="form-select form-select-sm"
                                [ngModel]="m.role" (ngModelChange)="updateTeamMember(c, m.id, 'role', $event)"
                                [disabled]="!canEditCapa(c)">
                          <option value="">— Select discipline —</option>
                          <option>Quality Engineer</option>
                          <option>Quality Supervisor</option>
                          <option>Quality Manager</option>
                          <option>Manufacturing Engineer</option>
                          <option>Production Manager</option>
                          <option>Process Owner</option>
                          <option>Maintenance Engineer</option>
                          <option>Supplier Quality</option>
                          <option>Design Engineer</option>
                          <option>Other</option>
                        </select>
                      </td>
                      <td>
                        @if (canEditCapa(c)) {
                          <button class="rm-btn" title="Remove team member" (click)="removeTeamMember(c, m.id)"><i class="bi bi-x"></i></button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              @if (canEditCapa(c)) {
                <button class="btn btn-outline-secondary btn-sm" (click)="addTeamMember(c)">
                  <i class="bi bi-plus me-1"></i> Add Team Member
                </button>
              }
              <div class="step-footer">
                <button class="btn btn-primary btn-sm"
                        [disabled]="teamMembers(c).length === 0 || !canEditCapa(c)"
                        [title]="!canEditCapa(c) ? 'Only the CAPA Champion, QE, QS, or QM can advance this step.' : 'Confirm the team is assembled and proceed to problem definition (D2).'"
                        (click)="markComplete(c, 'D1')">
                  Mark D1 Complete
                </button>
              </div>
            </div>
          }

          <!-- D2 Problem -->
          @if (activeStep() === 'D2' && !isFuture(c, 'D2')) {
            <div class="step-content">
              <h2 class="step-heading">D2 · Problem Description</h2>
              <p class="step-hint">Use the Is / Is-Not method to precisely define the problem boundaries. A well-defined problem is 50% of the solution — be specific enough for an auditor to understand the scope without additional context.</p>
              <table class="is-not-table mb-3">
                <thead><tr><th></th><th>IS — What is affected</th><th>IS NOT — What is not affected</th></tr></thead>
                <tbody>
                  <tr>
                    <td class="dimension">What</td>
                    <td><input class="form-control form-control-sm" [ngModel]="c.d2?.isWhat ?? ''" (ngModelChange)="patchD2(c,'isWhat',$event)"
                               [readonly]="!canEditCapa(c)" placeholder="e.g. Weld joint failure on Part #A420" /></td>
                    <td><input class="form-control form-control-sm" [ngModel]="c.d2?.isNotWhat ?? ''" (ngModelChange)="patchD2(c,'isNotWhat',$event)"
                               [readonly]="!canEditCapa(c)" placeholder="e.g. No failure on Part #A421 or other assemblies" /></td>
                  </tr>
                  <tr>
                    <td class="dimension">Where</td>
                    <td><input class="form-control form-control-sm" [ngModel]="c.d2?.isWhere ?? ''" (ngModelChange)="patchD2(c,'isWhere',$event)"
                               [readonly]="!canEditCapa(c)" placeholder="e.g. Line A – Assembly Station 3" /></td>
                    <td><input class="form-control form-control-sm" [ngModel]="c.d2?.isNotWhere ?? ''" (ngModelChange)="patchD2(c,'isNotWhere',$event)"
                               [readonly]="!canEditCapa(c)" placeholder="e.g. Not seen on Line B or Line C" /></td>
                  </tr>
                  <tr>
                    <td class="dimension">When</td>
                    <td><input class="form-control form-control-sm" [ngModel]="c.d2?.isWhen ?? ''" (ngModelChange)="patchD2(c,'isWhen',$event)"
                               [readonly]="!canEditCapa(c)" placeholder="e.g. Since 2026-06-20, second shift only" /></td>
                    <td><input class="form-control form-control-sm" [ngModel]="c.d2?.isNotWhen ?? ''" (ngModelChange)="patchD2(c,'isNotWhen',$event)"
                               [readonly]="!canEditCapa(c)" placeholder="e.g. Not during first shift or prior to June" /></td>
                  </tr>
                </tbody>
              </table>
              <div class="form-group">
                <label class="form-label">Problem Statement <span class="req">*</span></label>
                <textarea class="form-control form-control-sm" rows="4"
                          placeholder="Describe the problem using 5W2H: Who, What, Where, When, Why, How, How Many. This statement is permanently recorded in the audit trail."
                          [ngModel]="c.d2?.problemStatement ?? ''" (ngModelChange)="patchD2(c,'problemStatement',$event)"
                          [readonly]="!canEditCapa(c)"></textarea>
              </div>
              <div class="step-footer">
                <button class="btn btn-primary btn-sm"
                        [disabled]="!(c.d2?.problemStatement) || !canEditCapa(c)"
                        [title]="!canEditCapa(c) ? 'Only the CAPA Champion, QE, QS, or QM can advance this step.' : 'Confirm problem statement is complete and proceed to containment (D3).'"
                        (click)="markComplete(c, 'D2')">
                  Mark D2 Complete
                </button>
              </div>
            </div>
          }

          <!-- D3 Containment -->
          @if (activeStep() === 'D3' && !isFuture(c, 'D3')) {
            <div class="step-content">
              <h2 class="step-heading">D3 · Containment Actions</h2>
              <p class="step-hint">Record all immediate actions taken to stop the defect from reaching the customer or next process step. Each action must be verified by a QE, QS, QM, or the CAPA Champion — not the person who added it.</p>
              <table class="inner-table mb-2">
                <thead>
                  <tr>
                    <th>Action <span class="req">*</span></th>
                    <th>Owner <span class="req">*</span></th>
                    <th style="width:80px" data-tip="Number of units affected by this containment action">Qty</th>
                    <th style="width:120px" data-tip="Can only be verified by QE, QS, QM, or the CAPA Champion">Verified</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of containmentRows(c); track row.id) {
                    <tr>
                      <td><input class="form-control form-control-sm" [ngModel]="row.action" (ngModelChange)="updateContainRow(c, row.id, 'action', $event)"
                                 [readonly]="!canEditCapa(c)" /></td>
                      <td>
                        <select class="form-select form-select-sm" [ngModel]="row.owner" (ngModelChange)="updateContainRow(c, row.id, 'owner', $event)"
                                [disabled]="!canEditCapa(c)">
                          @for (u of siteUsers(); track u) { <option>{{ u }}</option> }
                        </select>
                      </td>
                      <td><input type="number" class="form-control form-control-sm" [ngModel]="row.qty" (ngModelChange)="updateContainRow(c, row.id, 'qty', $event)"
                                 [readonly]="!canEditCapa(c)" /></td>
                      <td>
                        <span class="verified-badge" [class.done]="row.verified"
                              [title]="canVerifyContainment(c) ? (row.verified ? 'Click to revert to Open' : 'Click to mark as Verified') : 'Only QE, QS, QM or the CAPA Champion can verify containment actions.'"
                              [style.cursor]="canVerifyContainment(c) ? 'pointer' : 'not-allowed'"
                              (click)="toggleVerified(c, row.id)">
                          @if (row.verified) { <i class="bi bi-check-circle-fill me-1"></i>Verified }
                          @else { <i class="bi bi-circle me-1"></i>Open }
                        </span>
                      </td>
                      <td>
                        @if (canEditCapa(c)) {
                          <button class="rm-btn" title="Remove this containment action" (click)="removeContainRow(c, row.id)"><i class="bi bi-x"></i></button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              @if (canEditCapa(c)) {
                <button class="btn btn-outline-secondary btn-sm" (click)="addContainRow(c)">
                  <i class="bi bi-plus me-1"></i> Add Action
                </button>
              }
              <div class="step-footer">
                <button class="btn btn-primary btn-sm"
                        [disabled]="isFuture(c, 'D3') || containmentRows(c).length === 0 || !canEditCapa(c)"
                        [title]="!canEditCapa(c) ? 'Only the CAPA Champion, QE, QS, or QM can advance this step.' : 'Confirm containment is in place and proceed to root cause analysis (D4).'"
                        (click)="markComplete(c, 'D3')">
                  Mark D3 Complete
                </button>
              </div>
            </div>
          }

          <!-- D4 Root Cause -->
          @if (activeStep() === 'D4' && !isFuture(c, 'D4')) {
            <div class="step-content">
              <h2 class="step-heading">D4 · Root Cause Analysis</h2>
              <p class="step-hint">Identify the root cause of the problem — the deepest systemic reason, not just the symptom. The root cause statement must be specific enough to form the basis for permanent corrective actions in D5.</p>
              <div class="form-group mb-3">
                <label class="form-label">Analysis Method</label>
                <div class="method-radio-row">
                  @for (m of ['5-Why','Fishbone','Other']; track m) {
                    <label class="method-radio">
                      <input type="radio" name="method" [value]="m"
                             [ngModel]="c.d4?.method ?? '5-Why'" (ngModelChange)="patchD4Method(c, $event)"
                             [disabled]="!canEditCapa(c)" />
                      {{ m }}
                    </label>
                  }
                  <button class="btn btn-outline-primary btn-sm ms-3" [disabled]="!canEditCapa(c)"
                          [title]="!canEditCapa(c) ? 'Root cause analysis requires Champion, QE, QS, or QM role.' : 'Open the full interactive root cause analysis tool.'"
                          (click)="openRcTool(c)">
                    <i class="bi bi-tools me-1"></i> Open Root Cause Tool
                  </button>
                </div>
              </div>

              @if ((c.d4?.method ?? '5-Why') === '5-Why') {
                <div class="why-chain mb-3">
                  @for (row of whyRows(c); track $index) {
                    <div class="why-row">
                      <div class="why-label">Why {{ $index + 1 }}</div>
                      <textarea class="form-control form-control-sm why-input" rows="1"
                                [ngModel]="row.why" (ngModelChange)="updateWhy(c, $index, 'why', $event)"
                                placeholder="State the why…" [readonly]="!canEditCapa(c)"></textarea>
                      <div class="why-arrow"><i class="bi bi-arrow-down"></i></div>
                      <textarea class="form-control form-control-sm why-input" rows="1"
                                [ngModel]="row.answer" (ngModelChange)="updateWhy(c, $index, 'answer', $event)"
                                placeholder="Answer…" [readonly]="!canEditCapa(c)"></textarea>
                    </div>
                    @if ($index < whyRows(c).length - 1) {
                      <div class="chain-connector"></div>
                    }
                  }
                  @if (whyRows(c).length < 5 && canEditCapa(c)) {
                    <button class="btn btn-outline-secondary btn-sm mt-2" (click)="addWhy(c)">
                      <i class="bi bi-plus me-1"></i> Add Another Why
                    </button>
                  }
                </div>
                @if (lastAnswer(c)) {
                  <div class="auto-summary mb-3">
                    <label class="form-label text-muted" style="font-size:.75rem">ROOT CAUSE SUMMARY (auto-filled from last answer)</label>
                    <div class="summary-box">{{ lastAnswer(c) }}</div>
                  </div>
                }
              }

              <div class="form-grid-1 mb-3">
                <div class="form-group">
                  <label class="form-label">Root Cause Statement <span class="req">*</span></label>
                  <textarea class="form-control form-control-sm" rows="3"
                            placeholder="State the verified root cause clearly. This will form the basis of corrective actions in D5."
                            [ngModel]="c.d4?.rootCauseStatement ?? ''" (ngModelChange)="patchD4(c,'rootCauseStatement',$event)"
                            [readonly]="!canEditCapa(c)"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Escape Point</label>
                  <textarea class="form-control form-control-sm" rows="2"
                            [ngModel]="c.d4?.escapePoint ?? ''" (ngModelChange)="patchD4(c,'escapePoint',$event)"
                            placeholder="Why was the defect not detected before reaching the next step or customer?"
                            [readonly]="!canEditCapa(c)"></textarea>
                </div>
              </div>
              <div class="step-footer">
                <button class="btn btn-primary btn-sm"
                        [disabled]="!(c.d4?.rootCauseStatement) || !canEditCapa(c)"
                        [title]="!canEditCapa(c) ? 'Only the CAPA Champion, QE, QS, or QM can advance this step.' : 'Confirm root cause is verified and proceed to corrective actions (D5).'"
                        (click)="markComplete(c, 'D4')">
                  Mark D4 Complete
                </button>
              </div>
            </div>
          }

          <!-- D5 Corrective Actions -->
          @if (activeStep() === 'D5' && !isFuture(c, 'D5')) {
            <div class="step-content">
              <h2 class="step-heading">D5 · Corrective Actions</h2>
              <p class="step-hint">Define permanent corrective actions that directly address the root cause identified in D4. Each action must have a specific owner and target date. Actions must be measurable and verifiable.</p>
              <table class="inner-table mb-2">
                <thead><tr><th>Description <span class="req">*</span></th><th>Owner <span class="req">*</span></th><th style="width:120px">Due Date <span class="req">*</span></th><th></th></tr></thead>
                <tbody>
                  @for (row of d5Actions(c); track row.id) {
                    <tr>
                      <td><input class="form-control form-control-sm" [ngModel]="row.description" (ngModelChange)="updateD5(c, row.id, 'description', $event)"
                                 [readonly]="!canEditCapa(c)" placeholder="Describe the permanent corrective action specifically" /></td>
                      <td>
                        <select class="form-select form-select-sm" [ngModel]="row.owner" (ngModelChange)="updateD5(c, row.id, 'owner', $event)"
                                [disabled]="!canEditCapa(c)">
                          @for (u of siteUsers(); track u) { <option>{{ u }}</option> }
                        </select>
                      </td>
                      <td><input type="date" class="form-control form-control-sm" [ngModel]="row.due" (ngModelChange)="updateD5(c, row.id, 'due', $event)"
                                 [readonly]="!canEditCapa(c)" /></td>
                      <td>
                        @if (canEditCapa(c)) {
                          <button class="rm-btn" title="Remove this corrective action" (click)="removeD5(c, row.id)"><i class="bi bi-x"></i></button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              @if (canEditCapa(c)) {
                <button class="btn btn-outline-secondary btn-sm" (click)="addD5(c)">
                  <i class="bi bi-plus me-1"></i> Add Action
                </button>
              }
              <div class="step-footer">
                <button class="btn btn-primary btn-sm"
                        [disabled]="d5Actions(c).length === 0 || !canEditCapa(c)"
                        [title]="!canEditCapa(c) ? 'Only the CAPA Champion, QE, QS, or QM can advance this step.' : 'Confirm corrective actions are defined and proceed to implementation (D6).'"
                        (click)="markComplete(c, 'D5')">
                  Mark D5 Complete
                </button>
              </div>
            </div>
          }

          <!-- D6 Implementation -->
          @if (activeStep() === 'D6' && !isFuture(c, 'D6')) {
            <div class="step-content">
              <h2 class="step-heading">D6 · Permanent Corrective Action — Implementation</h2>
              <p class="step-hint">Document the implementation of each corrective action from D5. Attach objective evidence (photos, updated documents, training records) to demonstrate the action was completed. Evidence is required for audit traceability.</p>
              <table class="inner-table mb-2">
                <thead><tr><th>Description <span class="req">*</span></th><th>Owner <span class="req">*</span></th><th style="width:120px">Due Date <span class="req">*</span></th><th style="width:120px">Evidence</th><th></th></tr></thead>
                <tbody>
                  @for (row of d6Actions(c); track row.id) {
                    <tr>
                      <td><input class="form-control form-control-sm" [ngModel]="row.description" (ngModelChange)="updateD6(c, row.id, 'description', $event)"
                                 [readonly]="!canEditCapa(c)" /></td>
                      <td>
                        <select class="form-select form-select-sm" [ngModel]="row.owner" (ngModelChange)="updateD6(c, row.id, 'owner', $event)"
                                [disabled]="!canEditCapa(c)">
                          @for (u of siteUsers(); track u) { <option>{{ u }}</option> }
                        </select>
                      </td>
                      <td><input type="date" class="form-control form-control-sm" [ngModel]="row.due" (ngModelChange)="updateD6(c, row.id, 'due', $event)"
                                 [readonly]="!canEditCapa(c)" /></td>
                      <td>
                        <button class="btn btn-link btn-sm p-0" style="font-size:.78rem"
                                [disabled]="!canEditCapa(c)"
                                [title]="!canEditCapa(c) ? 'Uploading evidence requires Champion, QE, QS, or QM role.' : 'Attach objective evidence: photo, updated document, training record, etc.'"
                                (click)="showToast('Evidence upload simulated.')">
                          <i class="bi bi-paperclip me-1"></i>
                          @if (row.evidence) { View } @else { Upload }
                        </button>
                      </td>
                      <td>
                        @if (canEditCapa(c)) {
                          <button class="rm-btn" title="Remove this implementation action" (click)="removeD6(c, row.id)"><i class="bi bi-x"></i></button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              @if (canEditCapa(c)) {
                <button class="btn btn-outline-secondary btn-sm" (click)="addD6(c)">
                  <i class="bi bi-plus me-1"></i> Add Action
                </button>
              }
              <div class="step-footer">
                <button class="btn btn-primary btn-sm"
                        [disabled]="d6Actions(c).length === 0 || !canEditCapa(c)"
                        [title]="!canEditCapa(c) ? 'Only the CAPA Champion, QE, QS, or QM can advance this step.' : 'Confirm all corrective actions are implemented with evidence and proceed to effectiveness verification (D7).'"
                        (click)="markComplete(c, 'D6')">
                  Mark D6 Complete
                </button>
              </div>
            </div>
          }

          <!-- D7 Effectiveness -->
          @if (activeStep() === 'D7' && !isFuture(c, 'D7')) {
            <div class="step-content">
              <h2 class="step-heading">D7 · Effectiveness Verification</h2>
              <p class="step-hint">Verify that the corrective actions implemented in D6 have permanently eliminated the root cause. Monitoring must run long enough to confirm the fix — typically 30–90 days of production data. Approval requires a Quality Manager who is not the CAPA Champion (separation of duties).</p>

              @if (!canEditCapa(c)) {
                <div class="alert d-flex align-items-start gap-2 mb-3" style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:6px;padding:12px 16px;font-size:.85rem;color:#92400E">
                  <i class="bi bi-lock-fill mt-1"></i>
                  <div>
                    <strong>Access Restricted — {{ roleDisplayName }}</strong><br>
                    Your role cannot edit effectiveness data or approve this CAPA. A Quality Manager (who is not the Champion) must formally verify and sign off on D7.
                  </div>
                </div>
              }

              <p class="form-label mb-2">Verification Criteria</p>
              <table class="inner-table mb-3">
                <thead><tr><th>Criteria</th><th style="width:90px;text-align:center">Complete</th><th style="width:100px">Evidence</th></tr></thead>
                <tbody>
                  @for (item of effCriteria(c); track item.id) {
                    <tr>
                      <td style="font-size:.85rem">{{ item.text }}</td>
                      <td style="text-align:center">
                        <input type="checkbox" [ngModel]="item.checked" (ngModelChange)="toggleCriteria(c, item.id, $event)"
                               [disabled]="!canEditCapa(c)" style="accent-color:#059669" />
                      </td>
                      <td>
                        <button class="btn btn-link btn-sm p-0" style="font-size:.78rem"
                                [disabled]="!canEditCapa(c)"
                                title="Attach objective evidence supporting this criterion"
                                (click)="showToast('Evidence upload simulated.')">
                          <i class="bi bi-paperclip"></i>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              <div class="form-grid-3 mb-3">
                <div class="form-group">
                  <label class="form-label">Monitoring Start</label>
                  <input type="date" class="form-control form-control-sm" [ngModel]="c.d7?.monitorStart ?? ''" (ngModelChange)="patchD7(c,'monitorStart',$event)"
                         [readonly]="!canEditCapa(c)"
                         data-tip="Date monitoring of the corrective action began." />
                </div>
                <div class="form-group">
                  <label class="form-label">Monitoring End</label>
                  <input type="date" class="form-control form-control-sm" [ngModel]="c.d7?.monitorEnd ?? ''" (ngModelChange)="patchD7(c,'monitorEnd',$event)"
                         [readonly]="!canEditCapa(c)"
                         data-tip="Date monitoring concluded. Minimum 30 days of production data recommended." />
                </div>
                <div class="form-group">
                  <label class="form-label">Monitoring Status</label>
                  <select class="form-select form-select-sm" [ngModel]="c.d7?.monitorStatus ?? ''" (ngModelChange)="patchD7(c,'monitorStatus',$event)"
                          [disabled]="!canEditCapa(c)">
                    <option>Not Started</option><option>In Progress</option><option>Complete</option>
                  </select>
                </div>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Results / Evidence of Effectiveness <span class="req">*</span></label>
                <textarea class="form-control form-control-sm" rows="3"
                          [ngModel]="c.d7?.results ?? ''" (ngModelChange)="patchD7(c,'results',$event)"
                          placeholder="Describe measurable evidence that the corrective action eliminated the root cause — e.g. defect rate, before/after data, audit results."
                          [readonly]="!canEditCapa(c)"></textarea>
              </div>

              <!-- E-sign block: QM only, non-champion -->
              @if (currentUserIsQM() && !isChampion(c)) {
                <div class="esign-block">
                  <p class="esign-title"><i class="bi bi-pen me-1"></i> Quality Manager Sign-Off</p>
                  <p class="esign-sub">By signing below, I confirm I have reviewed the evidence and verify this CAPA has effectively eliminated the root cause. This constitutes an electronic signature per your QMS policy.</p>
                  <div class="form-grid-2 mb-2">
                    <div class="form-group">
                      <label class="form-label">Approver Name (read-only)</label>
                      <input class="form-control form-control-sm" [value]="authStore.fullName()" readonly />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Password Confirmation <span class="req">*</span></label>
                      <input type="password" class="form-control form-control-sm" [(ngModel)]="esignPassword"
                             placeholder="Re-enter your password to sign" />
                    </div>
                  </div>
                  <button class="btn btn-success btn-sm"
                          [disabled]="esignPassword.length < 4 || !c.d7?.results"
                          title="Password must be at least 4 characters and results must be recorded before approving."
                          (click)="approveEffectiveness(c)">
                    <i class="bi bi-check-circle me-1"></i> Approve Effectiveness
                  </button>
                </div>
              }

              <!-- Champion message -->
              @if (isChampion(c) && !currentUserIsQM()) {
                <div class="alert alert-warning d-flex align-items-start gap-2 mb-3" style="font-size:.85rem">
                  <i class="bi bi-exclamation-triangle-fill mt-1"></i>
                  <div>
                    <strong>Champion — Sign-Off Required from Quality Manager</strong><br>
                    You entered the results and evidence as Champion. A Quality Manager who is not you must formally verify and sign off on effectiveness. This is a separation-of-duties requirement under ISO 9001 / IATF 16949.
                  </div>
                </div>
              }

              <!-- Authorized non-QM message (e.g. QE, QS filling in results) -->
              @if (canEditCapa(c) && !currentUserIsQM() && !isChampion(c)) {
                <div class="alert alert-info d-flex align-items-start gap-2 mb-3" style="font-size:.85rem;background:#EFF6FF;border:1px solid #BFDBFE;color:#1E40AF;border-radius:6px;padding:12px 16px">
                  <i class="bi bi-info-circle-fill mt-1"></i>
                  <div>
                    <strong>Results Entry — QM Approval Required</strong><br>
                    You can record monitoring results and check verification criteria. However, formal effectiveness approval can only be performed by a Quality Manager who is not the CAPA Champion.
                  </div>
                </div>
              }

              <div class="step-footer">
                <button class="btn btn-primary btn-sm"
                        [disabled]="!c.d7?.results || !canEditCapa(c)"
                        [title]="!canEditCapa(c) ? 'Only the CAPA Champion, QE, QS, or QM can advance this step.' : 'Confirm effectiveness data is recorded and proceed to lessons learned (D8).'"
                        (click)="markComplete(c, 'D7')">
                  Mark D7 Complete
                </button>
              </div>
            </div>
          }

          <!-- D8 Lessons -->
          @if (activeStep() === 'D8' && !isFuture(c, 'D8')) {
            <div class="step-content">
              <h2 class="step-heading">D8 · Lessons Learned &amp; Closure</h2>
              <p class="step-hint">Document lessons learned so knowledge is shared across the organization to prevent recurrence on similar processes. Confirm all affected documents have been updated before closing the CAPA.</p>

              <div class="form-group mb-3">
                <label class="form-label">Lessons Learned</label>
                <textarea class="form-control form-control-sm" rows="4"
                          [ngModel]="c.d8?.lessons ?? ''" (ngModelChange)="patchD8(c,'lessons',$event)"
                          placeholder="What did the team learn? What systemic changes prevent this from recurring? How can similar processes benefit from this experience?"
                          [readonly]="!canEditCapa(c)"></textarea>
              </div>

              <p class="form-label mb-2">Documents Updated <span class="field-hint" style="font-size:.72rem;color:#94A3B8;font-weight:400">(confirm all affected documents are revised before closure)</span></p>
              <div class="docs-checklist mb-3">
                @for (doc of docLabels; track $index) {
                  <label class="doc-check-item">
                    <input type="checkbox" [ngModel]="getDocUpdated(c, $index)" (ngModelChange)="setDocUpdated(c, $index, $event)"
                           [disabled]="!canEditCapa(c)" style="accent-color:#059669" />
                    {{ doc }}
                  </label>
                }
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Team Recognition Note <span class="field-hint" style="font-size:.72rem;color:#94A3B8;font-weight:400">(optional)</span></label>
                <textarea class="form-control form-control-sm" rows="2"
                          [ngModel]="c.d8?.teamNote ?? ''" (ngModelChange)="patchD8(c,'teamNote',$event)"
                          placeholder="Acknowledge team contributions and recognize individuals who drove the resolution."
                          [readonly]="!canEditCapa(c)"></textarea>
              </div>

              <!-- QM e-sign block for D8 closure -->
              @if (currentUserIsQM() && !isChampion(c) && allD0toD7Complete(c)) {
                <div class="esign-block">
                  <p class="esign-title"><i class="bi bi-pen me-1"></i> Quality Manager — CAPA Closure Sign-Off</p>
                  <p class="esign-sub">By signing below, I confirm all 8D steps are complete, effectiveness is verified, and this CAPA record can be permanently closed per QMS policy.</p>
                  <div class="form-grid-2 mb-2">
                    <div class="form-group">
                      <label class="form-label">Approver Name (read-only)</label>
                      <input class="form-control form-control-sm" [value]="authStore.fullName()" readonly />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Password Confirmation <span class="req">*</span></label>
                      <input type="password" class="form-control form-control-sm" [(ngModel)]="d8ClosePassword"
                             placeholder="Re-enter your password to close" />
                    </div>
                  </div>
                </div>
              }
              @if (isChampion(c) && !currentUserIsQM() && allD0toD7Complete(c)) {
                <div class="alert alert-warning d-flex align-items-start gap-2 mb-3" style="font-size:.85rem">
                  <i class="bi bi-exclamation-triangle-fill mt-1"></i>
                  <div>
                    <strong>Champion — QM Authorization Required for Closure</strong><br>
                    All steps are complete. A Quality Manager (non-Champion) must formally close this CAPA — separation-of-duties requirement per IATF 16949.
                  </div>
                </div>
              }
              @if (canEditCapa(c) && !currentUserIsQM() && !isChampion(c) && allD0toD7Complete(c)) {
                <div class="alert d-flex align-items-start gap-2 mb-3" style="font-size:.85rem;background:#EFF6FF;border:1px solid #BFDBFE;color:#1E40AF;border-radius:6px;padding:12px 16px">
                  <i class="bi bi-info-circle-fill mt-1"></i>
                  <div>
                    <strong>QM Sign-Off Required for Closure</strong><br>
                    You can update lessons learned and document confirmations. Formal CAPA closure requires a Quality Manager (non-Champion) authorization.
                  </div>
                </div>
              }
              <div class="step-footer">
                <button class="btn btn-success btn-sm"
                        [disabled]="!allD0toD7Complete(c) || !(currentUserIsQM() && !isChampion(c) && d8ClosePassword.length >= 4)"
                        [title]="!(currentUserIsQM() && !isChampion(c)) ? 'Only a Quality Manager (non-Champion) can formally close this CAPA.' : (!allD0toD7Complete(c) ? 'Complete all steps D0–D7 before closing this CAPA.' : 'Close this CAPA. All steps are complete and the record will be locked for audit.')"
                        (click)="closeCapa(c)">
                  <i class="bi bi-check2-all me-1"></i> Close CAPA
                </button>
                @if (!allD0toD7Complete(c)) {
                  <span class="ms-2 text-muted" style="font-size:.8rem">All steps D0–D7 must be complete before closure</span>
                } @else if (!(currentUserIsQM() && !isChampion(c))) {
                  <span class="ms-2 text-muted" style="font-size:.8rem">Quality Manager (non-Champion) authorization required to close</span>
                }
              </div>
            </div>
          }

          <!-- Future step placeholder -->
          @if (isFuture(c, activeStep())) {
            <div class="step-content">
              <div class="future-placeholder">
                <i class="bi bi-lock fs-3 mb-2 text-muted"></i>
                <p>Complete <strong>{{ prevStep(activeStep()) }}</strong> to unlock this discipline.</p>
              </div>
            </div>
          }

        </div>
      </div>

      <!-- ── Footer rail ── -->
      <div class="ws-footer">
        <button class="footer-link" (click)="router.navigate(['/capas', c.id, 'scar'])">
          <i class="bi bi-file-earmark-text me-1"></i> Generate SCAR PDF
        </button>
        <button class="footer-link" (click)="activityOpen.set(!activityOpen())">
          <i class="bi bi-clock-history me-1"></i> Activity
        </button>
        <button class="footer-link" (click)="showToast('You are now watching ' + c.id)">
          <i class="bi bi-eye me-1"></i> Watch
        </button>
        <span class="footer-sep">·</span>
        <span class="footer-meta">{{ c.completionPct }}% complete · {{ c.daysOpen }} days open</span>
      </div>

    </div>

    <!-- Activity slide-over -->
    @if (activityOpen()) {
      <div class="activity-overlay" (click)="activityOpen.set(false)"></div>
      <div class="activity-drawer">
        <div class="drawer-header">
          <span class="fw-600">Activity Log</span>
          <button class="close-btn" (click)="activityOpen.set(false)"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="activity-list">
          @for (item of activityItems; track item.ts) {
            <div class="activity-item">
              <span class="act-dot" [style.background]="item.color"></span>
              <div class="act-body">
                <span class="act-actor">{{ item.actor }}</span> {{ item.action }}
                <div class="act-ts">{{ item.ts }}</div>
              </div>
            </div>
          }
        </div>
      </div>
    }
    }

    @if (!capa()) {
      <div style="padding:40px;text-align:center;color:#94A3B8">
        <i class="bi bi-exclamation-circle fs-2 d-block mb-2"></i>
        CAPA not found.
      </div>
    }

    <!-- Toast -->
    @if (toast()) {
      <div class="toast-pill">{{ toast() }}</div>
    }
  `,
  styles: [`
    .ws-layout { display:flex; flex-direction:column; height:calc(100vh - 60px); overflow:hidden; }

    /* Header */
    .ws-header { background:#fff; border-bottom:1px solid #E2E8F0; padding:16px 24px 0; flex-shrink:0; }
    .back-btn { background:none; border:none; color:#2563EB; font-size:.82rem; cursor:pointer; padding:0 0 10px; display:flex; align-items:center; }
    .header-body { display:flex; align-items:flex-start; justify-content:space-between; padding-bottom:14px; }
    .header-left { flex:1; }
    .header-id-row { display:flex; align-items:center; gap:4px; margin-bottom:4px; }
    .record-id { font-family:monospace; font-size:.85rem; font-weight:700; color:#0F172A; }
    .status-chip { font-size:.72rem; font-weight:600; padding:2px 8px; border-radius:99px; }
    .chip-open { background:#DBEAFE; color:#1D4ED8; }
    .chip-closed { background:#D1FAE5; color:#065F46; }
    .ontime-chip { font-size:.72rem; font-weight:600; padding:2px 8px; border-radius:99px; }
    .ontime-on-track { background:#D1FAE5; color:#065F46; }
    .ontime-at-risk { background:#FEF3C7; color:#92400E; }
    .ontime-overdue { background:#FEE2E2; color:#991B1B; }
    .capa-title { font-size:1.25rem; font-weight:700; color:#0F172A; margin:0 0 8px; }
    .header-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .meta-item { font-size:.82rem; color:#475569; }
    .meta-sep { color:#CBD5E1; }
    .source-chip { font-size:.75rem; font-weight:600; padding:3px 10px; border-radius:99px; }
    .source-ncr { background:#DBEAFE; color:#1D4ED8; }
    .source-customer { background:#FEF3C7; color:#92400E; }
    .source-audit { background:#F3E8FF; color:#6B21A8; }
    .source-internal { background:#F0FDF4; color:#166534; }
    .countdown-chip { font-size:.78rem; font-weight:600; padding:3px 10px; border-radius:99px; background:#F1F5F9; color:#475569; }
    .countdown-chip.amber { background:#FEF3C7; color:#92400E; }
    .countdown-chip.red { background:#FEE2E2; color:#991B1B; }

    .header-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; }
    .champion-row { display:flex; align-items:center; gap:8px; }
    .avatar-md { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:50%; color:#fff; font-size:.75rem; font-weight:700; }
    .avatar-sm { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; color:#fff; font-size:.65rem; font-weight:700; border:2px solid #fff; margin-right:-6px; }
    .avatar-more { background:#94A3B8; }
    .champion-name { font-size:.85rem; font-weight:600; color:#1E293B; }
    .role-label { font-size:.75rem; color:#64748B; background:#F1F5F9; padding:1px 6px; border-radius:4px; }
    .team-avatars { display:flex; align-items:center; }
    .team-label { font-size:.75rem; color:#64748B; margin-left:12px; }

    /* Body */
    .ws-body { display:flex; flex:1; overflow:hidden; }

    /* Left pane */
    .left-pane { width:280px; background:#fff; border-right:1px solid #E2E8F0; overflow-y:auto; padding:16px 0; flex-shrink:0; }
    .pane-section-label { font-size:.7rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#94A3B8; padding:0 16px 8px; margin:0; }
    .step-row {
      display:flex; align-items:center; gap:10px; padding:9px 16px;
      background:none; border:none; width:100%; text-align:left; cursor:pointer;
      transition:background .1s; border-radius:0;
    }
    .step-row:hover { background:#F8FAFC; }
    .step-active { background:#1E40AF !important; color:#fff; }
    .step-active .step-label { color:#fff; font-weight:600; }
    .step-active .days-badge { background:rgba(255,255,255,.25); color:#fff; }
    .step-done .step-label { color:#94A3B8; }
    .step-future .step-label { color:#CBD5E1; }
    .step-icon { width:18px; text-align:center; font-size:.95rem; flex-shrink:0; }
    .step-label { font-size:.83rem; color:#374151; }
    .days-badge { font-size:.7rem; background:#EFF6FF; color:#1D4ED8; padding:1px 6px; border-radius:99px; }

    /* Right pane */
    .right-pane { flex:1; overflow-y:auto; background:#F8FAFC; }
    .step-content { padding:28px 32px; max-width:900px; }
    .step-heading { font-size:1.1rem; font-weight:700; color:#0F172A; margin:0 0 16px; }
    .step-hint { font-size:.83rem; color:#64748B; margin-bottom:16px; }
    .req { color:#DC2626; }

    .lock-banner { background:#FEF3C7; border-left:4px solid #F59E0B; padding:12px 20px; font-size:.85rem; color:#92400E; }
    .role-lock-notice { display:flex; align-items:flex-start; gap:12px; background:#EFF6FF; border-left:4px solid #3B82F6; padding:14px 20px; font-size:.85rem; color:#1E40AF; flex-shrink:0; }
    .role-lock-notice strong { display:block; margin-bottom:3px; font-size:.875rem; }
    .role-lock-notice .rln-sub { font-size:.8rem; color:#3B82F6; line-height:1.5; }
    .role-lock-notice i { font-size:1.1rem; margin-top:1px; flex-shrink:0; }
    input[readonly], textarea[readonly] { background:#F8FAFC !important; color:#64748B; cursor:not-allowed; }
    select:disabled, button:disabled { opacity:.55; cursor:not-allowed; }

    /* Forms */
    .form-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .form-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
    .form-grid-1 { display:grid; grid-template-columns:1fr; gap:14px; }
    .form-group { display:flex; flex-direction:column; gap:4px; }
    .form-label { font-size:.78rem; font-weight:600; color:#374151; }

    /* Is/Is-Not table */
    .is-not-table { width:100%; border-collapse:collapse; }
    .is-not-table th { background:#F8FAFC; padding:7px 10px; font-size:.75rem; font-weight:600; color:#64748B; border:1px solid #E2E8F0; }
    .is-not-table td { padding:6px 8px; border:1px solid #E2E8F0; vertical-align:top; }
    .dimension { font-size:.78rem; font-weight:600; color:#374151; background:#F8FAFC; white-space:nowrap; width:60px; }

    /* Inner table */
    .inner-table { width:100%; border-collapse:collapse; }
    .inner-table th { background:#F8FAFC; padding:7px 10px; font-size:.75rem; font-weight:600; color:#64748B; border:1px solid #E2E8F0; }
    .inner-table td { padding:6px 8px; border:1px solid #E2E8F0; vertical-align:middle; }
    .rm-btn { background:none; border:none; color:#94A3B8; cursor:pointer; padding:2px 4px; font-size:.9rem; }
    .rm-btn:hover { color:#DC2626; }
    .verified-badge { font-size:.75rem; cursor:pointer; padding:2px 8px; border-radius:99px; background:#F1F5F9; color:#64748B; }
    .verified-badge.done { background:#D1FAE5; color:#065F46; }

    /* 5-Why chain */
    .why-chain { max-width:600px; }
    .why-row { display:grid; grid-template-columns:60px 1fr; grid-template-rows:auto 20px auto; gap:4px 12px; align-items:center; }
    .why-label { font-size:.75rem; font-weight:700; color:#1E40AF; grid-row:1/2; }
    .why-input { grid-column:2; resize:none; }
    .why-arrow { grid-column:2; text-align:center; color:#94A3B8; font-size:.8rem; }
    .chain-connector { height:12px; border-left:2px dashed #CBD5E1; margin-left:30px; }

    .auto-summary { }
    .summary-box { background:#EFF6FF; border:1px solid #BFDBFE; border-radius:6px; padding:10px 14px; font-size:.85rem; color:#1D4ED8; }

    /* Method radio */
    .method-radio-row { display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
    .method-radio { display:flex; align-items:center; gap:5px; font-size:.85rem; color:#374151; cursor:pointer; }

    /* D7 */
    .esign-block { background:#F0FDF4; border:1px solid #A7F3D0; border-radius:8px; padding:16px; margin-bottom:16px; }
    .esign-title { font-weight:700; color:#065F46; margin:0 0 4px; font-size:.9rem; }
    .esign-sub { font-size:.83rem; color:#374151; margin-bottom:12px; }

    /* D8 */
    .docs-checklist { display:flex; flex-direction:column; gap:8px; }
    .doc-check-item { display:flex; align-items:center; gap:8px; font-size:.85rem; color:#374151; cursor:pointer; }

    .future-placeholder { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 40px; color:#94A3B8; text-align:center; font-size:.9rem; }
    .champion-readonly-row { display:flex; align-items:center; gap:10px; padding:7px 12px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; max-width:320px; }
    .avatar-sm-inline { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:50%; color:#fff; font-size:.7rem; font-weight:700; flex-shrink:0; }
    .champion-readonly-name { font-size:.875rem; font-weight:600; color:#0F172A; flex:1; }
    .champion-readonly-badge { font-size:.7rem; font-weight:600; color:#64748B; background:#E2E8F0; padding:2px 7px; border-radius:99px; white-space:nowrap; }

    /* Step footer */
    .step-footer { margin-top:24px; padding-top:16px; border-top:1px solid #E2E8F0; }

    /* Footer rail */
    .ws-footer { background:#fff; border-top:1px solid #E2E8F0; padding:10px 24px; display:flex; align-items:center; gap:16px; flex-shrink:0; }
    .footer-link { background:none; border:none; color:#2563EB; font-size:.83rem; cursor:pointer; padding:0; display:flex; align-items:center; }
    .footer-link:hover { text-decoration:underline; }
    .footer-sep { color:#CBD5E1; }
    .footer-meta { font-size:.8rem; color:#64748B; margin-left:auto; }

    /* Activity drawer */
    .activity-overlay { position:fixed; inset:0; z-index:400; background:rgba(0,0,0,.3); }
    .activity-drawer {
      position:fixed; right:0; top:0; bottom:0; width:360px; background:#fff; z-index:401;
      display:flex; flex-direction:column; box-shadow:-4px 0 16px rgba(0,0,0,.15);
    }
    .drawer-header { padding:16px 20px; border-bottom:1px solid #E2E8F0; display:flex; align-items:center; justify-content:space-between; }
    .close-btn { background:none; border:none; color:#64748B; cursor:pointer; font-size:1rem; }
    .activity-list { padding:16px; overflow-y:auto; flex:1; }
    .activity-item { display:flex; gap:10px; margin-bottom:16px; }
    .act-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-top:4px; }
    .act-body { font-size:.83rem; color:#374151; }
    .act-actor { font-weight:600; }
    .act-ts { font-size:.75rem; color:#94A3B8; margin-top:2px; }
    .fw-600 { font-weight:600; }

    .toast-pill {
      position:fixed; bottom:24px; right:24px; z-index:9999;
      background:#1E293B; color:#fff; padding:10px 20px; border-radius:8px;
      font-size:.87rem; box-shadow:0 4px 16px rgba(0,0,0,.2);
    }
  `],
})
export class CapaWorkspaceComponent implements OnInit {
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly mock = inject(MockDataService);
  readonly authStore = inject(AuthStore);

  activeStep = signal<DStep>('D4');
  activityOpen = signal(false);
  toast = signal('');
  esignPassword = '';
  d8ClosePassword = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly steps = STEPS;
  readonly docLabels = ['Control Plan updated', 'PFMEA updated', 'Work Instructions updated', 'Maintenance Schedule revised', 'Training records filed'];

  readonly siteUsers = computed(() => {
    const c = this.capa();
    const all = this.mock.users;
    return (c ? all.filter(u => u.siteId === c.siteId) : all).map(u => u.fullName);
  });

  readonly activityItems = [
    { actor: 'Dev Patel', action: 'updated D4 root cause statement', ts: '2026-06-13 09:15', color: '#7C3AED' },
    { actor: 'Maria Delgado', action: 'marked D3 Containment complete', ts: '2026-06-11 14:30', color: '#2563EB' },
    { actor: 'Dev Patel', action: 'added containment action', ts: '2026-06-10 11:00', color: '#7C3AED' },
    { actor: 'Maria Delgado', action: 'marked D2 complete', ts: '2026-06-07 16:45', color: '#2563EB' },
    { actor: 'Dev Patel', action: 'opened CAPA from NCR-2026-0103', ts: '2026-05-16 08:00', color: '#7C3AED' },
  ];

  readonly capa = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.mock.getCapa8d(id) : undefined;
  });

  ngOnInit(): void {
    const c = this.capa();
    if (c) this.activeStep.set(c.activeStep);
  }

  daysRemaining(c: CAPA8D): string {
    const due = new Date(c.dueDate);
    const today = new Date('2026-06-13');
    const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    return `${diff} days remaining`;
  }

  teamExtra(c: CAPA8D): number {
    const d1Team = c.d1?.team ?? [];
    return Math.max(0, d1Team.length - c.teamAvatars.length);
  }

  isCompleted(c: CAPA8D, step: DStep): boolean {
    return c.completedSteps.includes(step);
  }

  isFuture(c: CAPA8D, step: DStep): boolean {
    const order: DStep[] = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'];
    const activeIdx = order.indexOf(c.activeStep);
    const stepIdx = order.indexOf(step);
    return stepIdx > activeIdx;
  }

  prevStep(step: DStep): string {
    const order: DStep[] = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'];
    const idx = order.indexOf(step);
    return idx > 0 ? order[idx - 1] : step;
  }

  sourceClass(type: string): string {
    if (type === 'NCR') return 'ncr';
    if (type === 'Customer Complaint') return 'customer';
    if (type === 'Audit') return 'audit';
    return 'internal';
  }

  navToSource(c: CAPA8D): void {
    if (c.ncrId) this.router.navigate(['/ncrs', c.ncrId]);
  }

  // ── D0 ──────────────────────────────────────────────────────────────────────
  patchD0(c: CAPA8D, field: string, val: string): void {
    const d0 = { ...(c.d0 ?? { title: '', source: '', severity: '', dueDate: '' }), [field]: val };
    this.mock.updateCapa8d(c.id, { d0 });
  }

  patchD0Champion(c: CAPA8D, champion: string): void {
    const d0 = { ...(c.d0 ?? { title: '', source: '', severity: '', dueDate: '' }), champion };
    this.mock.updateCapa8d(c.id, { d0, champion });
  }

  // ── D1 ──────────────────────────────────────────────────────────────────────
  teamMembers(c: CAPA8D): CapaTeamMember[] {
    return c.d1?.team ?? [];
  }
  patchD1Champion(c: CAPA8D, champion: string): void {
    const d1 = { ...(c.d1 ?? { champion: '', team: [] }), champion };
    this.mock.updateCapa8d(c.id, { d1 });
  }
  addTeamMember(c: CAPA8D): void {
    const team = [...(c.d1?.team ?? []), { id: 'tm' + Date.now(), name: '', role: '' }];
    const d1 = { ...(c.d1 ?? { champion: c.champion }), team };
    this.mock.updateCapa8d(c.id, { d1 });
  }
  availableUsersForRow(c: CAPA8D, memberId: string): string[] {
    const taken = (c.d1?.team ?? [])
      .filter((m: CapaTeamMember) => m.id !== memberId && m.name)
      .map((m: CapaTeamMember) => m.name);
    return this.siteUsers().filter(u => !taken.includes(u));
  }

  updateTeamMember(c: CAPA8D, id: string, field: 'name' | 'role', val: string): void {
    const team = (c.d1?.team ?? []).map((m: CapaTeamMember) => m.id === id ? { ...m, [field]: val } : m);
    const d1 = { ...(c.d1 ?? { champion: c.champion, team: [] }), team };
    this.mock.updateCapa8d(c.id, { d1 });
  }
  removeTeamMember(c: CAPA8D, id: string): void {
    const team = (c.d1?.team ?? []).filter((m: CapaTeamMember) => m.id !== id);
    const d1 = { ...(c.d1 ?? { champion: c.champion, team: [] }), team };
    this.mock.updateCapa8d(c.id, { d1 });
  }

  // ── D2 ──────────────────────────────────────────────────────────────────────
  patchD2(c: CAPA8D, field: string, val: string): void {
    const d2 = { ...(c.d2 ?? { problemStatement: '' }), [field]: val };
    this.mock.updateCapa8d(c.id, { d2 });
  }

  // ── D3 ──────────────────────────────────────────────────────────────────────
  containmentRows(c: CAPA8D): CapaContainmentRow[] {
    return c.d3?.actions ?? [];
  }
  addContainRow(c: CAPA8D): void {
    const actions = [...this.containmentRows(c), { id: 'cr' + Date.now(), action: '', owner: 'Dev Patel', verified: false }];
    this.mock.updateCapa8d(c.id, { d3: { ...(c.d3 ?? {}), actions } });
  }
  removeContainRow(c: CAPA8D, id: string): void {
    const actions = this.containmentRows(c).filter((r: CapaContainmentRow) => r.id !== id);
    this.mock.updateCapa8d(c.id, { d3: { actions } });
  }
  updateContainRow(c: CAPA8D, id: string, field: string, val: string | number): void {
    const actions = this.containmentRows(c).map((r: CapaContainmentRow) => r.id === id ? { ...r, [field]: val } : r);
    this.mock.updateCapa8d(c.id, { d3: { ...(c.d3 ?? {}), actions } });
  }
  toggleVerified(c: CAPA8D, id: string): void {
    if (!this.canVerifyContainment(c)) {
      this.showToast('Only QE, QS, QM or the CAPA Champion can verify containment actions.');
      return;
    }
    const actions = this.containmentRows(c).map((r: CapaContainmentRow) =>
      r.id === id ? { ...r, verified: !r.verified, verifiedDate: !r.verified ? '2026-06-13' : undefined } : r
    );
    this.mock.updateCapa8d(c.id, { d3: { ...(c.d3 ?? {}), actions } });
  }

  // ── D4 ──────────────────────────────────────────────────────────────────────
  whyRows(c: CAPA8D) { return c.d4?.whyRows ?? []; }
  addWhy(c: CAPA8D): void {
    const whyRows = [...this.whyRows(c), { why: '', answer: '' }];
    this.mock.updateCapa8d(c.id, { d4: { ...(c.d4 ?? { method: '5-Why', fishbone: { man:[], machine:[], method:[], material:[], measurement:[], nature:[] }, rootCauseStatement: '', escapePoint: '' }), whyRows } });
  }
  updateWhy(c: CAPA8D, idx: number, field: string, val: string): void {
    const whyRows = this.whyRows(c).map((r, i) => i === idx ? { ...r, [field]: val } : r);
    this.mock.updateCapa8d(c.id, { d4: { ...(c.d4!), whyRows } });
  }
  patchD4(c: CAPA8D, field: string, val: string): void {
    this.mock.updateCapa8d(c.id, { d4: { ...(c.d4!), [field]: val } });
  }
  patchD4Method(c: CAPA8D, method: '5-Why' | 'Fishbone' | 'Other'): void {
    this.mock.updateCapa8d(c.id, { d4: { ...(c.d4!), method } });
  }
  lastAnswer(c: CAPA8D): string {
    const rows = this.whyRows(c);
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].answer) return rows[i].answer;
    }
    return '';
  }
  openRcTool(c: CAPA8D): void {
    this.router.navigate(['/capas', c.id, 'd4']);
  }

  // ── D5 ──────────────────────────────────────────────────────────────────────
  d5Actions(c: CAPA8D): CapaActionRow[] { return c.d5?.actions ?? []; }
  addD5(c: CAPA8D): void {
    const actions = [...this.d5Actions(c), { id: 'd5_' + Date.now(), description: '', owner: 'Dev Patel', due: '' }];
    this.mock.updateCapa8d(c.id, { d5: { actions } });
  }
  removeD5(c: CAPA8D, id: string): void {
    this.mock.updateCapa8d(c.id, { d5: { actions: this.d5Actions(c).filter((r: CapaActionRow) => r.id !== id) } });
  }
  updateD5(c: CAPA8D, id: string, field: string, val: string): void {
    const actions = this.d5Actions(c).map((r: CapaActionRow) => r.id === id ? { ...r, [field]: val } : r);
    this.mock.updateCapa8d(c.id, { d5: { actions } });
  }

  // ── D6 ──────────────────────────────────────────────────────────────────────
  d6Actions(c: CAPA8D): CapaActionRow[] { return c.d6?.actions ?? []; }
  addD6(c: CAPA8D): void {
    const actions = [...this.d6Actions(c), { id: 'd6_' + Date.now(), description: '', owner: 'Dev Patel', due: '' }];
    this.mock.updateCapa8d(c.id, { d6: { actions } });
  }
  removeD6(c: CAPA8D, id: string): void {
    this.mock.updateCapa8d(c.id, { d6: { actions: this.d6Actions(c).filter((r: CapaActionRow) => r.id !== id) } });
  }
  updateD6(c: CAPA8D, id: string, field: string, val: string): void {
    const actions = this.d6Actions(c).map((r: CapaActionRow) => r.id === id ? { ...r, [field]: val } : r);
    this.mock.updateCapa8d(c.id, { d6: { actions } });
  }

  // ── D7 ──────────────────────────────────────────────────────────────────────
  effCriteria(c: CAPA8D) { return c.d7?.criteria ?? []; }
  toggleCriteria(c: CAPA8D, id: string, val: boolean): void {
    const criteria = this.effCriteria(c).map(item => item.id === id ? { ...item, checked: val } : item);
    this.mock.updateCapa8d(c.id, { d7: { ...(c.d7!), criteria } });
  }
  patchD7(c: CAPA8D, field: string, val: string): void {
    this.mock.updateCapa8d(c.id, { d7: { ...(c.d7 ?? { criteria: [] }), [field]: val } });
  }
  currentUserIsQM(): boolean { return this.authStore.hasRole('QM'); }
  isChampion(c: CAPA8D): boolean { return c.champion === this.authStore.fullName(); }

  private static readonly CAPA_EDIT_ROLES = ['QE', 'QS', 'ME', 'QM'];
  private static readonly VERIFY_ROLES    = ['QE', 'QS', 'QM'];

  canEditCapa(c: CAPA8D): boolean {
    if (this.isChampion(c)) return true;
    const roles = this.authStore.currentUser()?.roles ?? [];
    return CapaWorkspaceComponent.CAPA_EDIT_ROLES.some(r => roles.includes(r));
  }

  canVerifyContainment(c: CAPA8D): boolean {
    if (this.isChampion(c)) return true;
    return CapaWorkspaceComponent.VERIFY_ROLES.some(r => this.authStore.hasRole(r));
  }

  get roleDisplayName(): string {
    const roles = this.authStore.currentUser()?.roles ?? [];
    return roles.find(r => !r.startsWith('lpa:')) ?? 'Operator';
  }
  approveEffectiveness(c: CAPA8D): void {
    const name = this.authStore.fullName();
    this.mock.updateCapa8d(c.id, { d7: { ...(c.d7!), approvedBy: name, approvedAt: new Date().toISOString().split('T')[0] } });
    this.esignPassword = '';
    this.showToast(`Effectiveness approved by ${name}.`);
  }

  // ── D8 ──────────────────────────────────────────────────────────────────────
  patchD8(c: CAPA8D, field: string, val: string): void {
    this.mock.updateCapa8d(c.id, { d8: { ...(c.d8 ?? { lessons: '', docsUpdated: [false,false,false,false,false], teamNote: '', closed: false }), [field]: val } });
  }
  getDocUpdated(c: CAPA8D, idx: number): boolean {
    return c.d8?.docsUpdated?.[idx] ?? false;
  }
  setDocUpdated(c: CAPA8D, idx: number, val: boolean): void {
    const docsUpdated = [...(c.d8?.docsUpdated ?? [false, false, false, false, false])];
    docsUpdated[idx] = val;
    this.mock.updateCapa8d(c.id, { d8: { ...(c.d8 ?? { lessons: '', teamNote: '', closed: false }), docsUpdated } });
  }
  allD0toD7Complete(c: CAPA8D): boolean {
    const required: DStep[] = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];
    return required.every(s => c.completedSteps.includes(s));
  }
  closeCapa(c: CAPA8D): void {
    if (!this.currentUserIsQM() || this.isChampion(c)) {
      this.showToast('CAPA closure requires Quality Manager (non-Champion) authorization.');
      return;
    }
    this.mock.updateCapa8d(c.id, { status: 'Closed', d8: { ...(c.d8!), closed: true, closedAt: '2026-06-13' } });
    this.d8ClosePassword = '';
    this.showToast(`${c.id} closed successfully.`);
  }

  // ── Step completion ──────────────────────────────────────────────────────────
  markComplete(c: CAPA8D, step: DStep): void {
    const order: DStep[] = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'];
    const idx = order.indexOf(step);
    const completedSteps = [...new Set([...c.completedSteps, step])];
    const nextStep = idx < order.length - 1 ? order[idx + 1] : step;
    this.mock.updateCapa8d(c.id, { completedSteps, activeStep: nextStep });
    this.activeStep.set(nextStep);
    this.showToast(`${step} marked complete.`);
  }

  showToast(msg: string): void {
    this.toast.set(msg);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 3000);
  }
}
