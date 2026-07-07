import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { LPARun } from '../../../shared/interfaces/models';
import { AuthStore } from '../../../core/auth/stores/auth.store';

interface AreaCell {
  area: string;
  layer: string;
  score: number;
  runId?: string;
  runs: LPARun[];
}

@Component({
  selector: 'app-lpa-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="lpa-page">

      <!-- ── Page header ─────────────────────────────────────────────────────── -->
      <div class="ph-row">
        <div>
          <div class="ph-eyebrow"><i class="bi bi-layers me-1"></i>Layered Process Audit</div>
          <h1 class="ph-title">LPA Dashboard</h1>
          <p class="ph-sub">
            <span>{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
            <span class="ph-sep">·</span>
            <span>{{ siteName() }}</span>
            <span class="ph-sep">·</span>
            <span class="lpa-role-chip"
                  [style.color]="lpaLayerChip().color"
                  [style.background]="lpaLayerChip().bg">
              {{ lpaLayerLabel() }}
            </span>
          </p>
        </div>
        <div class="ph-actions">
          <span class="chip chip-blue">SCR-057</span>
          @if (canSetup()) {
            <button class="btn btn-sm btn-outline-secondary" [routerLink]="['/lpa/setup']">
              <i class="bi bi-gear me-1"></i>Setup
            </button>
          }
          @if (canRunAdhoc()) {
            <button class="btn btn-sm btn-outline-warning" (click)="openAdhocModal()">
              <i class="bi bi-lightning me-1"></i>Ad-hoc Run
            </button>
          }
          <button class="btn btn-sm btn-primary" [routerLink]="['/lpa/run', nextPendingRunId()]">
            <i class="bi bi-play-fill me-1"></i>Start Run
          </button>
        </div>
      </div>

      <!-- ── KPI row ──────────────────────────────────────────────────────────── -->
      <div class="kpi-row">

        <!-- Compliance Rate -->
        <div class="kpi-card kc-green">
          <div class="kc-top">
            <div class="kc-icon ic-green"><i class="bi bi-shield-check"></i></div>
            <svg class="kc-donut" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="18" fill="none" stroke="#DCFCE7" stroke-width="6"/>
              <circle cx="24" cy="24" r="18" fill="none" stroke="#22C55E" stroke-width="6"
                      [attr.stroke-dasharray]="miniCircumference"
                      [attr.stroke-dashoffset]="miniComplianceOffset()"
                      stroke-linecap="round" transform="rotate(-90 24 24)"/>
            </svg>
          </div>
          <div class="kc-label">Compliance Rate</div>
          <div class="kc-value">{{ compliancePct() }}<span class="kc-unit">%</span></div>
          <div class="kc-sub">{{ completedCount() }} runs scored 100%</div>
        </div>

        <!-- Completion Rate -->
        <div class="kpi-card kc-blue">
          <div class="kc-top">
            <div class="kc-icon ic-blue"><i class="bi bi-clipboard-check"></i></div>
            <svg class="kc-donut" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="18" fill="none" stroke="#DBEAFE" stroke-width="6"/>
              <circle cx="24" cy="24" r="18" fill="none" stroke="#3B82F6" stroke-width="6"
                      [attr.stroke-dasharray]="miniCircumference"
                      [attr.stroke-dashoffset]="miniCompletionOffset()"
                      stroke-linecap="round" transform="rotate(-90 24 24)"/>
            </svg>
          </div>
          <div class="kc-label">Completion Rate</div>
          <div class="kc-value">{{ completionPct() }}<span class="kc-unit">%</span></div>
          <div class="kc-sub">{{ completedCount() }} of {{ visibleRuns().length }} runs done</div>
        </div>

        <!-- Run Status -->
        <div class="kpi-card kc-slate">
          <div class="kc-top">
            <div class="kc-icon ic-slate"><i class="bi bi-bar-chart-steps"></i></div>
          </div>
          <div class="kc-label">Run Status</div>
          <div class="kc-stat-row">
            <div class="kc-stat">
              <div class="kc-stat-num kc-done">{{ completedCount() }}</div>
              <div class="kc-stat-lbl">Done</div>
              <div class="kc-stat-bar" style="background:#22C55E"></div>
            </div>
            <div class="kc-divider"></div>
            <div class="kc-stat">
              <div class="kc-stat-num kc-pending">{{ pendingCount() }}</div>
              <div class="kc-stat-lbl">Pending</div>
              <div class="kc-stat-bar" style="background:#F59E0B"></div>
            </div>
            <div class="kc-divider"></div>
            <div class="kc-stat">
              <div class="kc-stat-num kc-overdue">{{ overdueCount() }}</div>
              <div class="kc-stat-lbl">Overdue</div>
              <div class="kc-stat-bar" style="background:#DC2626"></div>
            </div>
          </div>
        </div>

        <!-- Open Findings -->
        <div class="kpi-card kc-red">
          <div class="kc-top">
            <div class="kc-icon ic-red"><i class="bi bi-exclamation-triangle"></i></div>
          </div>
          <div class="kc-label">Open Findings</div>
          <div class="kc-value kc-findings">{{ openFindingCount() }}</div>
          <div class="kc-sub">Overdue + partial completions</div>
        </div>

      </div>

      <!-- ── Main grid ─────────────────────────────────────────────────────────── -->
      <div class="main-grid">

        <!-- LEFT: Heatmap + Recent Runs -->
        <div class="left-col">

          <!-- Heatmap -->
          <div class="q-card hm-card">
            <div class="chr">
              <div class="chr-left">
                <div class="chr-icon" style="background:#EDE9FE;color:#5B21B6">
                  <i class="bi bi-grid-3x3-gap"></i>
                </div>
                <h2 class="chr-title">Area Compliance Heatmap</h2>
              </div>
              <div class="chr-right">
                <div class="hm-legend">
                  <span class="hl-item">
                    <span class="hl-sw" style="background:#DCFCE7;border-color:#86EFAC"></span>90–100%
                  </span>
                  <span class="hl-item">
                    <span class="hl-sw" style="background:#FEF9C3;border-color:#FDE68A"></span>70–89%
                  </span>
                  <span class="hl-item">
                    <span class="hl-sw" style="background:#FEE2E2;border-color:#FCA5A5"></span>&lt;70%
                  </span>
                  <span class="hl-item">
                    <span class="hl-sw" style="background:#F1F5F9;border-color:#E2E8F0"></span>No data
                  </span>
                </div>
                <span class="chip chip-purple ms-2">{{ heatmapCells().length }} areas</span>
              </div>
            </div>
            <div class="heatmap-grid">
              @for (cell of heatmapCells(); track cell.area + cell.layer) {
                <div class="hm-cell" [style.background]="heatColor(cell.score)" (click)="selectCell(cell)">
                  <div class="hm-cell-top">
                    <span class="hm-layer-badge"
                          [style.background]="layerBadgeBg(cell.layer)"
                          [style.color]="layerBadgeColor(cell.layer)">
                      {{ cell.layer }}
                    </span>
                    <span class="hm-dot" [style.background]="scoreDotColor(cell.score)"></span>
                  </div>
                  <div class="hm-area">{{ cell.area }}</div>
                  <div class="hm-score" [style.color]="scoreTextColor(cell.score)">
                    {{ cell.score === 0 ? '—' : cell.score + '%' }}
                  </div>
                </div>
              }
              @empty {
                <div class="hm-empty">No areas assigned to your role</div>
              }
            </div>
          </div>

          <!-- Recent Runs -->
          <div class="q-card runs-card">
            <div class="chr">
              <div class="chr-left">
                <div class="chr-icon" style="background:#DBEAFE;color:#2563EB">
                  <i class="bi bi-clock-history"></i>
                </div>
                <h2 class="chr-title">Recent Runs</h2>
              </div>
              <span class="chip chip-blue">{{ recentRuns().length }}</span>
            </div>
            <div class="runs-list">
              @for (run of recentRuns(); track run.id) {
                <a class="run-row" [routerLink]="['/lpa/run', run.id]">
                  <div class="run-layer-sq"
                       [style.background]="layerBadgeBg(run.layer)"
                       [style.color]="layerBadgeColor(run.layer)">
                    {{ run.layer }}
                  </div>
                  <div class="run-info">
                    <div class="run-title">{{ run.title }}</div>
                    <div class="run-meta">
                      <span>{{ run.zone }}</span>
                      <span class="sep">·</span>
                      <span>{{ run.dueDate | date:'MMM d' }}</span>
                    </div>
                    @if (run.reviewedBy) {
                      <div class="run-reviewed-by">
                        <span class="avatar-xs" style="background:#0F766E">{{ run.reviewedByInitials }}</span>
                        <span>Reviewed by {{ run.reviewedBy }}</span>
                      </div>
                    }
                  </div>
                  <div class="run-right">
                    <div class="mini-bar-wrap">
                      <div class="mini-bar">
                        <div class="mini-bar-fill"
                             [style.width.%]="run.completionRate"
                             [style.background]="run.completionRate === 100 ? '#22C55E' : '#3B82F6'">
                        </div>
                      </div>
                      <span class="run-pct">{{ run.completionRate }}%</span>
                    </div>
                    <span [class]="statusChipClass(run.status)">{{ run.status }}</span>
                  </div>
                </a>
              }
              @empty {
                <div class="list-empty">
                  <i class="bi bi-inbox"></i> No runs in your scope yet
                </div>
              }
            </div>
          </div>

        </div>

        <!-- RIGHT: Missed Runs -->
        <div class="right-col">

          <div class="q-card missed-card">
            <div class="chr">
              <div class="chr-left">
                <div class="chr-icon" style="background:#FEE2E2;color:#DC2626">
                  <i class="bi bi-calendar-x"></i>
                </div>
                <h2 class="chr-title">Missed Runs</h2>
              </div>
              @if (missedRuns().length > 0) {
                <span class="chip chip-red">{{ missedRuns().length }} overdue</span>
              }
            </div>

            @if (missedRuns().length === 0) {
              <div class="missed-empty">
                <div class="missed-empty-icon"><i class="bi bi-check-circle-fill"></i></div>
                <div class="missed-empty-title">All on track!</div>
                <div class="missed-empty-sub">No overdue runs in your scope</div>
              </div>
            } @else {
              <div class="missed-list">
                @for (run of missedRuns(); track run.id) {
                  <a class="missed-item" [routerLink]="['/lpa/run', run.id]">
                    <div class="missed-layer"
                         [style.background]="layerBadgeBg(run.layer)"
                         [style.color]="layerBadgeColor(run.layer)">
                      {{ run.layer }}
                    </div>
                    <div class="missed-body">
                      <div class="missed-title">{{ run.title }}</div>
                      <div class="missed-meta">
                        <span class="record-id">{{ run.id }}</span>
                        <span class="sep">·</span>
                        <span>{{ run.zone }}</span>
                      </div>
                      <div class="missed-owner-row">
                        <span class="avatar-sm" style="background:#DC2626">{{ run.ownerInitials }}</span>
                        <span class="missed-owner-name">{{ run.owner }}</span>
                      </div>
                    </div>
                    <div class="missed-right">
                      <div class="overdue-days">{{ daysOverdue(run.dueDate) }}d</div>
                      <div class="overdue-lbl">overdue</div>
                      <span class="chip chip-red" style="margin-top:4px">{{ run.dueDate | date:'MMM d' }}</span>
                    </div>
                  </a>
                }
              </div>
            }
          </div>

          <!-- Completed Runs -->
          <div class="q-card completed-card">
            <div class="chr">
              <div class="chr-left">
                <div class="chr-icon" style="background:#DCFCE7;color:#16A34A">
                  <i class="bi bi-check-circle-fill"></i>
                </div>
                <h2 class="chr-title">Completed Runs</h2>
              </div>
              @if (completedRuns().length > 0) {
                <span class="chip chip-green">{{ completedRuns().length }}</span>
              }
            </div>

            @if (completedRuns().length === 0) {
              <div class="missed-empty">
                <div class="missed-empty-icon" style="background:#F0FDF4">
                  <i class="bi bi-clipboard-check" style="color:#22C55E"></i>
                </div>
                <div class="missed-empty-title">No completions yet</div>
                <div class="missed-empty-sub">Completed runs will appear here</div>
              </div>
            } @else {
              <div class="completed-list">
                @for (run of completedRuns(); track run.id) {
                  <a class="completed-item" [routerLink]="['/lpa/run', run.id]">
                    <div class="completed-layer"
                         [style.background]="layerBadgeBg(run.layer)"
                         [style.color]="layerBadgeColor(run.layer)">
                      {{ run.layer }}
                    </div>
                    <div class="completed-body">
                      <div class="completed-title">{{ run.title }}</div>
                      <div class="completed-meta">
                        <span class="record-id">{{ run.id }}</span>
                        <span class="sep">·</span>
                        <span>{{ run.zone }}</span>
                      </div>
                      <div class="completed-owner-row">
                        <span class="avatar-sm" style="background:#16A34A">{{ run.ownerInitials }}</span>
                        <span class="completed-owner-name">{{ run.owner }}</span>
                      </div>
                    </div>
                    <div class="completed-right">
                      <span class="chip {{ run.completionRate === 100 ? 'chip-green' : 'chip-amber' }}"
                            style="font-size:0.75rem;font-weight:700">
                        {{ run.completionRate }}%
                      </span>
                      @if (run.completedAt) {
                        <span class="completed-time">{{ run.completedAt | date:'MMM d · h:mm a' }}</span>
                      } @else if (run.completedDate) {
                        <span class="completed-time">{{ run.completedDate | date:'MMM d' }}</span>
                      }
                    </div>
                  </a>
                }
              </div>
            }
          </div>

        </div>
      </div>

      <!-- ── Slide-over detail panel ─────────────────────────────────────────── -->
      @if (selectedCell()) {
        <div class="slideover-backdrop" (click)="selectedCell.set(null)">
          <aside class="slideover-panel" (click)="$event.stopPropagation()">
            <div class="so-header">
              <div class="so-header-left">
                <div class="so-header-icon"
                     [style.background]="heatColor(selectedCell()!.score)">
                  <i class="bi bi-grid-3x3-gap" [style.color]="scoreTextColor(selectedCell()!.score)"></i>
                </div>
                <div>
                  <h3 class="so-title">{{ selectedCell()!.area }}</h3>
                  <span class="hm-layer-badge"
                        [style.background]="layerBadgeBg(selectedCell()!.layer)"
                        [style.color]="layerBadgeColor(selectedCell()!.layer)">
                    {{ selectedCell()!.layer }}
                  </span>
                </div>
              </div>
              <button class="so-close" (click)="selectedCell.set(null)">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <div class="so-body">
              <div class="so-score-block" [style.background]="heatColor(selectedCell()!.score)">
                <div class="so-score-num" [style.color]="scoreTextColor(selectedCell()!.score)">
                  {{ selectedCell()!.score === 0 ? '—' : selectedCell()!.score + '%' }}
                </div>
                <div class="so-score-lbl">Compliance Score</div>
              </div>
              <div class="so-details">
                <div class="so-detail-row">
                  <span class="so-dl-label"><i class="bi bi-building me-1"></i>Area</span>
                  <span class="so-dl-val">{{ selectedCell()!.area }}</span>
                </div>
                <div class="so-detail-row">
                  <span class="so-dl-label"><i class="bi bi-layers me-1"></i>Layer</span>
                  <span class="so-dl-val">
                    <span class="hm-layer-badge"
                          [style.background]="layerBadgeBg(selectedCell()!.layer)"
                          [style.color]="layerBadgeColor(selectedCell()!.layer)">
                      {{ selectedCell()!.layer }}
                    </span>
                  </span>
                </div>
                <div class="so-detail-row">
                  <span class="so-dl-label"><i class="bi bi-activity me-1"></i>Status</span>
                  <span class="so-dl-val"
                        [style.color]="scoreTextColor(selectedCell()!.score)">
                    {{ selectedCell()!.score >= 90 ? 'Compliant' : selectedCell()!.score >= 70 ? 'At Risk' : selectedCell()!.score === 0 ? 'No Data' : 'Non-Compliant' }}
                  </span>
                </div>
              </div>
              <div class="so-runs-section">
                <div class="so-runs-label">
                  <i class="bi bi-list-check me-1"></i>Runs in this Area
                  <span class="so-runs-count">{{ selectedCell()!.runs.length }}</span>
                </div>
                <div class="so-runs-list">
                  @for (run of selectedCell()!.runs; track run.id) {
                    <a class="so-run-row" [routerLink]="['/lpa/run', run.id]" (click)="selectedCell.set(null)">
                      <div class="so-run-info">
                        <div class="so-run-name">{{ run.title }}</div>
                        <div class="so-run-meta">
                          {{ run.dueDate | date:'MMM d' }}
                          <span class="sep">·</span>
                          {{ run.owner }}
                        </div>
                        @if (run.reviewedBy) {
                          <div class="run-reviewed-by">
                            <span class="avatar-xs" style="background:#0F766E">{{ run.reviewedByInitials }}</span>
                            <span>Reviewed by {{ run.reviewedBy }}</span>
                          </div>
                        }
                      </div>
                      <span [class]="statusChipClass(run.status)">{{ run.status }}</span>
                    </a>
                  }
                </div>
              </div>
              @if (selectedCell()!.runId) {
                <button class="btn btn-primary w-100"
                        [routerLink]="['/lpa/run', selectedCell()!.runId]"
                        (click)="selectedCell.set(null)">
                  <i class="bi bi-play-fill me-1"></i>Start LPA Run for this Area
                </button>
              } @else {
                <button class="btn btn-outline-secondary w-100" disabled>
                  <i class="bi bi-check-circle me-1"></i>No Active Run in this Area
                </button>
              }
            </div>
          </aside>
        </div>
      }

      <!-- ── Ad-hoc Run Modal ──────────────────────────────────────────────── -->
      @if (adhocModalOpen()) {
        <div class="ah-backdrop" (click)="closeAdhocModal()">
          <div class="ah-modal" (click)="$event.stopPropagation()">
            <div class="ah-header">
              <div class="ah-header-left">
                <div class="ah-icon"><i class="bi bi-lightning-charge"></i></div>
                <div>
                  <div class="ah-title">Start Ad-hoc LPA Run</div>
                  <div class="ah-sub">Unscheduled spot-check — results flow to your manager's board</div>
                </div>
              </div>
              <button class="ah-close" (click)="closeAdhocModal()"><i class="bi bi-x-lg"></i></button>
            </div>

            <div class="ah-body">

              <!-- Info callout -->
              <div class="ah-info-callout">
                <i class="bi bi-info-circle-fill ah-info-icon"></i>
                <span>Each layer uses a <strong>different question set</strong>. Picking a lower layer lets you
                  independently verify what that layer is supposed to catch — the core principle of LPA.</span>
              </div>

              <div class="ah-field">
                <label class="ah-label">Area to audit</label>
                <select class="form-select form-select-sm" [(ngModel)]="adhocZone">
                  <option value="" disabled>Select area…</option>
                  @for (zone of adhocZones(); track zone) {
                    <option [value]="zone">{{ zone }}</option>
                  }
                </select>
              </div>

              <div class="ah-field">
                <label class="ah-label">Audit layer
                  <span class="ah-label-hint">— determines which question set you'll answer</span>
                </label>
                <div class="ah-layer-group">
                  @for (opt of adhocLayerOptions(); track opt.value) {
                    <label class="ah-layer-opt" [class.selected]="adhocLayer === opt.value">
                      <input type="radio" name="adhocLayer" [value]="opt.value" [(ngModel)]="adhocLayer" />
                      <div class="ah-layer-left">
                        <span class="ah-layer-badge"
                              [style.background]="opt.bg"
                              [style.color]="opt.color">{{ opt.value }}</span>
                      </div>
                      <div class="ah-layer-content">
                        <div class="ah-layer-title">
                          <i class="bi {{ opt.icon }} me-1"></i>{{ opt.label }}
                        </div>
                        <div class="ah-layer-desc">{{ opt.desc }}</div>
                        <div class="ah-layer-tip">
                          <i class="bi bi-lightbulb me-1"></i>{{ opt.tip }}
                        </div>
                      </div>
                      <div class="ah-layer-check">
                        @if (adhocLayer === opt.value) {
                          <i class="bi bi-check-circle-fill"></i>
                        }
                      </div>
                    </label>
                  }
                </div>
              </div>

              <!-- Selected layer summary -->
              @if (adhocZone) {
                <div class="ah-summary">
                  <i class="bi bi-play-circle me-1"></i>
                  You will answer <strong>{{ adhocLayer }}</strong> questions for
                  <strong>{{ adhocZone }}</strong> — results are tagged as ad-hoc and
                  visible to your manager's board.
                </div>
              }

            </div>

            <div class="ah-footer">
              <button class="btn btn-sm btn-outline-secondary" (click)="closeAdhocModal()">Cancel</button>
              <button class="btn btn-sm btn-warning" [disabled]="!adhocZone" (click)="startAdhocRun()">
                <i class="bi bi-lightning me-1"></i>Start Run
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    /* ── Page ──────────────────────────────────────────────────────────────── */
    .lpa-page { padding: 1.5rem; max-width: 1280px; margin: 0 auto; }

    /* ── Page header ────────────────────────────────────────────────────────── */
    .ph-row {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
    }
    .ph-eyebrow {
      font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: #2563EB; margin-bottom: 0.25rem;
    }
    .ph-title { font-size: 1.375rem; font-weight: 800; color: #0F172A; margin: 0 0 0.3rem; }
    .ph-sub {
      font-size: 0.875rem; color: #64748B; margin: 0;
      display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap;
    }
    .ph-sep { color: #CBD5E1; }
    .lpa-role-chip {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.75rem; font-weight: 700; padding: 2px 8px;
      border-radius: 20px; white-space: nowrap;
    }
    .ph-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

    /* ── KPI row ────────────────────────────────────────────────────────────── */
    .kpi-row {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 1rem; margin-bottom: 1.25rem;
    }
    @media (max-width: 960px)  { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px)  { .kpi-row { grid-template-columns: 1fr; } }

    .kpi-card {
      background: #fff; border: 1px solid #E2E8F0; border-radius: 10px;
      padding: 1.125rem 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      display: flex; flex-direction: column; gap: 0.25rem;
      position: relative; overflow: hidden;
    }
    .kpi-card::after {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0;
      width: 4px; border-radius: 10px 0 0 10px;
    }
    .kc-green::after { background: #22C55E; }
    .kc-blue::after  { background: #3B82F6; }
    .kc-slate::after { background: #64748B; }
    .kc-red::after   { background: #DC2626; }

    .kc-top {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .kc-icon {
      width: 36px; height: 36px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
    }
    .ic-green  { background: #DCFCE7; color: #16A34A; }
    .ic-blue   { background: #DBEAFE; color: #2563EB; }
    .ic-slate  { background: #F1F5F9; color: #475569; }
    .ic-red    { background: #FEE2E2; color: #DC2626; }

    .kc-donut { width: 44px; height: 44px; flex-shrink: 0; }

    .kc-label {
      font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: #64748B;
    }
    .kc-value {
      font-size: 2rem; font-weight: 800; color: #0F172A; line-height: 1.1;
    }
    .kc-unit  { font-size: 1.125rem; font-weight: 600; color: #94A3B8; }
    .kc-findings { color: #DC2626; font-size: 2.5rem; }
    .kc-sub   { font-size: 0.75rem; color: #94A3B8; margin-top: 2px; }

    .kc-stat-row  { display: flex; align-items: flex-end; gap: 0; margin-top: 0.375rem; }
    .kc-stat      { flex: 1; text-align: center; }
    .kc-stat-num  { font-size: 1.625rem; font-weight: 800; line-height: 1; }
    .kc-done      { color: #16A34A; }
    .kc-pending   { color: #B45309; }
    .kc-overdue   { color: #DC2626; }
    .kc-stat-lbl  { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94A3B8; margin-top: 3px; }
    .kc-stat-bar  { height: 3px; border-radius: 2px; margin-top: 6px; }
    .kc-divider   { width: 1px; background: #F1F5F9; align-self: stretch; margin: 0 0.25rem; }

    /* ── Main grid ──────────────────────────────────────────────────────────── */
    .main-grid {
      display: grid; grid-template-columns: 1fr 360px;
      gap: 1rem; align-items: start;
    }
    @media (max-width: 1100px) { .main-grid { grid-template-columns: 1fr; } }
    .left-col  { display: flex; flex-direction: column; gap: 1rem; }
    .right-col { display: flex; flex-direction: column; gap: 1rem; }

    /* ── Card header row ────────────────────────────────────────────────────── */
    .chr {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1rem; gap: 0.5rem; flex-wrap: wrap;
    }
    .chr-left  { display: flex; align-items: center; gap: 0.5rem; }
    .chr-right { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .chr-icon  {
      width: 28px; height: 28px; border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8125rem; flex-shrink: 0;
    }
    .chr-title { font-size: 0.9375rem; font-weight: 700; color: #0F172A; margin: 0; }

    /* ── Heatmap ────────────────────────────────────────────────────────────── */
    .hm-card { padding: 1.25rem; }
    .hm-legend { display: flex; gap: 0.625rem; flex-wrap: wrap; }
    .hl-item {
      font-size: 0.75rem; color: #475569;
      display: flex; align-items: center; gap: 4px;
    }
    .hl-sw {
      width: 12px; height: 12px; border-radius: 3px;
      border: 1px solid transparent; flex-shrink: 0;
    }
    .heatmap-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
      gap: 0.625rem;
    }
    .hm-cell {
      border-radius: 10px; padding: 0.875rem 0.875rem 0.75rem;
      cursor: pointer; border: 1px solid rgba(0,0,0,0.05);
      transition: transform 120ms ease, box-shadow 120ms ease;
    }
    .hm-cell:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 14px rgba(0,0,0,0.1);
    }
    .hm-cell-top {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    .hm-layer-badge {
      font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.05em; padding: 2px 6px; border-radius: 10px;
    }
    .hm-dot   { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
    .hm-area  { font-size: 0.8125rem; font-weight: 600; color: #0F172A; line-height: 1.3; margin-bottom: 0.375rem; }
    .hm-score { font-size: 1.375rem; font-weight: 800; line-height: 1; }
    .hm-empty { grid-column: 1/-1; text-align: center; padding: 2rem; color: #94A3B8; font-size: 0.875rem; }

    /* ── Recent runs ────────────────────────────────────────────────────────── */
    .runs-card { padding: 1.25rem; }
    .runs-list { display: flex; flex-direction: column; }
    .run-row {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.625rem 0.5rem; border-radius: 8px;
      cursor: pointer; text-decoration: none;
      border-bottom: 1px solid #F8FAFC;
      transition: background 120ms;
    }
    .run-row:last-child { border-bottom: none; }
    .run-row:hover { background: #F8FAFC; }
    .run-layer-sq {
      width: 34px; height: 34px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.6875rem; font-weight: 800; flex-shrink: 0;
    }
    .run-info    { flex: 1; min-width: 0; }
    .run-title   {
      font-size: 0.875rem; font-weight: 500; color: #0F172A;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .run-meta    { font-size: 0.75rem; color: #94A3B8; margin-top: 2px; }
    .sep         { margin: 0 3px; color: #CBD5E1; }
    .run-right   { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; flex-shrink: 0; }
    .mini-bar-wrap { display: flex; align-items: center; gap: 5px; }
    .mini-bar    { width: 60px; height: 4px; background: #E2E8F0; border-radius: 2px; overflow: hidden; }
    .mini-bar-fill { height: 100%; border-radius: 2px; }
    .run-pct     { font-size: 0.6875rem; font-weight: 700; color: #475569; min-width: 28px; text-align: right; }
    .run-reviewed-by {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.6875rem; color: #0F766E; margin-top: 3px;
    }
    .avatar-xs {
      width: 16px; height: 16px; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.5rem; font-weight: 800; color: #fff; flex-shrink: 0;
    }
    .list-empty  {
      text-align: center; padding: 1.5rem; color: #94A3B8;
      font-size: 0.875rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    }

    /* ── Missed runs ────────────────────────────────────────────────────────── */
    .missed-card { padding: 1.25rem; }
    .missed-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .missed-item {
      display: flex; align-items: flex-start; gap: 0.75rem;
      padding: 0.875rem; border-radius: 10px;
      background: #FFFBFB; border: 1px solid #FEE2E2;
      cursor: pointer; text-decoration: none;
      transition: background 120ms, border-color 120ms;
    }
    .missed-item:hover { background: #FFF1F2; border-color: #FCA5A5; }
    .missed-layer {
      width: 34px; height: 34px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.6875rem; font-weight: 800; flex-shrink: 0; margin-top: 1px;
    }
    .missed-body   { flex: 1; min-width: 0; }
    .missed-title  {
      font-size: 0.8125rem; font-weight: 600; color: #1E293B;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .missed-meta   { font-size: 0.75rem; color: #64748B; margin-top: 2px; }
    .missed-owner-row {
      display: flex; align-items: center; gap: 5px; margin-top: 6px;
    }
    .missed-owner-name { font-size: 0.75rem; color: #475569; }
    .missed-right  { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
    .overdue-days  { font-size: 1.25rem; font-weight: 800; color: #DC2626; line-height: 1; }
    .overdue-lbl   { font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94A3B8; }
    .missed-empty  { text-align: center; padding: 2rem 1rem; }
    .missed-empty-icon {
      font-size: 2.25rem; color: #22C55E;
      background: #F0FDF4; width: 56px; height: 56px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 0.75rem;
    }
    .missed-empty-title { font-size: 0.9375rem; font-weight: 700; color: #0F172A; }
    .missed-empty-sub   { font-size: 0.8125rem; color: #94A3B8; margin-top: 4px; }

    /* ── Completed runs ─────────────────────────────────────────────────────── */
    .completed-card { padding: 1.25rem; }
    .completed-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .completed-item {
      display: flex; align-items: flex-start; gap: 0.75rem;
      padding: 0.875rem; border-radius: 10px;
      background: #F0FDF4; border: 1px solid #BBF7D0;
      cursor: pointer; text-decoration: none;
      transition: background 120ms, border-color 120ms;
    }
    .completed-item:hover { background: #DCFCE7; border-color: #86EFAC; }
    .completed-layer {
      width: 34px; height: 34px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.6875rem; font-weight: 800; flex-shrink: 0; margin-top: 1px;
    }
    .completed-body   { flex: 1; min-width: 0; }
    .completed-title  {
      font-size: 0.8125rem; font-weight: 600; color: #1E293B;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .completed-meta   { font-size: 0.75rem; color: #64748B; margin-top: 2px; }
    .completed-owner-row {
      display: flex; align-items: center; gap: 5px; margin-top: 6px;
    }
    .completed-owner-name { font-size: 0.75rem; color: #475569; }
    .completed-right  { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .completed-time   { font-size: 0.6875rem; color: #64748B; white-space: nowrap; }

    /* ── Slide-over ─────────────────────────────────────────────────────────── */
    .slideover-backdrop {
      position: fixed; inset: 0;
      background: rgba(15,23,42,0.45); z-index: 1040;
      display: flex; justify-content: flex-end;
      backdrop-filter: blur(2px);
    }
    .slideover-panel {
      width: 360px; max-width: 100%; background: #fff; height: 100%;
      display: flex; flex-direction: column;
      box-shadow: -16px 0 48px rgba(0,0,0,0.18);
      animation: slideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .so-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem; border-bottom: 1px solid #E2E8F0;
    }
    .so-header-left { display: flex; align-items: center; gap: 0.75rem; }
    .so-header-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.125rem; flex-shrink: 0;
    }
    .so-title  { font-size: 1rem; font-weight: 700; margin: 0 0 4px; color: #0F172A; }
    .so-close  {
      background: none; border: none; font-size: 1.125rem;
      color: #94A3B8; cursor: pointer; padding: 4px;
      border-radius: 6px; line-height: 1;
      &:hover { background: #F1F5F9; color: #475569; }
    }
    .so-body   { padding: 1.25rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem; }
    .so-score-block {
      border-radius: 12px; padding: 1.5rem; text-align: center;
    }
    .so-score-num  { font-size: 3.5rem; font-weight: 800; line-height: 1; }
    .so-score-lbl  { font-size: 0.875rem; color: #64748B; margin-top: 4px; }
    .so-details    { display: flex; flex-direction: column; gap: 0; border: 1px solid #F1F5F9; border-radius: 10px; overflow: hidden; }
    .so-detail-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.75rem 1rem; border-bottom: 1px solid #F1F5F9;
      &:last-child { border-bottom: none; }
    }
    .so-dl-label { font-size: 0.8125rem; color: #94A3B8; }
    .so-dl-val   { font-size: 0.875rem; font-weight: 600; color: #0F172A; }

    /* ── Slide-over runs list ─────────────────────────────────────────────────── */
    .so-runs-section { display: flex; flex-direction: column; gap: 0.5rem; }
    .so-runs-label {
      font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: #64748B;
      display: flex; align-items: center; gap: 0.375rem;
    }
    .so-runs-count {
      background: #F1F5F9; color: #475569; font-size: 0.6875rem; font-weight: 700;
      padding: 1px 6px; border-radius: 10px;
    }
    .so-runs-list { display: flex; flex-direction: column; gap: 0.375rem; }
    .so-run-row {
      display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
      padding: 0.625rem 0.75rem; border-radius: 8px;
      background: #F8FAFC; border: 1px solid #F1F5F9;
      text-decoration: none; cursor: pointer;
      transition: background 120ms, border-color 120ms;
    }
    .so-run-row:hover { background: #F1F5F9; border-color: #E2E8F0; }
    .so-run-info  { flex: 1; min-width: 0; }
    .so-run-name  {
      font-size: 0.8125rem; font-weight: 500; color: #0F172A;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .so-run-meta  { font-size: 0.75rem; color: #94A3B8; margin-top: 2px; }

    /* ── Ad-hoc modal ───────────────────────────────────────────────────────── */
    .ah-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,0.5);
      z-index: 1050; display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(2px);
    }
    .ah-modal {
      background: #fff; border-radius: 16px; width: 440px; max-width: calc(100vw - 2rem);
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      animation: ahIn 0.18s cubic-bezier(0.16,1,0.3,1);
    }
    @keyframes ahIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .ah-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 1.25rem 1.25rem 0;
    }
    .ah-header-left { display: flex; align-items: flex-start; gap: 0.75rem; }
    .ah-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: #FEF9C3; color: #92400E;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.125rem; flex-shrink: 0;
    }
    .ah-title { font-size: 1rem; font-weight: 700; color: #0F172A; }
    .ah-sub   { font-size: 0.75rem; color: #94A3B8; margin-top: 2px; }
    .ah-close {
      background: none; border: none; font-size: 1rem; color: #94A3B8;
      cursor: pointer; padding: 2px; border-radius: 6px;
      &:hover { background: #F1F5F9; color: #475569; }
    }
    .ah-body  { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 1rem; max-height: 70vh; overflow-y: auto; }
    .ah-info-callout {
      display: flex; gap: 0.5rem; align-items: flex-start;
      background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px;
      padding: 0.625rem 0.75rem; font-size: 0.75rem; color: #0369A1; line-height: 1.4;
    }
    .ah-info-icon { flex-shrink: 0; margin-top: 1px; font-size: 0.875rem; }
    .ah-field { display: flex; flex-direction: column; gap: 0.375rem; }
    .ah-label { font-size: 0.8125rem; font-weight: 600; color: #374151; }
    .ah-label-hint { font-weight: 400; color: #94A3B8; font-size: 0.75rem; }
    .ah-layer-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .ah-layer-opt {
      display: flex; align-items: flex-start; gap: 0.75rem;
      padding: 0.75rem; border-radius: 10px;
      border: 1.5px solid #E2E8F0; cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      input[type=radio] { display: none; }
      &.selected { border-color: #F59E0B; background: #FFFBEB; }
      &:hover:not(.selected) { border-color: #D1D5DB; background: #F8FAFC; }
    }
    .ah-layer-left  { flex-shrink: 0; padding-top: 2px; }
    .ah-layer-badge {
      font-size: 0.6875rem; font-weight: 800; padding: 2px 8px;
      border-radius: 8px; display: inline-block;
    }
    .ah-layer-content { flex: 1; min-width: 0; }
    .ah-layer-title {
      font-size: 0.8125rem; font-weight: 700; color: #1E293B; margin-bottom: 3px;
    }
    .ah-layer-desc { font-size: 0.75rem; color: #475569; line-height: 1.45; margin-bottom: 4px; }
    .ah-layer-tip  {
      font-size: 0.6875rem; color: #92400E; background: #FEF9C3;
      padding: 2px 6px; border-radius: 5px; display: inline-block;
    }
    .ah-layer-check { flex-shrink: 0; color: #F59E0B; font-size: 1rem; padding-top: 2px; }
    .ah-summary {
      font-size: 0.75rem; color: #166534; background: #F0FDF4;
      border: 1px solid #BBF7D0; border-radius: 8px;
      padding: 0.5rem 0.75rem; line-height: 1.4;
    }
    .ah-footer {
      display: flex; justify-content: flex-end; gap: 0.5rem;
      padding: 0.75rem 1.25rem 1.25rem;
      border-top: 1px solid #F1F5F9;
    }
  `],
})
export class LpaDashboardComponent {
  readonly mock = inject(MockDataService);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  readonly selectedCell = signal<AreaCell | null>(null);

  // ── Ad-hoc run modal ─────────────────────────────────────────────────────────
  readonly adhocModalOpen = signal(false);
  adhocZone = '';
  adhocLayer: 'L1' | 'L2' | 'L3' = 'L1';

  readonly canRunAdhoc = computed(() =>
    ['supervisor', 'manager', 'director'].includes(this.lpaRole())
  );

  readonly canSetup = computed(() => this.lpaRole() !== 'operator');

  readonly adhocZones = computed(() => {
    const uid = this.userId();
    const runs = this.lpaRole() === 'manager' || this.lpaRole() === 'director'
      ? this.visibleRuns()                          // managers can spot-check any site area
      : this.visibleRuns().filter(r => r.ownerId === uid); // supervisors: own assigned areas only
    return [...new Set(runs.map(r => r.zone))].sort();
  });

  readonly adhocLayerOptions = computed(() => {
    const role = this.lpaRole();
    const all = [
      {
        value: 'L1' as const,
        label: 'Operator Check',
        bg: '#EDE9FE', color: '#5B21B6',
        icon: 'bi-person-gear',
        desc: 'Verify floor-level compliance — same checklist an operator completes. Use this to confirm the process is actually being followed right now, not just on paper.',
        tip: 'Best for: surprise floor checks, post-incident verification, new operator onboarding',
      },
      {
        value: 'L2' as const,
        label: 'Supervisor Check',
        bg: '#DBEAFE', color: '#1E40AF',
        icon: 'bi-person-badge',
        desc: 'Cross-verify supervisory controls — NCR tracking, training records, control charts, mistake-proofing. Use this to confirm supervisors are catching what operators miss.',
        tip: 'Best for: after a customer complaint, verifying corrective actions are sustained',
      },
      {
        value: 'L3' as const,
        label: 'Manager Check',
        bg: '#DCFCE7', color: '#166534',
        icon: 'bi-briefcase',
        desc: 'Review management-level quality indicators — CAPA closure, audit schedule, KPIs, customer scorecards. Use this for strategic-level spot verification.',
        tip: 'Best for: pre-audit readiness, management review preparation',
      },
    ];
    if (role === 'supervisor') return all.slice(0, 2);
    return all;
  });

  openAdhocModal(): void {
    this.adhocZone = '';
    this.adhocLayer = 'L1';
    this.adhocModalOpen.set(true);
  }

  closeAdhocModal(): void { this.adhocModalOpen.set(false); }

  startAdhocRun(): void {
    const user = this.currentUser();
    if (!user || !this.adhocZone) return;
    const initials = `${user.firstName[0]}${user.lastName[0]}`;
    const runId = this.mock.createAdhocRun(
      this.adhocZone,
      this.adhocLayer,
      `${user.firstName} ${user.lastName}`,
      initials,
      user.id,
      user.siteId,
    );
    this.adhocModalOpen.set(false);
    this.router.navigate(['/lpa/run', runId]);
  }

  // ── User context ─────────────────────────────────────────────────────────────
  readonly currentUser = this.auth.currentUser;
  private readonly userId = computed(() => this.currentUser()?.id ?? '');
  private readonly userSiteId = computed(() => this.currentUser()?.siteId ?? '');

  private readonly lpaRole = computed(() => {
    const roles = this.currentUser()?.roles ?? [];
    if (roles.includes('Director'))       return 'director';
    if (roles.includes('lpa:manager'))    return 'manager';
    if (roles.includes('lpa:supervisor')) return 'supervisor';
    return 'operator';
  });

  readonly lpaLayerLabel = computed(() => {
    const labels: Record<string, string> = {
      director:   'Cross-Site',
      manager:    'L3 · Manager',
      supervisor: 'L2 · Supervisor',
      operator:   'L1 · Operator',
    };
    return labels[this.lpaRole()] ?? this.lpaRole();
  });

  readonly lpaLayerChip = computed(() => {
    const chips: Record<string, { color: string; bg: string }> = {
      director:   { color: '#0E7490', bg: '#CFFAFE' },
      manager:    { color: '#166534', bg: '#DCFCE7' },
      supervisor: { color: '#1D4ED8', bg: '#DBEAFE' },
      operator:   { color: '#5B21B6', bg: '#EDE9FE' },
    };
    return chips[this.lpaRole()] ?? { color: '#475569', bg: '#F1F5F9' };
  });

  readonly siteName = computed(() => {
    const map: Record<string, string> = {
      'SITE-001': 'Plant-1 · Detroit',
      'SITE-002': 'Plant-2 · Toledo',
      'SITE-003': 'Plant-3 · Lansing',
    };
    return map[this.userSiteId()] ?? this.userSiteId();
  });

  // ── Role-scoped run pool ──────────────────────────────────────────────────────
  readonly visibleRuns = computed((): LPARun[] => {
    const uid    = this.userId();
    const siteId = this.userSiteId();
    const role   = this.lpaRole();
    const all    = this.mock.lpaRunsSignal();

    if (role === 'operator')   return all.filter(r => r.ownerId === uid);
    if (role === 'supervisor') return all.filter(r => r.ownerId === uid || (r.layer === 'L1' && r.siteId === siteId));
    if (role === 'manager')    return all.filter(r => r.siteId === siteId);
    return all;
  });

  // ── KPI computeds ─────────────────────────────────────────────────────────────
  readonly miniCircumference = 2 * Math.PI * 18; // r=18 → ≈113.1

  readonly compliancePct = computed(() => {
    const completed = this.visibleRuns().filter(r => r.status === 'Completed');
    if (!completed.length) return 0;
    return Math.round(completed.filter(r => r.completionRate === 100).length / completed.length * 100);
  });

  readonly completionPct = computed(() => {
    const runs = this.visibleRuns();
    if (!runs.length) return 0;
    return Math.round(runs.filter(r => r.status === 'Completed').length / runs.length * 100);
  });

  readonly miniComplianceOffset = computed(() =>
    this.miniCircumference * (1 - this.compliancePct() / 100)
  );

  readonly miniCompletionOffset = computed(() =>
    this.miniCircumference * (1 - this.completionPct() / 100)
  );

  // kept for template compatibility (slide-over donut, if needed)
  readonly complianceCircumference = 2 * Math.PI * 30;
  readonly complianceDashOffset = computed(() =>
    this.complianceCircumference * (1 - this.compliancePct() / 100)
  );
  readonly completionDashOffset = computed(() =>
    this.complianceCircumference * (1 - this.completionPct() / 100)
  );

  readonly completedCount = computed(() =>
    this.visibleRuns().filter(r => r.status === 'Completed').length
  );
  readonly pendingCount = computed(() =>
    this.visibleRuns().filter(r => r.status === 'Pending' || r.status === 'In Progress').length
  );
  readonly overdueCount = computed(() =>
    this.visibleRuns().filter(r => r.status === 'Overdue').length
  );
  readonly openFindingCount = computed(() => {
    const runs = this.visibleRuns();
    return runs.filter(r => r.status === 'Overdue').length
         + runs.filter(r => r.status === 'Completed' && r.completionRate < 100).length;
  });

  // ── Widget data ────────────────────────────────────────────────────────────────
  readonly recentRuns = computed(() =>
    [...this.visibleRuns()]
      .sort((a, b) => {
        const da = a.completedDate ?? a.dueDate;
        const db = b.completedDate ?? b.dueDate;
        return db.localeCompare(da);
      })
      .slice(0, 6)
  );

  readonly missedRuns = computed(() =>
    this.visibleRuns()
      .filter(r => r.status === 'Overdue')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5)
  );

  readonly completedRuns = computed(() =>
    [...this.visibleRuns()]
      .filter(r => r.status === 'Completed')
      .sort((a, b) => (b.completedDate ?? b.dueDate).localeCompare(a.completedDate ?? a.dueDate))
      .slice(0, 7)
  );

  readonly nextPendingRunId = computed(() => {
    const uid = this.userId();
    const urgency: Record<string, number> = { Overdue: 0, 'In Progress': 1, Pending: 2 };
    const myActionable = [...this.mock.lpaRunsSignal()]
      .filter(r => r.status !== 'Completed' && r.ownerId === uid)
      .sort((a, b) => (urgency[a.status] ?? 3) - (urgency[b.status] ?? 3))[0];
    return myActionable?.id
      ?? this.visibleRuns().find(r => r.status !== 'Completed')?.id
      ?? this.visibleRuns()[0]?.id;
  });

  // ── Heatmap ────────────────────────────────────────────────────────────────────
  readonly heatmapCells = computed((): AreaCell[] => {
    const runs = this.visibleRuns();
    const completedRates = new Map<string, number[]>();
    const runsPerKey = new Map<string, LPARun[]>();
    const allKeys = new Set<string>();
    for (const r of runs) {
      const key = `${r.zone}|${r.layer}`;
      allKeys.add(key);
      const bucket = runsPerKey.get(key) ?? [];
      bucket.push(r);
      runsPerKey.set(key, bucket);
      if (r.status === 'Completed') {
        const rateBucket = completedRates.get(key) ?? [];
        rateBucket.push(r.completionRate);
        completedRates.set(key, rateBucket);
      }
    }
    return [...allKeys]
      .map(key => {
        const [zone, layer] = key.split('|');
        const rates = completedRates.get(key) ?? [];
        const score = rates.length
          ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
        const keyRuns = runsPerKey.get(key) ?? [];
        const actionableRun = keyRuns.find(r => r.status === 'Pending' || r.status === 'In Progress')
          ?? keyRuns.find(r => r.status === 'Overdue');
        return { area: zone, layer, score, runId: actionableRun?.id, runs: keyRuns } as AreaCell;
      })
      .sort((a, b) => a.area.localeCompare(b.area) || a.layer.localeCompare(b.layer));
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────
  heatColor(score: number): string {
    if (score === 0) return '#F1F5F9';
    if (score >= 90) return '#DCFCE7';
    if (score >= 70) return '#FEF9C3';
    return '#FEE2E2';
  }

  scoreTextColor(score: number): string {
    if (score === 0) return '#94A3B8';
    if (score >= 90) return '#166534';
    if (score >= 70) return '#713F12';
    return '#DC2626';
  }

  scoreDotColor(score: number): string {
    if (score === 0) return '#CBD5E1';
    if (score >= 90) return '#22C55E';
    if (score >= 70) return '#F59E0B';
    return '#DC2626';
  }

  layerBadgeBg(layer: string): string {
    return layer === 'L1' ? '#EDE9FE' : layer === 'L2' ? '#DBEAFE' : '#DCFCE7';
  }

  layerBadgeColor(layer: string): string {
    return layer === 'L1' ? '#5B21B6' : layer === 'L2' ? '#1E40AF' : '#166534';
  }

  statusChipClass(status: string): string {
    switch (status) {
      case 'Completed':   return 'chip chip-green';
      case 'In Progress': return 'chip chip-blue';
      case 'Overdue':     return 'chip chip-red';
      default:            return 'chip chip-amber';
    }
  }

  daysOverdue(dueDateStr: string): number {
    const due = new Date(dueDateStr);
    const today = new Date();
    return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86_400_000));
  }

  selectCell(cell: AreaCell): void {
    this.selectedCell.set(cell);
  }
}
