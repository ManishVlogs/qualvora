import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentStorageService } from '../../../shared/services/document-storage.service';
import { PermissionStorageService } from '../../../shared/services/permission-storage.service';
import { WorkflowStorageService } from '../../../shared/services/workflow-storage.service';
import { ConfigurationStorageService } from '../../../shared/services/configuration-storage.service';
import { DocumentFileStoreService } from '../../../shared/services/document-file-store.service';
import { ActionConfig, WorkflowStageConfig } from '../../../shared/interfaces/document-detail.config';

type ResolvedAction = ActionConfig & { enabled: boolean; tooltipToShow: string };

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="doc-detail-root" [style.max-width]="config().maxContentWidth">

  <!-- ── Loading skeleton ──────────────────────────────────────────────── -->
  @if (loading()) {
    <div class="skeleton-layout" aria-busy="true" aria-label="Loading document…">
      <div class="skel-header q-card">
        <div class="skel-line skel-sm" style="width:120px"></div>
        <div class="skel-line skel-lg" style="width:60%;margin-top:0.75rem"></div>
        <div class="skel-line skel-sm" style="width:40%;margin-top:0.5rem"></div>
        <div class="skel-line skel-xs" style="width:80%;margin-top:1.5rem"></div>
        <div class="skel-tabs">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="skel-tab"></div>
          }
        </div>
      </div>
      <div class="skel-body">
        <div class="skel-pdf q-card"></div>
        <div class="skel-meta q-card">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="skel-line skel-sm" style="margin-bottom:0.75rem"></div>
          }
        </div>
      </div>
    </div>
  }

  <!-- ── Not found ─────────────────────────────────────────────────────── -->
  @else if (!doc()) {
    <div class="not-found-card q-card" role="alert">
      <i class="bi bi-file-earmark-x not-found-icon" aria-hidden="true"></i>
      <h2 class="not-found-title">Document Not Found</h2>
      <p class="not-found-desc">
        <strong>{{ docId }}</strong> could not be located. It may have been deleted,
        moved, or the link may be invalid.
      </p>
      <button class="btn btn-outline-primary btn-sm" (click)="router.navigate(['/documents'])">
        <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to Document Library
      </button>
    </div>
  }

  <!-- ── Main content ───────────────────────────────────────────────────── -->
  @else {

    <!-- Superseded banner -->
    @if (isSupersededRevision()) {
      <div class="superseded-banner" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>
        You are viewing a <strong>superseded revision</strong> — a newer version is currently active.
        <button class="view-current-btn" (click)="router.navigate(['/documents', docId])">
          View Current <i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
        </button>
      </div>
    }

    <!-- ── Header card ──────────────────────────────────────────────────── -->
    <div class="doc-header-card q-card">

      <!-- Breadcrumb + help -->
      <div class="breadcrumb-bar">
        <button class="back-btn" (click)="router.navigate(['/documents'])"
                data-tip="Return to the Document Library" aria-label="Document Library">
          <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Document Library
        </button>
        @if (config().showHelpDrawer) {
          <button class="help-trigger-btn"
                  data-tip="Open the Document Lifecycle Help Guide"
                  aria-label="Open help guide"
                  (click)="helpOpen.set(true)">
            <i class="bi bi-question-circle me-1" aria-hidden="true"></i>Help
          </button>
        }
      </div>

      <!-- Title row + actions -->
      <div class="header-main">
        <div class="header-left">
          <div class="id-status-row">
            <span class="record-id">{{ docId }}</span>
            <span class="chip {{ statusConfig()?.chipClass ?? 'chip-minor' }} ms-2"
                  [attr.data-tip]="statusTooltip()"
                  [attr.aria-label]="'Document status: ' + doc()!.status">
              <i class="bi {{ statusConfig()?.icon ?? 'bi-circle' }} me-1" aria-hidden="true"></i>
              {{ doc()!.status }}
            </span>
          </div>
          <h1 class="doc-title">{{ doc()!.title }}</h1>
          <div class="doc-meta-row" role="list" aria-label="Document metadata">
            <span class="meta-chip" role="listitem">
              <i class="bi bi-tag me-1" aria-hidden="true"></i>Rev {{ doc()!.revision }}
            </span>
            <span class="meta-sep" aria-hidden="true">·</span>
            <span class="meta-chip" role="listitem">{{ doc()!.type }}</span>
            <span class="meta-sep" aria-hidden="true">·</span>
            <span class="meta-chip" role="listitem"
                  data-tip="Document tier per QMS hierarchy. T2 = Procedures/Control Plans, T3 = Work Instructions, T4 = Forms">
              Tier {{ docTier() }}
            </span>
            <span class="meta-sep" aria-hidden="true">·</span>
            <span class="meta-chip" role="listitem">
              <i class="bi bi-building me-1" aria-hidden="true"></i>{{ siteName() }}
            </span>
            @if (doc()!.status === 'Released') {
              <span class="meta-sep" aria-hidden="true">·</span>
              <span class="meta-chip meta-chip-green" role="listitem"
                    data-tip="This revision has been approved and released. It is the active controlled version that must be followed at the point of use.">
                <i class="bi bi-check-circle-fill me-1" aria-hidden="true"></i>Released {{ doc()!.lastReviewed }}
              </span>
            }
            @if (doc()!.status === 'In Approval') {
              <span class="meta-sep" aria-hidden="true">·</span>
              <span class="meta-chip meta-chip-amber" role="listitem"
                    data-tip="This revision has been submitted and is awaiting e-signature approval from the designated approvers. Editing is locked until the review is resolved. Check the Approvals tab for details.">
                <i class="bi bi-hourglass-split me-1" aria-hidden="true"></i>Pending approval
              </span>
            }
          </div>

          <!-- Compliance standard tags -->
          @if (config().showComplianceTags) {
            <div class="compliance-tags" aria-label="Applicable compliance standards">
              @for (tag of config().complianceTags; track tag.id) {
                <span class="compliance-tag {{ tag.colorClass }}"
                      [attr.data-tip]="tag.tooltip"
                      role="img"
                      [attr.aria-label]="tag.fullLabel">
                  {{ tag.shortLabel }}
                </span>
              }
            </div>
          }
        </div>

        <!-- Action toolbar -->
        <div class="header-actions" role="toolbar" aria-label="Document actions">
          @for (action of renderedPrimaryActions(); track action.key) {
            <span class="action-btn-wrap me-2" [attr.data-tip]="action.tooltipToShow">
              <button
                class="btn btn-sm {{ action.variant === 'primary' ? 'btn-primary' : 'btn-outline-secondary' }}"
                [disabled]="!action.enabled"
                [attr.aria-label]="action.label"
                [attr.aria-disabled]="!action.enabled"
                (click)="action.enabled && onAction(action.key)">
                <i class="bi {{ action.icon }} me-1" aria-hidden="true"></i>
                <span class="action-label">{{ action.label }}</span>
              </button>
            </span>
          }

          <!-- Overflow menu -->
          <div class="overflow-wrap">
            <button class="btn btn-outline-secondary btn-sm icon-btn"
                    data-tip="More actions — compare revisions, export metadata, mark obsolete"
                    aria-label="More actions"
                    aria-haspopup="menu"
                    [attr.aria-expanded]="overflowOpen()"
                    (click)="overflowOpen.set(!overflowOpen())">
              <i class="bi bi-three-dots" aria-hidden="true"></i>
            </button>
            @if (overflowOpen()) {
              <div class="overflow-dropdown" role="menu" aria-label="Additional actions">
                @for (action of renderedOverflowActions(); track action.key) {
                  <span class="action-btn-wrap" style="display:block" [attr.data-tip]="action.tooltipToShow">
                    <button
                      class="overflow-item {{ action.variant === 'danger' ? 'overflow-danger' : '' }}"
                      [disabled]="!action.enabled"
                      [attr.aria-disabled]="!action.enabled"
                      role="menuitem"
                      (click)="action.enabled && onAction(action.key); overflowOpen.set(false)">
                      <i class="bi {{ action.icon }} me-2" aria-hidden="true"></i>{{ action.label }}
                    </button>
                  </span>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- ── Workflow pipeline bar ───────────────────────────────────────── -->
      @if (config().showWorkflowBar) {
        <div class="workflow-bar" aria-label="Document lifecycle stages" role="group">
          @for (stage of sortedStages(); track stage.key; let i = $index; let last = $last) {
            <div class="stage-wrap">
              <div class="stage-item {{ getStageClass(i) }}"
                   [attr.aria-current]="i === activeStageIndex() ? 'step' : null"
                   [attr.data-tip]="stage.label + (i === activeStageIndex() ? ' — Current stage' : i < activeStageIndex() ? ' — Completed' : ' — Upcoming')">
                <div class="stage-dot">
                  @if (i < activeStageIndex()) {
                    <i class="bi bi-check-lg" aria-hidden="true"></i>
                  } @else {
                    <i class="bi {{ stage.icon }}" aria-hidden="true"></i>
                  }
                </div>
                <div class="stage-label">{{ stage.label }}</div>
              </div>
              @if (!last) {
                <div class="stage-connector {{ i < activeStageIndex() ? 'connector-done' : '' }}"
                     aria-hidden="true"></div>
              }
            </div>
          }
        </div>
      }

      <!-- ── Tab rail ────────────────────────────────────────────────────── -->
      <div class="tab-rail" role="tablist" aria-label="Document sections">
        @for (tab of config().tabs; track tab.key) {
          <button
            class="tab-btn"
            [class.active]="activeTab() === tab.key"
            role="tab"
            [attr.aria-selected]="activeTab() === tab.key"
            [attr.id]="'tab-' + tab.key"
            [attr.aria-controls]="'panel-' + tab.key"
            [attr.data-tip]="tab.tooltip"
            (click)="activeTab.set(tab.key)">
            <i class="bi {{ tab.icon }} me-1" aria-hidden="true"></i>
            {{ tab.label }}
            @if (tab.showBadge && tab.key === 'distribution' && pendingAckCount() > 0) {
              <span class="tab-badge" [attr.aria-label]="pendingAckCount() + ' pending acknowledgments'">
                {{ pendingAckCount() }}
              </span>
            }
          </button>
        }
      </div>
    </div><!-- /doc-header-card -->

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TAB PANELS                                                         -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->

    <!-- ── CONTENT tab ─────────────────────────────────────────────────── -->
    @if (activeTab() === 'content') {
      <div id="panel-content" role="tabpanel" aria-labelledby="tab-content" class="content-grid">

        <!-- PDF viewer (65%) -->
        <div class="q-card pdf-card" aria-label="Document PDF viewer">
          <div class="pdf-toolbar" role="toolbar" aria-label="PDF viewer controls">
            <span class="pdf-filename">
              <i class="bi bi-file-earmark-pdf text-danger me-1" aria-hidden="true"></i>
              {{ pdfFilename() }}
            </span>
            <div class="pdf-actions">
              <button class="pdf-btn" data-tip="Zoom in — increase the display size for detailed reading" aria-label="Zoom in" (click)="zoomIn()">
                <i class="bi bi-zoom-in" aria-hidden="true"></i>
              </button>
              <button class="pdf-btn" data-tip="Zoom out — decrease the display size to see more content at once" aria-label="Zoom out" (click)="zoomOut()">
                <i class="bi bi-zoom-out" aria-hidden="true"></i>
              </button>
              <button class="pdf-btn" data-tip="Open in a new browser tab for full-screen, uninterrupted reading" aria-label="Open fullscreen" (click)="openFullscreen()">
                <i class="bi bi-fullscreen" aria-hidden="true"></i>
              </button>
              @if (config().pdfViewer.allowDownload) {
                <button class="pdf-btn" data-tip="Download the PDF to your device. The watermarked controlled copy is the version of record." aria-label="Download PDF" (click)="downloadPdf()">
                  <i class="bi bi-download" aria-hidden="true"></i>
                </button>
              }
              @if (config().pdfViewer.showWatermark) {
                <span class="watermark-badge"
                      [attr.data-tip]="watermarkTitle()">
                  <i class="bi bi-shield-check me-1" aria-hidden="true"></i>Controlled
                </span>
              }
            </div>
          </div>
          <div class="pdf-preview-area" role="img" [attr.aria-label]="'PDF preview for ' + doc()!.title"
               [style.overflow]="pdfZoom() !== 1 ? 'auto' : 'hidden'"
               [style.align-items]="pdfZoom() > 1 ? 'flex-start' : 'center'">
            @if (pdfUrl()) {
              <iframe [src]="pdfUrl()!" class="pdf-iframe" title="Document PDF viewer"
                      aria-label="PDF document viewer"
                      [style.zoom]="pdfZoom()"
                      [style.width]="pdfZoom() < 1 ? (100 / pdfZoom()) + '%' : '100%'"
                      [style.height]="pdfZoom() < 1 ? (480 / pdfZoom()) + 'px' : '100%'"></iframe>
            } @else {
              <div class="pdf-placeholder">
                <i class="bi bi-file-earmark-pdf pdf-placeholder-icon" aria-hidden="true"></i>
                <p class="pdf-placeholder-title">PDF Preview</p>
                <p class="pdf-placeholder-sub">{{ doc()!.title }} · Rev {{ doc()!.revision }}</p>
                <button class="btn btn-outline-primary btn-sm mt-3"
                        data-tip="Open the PDF in a full-screen overlay for detailed reading"
                        aria-label="Open document fullscreen">
                  <i class="bi bi-arrows-fullscreen me-1" aria-hidden="true"></i>Open Full Screen
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Metadata panel (35%) -->
        <aside class="meta-panel" aria-label="Document metadata">
          <div class="q-card meta-card">

            <h2 class="meta-section-title">Document Details</h2>
            @for (field of detailsFields(); track field.key) {
              <div class="meta-row" [attr.data-tip]="field.tooltip">
                <span class="meta-key">{{ field.label }}</span>
                <span class="meta-val">
                  @switch (field.format) {
                    @case ('tier-badge') {
                      <span class="tier-badge" [attr.data-tip]="field.tooltip">T{{ docTier() }}</span>
                    }
                    @case ('user') {
                      <span class="user-val">
                        <span class="av-sm" [style.background]="ownerColor()" aria-hidden="true">
                          {{ doc()!.ownerInitials }}
                        </span>
                        {{ doc()!.owner }}
                      </span>
                    }
                    @default {
                      {{ metaValue(field.key) || '—' }}
                    }
                  }
                </span>
              </div>
            }

            <div class="meta-divider" aria-hidden="true"></div>
            <h2 class="meta-section-title">Review Schedule</h2>
            @for (field of reviewFields(); track field.key) {
              <div class="meta-row" [attr.data-tip]="field.tooltip">
                <span class="meta-key">{{ field.label }}</span>
                <span class="meta-val">
                  @if (field.format === 'review-indicator') {
                    <span class="review-date-val {{ reviewUrgencyClass() }}"
                          [attr.data-tip]="reviewUrgencyTooltip()">
                      <i class="bi bi-calendar-check me-1" aria-hidden="true"></i>
                      {{ doc()!.nextReview || '—' }}
                      @if ((doc()!.daysUntilReview || 999) <= 30) {
                        <i class="bi bi-exclamation-circle-fill ms-1"
                           aria-label="Review due soon" aria-hidden="false"></i>
                      }
                    </span>
                  } @else if (field.format === 'number-unit') {
                    {{ doc()!.reviewCycle ? doc()!.reviewCycle + ' ' + field.unit : '—' }}
                  } @else {
                    {{ metaValue(field.key) || '—' }}
                  }
                </span>
              </div>
            }

            <div class="meta-divider" aria-hidden="true"></div>
            <h2 class="meta-section-title">IATF Clauses</h2>
            <div class="clause-chips" role="list" aria-label="IATF 16949 clause references">
              @for (c of clauses(); track c) {
                <button class="clause-chip" role="listitem"
                        [attr.data-tip]="'Browse all documents mapped to IATF 16949 Clause ' + c"
                        (click)="router.navigate(['/clause-map'])">
                  {{ c }}
                </button>
              }
              @if (clauses().length === 0) {
                <p class="no-data-text">No clause references assigned.</p>
              }
            </div>

            <div class="meta-divider" aria-hidden="true"></div>
            <h2 class="meta-section-title">Related Documents</h2>
            <div class="related-docs" role="list" aria-label="Related documents">
              @for (r of relatedDocs(); track r.id) {
                <button class="related-row" role="listitem"
                        [attr.data-tip]="'Open ' + r.title + ' (' + r.id + ')'"
                        (click)="router.navigate(['/documents', r.id])">
                  <i class="bi bi-file-earmark-text text-primary me-1" aria-hidden="true"></i>
                  <span class="related-id">{{ r.id }}</span>
                  <span class="related-title">{{ r.title }}</span>
                  <span class="rel-badge">{{ r.rel }}</span>
                </button>
              }
              @if (relatedDocs().length === 0) {
                <p class="no-data-text">No related documents found.</p>
              }
            </div>
          </div>
        </aside>
      </div>
    }

    <!-- ── REVISIONS tab ────────────────────────────────────────────────── -->
    @if (activeTab() === 'revisions') {
      <div id="panel-revisions" role="tabpanel" aria-labelledby="tab-revisions" class="q-card">
        <div class="tab-inner-header">
          <span>{{ revisions().length }} {{ revisions().length === 1 ? 'revision' : 'revisions' }}</span>
          <button class="btn btn-outline-secondary btn-sm"
                  data-tip="Open a side-by-side diff of any two revisions — compare status, release dates, approvers, and change notes to understand exactly what changed and why."
                  aria-label="Compare revisions"
                  (click)="router.navigate(['/documents', docId, 'compare'], { queryParams: compareDefaultParams() })">
            <i class="bi bi-subtract me-1" aria-hidden="true"></i>Compare Revisions
          </button>
        </div>
        <div class="revision-timeline" role="list" aria-label="Revision history">
          @for (r of revisions(); track r.rev; let last = $last) {
            <div class="rev-item {{ r.current ? 'rev-item-current' : '' }}" role="listitem">
              <div class="rev-timeline-col">
                <div class="rev-dot {{ r.current ? 'rev-dot-active' : 'rev-dot-past' }}"
                     [attr.data-tip]="r.current ? 'Current revision — the active controlled version of this document' : 'Historical revision — retained for audit and traceability. No longer the active version.'">
                  @if (r.current) { <i class="bi bi-record-circle-fill" aria-hidden="true"></i> }
                  @else { <i class="bi bi-circle-fill" aria-hidden="true"></i> }
                </div>
                @if (!last) { <div class="rev-line" aria-hidden="true"></div> }
              </div>
              <div class="rev-content">
                <div class="rev-header-row">
                  <span class="rev-label">Rev {{ r.rev }}</span>
                  <span class="chip chip-sm {{ r.chipClass }}" [attr.data-tip]="revStatusTooltip(r.status)">{{ r.status }}</span>
                  @if (r.current) {
                    <span class="current-badge"
                          data-tip="This is the latest active revision. It is the controlled version currently in use and must be followed at the point of use."
                          aria-label="Current revision">Current</span>
                  }
                  <span class="rev-date">{{ r.date }}</span>
                  <span class="rev-by">{{ r.by }}</span>
                  @if (!r.current) {
                    <button class="btn btn-outline-secondary btn-xs ms-auto"
                            [attr.data-tip]="'Compare Rev ' + r.rev + ' side by side with the current Rev ' + revisions()[0].rev + ' — see exactly what changed in status, dates, approver, and change notes'"
                            (click)="router.navigate(['/documents', docId, 'compare'], { queryParams: { rev1: r.rev, rev2: revisions()[0].rev } })">
                      Compare
                    </button>
                  }
                </div>
                @if (r.change) {
                  <p class="rev-change">{{ r.change }}</p>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- ── APPROVALS tab ────────────────────────────────────────────────── -->
    @if (activeTab() === 'approvals') {
      <div id="panel-approvals" role="tabpanel" aria-labelledby="tab-approvals" class="q-card approval-card">
        <div class="tab-inner-header">
          <span>Approval Chain — Rev {{ doc()!.revision }}</span>
          <span class="compliance-chip"
                data-tip="Electronic signatures comply with FDA 21 CFR Part 11: unique user IDs, timestamp integrity, and audit trail authenticity">
            <i class="bi bi-shield-lock-fill me-1" aria-hidden="true"></i>21 CFR §11 Compliant
          </span>
        </div>
        <div class="approval-stepper" role="list" aria-label="Approval workflow steps">
          @for (step of approvalSteps(); track step.step; let last = $last) {
            <div class="approval-step" role="listitem"
                 [attr.aria-label]="'Step ' + step.step + ': ' + step.approver + ' — ' + (step.done ? step.action : step.active ? 'Awaiting approval' : 'Pending')">
              <div class="step-col">
                <div class="step-circle
                       {{ step.done ? 'step-done' : step.rejected ? 'step-rejected' : step.active ? 'step-active' : 'step-pending' }}"
                   [attr.data-tip]="stepCircleTooltip(step)">
                  @if (step.done) { <i class="bi bi-check-lg" aria-hidden="true"></i> }
                  @else if (step.rejected) { <i class="bi bi-x-lg" aria-hidden="true"></i> }
                  @else { <span>{{ step.step }}</span> }
                </div>
                @if (!last) {
                  <div class="step-line {{ step.done ? 'step-line-done' : '' }}" aria-hidden="true"></div>
                }
              </div>
              <div class="step-body">
                <div class="step-header">
                  <span class="av-sm" [style.background]="step.color" aria-hidden="true">
                    {{ step.initials }}
                  </span>
                  <span class="step-name">{{ step.approver }}</span>
                  <span class="step-role-chip">{{ step.role }}</span>
                  @if (step.requiresESign) {
                    <span class="esign-req-chip"
                          data-tip="This step requires a legally-binding electronic signature per FDA 21 CFR Part 11">
                      <i class="bi bi-pen me-1" aria-hidden="true"></i>E-Sig Required
                    </span>
                  }
                  <span class="step-status ms-auto
                         {{ step.done ? 'status-approved' : step.rejected ? 'status-rejected' : step.active ? 'status-active' : 'status-pending' }}">
                    @if (step.done) {
                      <i class="bi bi-patch-check-fill me-1" aria-hidden="true"></i>{{ step.action }}
                    } @else if (step.rejected) {
                      <i class="bi bi-x-circle-fill me-1" aria-hidden="true"></i>Rejected
                    } @else if (step.active) {
                      <i class="bi bi-hourglass-split me-1" aria-hidden="true"></i>Awaiting Approval
                    } @else {
                      <i class="bi bi-clock me-1" aria-hidden="true"></i>Pending
                    }
                  </span>
                </div>
                @if (step.date) {
                  <div class="step-meta">
                    <i class="bi bi-calendar-event me-1" aria-hidden="true"></i>{{ step.date }}
                    @if (step.esigned) {
                      <span class="esign-done-chip ms-2"
                            data-tip="E-signature captured: unique user ID, timestamp, and session data recorded per FDA 21 CFR Part 11">
                        <i class="bi bi-pen-fill me-1" aria-hidden="true"></i>E-Signed
                      </span>
                    }
                  </div>
                }
                @if (step.comment) {
                  <blockquote class="step-comment">"{{ step.comment }}"</blockquote>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- ── DISTRIBUTION tab ─────────────────────────────────────────────── -->
    @if (activeTab() === 'distribution') {
      <div id="panel-distribution" role="tabpanel" aria-labelledby="tab-distribution" class="q-card">
        @if (recipients().length === 0) {
          <div class="empty-state" role="status">
            <i class="bi bi-send empty-icon" aria-hidden="true"></i>
            <h3 class="empty-title">No Distribution Sent</h3>
            <p class="empty-desc">
              This document has not yet been distributed. Once released, distribute it to
              ensure affected personnel are informed of the current controlled version.
              Per IATF 16949 §7.5.3, documents must be available at points of use.
            </p>
            <button class="btn btn-outline-primary btn-sm"
                    [disabled]="!canDistribute()"
                    [attr.data-tip]="canDistribute() ? 'Send this document to designated personnel and track acknowledgments' : 'Distribution requires QE, ME, QM, QS, or Director role'"
                    (click)="router.navigate(['/documents', docId, 'distribution'])">
              <i class="bi bi-send me-1" aria-hidden="true"></i>Send Distribution
            </button>
          </div>
        } @else {
          <div class="tab-inner-header">
            <div>
              <span class="fw-600">{{ doc()!.areas || 'All Areas' }} — {{ recipients().length }} recipients</span>
              <span class="ms-2 text-muted-sm">Controlled distribution</span>
            </div>
            @if (pendingAckCount() > 0) {
              <button class="btn btn-warning btn-sm"
                      [attr.data-tip]="'Send a reminder to the ' + pendingAckCount() + ' recipients who have not yet acknowledged this document'"
                      aria-label="Send reminder to unacknowledged recipients"
                      (click)="onNudge()">
                <i class="bi bi-bell me-1" aria-hidden="true"></i>Nudge ({{ pendingAckCount() }})
              </button>
            }
          </div>
          <div class="ack-progress-wrap">
            <div class="ack-progress-labels">
              <span>Acknowledgments</span>
              <span class="fw-600">
                {{ ackCount() }} / {{ recipients().length }}
                <span class="text-muted-sm ms-1">({{ ackPct() }}%)</span>
              </span>
            </div>
            <div class="ack-bar" role="progressbar"
                 [attr.aria-valuenow]="ackPct()" aria-valuemin="0" aria-valuemax="100"
                 [attr.aria-label]="ackPct() + '% of recipients have acknowledged'">
              <div class="ack-fill {{ ackPct() === 100 ? 'ack-fill-complete' : '' }}"
                   [style.width]="ackPct() + '%'"></div>
            </div>
          </div>
          <table class="q-table" aria-label="Distribution recipients">
            <thead>
              <tr>
                <th scope="col">Recipient</th>
                <th scope="col" style="width:130px">Role</th>
                <th scope="col" style="width:140px">Ack. Date</th>
                <th scope="col" style="width:130px">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (r of recipients(); track r.id) {
                <tr>
                  <td>
                    <div class="user-val">
                      <span class="av-sm" [style.background]="r.color" aria-hidden="true">{{ r.initials }}</span>
                      {{ r.name }}
                    </div>
                  </td>
                  <td><span class="role-chip" [attr.data-tip]="r.role + ' — job role of this recipient in the quality management system'">{{ r.role }}</span></td>
                  <td class="text-muted-sm">{{ r.ackDate ?? '—' }}</td>
                  <td>
                    <span class="chip chip-sm {{ ackStatusChip(r.status) }}"
                          [attr.data-tip]="ackStatusTooltip(r.status)"
                          [attr.aria-label]="'Acknowledgment status: ' + r.status">
                      {{ r.status }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    }

    <!-- ── CLAUSES tab ──────────────────────────────────────────────────── -->
    @if (activeTab() === 'clauses') {
      <div id="panel-clauses" role="tabpanel" aria-labelledby="tab-clauses" class="q-card clauses-card">
        <div class="tab-inner-header"><span>IATF 16949 Clause References</span></div>
        @if (clauses().length > 0) {
          <div class="clause-grid" role="list" aria-label="IATF 16949 clauses">
            @for (c of clauses(); track c) {
              <button class="clause-card" role="listitem"
                      [attr.data-tip]="'View all documents and controls mapped to IATF 16949 Clause ' + c"
                      (click)="router.navigate(['/clause-map'])">
                <span class="clause-num">{{ c }}</span>
                <span class="clause-link-label">
                  <i class="bi bi-arrow-right-circle me-1" aria-hidden="true"></i>View in Clause Map
                </span>
              </button>
            }
          </div>
        } @else {
          <div class="empty-state" role="status">
            <i class="bi bi-link-45deg empty-icon" aria-hidden="true"></i>
            <p class="empty-desc">No IATF 16949 clauses have been assigned to this document.</p>
          </div>
        }

        <div class="meta-divider my-4" aria-hidden="true"></div>
        <div class="tab-inner-header border-0"><span>Related Documents & Cross-References</span></div>
        @if (relatedDocs().length > 0) {
          <table class="q-table" aria-label="Related documents">
            <thead>
              <tr>
                <th scope="col" style="width:120px">ID</th>
                <th scope="col">Title</th>
                <th scope="col" style="width:150px">Relationship</th>
                <th scope="col" style="width:80px">Rev</th>
              </tr>
            </thead>
            <tbody>
              @for (r of relatedDocs(); track r.id) {
                <tr class="linked-row" [attr.data-tip]="'Open ' + r.title"
                    (click)="router.navigate(['/documents', r.id])"
                    tabindex="0" role="link"
                    (keyup.enter)="router.navigate(['/documents', r.id])">
                  <td><span class="record-id">{{ r.id }}</span></td>
                  <td>{{ r.title }}</td>
                  <td><span class="rel-badge">{{ r.rel }}</span></td>
                  <td>Rev {{ r.rev }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="text-muted-sm" style="padding:1rem 1.25rem">No related documents found.</p>
        }
      </div>
    }

    <!-- ── HISTORY / AUDIT TRAIL tab ────────────────────────────────────── -->
    @if (activeTab() === 'history') {
      <div id="panel-history" role="tabpanel" aria-labelledby="tab-history" class="q-card history-card">
        <div class="tab-inner-header">
          <span>Audit Trail — {{ history().length }} {{ history().length === 1 ? 'event' : 'events' }}</span>
          <span class="compliance-chip"
                data-tip="This audit trail is immutable and tamper-evident, satisfying ISO 9001 §7.5 and FDA 21 CFR Part 11 requirements for record integrity">
            <i class="bi bi-shield-check me-1" aria-hidden="true"></i>ISO 9001 Compliant
          </span>
        </div>
        @if (history().length === 0) {
          <div class="empty-state" role="status">
            <i class="bi bi-journal-text empty-icon" aria-hidden="true"></i>
            <p class="empty-desc">No audit trail events recorded yet.</p>
          </div>
        }
        <ol class="history-timeline" aria-label="Document audit trail events">
          @for (h of history(); track h.id; let last = $last) {
            <li class="history-item">
              <div class="hist-avatar" [style.background]="h.actorColor" aria-hidden="true">
                {{ h.actorInitials }}
              </div>
              <div class="hist-body">
                <div class="hist-action">
                  <span class="hist-actor">{{ h.actor }}</span>
                  {{ h.action }}
                  @if (h.detail) { <span class="hist-detail">{{ h.detail }}</span> }
                </div>
                <time class="hist-time" [attr.datetime]="h.timestamp">{{ h.timestamp }}</time>
              </div>
              @if (!last) { <div class="hist-line" aria-hidden="true"></div> }
            </li>
          }
        </ol>
      </div>
    }

  }<!-- /else main content -->

  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  <!-- HELP DRAWER                                                            -->
  <!-- ═══════════════════════════════════════════════════════════════════════ -->
  @if (helpOpen()) {
    <div class="help-overlay" aria-hidden="true" (click)="helpOpen.set(false)"></div>
    <aside class="help-drawer" role="dialog" aria-modal="true" aria-label="Document Lifecycle Help Guide">
      <div class="help-header">
        <h2 class="help-title">
          <i class="bi bi-question-circle me-2" aria-hidden="true"></i>Document Lifecycle Guide
        </h2>
        <button class="help-close" aria-label="Close help guide" (click)="helpOpen.set(false)">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </div>
      <div class="help-body">
        <section class="help-section">
          <h3>Document Statuses</h3>
          <dl class="help-dl">
            <div class="help-entry">
              <dt><span class="chip chip-minor">Draft</span></dt>
              <dd>Being authored. Not yet submitted for approval. Only the owner can edit.</dd>
            </div>
            <div class="help-entry">
              <dt><span class="chip chip-in-approval">In Approval</span></dt>
              <dd>Submitted and awaiting e-signature approval from designated approvers in sequence.</dd>
            </div>
            <div class="help-entry">
              <dt><span class="chip chip-released">Released</span></dt>
              <dd>Fully approved and active. This is the controlled version that must be followed.</dd>
            </div>
            <div class="help-entry">
              <dt><span class="chip chip-superseded">Superseded</span></dt>
              <dd>A newer revision is active. Retained in the archive for traceability.</dd>
            </div>
            <div class="help-entry">
              <dt><span class="chip chip-obsolete">Obsolete</span></dt>
              <dd>Retired. No longer valid for use. Stored for historical and audit purposes.</dd>
            </div>
          </dl>
        </section>
        <section class="help-section">
          <h3>Approval Process</h3>
          <p>Every document revision must pass through a predefined approval chain based on its type and tier. Approvers provide legally-binding electronic signatures (FDA 21 CFR Part 11). The chain is fully configurable per document type.</p>
        </section>
        <section class="help-section">
          <h3>Controlled Distribution</h3>
          <p>Released documents must be sent to affected personnel who formally acknowledge receipt. Per IATF 16949 §7.5.3, document control must ensure availability at points of use. Use the <strong>Nudge</strong> feature to send reminders to pending acknowledgments.</p>
        </section>
        <section class="help-section">
          <h3>Review Cycle</h3>
          <p>Documents must be reviewed at defined intervals (typically 6–24 months). Review Due dates are highlighted amber within 60 days, red when overdue. Reviewing confirms the document remains accurate and valid.</p>
        </section>
        <section class="help-section">
          <h3>Compliance Standards</h3>
          <ul class="help-list">
            <li><strong>IATF 16949:2016</strong> — §7.5 Documented Information (Automotive)</li>
            <li><strong>ISO 9001:2015</strong> — §7.5 Documented Information</li>
            <li><strong>FDA 21 CFR Part 11</strong> — Electronic Records &amp; Signatures</li>
          </ul>
        </section>
        <section class="help-section">
          <h3>Document Tiers</h3>
          <ul class="help-list">
            <li><strong>Tier 2</strong> — Quality Procedures, Control Plans, PFMEAs</li>
            <li><strong>Tier 3</strong> — Work Instructions, MSA Studies</li>
            <li><strong>Tier 4</strong> — Forms and Records</li>
          </ul>
        </section>
      </div>
    </aside>
  }

  <!-- Toast -->
  @if (toast()) {
    <div class="action-toast" role="status" aria-live="polite">
      <i class="bi bi-check-circle-fill me-2" aria-hidden="true"></i>{{ toast() }}
    </div>
  }

</div><!-- /doc-detail-root -->
  `,
  styles: [`
    /* ── Root & layout ──────────────────────────────────────────────────── */
    .doc-detail-root {
      padding: 1.5rem;
      margin: 0 auto;
      position: relative;
    }

    /* ── Skeleton loading ───────────────────────────────────────────────── */
    .skeleton-layout { display: flex; flex-direction: column; gap: 1rem; }
    .skel-header { padding: 1.25rem; }
    .skel-body { display: grid; grid-template-columns: 65fr 35fr; gap: 1rem; }
    .skel-pdf { height: 480px; }
    .skel-meta { padding: 1.25rem; }
    .skel-tabs { display: flex; gap: 0.25rem; margin-top: 1.5rem; border-top: 1px solid #F1F5F9; padding-top: 0.5rem; }
    .skel-tab { height: 36px; width: 100px; background: #F1F5F9; border-radius: 4px; animation: pulse 1.5s ease-in-out infinite; }
    .skel-line { height: 12px; background: #F1F5F9; border-radius: 4px; animation: pulse 1.5s ease-in-out infinite; }
    .skel-sm { height: 12px; }
    .skel-lg { height: 20px; }
    .skel-xs { height: 8px; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* ── Not found state ───────────────────────────────────────────────── */
    .not-found-card {
      padding: 3rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .not-found-icon { font-size: 3rem; color: #CBD5E1; }
    .not-found-title { font-size: 1.125rem; font-weight: 700; color: #334155; margin: 0; }
    .not-found-desc { font-size: 0.875rem; color: #64748B; max-width: 400px; margin: 0; }

    /* ── Superseded banner ─────────────────────────────────────────────── */
    .superseded-banner {
      background: #FEF3C7;
      border: 1px solid #FCD34D;
      border-radius: 8px;
      padding: 0.75rem 1.25rem;
      font-size: 0.875rem;
      color: #92400E;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .view-current-btn {
      margin-left: auto;
      background: none;
      border: 1px solid #F59E0B;
      color: #92400E;
      border-radius: 6px;
      padding: 3px 10px;
      font-size: 0.8125rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      &:hover { background: #FDE68A; }
    }

    /* ── Header card ───────────────────────────────────────────────────── */
    .doc-header-card {
      padding: 1.25rem 1.25rem 0;
      margin-bottom: 1rem;
    }
    .breadcrumb-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .back-btn {
      background: none;
      border: none;
      font-size: 0.8125rem;
      color: #64748B;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      transition: color 150ms;
      &:hover { color: #2563EB; }
    }
    .help-trigger-btn {
      background: none;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      font-size: 0.8125rem;
      color: #64748B;
      cursor: pointer;
      padding: 3px 10px;
      display: flex;
      align-items: center;
      transition: all 150ms;
      &:hover { border-color: #2563EB; color: #2563EB; background: #EFF6FF; }
    }

    /* Title + actions */
    .header-main {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .header-left { flex: 1; min-width: 0; }
    .id-status-row {
      display: flex;
      align-items: center;
      margin-bottom: 0.375rem;
    }
    .doc-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0F172A;
      margin: 0 0 0.5rem;
      line-height: 1.3;
    }
    .doc-meta-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      flex-wrap: wrap;
      margin-bottom: 0.625rem;
    }
    .meta-chip {
      font-size: 0.8125rem;
      color: #64748B;
      display: flex;
      align-items: center;
    }
    .meta-chip-green { color: #059669; }
    .meta-chip-amber { color: #D97706; }
    .meta-sep { color: #CBD5E1; font-size: 0.8125rem; }

    /* Compliance tags */
    .compliance-tags {
      display: flex;
      gap: 0.375rem;
      flex-wrap: wrap;
      margin-top: 0.25rem;
    }
    .compliance-tag {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.25px;
      border-radius: 4px;
      padding: 2px 7px;
      border: 1px solid;
      cursor: default;
    }
    .tag-iatf { background: #EEF2FF; color: #4338CA; border-color: #C7D2FE; }
    .tag-iso  { background: #ECFDF5; color: #047857; border-color: #A7F3D0; }
    .tag-fda  { background: #FFF7ED; color: #C2410C; border-color: #FED7AA; }

    /* Action toolbar */
    .header-actions {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      flex-wrap: wrap;
      gap: 0.375rem;
    }
    .icon-btn { padding: 0.375rem 0.625rem; }
    .action-label { /* hide label on very small screens */ }
    .action-btn-wrap { display: inline-flex; cursor: default; }

    /* Overflow dropdown */
    .overflow-wrap { position: relative; }
    .overflow-dropdown {
      position: absolute;
      right: 0;
      top: calc(100% + 4px);
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      min-width: 200px;
      z-index: 200;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .overflow-item {
      display: flex;
      align-items: center;
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      color: #334155;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 100ms;
      &:hover:not(:disabled) { background: #F8FAFC; }
      &:disabled { color: #94A3B8; cursor: not-allowed; }
    }
    .overflow-danger { color: #DC2626; &:hover:not(:disabled) { background: #FEF2F2; } }

    /* ── Workflow pipeline bar ─────────────────────────────────────────── */
    .workflow-bar {
      display: flex;
      align-items: center;
      padding: 0.875rem 0 1rem;
      border-top: 1px solid #F1F5F9;
      margin-top: 0.5rem;
      overflow-x: auto;
    }
    .stage-wrap {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
    }
    .stage-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      min-width: 64px;
      cursor: default;
    }
    .stage-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      transition: all 200ms;
    }
    .stage-label {
      font-size: 0.6875rem;
      font-weight: 500;
      white-space: nowrap;
    }
    .stage-done .stage-dot {
      background: #DCFCE7;
      border: 2px solid #86EFAC;
      color: #166534;
    }
    .stage-done .stage-label { color: #166534; }
    .stage-active .stage-dot {
      background: #2563EB;
      border: 2px solid #2563EB;
      color: #fff;
      box-shadow: 0 0 0 4px rgba(37,99,235,0.15);
    }
    .stage-active .stage-label { color: #2563EB; font-weight: 700; }
    .stage-pending .stage-dot {
      background: #F1F5F9;
      border: 2px solid #E2E8F0;
      color: #94A3B8;
    }
    .stage-pending .stage-label { color: #94A3B8; }
    .stage-connector {
      flex: 1;
      height: 2px;
      background: #E2E8F0;
      min-width: 16px;
      transition: background 300ms;
    }
    .connector-done { background: #86EFAC; }

    /* ── Tab rail ──────────────────────────────────────────────────────── */
    .tab-rail {
      display: flex;
      border-top: 1px solid #F1F5F9;
      overflow-x: auto;
    }
    .tab-btn {
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: #64748B;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      cursor: pointer;
      display: flex;
      align-items: center;
      white-space: nowrap;
      transition: color 150ms, border-color 150ms;
      position: relative;
      &:hover { color: #2563EB; }
      &.active {
        color: #2563EB;
        border-bottom-color: #2563EB;
        font-weight: 600;
      }
    }
    .tab-badge {
      background: #EF4444;
      color: #fff;
      border-radius: 10px;
      padding: 0 5px;
      font-size: 10px;
      font-weight: 700;
      line-height: 16px;
      min-width: 16px;
      text-align: center;
      margin-left: 4px;
    }

    /* ── Tab inner header ─────────────────────────────────────────────── */
    .tab-inner-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid #F1F5F9;
      font-size: 0.875rem;
      font-weight: 500;
      color: #334155;
    }
    .compliance-chip {
      font-size: 0.75rem;
      font-weight: 600;
      color: #1D4ED8;
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 4px;
      padding: 2px 8px;
      display: flex;
      align-items: center;
    }

    /* ── CONTENT tab ─────────────────────────────────────────────────── */
    .content-grid {
      display: grid;
      grid-template-columns: 65fr 35fr;
      gap: 1rem;
      align-items: start;
    }
    .pdf-card { overflow: hidden; }
    .pdf-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      border-bottom: 1px solid #F1F5F9;
      background: #F8FAFC;
    }
    .pdf-filename {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #475569;
      display: flex;
      align-items: center;
    }
    .pdf-actions { display: flex; align-items: center; gap: 4px; }
    .pdf-btn {
      width: 28px;
      height: 28px;
      background: none;
      border: 1px solid #E2E8F0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #64748B;
      font-size: 0.875rem;
      transition: all 150ms;
      &:hover { border-color: #2563EB; color: #2563EB; }
    }
    .watermark-badge {
      font-size: 10px;
      font-weight: 700;
      color: #047857;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      border-radius: 4px;
      padding: 2px 7px;
      margin-left: 6px;
      display: flex;
      align-items: center;
    }
    .pdf-preview-area {
      height: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F8FAFC;
      border-radius: 0 0 8px 8px;
      overflow: hidden;
    }
    .pdf-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }
    .pdf-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      color: #94A3B8;
      text-align: center;
    }
    .pdf-placeholder-icon { font-size: 4rem; color: #CBD5E1; }
    .pdf-placeholder-title { font-size: 1rem; font-weight: 500; color: #64748B; margin: 0; }
    .pdf-placeholder-sub { font-size: 0.8125rem; color: #94A3B8; margin: 0; }

    /* Metadata panel */
    .meta-panel { display: flex; flex-direction: column; gap: 1rem; }
    .meta-card { padding: 1.25rem; }
    .meta-section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94A3B8;
      margin: 0 0 0.75rem;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.625rem;
      margin-bottom: 0.625rem;
      border-bottom: 1px solid #F8FAFC;
      &:last-child { border-bottom: none; margin-bottom: 0; }
    }
    .meta-key { font-size: 0.8125rem; color: #64748B; }
    .meta-val {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #0F172A;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      text-align: right;
    }
    .meta-divider { height: 1px; background: #F1F5F9; margin: 0.875rem 0; }
    .tier-badge {
      background: #E0E7FF;
      color: #4338CA;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 700;
    }
    .user-val { display: flex; align-items: center; gap: 0.375rem; }
    .av-sm {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }

    /* Review due urgency */
    .review-date-val { display: flex; align-items: center; font-size: 0.8125rem; font-weight: 500; }
    .review-ok    { color: #059669; }
    .review-warn  { color: #D97706; }
    .review-urgent{ color: #DC2626; }

    /* IATF clauses */
    .clause-chips { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .clause-chip {
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      color: #1D4ED8;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms;
      &:hover { background: #DBEAFE; }
    }

    /* Related docs */
    .related-docs { display: flex; flex-direction: column; gap: 0.125rem; }
    .related-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.25rem;
      cursor: pointer;
      border-radius: 4px;
      background: none;
      border: none;
      text-align: left;
      width: 100%;
      transition: background 150ms;
      &:hover { background: #F8FAFC; }
    }
    .related-id { font-family: monospace; font-size: 0.8125rem; color: #2563EB; font-weight: 700; flex-shrink: 0; }
    .related-title { font-size: 0.8125rem; color: #475569; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rel-badge {
      background: #F1F5F9;
      color: #64748B;
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 10px;
      flex-shrink: 0;
    }
    .no-data-text { font-size: 0.8125rem; color: #94A3B8; margin: 0.25rem 0; }

    /* ── REVISIONS tab ───────────────────────────────────────────────── */
    .revision-timeline { padding: 1.25rem; display: flex; flex-direction: column; }
    .rev-item {
      display: flex;
      gap: 0.875rem;
      &.rev-item-current { background: #F0FDF4; border-radius: 8px; padding: 0.5rem 0.5rem 0.5rem 0; margin: -0.5rem -0.5rem -0.5rem 0; }
    }
    .rev-timeline-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 2px;
    }
    .rev-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      flex-shrink: 0;
    }
    .rev-dot-active { color: #2563EB; font-size: 18px; }
    .rev-dot-past { color: #CBD5E1; font-size: 12px; }
    .rev-line { width: 2px; flex: 1; min-height: 28px; background: #E2E8F0; margin: 4px 0; }
    .rev-content { flex: 1; padding-bottom: 1.25rem; }
    .rev-header-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.25rem;
    }
    .rev-label { font-size: 0.875rem; font-weight: 700; color: #0F172A; }
    .rev-date { font-size: 0.8125rem; color: #94A3B8; }
    .rev-by { font-size: 0.8125rem; color: #475569; }
    .rev-change { font-size: 0.8125rem; color: #64748B; margin: 0.25rem 0 0; }

    /* ── APPROVALS tab ───────────────────────────────────────────────── */
    .approval-card { padding: 0; }
    .approval-stepper { padding: 1.25rem; display: flex; flex-direction: column; }
    .approval-step { display: flex; gap: 0.875rem; }
    .step-col { display: flex; flex-direction: column; align-items: center; }
    .step-circle {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .step-done     { background: #DCFCE7; color: #166534; border: 2px solid #86EFAC; }
    .step-rejected { background: #FEE2E2; color: #991B1B; border: 2px solid #FCA5A5; }
    .step-active   { background: #EFF6FF; color: #1D4ED8; border: 2px dashed #93C5FD; }
    .step-pending  { background: #F8FAFC; color: #94A3B8; border: 2px solid #E2E8F0; }
    .step-line { width: 2px; flex: 1; min-height: 32px; background: #E2E8F0; margin: 4px 0; }
    .step-line-done { background: #86EFAC; }
    .step-body { flex: 1; padding-bottom: 1.75rem; }
    .step-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .step-name { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .step-role-chip {
      background: #F1F5F9;
      color: #475569;
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 11px;
    }
    .esign-req-chip {
      background: #EFF6FF;
      color: #1D4ED8;
      border: 1px solid #BFDBFE;
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
    }
    .step-status {
      font-size: 0.8125rem;
      font-weight: 500;
      display: flex;
      align-items: center;
    }
    .status-approved { color: #059669; }
    .status-rejected { color: #DC2626; }
    .status-active   { color: #2563EB; }
    .status-pending  { color: #94A3B8; }
    .step-meta {
      font-size: 0.8125rem;
      color: #64748B;
      margin-top: 0.375rem;
      display: flex;
      align-items: center;
    }
    .esign-done-chip {
      background: #ECFDF5;
      color: #065F46;
      border: 1px solid #A7F3D0;
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
    }
    .step-comment {
      font-size: 0.8125rem;
      color: #475569;
      font-style: italic;
      background: #F8FAFC;
      border-left: 3px solid #E2E8F0;
      padding: 0.375rem 0.75rem;
      border-radius: 0 4px 4px 0;
      margin: 0.375rem 0 0;
    }

    /* ── DISTRIBUTION tab ───────────────────────────────────────────── */
    .ack-progress-wrap { padding: 1rem 1.25rem; border-bottom: 1px solid #F1F5F9; }
    .ack-progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      color: #475569;
      margin-bottom: 0.375rem;
    }
    .ack-bar {
      height: 8px;
      background: #F1F5F9;
      border-radius: 4px;
      overflow: hidden;
    }
    .ack-fill {
      height: 100%;
      background: #2563EB;
      border-radius: 4px;
      transition: width 600ms ease;
    }
    .ack-fill-complete { background: #059669; }
    .role-chip {
      background: #F1F5F9;
      color: #475569;
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 11px;
    }

    /* ── CLAUSES tab ────────────────────────────────────────────────── */
    .clauses-card { padding: 0; }
    .clause-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 1.25rem;
    }
    .clause-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 1rem 1.25rem;
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 10px;
      cursor: pointer;
      min-width: 100px;
      transition: all 150ms;
      &:hover { background: #DBEAFE; border-color: #93C5FD; transform: translateY(-1px); }
    }
    .clause-num { font-size: 1.125rem; font-weight: 700; color: #1D4ED8; }
    .clause-link-label { font-size: 0.75rem; color: #3B82F6; display: flex; align-items: center; }
    .linked-row {
      cursor: pointer;
      transition: background 100ms;
      &:hover { background: #F8FAFC; }
    }

    /* ── HISTORY tab ────────────────────────────────────────────────── */
    .history-card { padding: 0; }
    .history-timeline {
      list-style: none;
      padding: 1.25rem;
      margin: 0;
      display: flex;
      flex-direction: column;
    }
    .history-item {
      display: flex;
      gap: 0.75rem;
      position: relative;
    }
    .hist-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    .hist-body { flex: 1; padding-bottom: 1.5rem; }
    .hist-action { font-size: 0.875rem; color: #334155; }
    .hist-actor { font-weight: 600; color: #0F172A; margin-right: 0.25rem; }
    .hist-detail { font-weight: 600; color: #2563EB; margin-left: 0.25rem; }
    .hist-time { font-size: 0.75rem; color: #94A3B8; display: block; margin-top: 0.125rem; }
    .hist-line {
      position: absolute;
      left: 15px;
      top: 38px;
      width: 2px;
      height: calc(100% - 14px);
      background: #E2E8F0;
    }

    /* ── Empty states ───────────────────────────────────────────────── */
    .empty-state {
      padding: 3rem 1.25rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .empty-icon { font-size: 2.5rem; color: #CBD5E1; }
    .empty-title { font-size: 1rem; font-weight: 600; color: #475569; margin: 0; }
    .empty-desc { font-size: 0.875rem; color: #94A3B8; max-width: 400px; margin: 0; }

    /* ── Help drawer ────────────────────────────────────────────────── */
    .help-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.25);
      z-index: 300;
    }
    .help-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 380px;
      background: #fff;
      border-left: 1px solid #E2E8F0;
      box-shadow: -8px 0 32px rgba(0,0,0,0.1);
      z-index: 301;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideIn 200ms ease;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .help-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      border-bottom: 1px solid #F1F5F9;
      flex-shrink: 0;
    }
    .help-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0F172A;
      margin: 0;
      display: flex;
      align-items: center;
    }
    .help-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #64748B;
      font-size: 1rem;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover { background: #F1F5F9; color: #0F172A; }
    }
    .help-body { overflow-y: auto; flex: 1; padding: 1.25rem; }
    .help-section { margin-bottom: 1.5rem; }
    .help-section h3 { font-size: 0.875rem; font-weight: 700; color: #0F172A; margin: 0 0 0.75rem; }
    .help-section p { font-size: 0.875rem; color: #475569; margin: 0; line-height: 1.6; }
    .help-dl { margin: 0; }
    .help-entry {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      margin-bottom: 0.75rem;
      dt { flex-shrink: 0; min-width: 100px; }
      dd { font-size: 0.8125rem; color: #64748B; margin: 0; line-height: 1.5; }
    }
    .help-list {
      list-style: none;
      padding: 0;
      margin: 0;
      li {
        font-size: 0.8125rem;
        color: #475569;
        padding: 0.25rem 0;
        padding-left: 1rem;
        position: relative;
        &::before { content: '·'; position: absolute; left: 0; color: #94A3B8; }
      }
    }

    /* ── Toast ──────────────────────────────────────────────────────── */
    .action-toast {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      background: #0F172A;
      color: #fff;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      z-index: 400;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      animation: fadeUp 200ms ease;
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateX(-50%) translateY(8px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    /* ── Shared utils ───────────────────────────────────────────────── */
    .fw-600 { font-weight: 600; }
    .fw-700 { font-weight: 700; }
    .text-muted-sm { font-size: 0.8125rem; color: #94A3B8; }
    .chip-sm { font-size: 11px !important; padding: 2px 8px !important; }
    .btn-xs { font-size: 11px; padding: 2px 8px; }
    .current-badge {
      font-size: 11px;
      background: #DCFCE7;
      color: #166534;
      border-radius: 4px;
      padding: 2px 6px;
      font-weight: 600;
    }
    .my-4 { margin-top: 1rem; margin-bottom: 1rem; }

    /* ── Responsive ─────────────────────────────────────────────────── */
    @media (max-width: 900px) {
      .content-grid { grid-template-columns: 1fr; }
      .pdf-preview-area { height: 300px; }
      .header-main { flex-direction: column; }
      .header-actions { justify-content: flex-start; }
    }
    @media (max-width: 640px) {
      .doc-detail-root { padding: 0.75rem; }
      .doc-title { font-size: 1rem; }
      .workflow-bar { display: none; }
      .help-drawer { width: 100%; }
      .action-label { display: none; }
    }

    /* ── data-tip tooltips ──────────────────────────────────────────── */
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

    /* ── Print ──────────────────────────────────────────────────────── */
    @media print {
      .header-actions, .tab-rail, .workflow-bar, .breadcrumb-bar .help-trigger-btn,
      .help-overlay, .help-drawer, .action-toast, .overflow-wrap { display: none !important; }
    }
  `]
})
export class DocumentDetailComponent implements OnInit {
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);
  private docStorage = inject(DocumentStorageService);
  private permStorage = inject(PermissionStorageService);
  private workflowStorage = inject(WorkflowStorageService);
  private configStorage = inject(ConfigurationStorageService);
  private fileStore = inject(DocumentFileStoreService);
  private sanitizer = inject(DomSanitizer);

  readonly docId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly activeTab = signal<string>('content');
  readonly loading = signal(true);
  readonly toast = signal('');
  readonly helpOpen = signal(false);
  readonly overflowOpen = signal(false);

  // Config + permissions come from storage services — swap bodies for API calls
  readonly config = this.configStorage.documentDetailConfig;
  readonly permissions = this.permStorage.documentPermissions;

  // Raw document signal (always live); masked by loading state for the template
  private readonly _docRaw = this.docStorage.getById(this.docId);
  readonly doc = computed(() => this.loading() ? undefined : this._docRaw());

  // ── Derived metadata ─────────────────────────────────────────────────────
  readonly ownerColor = computed(() => {
    const d = this.doc();
    if (!d) return '#64748B';
    return this.docStorage.getUserByInitials(d.ownerInitials)?.avatarColor ?? '#64748B';
  });

  readonly siteName = computed(() => {
    const d = this.doc();
    return d ? this.docStorage.getSiteName(d.siteId) : '';
  });

  readonly docTier = computed(() => {
    const d = this.doc();
    return d ? this.workflowStorage.getTier(d.type) : 3;
  });

  readonly statusConfig = computed(() => {
    return this.config().statuses.find(s => s.value === this.doc()?.status);
  });

  readonly pdfFilename = computed(() => {
    const d = this.doc();
    return d ? `${d.id}-Rev${d.revision}.pdf` : `${this.docId}.pdf`;
  });

  readonly pdfBlobUrl = signal<string | null>(null);

  readonly pdfUrl = computed((): SafeResourceUrl | null => {
    const url = this.pdfBlobUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  readonly pdfZoom = signal(1.0);

  readonly clauses = computed(() => this.doc()?.clauses ?? []);

  readonly relatedDocs = computed(() =>
    this.docStorage.getRelatedDocuments(this.docId)
  );

  // ── Metadata field groups (split by section from config) ─────────────────
  readonly detailsFields = computed(() =>
    this.config().metadataFields
      .filter(f => f.section === 'details')
      .sort((a, b) => a.order - b.order)
  );

  readonly reviewFields = computed(() =>
    this.config().metadataFields
      .filter(f => f.section === 'review')
      .sort((a, b) => a.order - b.order)
  );

  metaValue(key: string): string {
    const d = this.doc();
    if (!d) return '—';
    switch (key) {
      case 'type':        return d.type;
      case 'site':        return this.siteName();
      case 'areas':       return d.areas ?? '—';
      case 'parts':       return d.parts ?? '—';
      case 'nextReview':  return d.nextReview ?? '—';
      case 'reviewCycle': return d.reviewCycle ? String(d.reviewCycle) : '—';
      default:            return '—';
    }
  }

  // ── Review urgency indicator ──────────────────────────────────────────────
  readonly reviewUrgencyClass = computed(() => {
    const days = this.doc()?.daysUntilReview ?? 999;
    if (days <= 0)   return 'review-urgent';
    if (days <= 30)  return 'review-urgent';
    if (days <= 60)  return 'review-warn';
    return 'review-ok';
  });

  reviewUrgencyTooltip(): string {
    const days = this.doc()?.daysUntilReview ?? 999;
    if (days <= 0)  return `Review is OVERDUE by ${Math.abs(days)} days — action required`;
    if (days <= 30) return `Review due in ${days} days — action required`;
    if (days <= 60) return `Review due in ${days} days — plan ahead`;
    return `Review due in ${days} days`;
  }

  // ── Workflow pipeline stages ──────────────────────────────────────────────
  readonly sortedStages = computed(() =>
    [...this.config().workflowStages].sort((a, b) => a.order - b.order)
  );

  readonly activeStageIndex = computed(() => {
    const status = this.doc()?.status ?? 'Draft';
    const idx = this.sortedStages().findIndex(s => s.statuses.includes(status));
    return idx >= 0 ? idx : 0;
  });

  getStageClass(index: number): string {
    const active = this.activeStageIndex();
    if (index < active)  return 'stage-done';
    if (index === active) return 'stage-active';
    return 'stage-pending';
  }

  // ── Action rendering ─────────────────────────────────────────────────────
  // All actions always render; disabled + tooltip explains why when not permitted.
  private _resolveActions(actions: ActionConfig[]): ResolvedAction[] {
    const doc = this.doc();
    const perms = this.permissions();
    return actions.map(a => {
      const hasPerm = perms.has(a.requiredPermission);
      const statusOk = !a.allowedStatuses || (doc != null && a.allowedStatuses.includes(doc.status));
      const enabled = hasPerm && statusOk;
      let tooltipToShow = a.tooltip;
      if (!hasPerm) {
        tooltipToShow = a.disabledTooltip;
      } else if (!statusOk && a.allowedStatuses && doc) {
        tooltipToShow = a.disabledStatusTooltip
          ?? `This action is only available when the document is ${a.allowedStatuses.join(' or ')} — current status is ${doc.status}.`;
      }
      return { ...a, enabled, tooltipToShow };
    });
  }

  readonly renderedPrimaryActions = computed(() =>
    this._resolveActions(this.config().primaryActions)
  );

  readonly renderedOverflowActions = computed(() =>
    this._resolveActions(this.config().overflowActions)
  );

  // Convenient shorthand for distribute button in empty-distribution state
  readonly canDistribute = computed(() =>
    this.permissions().has('doc.distribute')
  );

  // ── Revisions ─────────────────────────────────────────────────────────────
  readonly revisions = computed(() => {
    const d = this.doc();
    if (!d) return [];
    if (d.revisions?.length) {
      return d.revisions.map((r, i) => ({
        rev: r.rev,
        status: r.status,
        chipClass: this._statusChip(r.status),
        date: r.releasedDate ?? '—',
        by: r.releasedBy ?? '—',
        change: r.changeSummary,
        current: i === 0,
      }));
    }
    const changeLabel =
      d.status === 'Draft'       ? 'Draft created' :
      d.status === 'In Approval' ? 'Submitted for approval' :
      'Initial release';
    return [{
      rev: d.revision,
      status: d.status,
      chipClass: this.statusConfig()?.chipClass ?? 'chip-minor',
      date: d.lastReviewed ?? '—',
      by: d.owner,
      change: changeLabel,
      current: true,
    }];
  });

  compareDefaultParams() {
    const revs = this.revisions();
    const newer = revs[0]?.rev ?? '';
    const older = revs[1]?.rev ?? revs[0]?.rev ?? '';
    return { rev1: older, rev2: newer };
  }

  // ── Approval steps ────────────────────────────────────────────────────────
  readonly approvalSteps = computed(() => {
    const d = this.doc();
    if (!d) return [];
    const chain = this.workflowStorage.getApprovalChain(d.type);
    const ownerUser = this.docStorage.getUserByInitials(d.ownerInitials);
    const qmUser = this.docStorage.getUserBySiteAndRole(d.siteId, 'QM')
                ?? this.docStorage.getUserBySiteAndRole(d.siteId, 'Director');
    const submitted = d.status !== 'Draft';
    const approved  = ['Released', 'Superseded', 'Obsolete'].includes(d.status);

    return chain.map(chainStep => {
      const isAuthor = chainStep.role === 'Author';
      const approver = isAuthor
        ? d.owner
        : (qmUser?.fullName ?? 'Quality Manager');
      const initials = isAuthor
        ? d.ownerInitials
        : (qmUser?.initials ?? 'QM');
      const color = isAuthor
        ? (ownerUser?.avatarColor ?? '#64748B')
        : (qmUser?.avatarColor ?? '#2563EB');

      const done = isAuthor ? submitted : approved;
      const active = !done && (isAuthor ? !submitted : submitted && !approved);

      return {
        step:         chainStep.step,
        role:         chainStep.role,
        requiresESign:chainStep.requiresESign,
        approver,
        initials,
        color,
        done,
        rejected:     false,
        active,
        action:       isAuthor ? 'Submitted for Approval' : 'Approved & Released',
        date:         done ? (d.lastReviewed ?? '') : '',
        esigned:      done && chainStep.requiresESign,
        comment:      '',
      };
    });
  });

  // ── Distribution ──────────────────────────────────────────────────────────
  readonly recipients = computed(() => this.doc()?.recipients ?? []);
  readonly ackCount = computed(() =>
    this.recipients().filter(r => r.status === 'Acknowledged').length
  );
  readonly ackPct = computed(() => {
    const total = this.recipients().length;
    return total > 0 ? Math.round((this.ackCount() / total) * 100) : 0;
  });
  readonly pendingAckCount = computed(() =>
    this.recipients().filter(r => r.status !== 'Acknowledged').length
  );

  ackStatusChip(status: string): string {
    switch (status) {
      case 'Acknowledged': return 'chip-released';
      case 'Overdue':      return 'chip-major';
      default:             return 'chip-in-approval';
    }
  }

  ackStatusTooltip(status: string): string {
    switch (status) {
      case 'Acknowledged':
        return 'Acknowledged — this recipient has formally confirmed receipt of the controlled document.';
      case 'Overdue':
        return 'Overdue — this recipient has not acknowledged within the required timeframe. Use the Nudge button to send a reminder.';
      default:
        return 'Pending — this recipient has been notified but has not yet confirmed receipt of the document.';
    }
  }

  readonly statusTooltip = computed(() => {
    const d = this.doc();
    if (!d) return '';
    switch (d.status) {
      case 'Draft':
        return `Draft — being authored, not yet submitted for approval. Only the document owner (${d.owner}) can edit it. Submit for approval when the content is ready.`;
      case 'In Approval':
        return `In Approval — submitted and awaiting e-signature from the designated approvers in sequence. Editing is locked until the review is resolved. Check the Approvals tab to see who is next.`;
      case 'Released':
        return `Released on ${d.lastReviewed ?? 'unknown date'} — this is the current active controlled version that must be followed at the point of use. Review due by ${d.nextReview ?? 'not set'}.`;
      case 'Superseded':
        return `Superseded — a newer revision is now active. This version is retained for audit and traceability only. It should not be used for production. Check the Revisions tab for the current version.`;
      case 'Obsolete':
        return `Obsolete — this document has been retired and is no longer valid for production use. It is stored in the archive for historical and regulatory compliance purposes.`;
      default:
        return `Status: ${d.status}`;
    }
  });

  revStatusTooltip(status: string): string {
    switch (status) {
      case 'Released':
        return 'Released — this was the active controlled version when it was current.';
      case 'Superseded':
        return 'Superseded — this revision was replaced by a newer version. Retained for audit and traceability only.';
      case 'In Approval':
        return 'In Approval — this revision is currently in the approval queue awaiting e-signatures.';
      case 'Draft':
        return 'Draft — this revision is still being authored and has not yet been submitted for approval.';
      case 'Obsolete':
        return 'Obsolete — this revision has been retired and is no longer valid for production use.';
      default:
        return status;
    }
  }

  stepCircleTooltip(step: { done: boolean; rejected: boolean; active: boolean; approver: string; action: string; date: string; role: string }): string {
    if (step.done)     return `${step.action} by ${step.approver} (${step.role})${step.date ? ' on ' + step.date : ''}.`;
    if (step.rejected) return `Rejected by ${step.approver} (${step.role}). The document must be revised and resubmitted.`;
    if (step.active)   return `Waiting for ${step.approver} (${step.role}) to review and e-sign. No action needed from others until this step is complete.`;
    return `Pending — this step will become active once all earlier approvers have signed.`;
  }

  // ── History / Audit trail ─────────────────────────────────────────────────
  readonly history = computed(() => {
    const d = this.doc();
    if (!d) return [];
    if (d.history?.length) return d.history;
    // Build synthetic trail from document state
    const color = this.docStorage.getUserByInitials(d.ownerInitials)?.avatarColor ?? '#64748B';
    const events: { id: string; actor: string; actorInitials: string; actorColor: string; action: string; detail?: string; timestamp: string }[] = [];
    if (['Released', 'Superseded', 'Obsolete'].includes(d.status)) {
      events.push({ id: 'H2', actor: d.owner, actorInitials: d.ownerInitials, actorColor: color, action: 'approved and released document', detail: 'Rev ' + d.revision, timestamp: d.lastReviewed ?? '' });
      events.push({ id: 'H1', actor: d.owner, actorInitials: d.ownerInitials, actorColor: color, action: 'submitted document for approval', detail: 'Rev ' + d.revision, timestamp: d.lastReviewed ?? '' });
    } else if (d.status === 'In Approval') {
      events.push({ id: 'H1', actor: d.owner, actorInitials: d.ownerInitials, actorColor: color, action: 'submitted document for approval', detail: 'Rev ' + d.revision, timestamp: d.lastReviewed ?? '' });
    }
    events.push({ id: 'H0', actor: d.owner, actorInitials: d.ownerInitials, actorColor: color, action: 'created document', detail: 'Rev ' + d.revision, timestamp: d.lastReviewed ?? 'Recently' });
    return events;
  });

  // ── Misc helpers ─────────────────────────────────────────────────────────
  watermarkTitle(): string {
    const text = this.config().pdfViewer.watermarkText;
    return `A "${text}" watermark is applied when printing to identify this as a controlled document`;
  }

  isSupersededRevision(): boolean {
    return this.route.snapshot.queryParamMap.get('rev') === 'B';
  }

  // ── Action handler ────────────────────────────────────────────────────────
  onAction(key: string): void {
    switch (key) {
      case 'approve':   this.router.navigate(['/documents', this.docId, 'approve']); break;
      case 'revise':    this.router.navigate(['/documents', this.docId, 'edit']); break;
      case 'distribute':this.router.navigate(['/documents', this.docId, 'distribution']); break;
      case 'print':     window.print(); break;
      case 'mobile':    this.router.navigate(['/d', this.docId]); break;
      case 'compare':   this.router.navigate(['/documents', this.docId, 'compare']); break;
      case 'obsolete':  this.router.navigate(['/documents', this.docId, 'obsolete']); break;
      case 'export':    this._exportMetadata(); break;
    }
    this.overflowOpen.set(false);
  }

  onNudge(): void {
    const pendingIds = this.recipients()
      .filter(r => r.status !== 'Acknowledged')
      .map(r => r.id);
    this.docStorage.sendNudge(this.docId, pendingIds);
    const count = pendingIds.length;
    this.toast.set(`Reminders sent to ${count} unacknowledged recipient${count !== 1 ? 's' : ''}`);
    setTimeout(() => this.toast.set(''), 3500);
  }

  ngOnInit(): void {
    setTimeout(() => this.loading.set(false), 280);
    this.fileStore.load(this.docId).then(url => {
      if (url) this.pdfBlobUrl.set(url);
    });
  }

  // Close overflow menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.overflow-wrap')) {
      this.overflowOpen.set(false);
    }
  }

  private _statusChip(status: string): string {
    return this.config().statuses.find(s => s.value === status)?.chipClass ?? 'chip-minor';
  }

  private _exportMetadata(): void {
    const d = this.doc();
    if (!d) return;
    const rows = [
      ['Field', 'Value'],
      ['ID', d.id],
      ['Title', d.title],
      ['Revision', d.revision],
      ['Type', d.type],
      ['Status', d.status],
      ['Owner', d.owner],
      ['Site', this.siteName()],
      ['Areas', d.areas ?? ''],
      ['Parts', d.parts ?? ''],
      ['Review Due', d.nextReview ?? ''],
      ['Review Cycle (months)', String(d.reviewCycle ?? '')],
      ['IATF Clauses', (d.clauses ?? []).join(', ')],
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${d.id}-metadata.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.set(`Metadata exported as ${d.id}-metadata.csv`);
    setTimeout(() => this.toast.set(''), 3500);
  }

  zoomIn(): void {
    this.pdfZoom.update(z => Math.min(+(z + 0.25).toFixed(2), 3.0));
  }

  zoomOut(): void {
    this.pdfZoom.update(z => Math.max(+(z - 0.25).toFixed(2), 0.25));
  }

  openFullscreen(): void {
    const url = this.pdfBlobUrl();
    if (url) window.open(url, '_blank');
  }

  downloadPdf(): void {
    const url = this.pdfBlobUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = this.pdfFilename();
    a.click();
  }
}
