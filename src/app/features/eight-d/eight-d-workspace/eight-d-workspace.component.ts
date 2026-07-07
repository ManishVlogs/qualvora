import { Component, inject, computed, signal, OnInit, Pipe, PipeTransform } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { EightDMockService } from '../../../shared/services/eight-d-mock.service';
import { EightD, EightDDiscipline, EightDAction } from '../../../shared/interfaces/eight-d.models';

@Pipe({ name: 'actionCount', standalone: true })
export class ActionCountPipe implements PipeTransform {
  transform(actions: EightDAction[], status: string): number {
    return actions.filter(a => a.status === status).length;
  }
}

@Pipe({ name: 'checkedCount', standalone: true })
export class CheckedCountPipe implements PipeTransform {
  transform(items: { checked: boolean }[]): number {
    return items.filter(i => i.checked).length;
  }
}

const STEPS: { key: EightDDiscipline; label: string; icon: string; desc: string }[] = [
  { key: 'D1', label: 'Team Formation',         icon: 'bi-people-fill',           desc: 'Assemble the cross-functional team' },
  { key: 'D2', label: 'Problem Description',    icon: 'bi-chat-square-text-fill', desc: '5W2H structured problem definition' },
  { key: 'D3', label: 'Containment Actions',    icon: 'bi-shield-fill-check',     desc: 'Immediate protection of the customer' },
  { key: 'D4', label: 'Root Cause Analysis',    icon: 'bi-diagram-2-fill',        desc: '5-Why & Fishbone investigation' },
  { key: 'D5', label: 'Corrective Actions',     icon: 'bi-wrench-adjustable',     desc: 'Permanent corrective action plan' },
  { key: 'D6', label: 'Implementation & Validation', icon: 'bi-patch-check-fill',  desc: 'Deploy and verify effectiveness' },
  { key: 'D7', label: 'Prevent Recurrence',     icon: 'bi-arrow-repeat',          desc: 'Systemic prevention & PFMEA update' },
  { key: 'D8', label: 'Closure & Recognition',  icon: 'bi-award-fill',            desc: 'Formal closure and team recognition' },
];

@Component({
  selector: 'app-eight-d-workspace',
  standalone: true,
  imports: [CommonModule, DatePipe, ActionCountPipe, CheckedCountPipe],
  template: `
@if (record(); as r) {
<div class="ws-root">

  <!-- ── Top Header Bar ───────────────────────────────────────────────── -->
  <div class="top-bar">
    <div class="top-left">
      <button class="back-btn" (click)="router.navigate(['/quality/8d/list'])">
        <i class="bi bi-arrow-left"></i>
      </button>
      <div class="rec-id-block">
        <span class="rec-id">{{ r.id }}</span>
        <span class="badge-status status-{{ statusClass(r.status) }}">{{ r.status }}</span>
        <span class="badge-sev sev-{{ r.severity.toLowerCase() }}">{{ r.severity }}</span>
        @if (r.isCustomerFacing) {
          <span class="badge-flag flag-cust"><i class="bi bi-person-fill"></i> Customer</span>
        }
        @if (r.isSupplierFacing) {
          <span class="badge-flag flag-supp"><i class="bi bi-truck"></i> Supplier</span>
        }
      </div>
    </div>
    <div class="top-right">
      <div class="ot-indicator ot-{{ r.onTimeStatus }}">
        <i class="bi"
           [class.bi-check-circle-fill]="r.onTimeStatus === 'on-track'"
           [class.bi-exclamation-circle-fill]="r.onTimeStatus === 'at-risk'"
           [class.bi-x-circle-fill]="r.onTimeStatus === 'overdue'"></i>
        {{ r.onTimeStatus | titlecase }}
      </div>
      <div class="top-meta">Due {{ r.dueDate }}</div>
      <div class="top-meta">{{ r.daysOpen }}d open</div>
      <button class="btn-sm-outline" (click)="showActivity.set(!showActivity())">
        <i class="bi bi-clock-history"></i> Activity
      </button>
      @if (r.status === 'Closed' && r.effectiveness) {
        <button class="btn-sm-blue" (click)="router.navigate(['/quality/8d', r.id, 'effectiveness'])">
          <i class="bi bi-shield-check"></i> Effectiveness
        </button>
      }
    </div>
  </div>

  <!-- ── Record Title ──────────────────────────────────────────────────── -->
  <div class="rec-title-bar">
    <div class="rec-title-text">{{ r.title }}</div>
    <div class="rec-meta-row">
      <span class="meta-item"><i class="bi bi-box-seam"></i> {{ r.product }}</span>
      <span class="meta-sep">·</span>
      <span class="meta-item"><i class="bi bi-upc-scan"></i> {{ r.partNumber }}</span>
      @if (r.customer) {
        <span class="meta-sep">·</span>
        <span class="meta-item"><i class="bi bi-building"></i> {{ r.customer }}</span>
      }
      <span class="meta-sep">·</span>
      <span class="meta-item"><i class="bi bi-geo-alt"></i> {{ r.site }}</span>
      <span class="meta-sep">·</span>
      <span class="meta-item"><i class="bi bi-calendar3"></i> Opened {{ r.createdAt }}</span>
    </div>
  </div>

  <!-- ── Progress Bar ──────────────────────────────────────────────────── -->
  <div class="prog-bar-top">
    <div class="prog-steps">
      @for (step of steps; track step.key) {
        <div class="prog-step"
             [class.ps-done]="r.completedSteps.includes(step.key)"
             [class.ps-active]="r.activeStep === step.key"
             [class.ps-future]="!r.completedSteps.includes(step.key) && r.activeStep !== step.key"
             (click)="activeStep.set(step.key)">
          <div class="ps-dot">
            @if (r.completedSteps.includes(step.key)) {
              <i class="bi bi-check-lg"></i>
            } @else if (r.activeStep === step.key) {
              <span class="ps-pulse"></span>
            }
          </div>
          <span class="ps-label">{{ step.key }}</span>
        </div>
        @if (!$last) { <div class="ps-line" [class.ps-line-done]="r.completedSteps.includes(step.key)"></div> }
      }
    </div>
    <div class="prog-pct-wrap">
      <div class="prog-fill-bar">
        <div class="prog-fill" [style.width.%]="r.completionPct"></div>
      </div>
      <span class="prog-pct-lbl">{{ r.completionPct }}% complete</span>
    </div>
  </div>

  <!-- ── Main Layout ───────────────────────────────────────────────────── -->
  <div class="main-layout">

    <!-- Left Step Sidebar -->
    <aside class="step-sidebar">
      @for (step of steps; track step.key) {
        <button class="step-item"
                [class.si-done]="r.completedSteps.includes(step.key)"
                [class.si-active]="activeStep() === step.key"
                [class.si-future]="!r.completedSteps.includes(step.key) && r.activeStep !== step.key && activeStep() !== step.key"
                (click)="activeStep.set(step.key)">
          <div class="si-icon-wrap">
            @if (r.completedSteps.includes(step.key)) {
              <i class="bi bi-check-circle-fill si-check"></i>
            } @else if (r.activeStep === step.key) {
              <i class="bi" [ngClass]="step.icon" style="color:#2563EB"></i>
            } @else {
              <i class="bi" [ngClass]="step.icon" style="color:#CBD5E1"></i>
            }
          </div>
          <div class="si-text">
            <span class="si-key">{{ step.key }}</span>
            <span class="si-label">{{ step.label }}</span>
          </div>
          @if (r.activeStep === step.key) {
            <span class="si-active-pill">Active</span>
          }
        </button>
      }

      <div class="sidebar-divider"></div>

      <button class="si-aux" (click)="activeStep.set('traceability')">
        <i class="bi bi-link-45deg"></i> Traceability
        @if (r.linkedRecords.length) {
          <span class="si-count">{{ r.linkedRecords.length }}</span>
        }
      </button>
      <button class="si-aux" (click)="activeStep.set('attachments')">
        <i class="bi bi-paperclip"></i> Attachments
        @if (r.attachments.length) {
          <span class="si-count">{{ r.attachments.length }}</span>
        }
      </button>
      <button class="si-aux" (click)="activeStep.set('activity')">
        <i class="bi bi-clock-history"></i> Activity Log
      </button>
    </aside>

    <!-- Right Content Panel -->
    <div class="content-panel">

      <!-- ── D1: Team Formation ── -->
      @if (activeStep() === 'D1') {
        <div class="step-content">
          <div class="step-hdr">
            <div class="step-hdr-left">
              <span class="step-badge">D1</span>
              <div>
                <h2 class="step-title">Team Formation</h2>
                <p class="step-desc">Cross-functional team assembled per IATF 16949 §10.2.2</p>
              </div>
            </div>
            <div class="step-status-wrap">
              @if (r.completedSteps.includes('D1')) {
                <span class="completed-chip"><i class="bi bi-check-circle-fill"></i> Complete</span>
              } @else if (r.activeStep === 'D1') {
                <span class="active-chip"><i class="bi bi-play-circle-fill"></i> In Progress</span>
              }
            </div>
          </div>
          @if (r.d1; as d1) {
            <div class="d1-grid">
              <div class="info-card">
                <div class="ic-label">Team Leader</div>
                <div class="ic-person">
                  <span class="av" [style.background]="d1.teamLeaderColor">{{ d1.teamLeaderInitials }}</span>
                  <div>
                    <div class="ic-name">{{ d1.teamLeader }}</div>
                    <div class="ic-role">Team Leader · Quality</div>
                  </div>
                </div>
              </div>
              <div class="info-card">
                <div class="ic-label">Champion / Sponsor</div>
                <div class="ic-person">
                  <span class="av" [style.background]="d1.championColor">{{ d1.championInitials }}</span>
                  <div>
                    <div class="ic-name">{{ d1.champion }}</div>
                    <div class="ic-role">Champion · Management</div>
                  </div>
                </div>
              </div>
              <div class="info-card">
                <div class="ic-label">Team Formed</div>
                <div class="ic-value">{{ d1.formedAt }}</div>
                <div class="ic-sub">{{ d1.members.length + 2 }} members total</div>
              </div>
            </div>

            <div class="section-title">Team Members</div>
            <div class="team-table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Responsibility</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="person-cell">
                        <span class="av-sm" [style.background]="d1.teamLeaderColor">{{ d1.teamLeaderInitials }}</span>
                        {{ d1.teamLeader }}
                      </div>
                    </td>
                    <td><span class="role-badge role-lead">Team Leader</span></td>
                    <td>Quality</td>
                    <td>Overall 8D coordination, customer communication, sign-off</td>
                    <td class="email-cell">{{ d1.teamLeader.toLowerCase().replace(' ', '.') }}&#64;qualvora.com</td>
                  </tr>
                  <tr>
                    <td>
                      <div class="person-cell">
                        <span class="av-sm" [style.background]="d1.championColor">{{ d1.championInitials }}</span>
                        {{ d1.champion }}
                      </div>
                    </td>
                    <td><span class="role-badge role-champ">Champion</span></td>
                    <td>Management</td>
                    <td>Resource allocation, escalation authority, final closure approval</td>
                    <td class="email-cell">{{ d1.champion.toLowerCase().replace(' ', '.') }}&#64;qualvora.com</td>
                  </tr>
                  @for (m of d1.members; track m.id) {
                    <tr>
                      <td>
                        <div class="person-cell">
                          <span class="av-sm" [style.background]="m.color">{{ m.initials }}</span>
                          {{ m.name }}
                        </div>
                      </td>
                      <td><span class="role-badge">{{ m.role }}</span></td>
                      <td>{{ m.department }}</td>
                      <td>{{ roleResponsibility(m.role) }}</td>
                      <td class="email-cell">{{ m.email }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="not-started-msg">
              <i class="bi bi-hourglass" style="font-size:24px;color:#CBD5E1"></i>
              <p>D1 Team Formation has not been initiated yet.</p>
            </div>
          }
        </div>
      }

      <!-- ── D2: Problem Description ── -->
      @if (activeStep() === 'D2') {
        <div class="step-content">
          <div class="step-hdr">
            <div class="step-hdr-left">
              <span class="step-badge">D2</span>
              <div>
                <h2 class="step-title">Problem Description</h2>
                <p class="step-desc">Structured 5W2H analysis — quantify the problem in measurable terms</p>
              </div>
            </div>
            <div class="step-status-wrap">
              @if (r.completedSteps.includes('D2')) {
                <span class="completed-chip"><i class="bi bi-check-circle-fill"></i> Complete</span>
              }
            </div>
          </div>
          @if (r.d2; as d2) {
            <div class="section-title">5W2H Analysis</div>
            <div class="fivew-grid">
              <div class="fivew-card">
                <div class="fw-label"><span class="fw-tag">WHAT</span> Defect Description</div>
                <div class="fw-value">{{ d2.what }}</div>
              </div>
              <div class="fivew-card">
                <div class="fw-label"><span class="fw-tag">WHERE</span> Detection Location</div>
                <div class="fw-value">{{ d2.where }}</div>
              </div>
              <div class="fivew-card">
                <div class="fw-label"><span class="fw-tag">WHEN</span> First Detected</div>
                <div class="fw-value">{{ d2.when }}</div>
              </div>
              <div class="fivew-card">
                <div class="fw-label"><span class="fw-tag">WHO</span> Reported By</div>
                <div class="fw-value">{{ d2.who }}</div>
              </div>
              <div class="fivew-card">
                <div class="fw-label"><span class="fw-tag">HOW MANY</span> Quantity Affected</div>
                <div class="fw-value">{{ d2.howMany }}</div>
              </div>
              <div class="fivew-card">
                <div class="fw-label"><span class="fw-tag">HOW OFTEN</span> Frequency</div>
                <div class="fw-value">{{ d2.howOften }}</div>
              </div>
            </div>

            <div class="section-title">Impact Assessment</div>
            <div class="impact-card">{{ d2.impact }}</div>

            <div class="section-title">Problem Statement (Is/Is-Not)</div>
            <div class="ps-card">{{ d2.problemStatement }}</div>

            @if (d2.customerReference) {
              <div class="section-title">Customer Reference</div>
              <div class="ref-chip"><i class="bi bi-link-45deg"></i> {{ d2.customerReference }}</div>
            }

            @if (d2.attachments.length) {
              <div class="section-title">Evidence & Attachments (D2)</div>
              <div class="attach-list">
                @for (a of d2.attachments; track a.id) {
                  <div class="attach-item">
                    <i class="bi" [ngClass]="attachIcon(a.type)"></i>
                    <div class="att-info">
                      <span class="att-name">{{ a.name }}</span>
                      <span class="att-meta">{{ a.size }} · Uploaded by {{ a.uploadedBy }} on {{ a.uploadedAt }}</span>
                    </div>
                    <button class="btn-dl"><i class="bi bi-download"></i></button>
                  </div>
                }
              </div>
            }
          } @else {
            <div class="not-started-msg">
              <i class="bi bi-hourglass" style="font-size:24px;color:#CBD5E1"></i>
              <p>D2 Problem Description has not been initiated yet.</p>
            </div>
          }
        </div>
      }

      <!-- ── D3: Containment ── -->
      @if (activeStep() === 'D3') {
        <div class="step-content">
          <div class="step-hdr">
            <div class="step-hdr-left">
              <span class="step-badge">D3</span>
              <div>
                <h2 class="step-title">Containment Actions</h2>
                <p class="step-desc">Immediate actions to protect the customer and isolate suspect inventory</p>
              </div>
            </div>
            <div class="step-status-wrap">
              @if (r.completedSteps.includes('D3')) {
                <span class="completed-chip"><i class="bi bi-check-circle-fill"></i> Complete</span>
              } @else if (r.activeStep === 'D3') {
                <span class="active-chip"><i class="bi bi-play-circle-fill"></i> In Progress</span>
              }
            </div>
          </div>
          @if (r.d3; as d3) {
            <div class="metrics-row">
              <div class="metric-card">
                <div class="mc-icon mc-red"><i class="bi bi-boxes"></i></div>
                <div>
                  <div class="mc-label">Affected Inventory</div>
                  <div class="mc-val">{{ d3.affectedInventoryQty }} units</div>
                </div>
              </div>
              <div class="metric-card">
                <div class="mc-icon mc-amber"><i class="bi bi-lock-fill"></i></div>
                <div>
                  <div class="mc-label">Blocked / Quarantined</div>
                  <div class="mc-val">{{ d3.blockedInventoryQty }} units</div>
                </div>
              </div>
              <div class="metric-card">
                <div class="mc-icon mc-orange"><i class="bi bi-truck"></i></div>
                <div>
                  <div class="mc-label">Shipments Held</div>
                  <div class="mc-val">{{ d3.customerShipmentsHeld }} shipment{{ d3.customerShipmentsHeld !== 1 ? 's' : '' }}</div>
                </div>
              </div>
              @if (d3.containmentEffective !== undefined) {
                <div class="metric-card">
                  <div class="mc-icon" [class.mc-green]="d3.containmentEffective" [class.mc-red]="!d3.containmentEffective">
                    <i class="bi" [class.bi-shield-fill-check]="d3.containmentEffective" [class.bi-shield-fill-x]="!d3.containmentEffective"></i>
                  </div>
                  <div>
                    <div class="mc-label">Containment Effective</div>
                    <div class="mc-val">{{ d3.containmentEffective ? 'Yes — Verified' : 'No — Reopen' }}</div>
                  </div>
                </div>
              }
            </div>

            <div class="section-title">Containment Action Register</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Action</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th>Due Date</th>
                  <th>Completed</th>
                  <th>Status</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                @for (c of d3.actions; track c.id; let i = $index) {
                  <tr>
                    <td class="idx-cell">{{ i + 1 }}</td>
                    <td class="action-cell">{{ c.action }}</td>
                    <td><span class="type-chip">{{ c.type }}</span></td>
                    <td>
                      <div class="person-cell">
                        <span class="av-sm" [style.background]="c.ownerColor">{{ c.ownerInitials }}</span>
                        {{ c.owner.split(' ')[0] }}
                      </div>
                    </td>
                    <td class="date-cell">{{ c.dueDate }}</td>
                    <td class="date-cell">{{ c.completedDate ?? '—' }}</td>
                    <td><span class="ca-status" [class.ca-verified]="c.status === 'Verified'" [class.ca-complete]="c.status === 'Complete'" [class.ca-open]="c.status === 'Open'">{{ c.status }}</span></td>
                    <td class="evidence-cell">{{ c.evidence ?? '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>

            @if (d3.effectivenessNote) {
              <div class="info-note mt-12">
                <i class="bi bi-info-circle-fill" style="color:#0891B2"></i>
                {{ d3.effectivenessNote }}
              </div>
            }
          } @else {
            <div class="not-started-msg">
              <i class="bi bi-hourglass" style="font-size:24px;color:#CBD5E1"></i>
              <p>D3 Containment has not been initiated yet.</p>
            </div>
          }
        </div>
      }

      <!-- ── D4: Root Cause Analysis ── -->
      @if (activeStep() === 'D4') {
        <div class="step-content">
          <div class="step-hdr">
            <div class="step-hdr-left">
              <span class="step-badge">D4</span>
              <div>
                <h2 class="step-title">Root Cause Analysis</h2>
                <p class="step-desc">Identify and verify the root cause using 5-Why and/or Fishbone analysis</p>
              </div>
            </div>
            <div class="step-status-wrap">
              @if (r.completedSteps.includes('D4')) {
                <span class="completed-chip"><i class="bi bi-check-circle-fill"></i> Complete</span>
              } @else if (r.activeStep === 'D4') {
                <span class="active-chip"><i class="bi bi-play-circle-fill"></i> In Progress</span>
              }
            </div>
          </div>
          @if (r.d4; as d4) {
            <div class="method-badge-row">
              <span class="method-badge"><i class="bi bi-diagram-2"></i> Method: {{ d4.method }}</span>
              @if (d4.rootCauseCategory) {
                <span class="rcc-badge"><i class="bi bi-tag"></i> {{ d4.rootCauseCategory }}</span>
              }
              @if (d4.verifiedBy) {
                <span class="verified-badge"><i class="bi bi-person-check"></i> Verified by {{ d4.verifiedBy }} on {{ d4.verifiedAt }}</span>
              }
            </div>

            @if (d4.whyRows.length > 0) {
              <div class="section-title">5-Why Analysis</div>
              <div class="why-chain">
                @for (w of d4.whyRows; track w.level) {
                  <div class="why-row">
                    <div class="why-num">Why {{ w.level }}</div>
                    <div class="why-content">
                      <div class="why-q">{{ w.why }}</div>
                      <div class="why-a">{{ w.answer }}</div>
                    </div>
                    @if (!$last) { <div class="why-arrow"><i class="bi bi-arrow-down"></i></div> }
                  </div>
                }
              </div>
            }

            @if (d4.fishbone) {
              @let fb = d4.fishbone;
              @let hasFishboneData = fb.man.length || fb.machine.length || fb.method.length || fb.material.length || fb.measurement.length || fb.environment.length;
              @if (hasFishboneData) {
                <div class="section-title">Fishbone (Ishikawa) Diagram — Cause Categories</div>
                <div class="fishbone-grid">
                  @for (cat of fishboneCategories; track cat.key) {
                    @let causes = getFishboneCauses(d4.fishbone, cat.key);
                    @if (causes.length) {
                      <div class="fb-category" [class.fb-has-root]="fbCategoryHasRoot(causes)">
                        <div class="fb-cat-header">
                          <i class="bi" [ngClass]="cat.icon"></i> {{ cat.label }}
                        </div>
                        <ul class="fb-causes">
                          @for (c of causes; track c.id) {
                            <li [class.fb-root]="c.isRoot">
                              @if (c.isRoot) { <i class="bi bi-star-fill" style="color:#F59E0B;font-size:10px"></i> }
                              {{ c.text }}
                            </li>
                          }
                        </ul>
                      </div>
                    }
                  }
                </div>
              }
            }

            <div class="section-title">Root Cause Statement</div>
            <div class="rca-statement">{{ d4.rootCauseStatement }}</div>

            <div class="section-title">Escape Point Analysis</div>
            <div class="escape-grid">
              <div class="info-card">
                <div class="ic-label">Escape Point</div>
                <div class="ic-value">{{ d4.escapePoint }}</div>
              </div>
              <div class="info-card">
                <div class="ic-label">Escape Root Cause</div>
                <div class="ic-value">{{ d4.escapeRootCause }}</div>
              </div>
            </div>
          } @else {
            <div class="not-started-msg">
              <i class="bi bi-hourglass" style="font-size:24px;color:#CBD5E1"></i>
              <p>D4 Root Cause Analysis has not been initiated yet.</p>
              <p class="ns-hint">Complete D3 Containment Actions first.</p>
            </div>
          }
        </div>
      }

      <!-- ── D5: Corrective Actions ── -->
      @if (activeStep() === 'D5') {
        <div class="step-content">
          <div class="step-hdr">
            <div class="step-hdr-left">
              <span class="step-badge">D5</span>
              <div>
                <h2 class="step-title">Corrective Actions</h2>
                <p class="step-desc">Permanent corrective actions to eliminate the root cause</p>
              </div>
            </div>
            <div class="step-status-wrap">
              @if (r.completedSteps.includes('D5')) {
                <span class="completed-chip"><i class="bi bi-check-circle-fill"></i> Complete</span>
              } @else if (r.activeStep === 'D5') {
                <span class="active-chip"><i class="bi bi-play-circle-fill"></i> In Progress</span>
              }
            </div>
          </div>
          @if (r.d5; as d5) {
            <div class="action-summary">
              <span>{{ d5.actions.length }} total actions</span>
              <span class="sep">·</span>
              <span class="ac-stat ac-open">{{ d5.actions | actionCount:'Open' }} Open</span>
              <span class="sep">·</span>
              <span class="ac-stat ac-progress">{{ d5.actions | actionCount:'In Progress' }} In Progress</span>
              <span class="sep">·</span>
              <span class="ac-stat ac-done">{{ d5.actions | actionCount:'Complete' }} Complete</span>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Action Description</th>
                  <th>Priority</th>
                  <th>Owner</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                @for (a of d5.actions; track a.id; let i = $index) {
                  <tr>
                    <td class="idx-cell">{{ i + 1 }}</td>
                    <td class="action-cell">{{ a.description }}</td>
                    <td><span class="pri-badge pri-{{ a.priority.toLowerCase() }}">{{ a.priority }}</span></td>
                    <td>
                      <div class="person-cell">
                        <span class="av-sm" [style.background]="a.ownerColor">{{ a.ownerInitials }}</span>
                        {{ a.owner.split(' ')[0] }}
                      </div>
                    </td>
                    <td class="date-cell">{{ a.dueDate }}</td>
                    <td><span class="as-badge as-{{ a.status.toLowerCase().replace(' ', '-') }}">{{ a.status }}</span></td>
                    <td class="evidence-cell">{{ a.evidence ?? '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="not-started-msg">
              <i class="bi bi-hourglass" style="font-size:24px;color:#CBD5E1"></i>
              <p>D5 Corrective Actions have not been defined yet.</p>
              <p class="ns-hint">Verify root cause in D4 before defining permanent actions.</p>
            </div>
          }
        </div>
      }

      <!-- ── D6: Implementation & Validation ── -->
      @if (activeStep() === 'D6') {
        <div class="step-content">
          <div class="step-hdr">
            <div class="step-hdr-left">
              <span class="step-badge">D6</span>
              <div>
                <h2 class="step-title">Implementation &amp; Validation</h2>
                <p class="step-desc">Deploy corrective actions and verify effectiveness through objective evidence</p>
              </div>
            </div>
            <div class="step-status-wrap">
              @if (r.completedSteps.includes('D6')) {
                <span class="completed-chip"><i class="bi bi-check-circle-fill"></i> Complete</span>
              } @else if (r.activeStep === 'D6') {
                <span class="active-chip"><i class="bi bi-play-circle-fill"></i> In Progress</span>
              }
            </div>
          </div>
          @if (r.d6; as d6) {
            <div class="d6-header-row">
              @if (d6.implementationDate) {
                <div class="info-card">
                  <div class="ic-label">Implementation Date</div>
                  <div class="ic-value">{{ d6.implementationDate }}</div>
                </div>
              }
              @if (d6.overallResult) {
                <div class="info-card">
                  <div class="ic-label">Overall Validation Result</div>
                  <div class="ic-value result-{{ d6.overallResult.toLowerCase() }}">{{ d6.overallResult }}</div>
                </div>
              }
              @if (d6.approvedBy) {
                <div class="info-card">
                  <div class="ic-label">Approved By</div>
                  <div class="ic-value">{{ d6.approvedBy }}</div>
                  <div class="ic-sub">{{ d6.approvedAt }}</div>
                </div>
              }
            </div>

            <div class="section-title">Validation Methods</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Validation Method</th>
                  <th>Description</th>
                  <th>Owner</th>
                  <th>Due Date</th>
                  <th>Result</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                @for (v of d6.validations; track v.id; let i = $index) {
                  <tr>
                    <td class="idx-cell">{{ i + 1 }}</td>
                    <td><span class="method-chip">{{ v.method }}</span></td>
                    <td class="action-cell">{{ v.description }}</td>
                    <td>
                      <div class="person-cell">
                        <span class="av-sm" [style.background]="v.ownerColor">{{ v.ownerInitials }}</span>
                        {{ v.owner.split(' ')[0] }}
                      </div>
                    </td>
                    <td class="date-cell">{{ v.dueDate }}</td>
                    <td><span class="result-badge res-{{ v.result.toLowerCase() }}">{{ v.result }}</span></td>
                    <td class="notes-cell">{{ v.notes ?? '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="not-started-msg">
              <i class="bi bi-hourglass" style="font-size:24px;color:#CBD5E1"></i>
              <p>D6 Validation has not been initiated yet.</p>
            </div>
          }
        </div>
      }

      <!-- ── D7: Prevent Recurrence ── -->
      @if (activeStep() === 'D7') {
        <div class="step-content">
          <div class="step-hdr">
            <div class="step-hdr-left">
              <span class="step-badge">D7</span>
              <div>
                <h2 class="step-title">Prevent Recurrence</h2>
                <p class="step-desc">Update PFMEA, control plan, work instructions, and training records</p>
              </div>
            </div>
            <div class="step-status-wrap">
              @if (r.completedSteps.includes('D7')) {
                <span class="completed-chip"><i class="bi bi-check-circle-fill"></i> Complete</span>
              } @else if (r.activeStep === 'D7') {
                <span class="active-chip"><i class="bi bi-play-circle-fill"></i> In Progress</span>
              }
            </div>
          </div>
          @if (r.d7; as d7) {
            <div class="d7-progress-wrap">
              <div class="d7-pct-label">{{ d7.completionPct }}% Systemic Actions Complete</div>
              <div class="d7-prog-bar">
                <div class="d7-prog-fill" [style.width.%]="d7.completionPct"></div>
              </div>
              <div class="d7-counts">
                {{ d7.items | checkedCount }} of {{ d7.items.length }} items completed
              </div>
            </div>

            <div class="section-title">Prevention Checklist</div>
            <div class="checklist">
              @for (item of d7.items; track item.id) {
                <div class="cl-item" [class.cl-done]="item.checked">
                  <div class="cl-check">
                    @if (item.checked) {
                      <i class="bi bi-check-circle-fill cl-checked"></i>
                    } @else {
                      <i class="bi bi-circle cl-unchecked"></i>
                    }
                  </div>
                  <div class="cl-body">
                    <div class="cl-label">{{ item.label }}</div>
                    @if (item.owner) {
                      <div class="cl-meta">
                        Owner: {{ item.owner }}
                        @if (item.completedDate) { · Completed {{ item.completedDate }} }
                      </div>
                    }
                    @if (item.evidence) {
                      <div class="cl-evidence"><i class="bi bi-paperclip"></i> {{ item.evidence }}</div>
                    }
                  </div>
                </div>
              }
            </div>

            @if (d7.lessonsLearned) {
              <div class="section-title">Lessons Learned</div>
              <div class="ll-card">{{ d7.lessonsLearned }}</div>
            }

            @if (d7.horizontalDeployment) {
              <div class="section-title">Horizontal Deployment</div>
              <div class="info-note">
                <i class="bi bi-arrow-left-right" style="color:#0891B2"></i>
                {{ d7.horizontalDeployment }}
              </div>
            }
          } @else {
            <div class="not-started-msg">
              <i class="bi bi-hourglass" style="font-size:24px;color:#CBD5E1"></i>
              <p>D7 Systemic Prevention has not been initiated yet.</p>
            </div>
          }
        </div>
      }

      <!-- ── D8: Closure ── -->
      @if (activeStep() === 'D8') {
        <div class="step-content">
          <div class="step-hdr">
            <div class="step-hdr-left">
              <span class="step-badge d8-badge">D8</span>
              <div>
                <h2 class="step-title">Closure &amp; Team Recognition</h2>
                <p class="step-desc">Formal 8D closure with customer acceptance and team acknowledgement</p>
              </div>
            </div>
            <div class="step-status-wrap">
              @if (r.status === 'Closed') {
                <span class="closed-chip"><i class="bi bi-award-fill"></i> Closed</span>
              } @else if (r.status === 'Pending Closure') {
                <span class="pending-chip"><i class="bi bi-hourglass-split"></i> Pending Closure</span>
              }
            </div>
          </div>
          @if (r.d8; as d8) {
            <div class="d8-grid">
              <div class="info-card span2">
                <div class="ic-label">Closure Summary</div>
                <div class="ic-value ic-multiline">{{ d8.closureSummary }}</div>
              </div>
              <div class="info-card">
                <div class="ic-label">Customer Approval</div>
                <div class="ic-value">
                  <span class="cust-approval" [class.ca-approved]="d8.customerApproval === 'Approved'"
                        [class.ca-pending]="d8.customerApproval === 'Pending'"
                        [class.ca-na]="d8.customerApproval === 'Not Required'">
                    <i class="bi" [class.bi-check-circle-fill]="d8.customerApproval === 'Approved'"
                                  [class.bi-clock]="d8.customerApproval === 'Pending'"
                                  [class.bi-dash-circle]="d8.customerApproval === 'Not Required'"></i>
                    {{ d8.customerApproval }}
                  </span>
                </div>
                @if (d8.customerApprovedBy) {
                  <div class="ic-sub">{{ d8.customerApprovedBy }} · {{ d8.customerApprovedAt }}</div>
                }
              </div>
              <div class="info-card">
                <div class="ic-label">Closure Date</div>
                <div class="ic-value">{{ d8.closedAt ?? 'Pending' }}</div>
                @if (d8.closedBy) { <div class="ic-sub">Closed by {{ d8.closedBy }}</div> }
              </div>
            </div>

            @if (d8.lessonsLearned) {
              <div class="section-title">Lessons Learned</div>
              <div class="ll-card">{{ d8.lessonsLearned }}</div>
            }

            @if (d8.teamCelebrated) {
              <div class="recognition-banner">
                <i class="bi bi-award-fill" style="font-size:24px;color:#F59E0B"></i>
                <div>
                  <div class="rec-title">Team Recognition</div>
                  @if (d8.recognitionNotes) {
                    <div class="rec-note">{{ d8.recognitionNotes }}</div>
                  } @else {
                    <div class="rec-note">The team successfully resolved this 8D and has been formally recognised.</div>
                  }
                </div>
              </div>
            }

            @if (r.effectiveness) {
              <div class="section-title">Effectiveness Verification</div>
              <div class="eff-card eff-{{ r.effectiveness.result.toLowerCase() }}">
                <div class="eff-left">
                  <i class="bi" [class.bi-shield-fill-check]="r.effectiveness.result === 'Pass'"
                                [class.bi-shield-fill-x]="r.effectiveness.result === 'Fail'"></i>
                  <div>
                    <div class="eff-result">{{ r.effectiveness.result }} — No Recurrence</div>
                    <div class="eff-meta">Verified by {{ r.effectiveness.auditor }} on {{ r.effectiveness.verificationDate }}</div>
                    <div class="eff-meta">Method: {{ r.effectiveness.method }}</div>
                  </div>
                </div>
                <button class="btn-sm-blue" (click)="router.navigate(['/quality/8d', r.id, 'effectiveness'])">
                  Full Report <i class="bi bi-arrow-right"></i>
                </button>
              </div>
            }
          } @else {
            <div class="not-started-msg">
              <i class="bi bi-hourglass" style="font-size:24px;color:#CBD5E1"></i>
              <p>D8 Closure has not been initiated yet.</p>
              <p class="ns-hint">Complete all D1–D7 disciplines before initiating closure.</p>
            </div>
          }
        </div>
      }

      <!-- ── Traceability ── -->
      @if (activeStep() === 'traceability') {
        <div class="step-content">
          <div class="step-hdr">
            <div class="step-hdr-left">
              <i class="bi bi-link-45deg" style="font-size:24px;color:#2563EB"></i>
              <div>
                <h2 class="step-title">Traceability</h2>
                <p class="step-desc">All records linked to this 8D problem resolution report</p>
              </div>
            </div>
          </div>
          @if (r.linkedRecords.length) {
            <div class="linked-list">
              @for (lr of r.linkedRecords; track lr.id) {
                <div class="linked-item" (click)="router.navigate([lr.route])">
                  <div class="lr-left">
                    <span class="lr-type-badge lt-{{ lr.type.toLowerCase().replace(' ', '-') }}">
                      <i class="bi" [ngClass]="linkedRecordIcon(lr.type)"></i> {{ lr.type }}
                    </span>
                    <div class="lr-info">
                      <span class="lr-id">{{ lr.id }}</span>
                      <span class="lr-title">{{ lr.title }}</span>
                    </div>
                  </div>
                  <div class="lr-right">
                    <span class="lr-status">{{ lr.status }}</span>
                    <i class="bi bi-arrow-right" style="color:#94A3B8"></i>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="not-started-msg">
              <i class="bi bi-link-45deg" style="font-size:24px;color:#CBD5E1"></i>
              <p>No linked records yet.</p>
            </div>
          }
        </div>
      }

      <!-- ── Attachments ── -->
      @if (activeStep() === 'attachments') {
        <div class="step-content">
          <div class="step-hdr">
            <div class="step-hdr-left">
              <i class="bi bi-paperclip" style="font-size:24px;color:#2563EB"></i>
              <div>
                <h2 class="step-title">Attachments</h2>
                <p class="step-desc">All files attached to this 8D report</p>
              </div>
            </div>
          </div>
          @if (r.attachments.length) {
            <div class="attach-list">
              @for (a of r.attachments; track a.id) {
                <div class="attach-item">
                  <i class="bi attach-icon" [ngClass]="attachIcon(a.type)"></i>
                  <div class="att-info">
                    <span class="att-name">{{ a.name }}</span>
                    <span class="att-meta">{{ a.size }} · Uploaded by {{ a.uploadedBy }} on {{ a.uploadedAt }}</span>
                  </div>
                  <span class="att-type">{{ a.type }}</span>
                  <button class="btn-dl"><i class="bi bi-download"></i></button>
                </div>
              }
            </div>
          } @else {
            <div class="not-started-msg">
              <i class="bi bi-paperclip" style="font-size:24px;color:#CBD5E1"></i>
              <p>No attachments yet.</p>
            </div>
          }
        </div>
      }

      <!-- ── Activity Log ── -->
      @if (activeStep() === 'activity') {
        <div class="step-content">
          <div class="step-hdr">
            <div class="step-hdr-left">
              <i class="bi bi-clock-history" style="font-size:24px;color:#2563EB"></i>
              <div>
                <h2 class="step-title">Activity Log</h2>
                <p class="step-desc">Complete timeline of actions taken on this 8D report</p>
              </div>
            </div>
          </div>
          <div class="timeline">
            @for (ev of r.activity; track ev.id; let last = $last) {
              <div class="tl-item">
                <div class="tl-left">
                  <span class="tl-av" [style.background]="ev.actorColor">{{ ev.actorInitials }}</span>
                  @if (!last) { <div class="tl-line"></div> }
                </div>
                <div class="tl-body">
                  <div class="tl-action">{{ ev.action }}
                    @if (ev.discipline) {
                      <span class="tl-disc">{{ ev.discipline }}</span>
                    }
                  </div>
                  <div class="tl-actor">{{ ev.actor }} · {{ ev.timeAgo }}</div>
                  @if (ev.detail) { <div class="tl-detail">{{ ev.detail }}</div> }
                </div>
              </div>
            }
          </div>
        </div>
      }

    </div><!-- /content-panel -->
  </div><!-- /main-layout -->

  <!-- ── Slide-in Activity Drawer ─────────────────────────────────────── -->
  @if (showActivity()) {
    <div class="drawer-overlay" (click)="showActivity.set(false)"></div>
    <div class="activity-drawer">
      <div class="drawer-header">
        <span class="drawer-title">Activity Log</span>
        <button class="drawer-close" (click)="showActivity.set(false)"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="timeline drawer-timeline">
        @for (ev of r.activity; track ev.id; let last = $last) {
          <div class="tl-item">
            <div class="tl-left">
              <span class="tl-av" [style.background]="ev.actorColor">{{ ev.actorInitials }}</span>
              @if (!last) { <div class="tl-line"></div> }
            </div>
            <div class="tl-body">
              <div class="tl-action">{{ ev.action }}</div>
              <div class="tl-actor">{{ ev.actor }} · {{ ev.timeAgo }}</div>
              @if (ev.detail) { <div class="tl-detail">{{ ev.detail }}</div> }
            </div>
          </div>
        }
      </div>
    </div>
  }

</div>
} @else {
  <div class="not-found">
    <i class="bi bi-exclamation-circle" style="font-size:32px;color:#CBD5E1"></i>
    <p>8D record not found.</p>
    <button class="btn-primary" (click)="router.navigate(['/quality/8d/list'])">Back to Register</button>
  </div>
}
  `,
  styles: [`
    /* ── Layout ─── */
    .ws-root {
      background: #F8FAFC; min-height: 100vh;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      display: flex; flex-direction: column;
    }

    /* Top bar */
    .top-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 20px; background: #fff; border-bottom: 1px solid #E2E8F0;
      flex-wrap: wrap; gap: 8px; position: sticky; top: 0; z-index: 100;
    }
    .top-left { display: flex; align-items: center; gap: 10px; }
    .back-btn {
      width: 30px; height: 30px; border-radius: 7px; border: 1px solid #E2E8F0;
      background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 14px; color: #374151; transition: background 0.15s;
    }
    .back-btn:hover { background: #F1F5F9; }
    .rec-id-block { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .rec-id {
      font-size: 13px; font-weight: 700; color: #2563EB;
      font-family: 'JetBrains Mono', monospace;
    }
    .badge-status { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
    .status-open     { background: #DBEAFE; color: #1D4ED8; }
    .status-draft    { background: #F1F5F9; color: #64748B; }
    .status-pending  { background: #FEF3C7; color: #92400E; }
    .status-closed   { background: #D1FAE5; color: #065F46; }
    .badge-sev { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
    .sev-critical { background: #FEE2E2; color: #991B1B; }
    .sev-major    { background: #FEF3C7; color: #92400E; }
    .sev-minor    { background: #DBEAFE; color: #1D4ED8; }
    .badge-flag {
      font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 4px;
      display: flex; align-items: center; gap: 4px;
    }
    .flag-cust { background: #CCFBF1; color: #0F766E; }
    .flag-supp { background: #F0FDF4; color: #166534; }
    .top-right { display: flex; align-items: center; gap: 10px; }
    .ot-indicator {
      font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 5px;
    }
    .ot-on-track { color: #059669; }
    .ot-at-risk  { color: #B45309; }
    .ot-overdue  { color: #DC2626; }
    .top-meta { font-size: 12px; color: #64748B; }
    .btn-sm-outline {
      background: #fff; border: 1px solid #E2E8F0; border-radius: 6px;
      padding: 5px 10px; font-size: 12px; font-weight: 500; color: #374151;
      cursor: pointer; display: flex; align-items: center; gap: 5px; transition: background 0.15s;
    }
    .btn-sm-outline:hover { background: #F1F5F9; }
    .btn-sm-blue {
      background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px;
      padding: 5px 10px; font-size: 12px; font-weight: 600; color: #2563EB;
      cursor: pointer; display: flex; align-items: center; gap: 5px; transition: background 0.15s;
    }
    .btn-sm-blue:hover { background: #DBEAFE; }

    /* Record title */
    .rec-title-bar { padding: 14px 20px 10px; background: #fff; border-bottom: 1px solid #F1F5F9; }
    .rec-title-text { font-size: 16px; font-weight: 700; color: #0F172A; margin-bottom: 4px; }
    .rec-meta-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .meta-item { font-size: 12px; color: #64748B; display: flex; align-items: center; gap: 4px; }
    .meta-sep { color: #CBD5E1; }

    /* Progress bar */
    .prog-bar-top {
      padding: 12px 20px; background: #fff; border-bottom: 1px solid #E2E8F0;
      display: flex; flex-direction: column; gap: 8px;
    }
    .prog-steps { display: flex; align-items: center; gap: 0; }
    .prog-step {
      display: flex; flex-direction: column; align-items: center; gap: 3px;
      cursor: pointer; padding: 0 4px; flex-shrink: 0;
    }
    .ps-dot {
      width: 22px; height: 22px; border-radius: 50%;
      background: #E2E8F0; display: flex; align-items: center; justify-content: center;
      font-size: 10px; color: #fff; position: relative; transition: all 0.2s;
    }
    .ps-done .ps-dot   { background: #10B981; }
    .ps-active .ps-dot { background: #2563EB; box-shadow: 0 0 0 3px #DBEAFE; }
    .ps-pulse {
      width: 8px; height: 8px; border-radius: 50%; background: #fff;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50% { opacity:0.6; transform:scale(1.3); }
    }
    .ps-label { font-size: 10px; font-weight: 700; color: #64748B; }
    .ps-done .ps-label   { color: #059669; }
    .ps-active .ps-label { color: #2563EB; }
    .ps-line { flex: 1; height: 2px; background: #E2E8F0; }
    .ps-line-done { background: #10B981; }
    .prog-pct-wrap { display: flex; align-items: center; gap: 10px; }
    .prog-fill-bar { flex: 1; height: 4px; background: #E2E8F0; border-radius: 99px; overflow: hidden; }
    .prog-fill { height: 100%; background: #2563EB; border-radius: 99px; transition: width 0.4s; }
    .prog-pct-lbl { font-size: 11px; font-weight: 600; color: #64748B; white-space: nowrap; }

    /* Main layout */
    .main-layout { display: flex; flex: 1; gap: 0; min-height: 0; }

    /* Step sidebar */
    .step-sidebar {
      width: 220px; background: #fff; border-right: 1px solid #E2E8F0;
      padding: 12px 8px; display: flex; flex-direction: column; gap: 2px;
      flex-shrink: 0; overflow-y: auto;
    }
    .step-item {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 10px; border-radius: 8px; border: none;
      background: transparent; cursor: pointer; text-align: left; width: 100%;
      transition: background 0.12s; position: relative;
    }
    .step-item:hover { background: #F8FAFC; }
    .si-active { background: #EFF6FF !important; }
    .si-icon-wrap { width: 22px; flex-shrink: 0; font-size: 16px; }
    .si-check { color: #10B981; }
    .si-text { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
    .si-key  { font-size: 10px; font-weight: 700; color: #94A3B8; }
    .si-active .si-key { color: #2563EB; }
    .si-done .si-key   { color: #059669; }
    .si-label { font-size: 12px; font-weight: 500; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .si-active .si-label { color: #2563EB; font-weight: 600; }
    .si-active-pill {
      font-size: 9px; font-weight: 700; background: #2563EB; color: #fff;
      padding: 1px 6px; border-radius: 99px; white-space: nowrap;
    }
    .sidebar-divider { height: 1px; background: #F1F5F9; margin: 6px 0; }
    .si-aux {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 10px; border-radius: 8px; border: none;
      background: transparent; cursor: pointer; font-size: 12px; color: #64748B;
      width: 100%; text-align: left; transition: background 0.12s;
    }
    .si-aux:hover { background: #F8FAFC; }
    .si-count {
      margin-left: auto; background: #E2E8F0; color: #64748B; font-size: 10px;
      font-weight: 700; padding: 1px 6px; border-radius: 99px;
    }

    /* Content panel */
    .content-panel {
      flex: 1; padding: 20px; overflow-y: auto; background: #F8FAFC;
    }
    .step-content { max-width: 900px; }

    /* Step header */
    .step-hdr {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
    }
    .step-hdr-left { display: flex; align-items: flex-start; gap: 12px; }
    .step-badge {
      width: 36px; height: 36px; border-radius: 9px; background: #EFF6FF;
      color: #2563EB; font-size: 13px; font-weight: 800; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0; letter-spacing: -0.5px;
    }
    .d8-badge { background: #FEF3C7; color: #B45309; }
    .step-title { font-size: 17px; font-weight: 700; color: #0F172A; margin: 0; }
    .step-desc  { font-size: 12px; color: #64748B; margin: 2px 0 0; }
    .step-status-wrap { flex-shrink: 0; }
    .completed-chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: #D1FAE5; color: #065F46; font-size: 11px; font-weight: 700;
      padding: 4px 10px; border-radius: 99px;
    }
    .active-chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: #DBEAFE; color: #1D4ED8; font-size: 11px; font-weight: 700;
      padding: 4px 10px; border-radius: 99px;
    }
    .closed-chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: #D1FAE5; color: #065F46; font-size: 11px; font-weight: 700;
      padding: 4px 10px; border-radius: 99px;
    }
    .pending-chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 700;
      padding: 4px 10px; border-radius: 99px;
    }

    /* Section title */
    .section-title {
      font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase;
      letter-spacing: 0.5px; margin: 18px 0 10px;
    }

    /* Info cards */
    .d1-grid, .d6-header-row, .d8-grid, .escape-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 4px;
    }
    .d8-grid .span2 { grid-column: span 2; }
    .info-card {
      background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px;
    }
    .ic-label { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; }
    .ic-person { display: flex; align-items: center; gap: 10px; }
    .ic-name { font-size: 13px; font-weight: 600; color: #0F172A; }
    .ic-role { font-size: 11px; color: #94A3B8; }
    .ic-value { font-size: 14px; font-weight: 600; color: #0F172A; }
    .ic-multiline { font-size: 13px; font-weight: 400; color: #374151; line-height: 1.5; }
    .ic-sub { font-size: 11px; color: #94A3B8; margin-top: 2px; }

    /* Avatars */
    .av {
      width: 36px; height: 36px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0;
    }
    .av-sm {
      width: 24px; height: 24px; border-radius: 50%; display: inline-flex;
      align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #fff; flex-shrink: 0;
    }

    /* Data table */
    .team-table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table th {
      padding: 7px 10px; font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;
      letter-spacing: 0.4px; text-align: left; background: #F8FAFC; border-bottom: 1px solid #E2E8F0;
    }
    .data-table td { padding: 8px 10px; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .person-cell { display: flex; align-items: center; gap: 7px; }
    .role-badge {
      background: #F1F5F9; color: #374151; font-size: 10px; font-weight: 600;
      padding: 2px 7px; border-radius: 4px; white-space: nowrap;
    }
    .role-lead  { background: #EFF6FF; color: #1D4ED8; }
    .role-champ { background: #F0FDF4; color: #166534; }
    .email-cell { font-size: 11px; color: #64748B; }
    .idx-cell { color: #94A3B8; font-size: 11px; width: 28px; }
    .action-cell { max-width: 240px; font-size: 12px; color: #374151; }
    .date-cell { font-size: 11px; color: #64748B; white-space: nowrap; }
    .notes-cell { font-size: 11px; color: #64748B; max-width: 200px; }
    .evidence-cell { font-size: 11px; color: #64748B; max-width: 180px; }
    .type-chip {
      background: #F1F5F9; color: #475569; font-size: 10px; font-weight: 600;
      padding: 2px 7px; border-radius: 4px; white-space: nowrap;
    }
    .method-chip {
      background: #EFF6FF; color: #2563EB; font-size: 10px; font-weight: 600;
      padding: 2px 7px; border-radius: 4px; white-space: nowrap;
    }

    /* Containment status */
    .ca-status { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
    .ca-verified { background: #D1FAE5; color: #065F46; }
    .ca-complete { background: #DBEAFE; color: #1D4ED8; }
    .ca-open     { background: #FEF3C7; color: #92400E; }

    /* Priority */
    .pri-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
    .pri-critical { background: #FEE2E2; color: #991B1B; }
    .pri-high     { background: #FFEDD5; color: #9A3412; }
    .pri-medium   { background: #FEF3C7; color: #92400E; }
    .pri-low      { background: #F0FDF4; color: #166534; }

    /* Action status */
    .as-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
    .as-open     { background: #FEF3C7; color: #92400E; }
    .as-in-progress { background: #DBEAFE; color: #1D4ED8; }
    .as-complete { background: #D1FAE5; color: #065F46; }
    .as-verified { background: #CCFBF1; color: #065F46; }
    .as-overdue  { background: #FEE2E2; color: #991B1B; }

    /* Result badges */
    .result-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
    .res-pass    { background: #D1FAE5; color: #065F46; }
    .res-fail    { background: #FEE2E2; color: #991B1B; }
    .res-pending { background: #F1F5F9; color: #64748B; }
    .result-pass    { color: #059669; font-weight: 700; }
    .result-fail    { color: #DC2626; font-weight: 700; }
    .result-pending { color: #B45309; font-weight: 700; }

    /* 5W2H */
    .fivew-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 4px; }
    .fivew-card {
      background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px;
    }
    .fw-label { font-size: 11px; font-weight: 600; color: #94A3B8; margin-bottom: 5px; display: flex; align-items: center; gap: 6px; }
    .fw-tag { background: #2563EB; color: #fff; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 3px; }
    .fw-value { font-size: 12px; color: #374151; line-height: 1.5; }

    .impact-card { background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #374151; line-height: 1.5; margin-bottom: 4px; }
    .ps-card { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #1E40AF; line-height: 1.5; margin-bottom: 4px; }
    .ref-chip {
      display: inline-flex; align-items: center; gap: 6px;
      background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 6px;
      padding: 5px 12px; font-size: 12px; font-weight: 600; color: #374151;
    }

    /* Metrics row */
    .metrics-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 4px; }
    .metric-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; }
    .mc-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
    .mc-red   { background: #FEE2E2; color: #DC2626; }
    .mc-amber { background: #FEF3C7; color: #B45309; }
    .mc-orange{ background: #FFEDD5; color: #EA580C; }
    .mc-green { background: #D1FAE5; color: #059669; }
    .mc-label { font-size: 11px; color: #94A3B8; font-weight: 500; }
    .mc-val   { font-size: 14px; font-weight: 700; color: #0F172A; }

    /* Root cause */
    .method-badge-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .method-badge { background: #EFF6FF; color: #2563EB; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; display: flex; align-items: center; gap: 5px; }
    .rcc-badge { background: #F5F3FF; color: #7C3AED; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; display: flex; align-items: center; gap: 5px; }
    .verified-badge { background: #D1FAE5; color: #065F46; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; display: flex; align-items: center; gap: 5px; }

    /* 5-Why */
    .why-chain { display: flex; flex-direction: column; gap: 0; }
    .why-row { display: flex; align-items: flex-start; gap: 12px; position: relative; }
    .why-num {
      width: 52px; min-width: 52px; background: #2563EB; color: #fff;
      font-size: 11px; font-weight: 700; padding: 6px 8px; border-radius: 6px;
      text-align: center; margin-top: 10px;
    }
    .why-content { flex: 1; background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 14px; margin: 4px 0; }
    .why-q { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; }
    .why-a { font-size: 13px; color: #0F172A; line-height: 1.5; }
    .why-arrow { width: 52px; min-width: 52px; display: flex; justify-content: center; font-size: 16px; color: #94A3B8; padding: 2px 0; }

    /* Fishbone */
    .fishbone-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
    .fb-category { background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; }
    .fb-has-root { border-color: #F59E0B; }
    .fb-cat-header { font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
    .fb-causes { margin: 0; padding-left: 14px; display: flex; flex-direction: column; gap: 4px; }
    .fb-causes li { font-size: 12px; color: #475569; }
    .fb-root { color: #DC2626; font-weight: 600; display: flex; align-items: center; gap: 5px; }

    .rca-statement {
      background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 8px;
      padding: 14px 16px; font-size: 13px; color: #374151; line-height: 1.6; font-weight: 500;
    }

    /* Action summary */
    .action-summary { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 13px; color: #64748B; }
    .sep { color: #CBD5E1; }
    .ac-stat { font-weight: 600; }
    .ac-open     { color: #B45309; }
    .ac-progress { color: #2563EB; }
    .ac-done     { color: #059669; }

    /* D7 progress */
    .d7-progress-wrap { background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; margin-bottom: 4px; }
    .d7-pct-label { font-size: 13px; font-weight: 600; color: #0F172A; margin-bottom: 8px; }
    .d7-prog-bar { height: 8px; background: #E2E8F0; border-radius: 99px; overflow: hidden; margin-bottom: 6px; }
    .d7-prog-fill { height: 100%; background: #059669; border-radius: 99px; transition: width 0.4s; }
    .d7-counts { font-size: 12px; color: #64748B; }

    /* Checklist */
    .checklist { display: flex; flex-direction: column; gap: 4px; }
    .cl-item { display: flex; align-items: flex-start; gap: 10px; background: #fff; border: 1px solid #E2E8F0; border-radius: 7px; padding: 10px 12px; }
    .cl-done { background: #F0FDF4; border-color: #BBF7D0; }
    .cl-check { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
    .cl-checked   { color: #059669; }
    .cl-unchecked { color: #CBD5E1; }
    .cl-body { flex: 1; }
    .cl-label { font-size: 13px; color: #0F172A; font-weight: 500; }
    .cl-done .cl-label { text-decoration: line-through; color: #64748B; }
    .cl-meta { font-size: 11px; color: #94A3B8; margin-top: 2px; }
    .cl-evidence { font-size: 11px; color: #2563EB; margin-top: 2px; }
    .ll-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #374151; line-height: 1.6; }

    /* D8 */
    .cust-approval { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }
    .ca-approved { color: #059669; }
    .ca-pending  { color: #B45309; }
    .ca-na       { color: #64748B; }

    .recognition-banner {
      display: flex; align-items: flex-start; gap: 14px;
      background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 16px;
    }
    .rec-title { font-size: 14px; font-weight: 700; color: #92400E; }
    .rec-note { font-size: 13px; color: #B45309; margin-top: 4px; line-height: 1.5; }

    .eff-card { display: flex; align-items: center; justify-content: space-between; border-radius: 8px; padding: 14px 16px; gap: 12px; }
    .eff-pass { background: #D1FAE5; border: 1px solid #6EE7B7; }
    .eff-fail { background: #FEE2E2; border: 1px solid #FCA5A5; }
    .eff-pending { background: #F1F5F9; border: 1px solid #E2E8F0; }
    .eff-left { display: flex; align-items: flex-start; gap: 12px; font-size: 22px; color: #059669; }
    .eff-result { font-size: 14px; font-weight: 700; color: #065F46; }
    .eff-meta { font-size: 12px; color: #059669; margin-top: 2px; }

    /* Traceability */
    .linked-list { display: flex; flex-direction: column; gap: 8px; }
    .linked-item {
      display: flex; align-items: center; justify-content: space-between;
      background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px;
      cursor: pointer; transition: background 0.12s;
    }
    .linked-item:hover { background: #F8FAFC; }
    .lr-left { display: flex; align-items: center; gap: 12px; }
    .lr-type-badge {
      font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 4px;
      white-space: nowrap; display: flex; align-items: center; gap: 4px;
    }
    .lt-ncr         { background: #FEE2E2; color: #991B1B; }
    .lt-complaint   { background: #FFEDD5; color: #9A3412; }
    .lt-capa        { background: #F5F3FF; color: #6D28D9; }
    .lt-audit-finding { background: #FEF3C7; color: #92400E; }
    .lt-pfmea       { background: #EFF6FF; color: #1D4ED8; }
    .lt-control-plan{ background: #CCFBF1; color: #0F766E; }
    .lt-warranty    { background: #F0FDF4; color: #166534; }
    .lt-supplier-issue { background: #FDF2F8; color: #9D174D; }
    .lr-info { display: flex; flex-direction: column; gap: 2px; }
    .lr-id   { font-size: 11px; font-weight: 700; color: #2563EB; font-family: monospace; }
    .lr-title { font-size: 12px; color: #374151; }
    .lr-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .lr-status { font-size: 11px; color: #94A3B8; }

    /* Attachments */
    .attach-list { display: flex; flex-direction: column; gap: 8px; }
    .attach-item {
      display: flex; align-items: center; gap: 10px;
      background: #fff; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px;
    }
    .attach-icon { font-size: 20px; color: #64748B; flex-shrink: 0; }
    .att-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .att-name { font-size: 13px; font-weight: 500; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .att-meta { font-size: 11px; color: #94A3B8; }
    .att-type { font-size: 10px; font-weight: 600; background: #F1F5F9; color: #64748B; padding: 2px 7px; border-radius: 4px; text-transform: capitalize; }
    .btn-dl {
      background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 5px;
      padding: 4px 8px; cursor: pointer; font-size: 12px; color: #64748B; flex-shrink: 0;
    }
    .btn-dl:hover { background: #EFF6FF; color: #2563EB; }

    /* Timeline */
    .timeline { display: flex; flex-direction: column; }
    .tl-item { display: flex; gap: 12px; }
    .tl-left { display: flex; flex-direction: column; align-items: center; width: 32px; flex-shrink: 0; }
    .tl-av {
      width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center;
      justify-content: center; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
    }
    .tl-line { flex: 1; width: 2px; background: #E2E8F0; margin: 4px 0; min-height: 16px; }
    .tl-body { flex: 1; padding-bottom: 16px; }
    .tl-action { font-size: 13px; font-weight: 600; color: #0F172A; margin-top: 6px; display: flex; align-items: center; gap: 6px; }
    .tl-disc {
      background: #EFF6FF; color: #2563EB; font-size: 10px; font-weight: 700;
      padding: 1px 6px; border-radius: 4px;
    }
    .tl-actor { font-size: 11px; color: #94A3B8; margin-top: 2px; }
    .tl-detail { font-size: 12px; color: #475569; margin-top: 3px; }

    /* Activity drawer */
    .drawer-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 200;
    }
    .activity-drawer {
      position: fixed; right: 0; top: 0; bottom: 0; width: 340px;
      background: #fff; border-left: 1px solid #E2E8F0; z-index: 201;
      display: flex; flex-direction: column; box-shadow: -4px 0 16px rgba(0,0,0,0.1);
    }
    .drawer-header {
      padding: 14px 16px; border-bottom: 1px solid #E2E8F0;
      display: flex; align-items: center; justify-content: space-between;
    }
    .drawer-title { font-size: 14px; font-weight: 700; color: #0F172A; }
    .drawer-close {
      width: 28px; height: 28px; border-radius: 6px; border: none;
      background: #F1F5F9; cursor: pointer; font-size: 12px; color: #64748B;
    }
    .drawer-timeline { padding: 16px; overflow-y: auto; flex: 1; }

    /* Misc */
    .info-note {
      display: flex; align-items: flex-start; gap: 8px;
      background: #F0FDFA; border: 1px solid #99F6E4; border-radius: 8px;
      padding: 10px 14px; font-size: 13px; color: #374151;
    }
    .mt-12 { margin-top: 12px; }
    .not-started-msg {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 48px 16px; gap: 8px; color: #94A3B8; text-align: center;
    }
    .not-started-msg p { font-size: 13px; margin: 0; }
    .ns-hint { font-size: 12px; color: #CBD5E1 !important; }

    .not-found {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 60vh; gap: 12px; color: #94A3B8;
    }
    .btn-primary {
      background: #2563EB; color: #fff; border: none; border-radius: 7px;
      padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
    }
  `]
})
export class EightDWorkspaceComponent implements OnInit {
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly svc = inject(EightDMockService);

  readonly activeStep = signal<EightDDiscipline | 'traceability' | 'attachments' | 'activity'>('D1');
  readonly showActivity = signal(false);
  readonly steps = STEPS;

  readonly record = computed((): EightD | undefined => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.svc.getById(id) : undefined;
  });

  ngOnInit(): void {
    const r = this.record();
    if (r) {
      this.activeStep.set(r.activeStep);
    }
  }

  statusClass(status: string): string {
    if (status === 'Pending Closure') return 'pending';
    return status.toLowerCase();
  }

  roleResponsibility(role: string): string {
    const map: Record<string, string> = {
      'Quality Engineer': 'Root cause analysis, measurement system verification, documentation updates',
      'Manufacturing Engineer': 'Process investigation, tooling assessment, work instruction revision',
      'Process Engineer': 'Process parameter review, SPC implementation, equipment qualification',
      'Production Supervisor': 'Production stop execution, containment actions, operator training oversight',
      'Supplier Quality Engineer': 'Supplier SCAR issuance, incoming inspection, supplier corrective action follow-up',
      'Incoming Quality Inspector': '100% incoming inspection, dimensional measurement, quarantine tagging',
    };
    return map[role] ?? 'Cross-functional support and implementation';
  }

  attachIcon(type: string): string {
    const map: Record<string, string> = {
      photo: 'bi-file-earmark-image',
      pdf: 'bi-file-earmark-pdf',
      email: 'bi-envelope',
      report: 'bi-file-earmark-bar-graph',
      document: 'bi-file-earmark-text',
    };
    return map[type] ?? 'bi-file-earmark';
  }

  linkedRecordIcon(type: string): string {
    const map: Record<string, string> = {
      'NCR':           'bi-exclamation-triangle',
      'Complaint':     'bi-chat-left-text',
      'CAPA':          'bi-tools',
      'Audit Finding': 'bi-clipboard-check',
      'Supplier Issue':'bi-truck',
      'PFMEA':         'bi-grid-3x3',
      'Control Plan':  'bi-file-earmark-check',
      'Training Record':'bi-mortarboard',
      'Warranty':      'bi-shield-exclamation',
    };
    return map[type] ?? 'bi-link-45deg';
  }

  getFishboneCauses(fishbone: NonNullable<NonNullable<EightD['d4']>['fishbone']>, key: string): { id: string; text: string; isRoot: boolean }[] {
    if (!fishbone) return [];
    return (fishbone as unknown as Record<string, { id: string; text: string; isRoot: boolean }[]>)[key] ?? [];
  }

  fbCategoryHasRoot(causes: { id: string; text: string; isRoot: boolean }[]): boolean {
    return causes.some(c => c.isRoot);
  }

  readonly fishboneCategories = [
    { key: 'man',         label: 'Man',         icon: 'bi-person' },
    { key: 'machine',     label: 'Machine',     icon: 'bi-gear' },
    { key: 'method',      label: 'Method',      icon: 'bi-diagram-2' },
    { key: 'material',    label: 'Material',    icon: 'bi-box' },
    { key: 'measurement', label: 'Measurement', icon: 'bi-rulers' },
    { key: 'environment', label: 'Environment', icon: 'bi-tree' },
  ];
}

