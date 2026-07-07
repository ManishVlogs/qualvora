import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { AuditDetail } from '../../../shared/interfaces/models';

type AuditTab = 'plan' | 'checklist' | 'findings' | 'report' | 'history';

@Component({
  selector: 'app-audit-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">

      @if (audit(); as a) {

        <!-- Breadcrumb -->
        <nav class="breadcrumb-nav">
          <a [routerLink]="['/audits']" class="bc-link">Audits</a>
          <i class="bi bi-chevron-right bc-sep"></i>
          <span class="bc-current">{{ a.id }}</span>
        </nav>

        <!-- Header -->
        <div class="page-header">
          <div class="header-left">
            <h1>{{ a.title }}</h1>
            <div class="header-meta">
              <span class="status-badge status-{{ a.status.toLowerCase().replace(' ', '-') }}">{{ a.status }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-text">{{ a.type }}</span>
              <span class="meta-sep">·</span>
              <span class="meta-text">{{ a.standard }}</span>
            </div>
          </div>
          <div class="header-actions">
            <span class="chip chip-blue">SCR-052</span>
            @if (a.status === 'Planned' || a.status === 'In Progress') {
              <button class="btn btn-primary ms-2" [routerLink]="['/audits', a.id, 'run']">
                <i class="bi bi-play-fill me-1"></i>Execute Audit
              </button>
            }
          </div>
        </div>

        <!-- Summary cards -->
        <div class="summary-row mb-3">
          <div class="summary-card">
            <div class="sc-label">Auditor</div>
            <div class="avatar-name">
              <div class="avatar-sm" [style.background]="a.auditorColor">{{ a.auditorInitials }}</div>
              <span class="sc-val">{{ a.auditor }}</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="sc-label">Auditee</div>
            <div class="avatar-name">
              <div class="avatar-sm" [style.background]="a.auditeeColor">{{ a.auditeeInitials }}</div>
              <span class="sc-val">{{ a.auditee }}</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="sc-label">Scheduled Date</div>
            <div class="sc-val">{{ a.scheduledDate | date:'MMM d, y' }}</div>
          </div>
          @if (a.completedDate) {
            <div class="summary-card">
              <div class="sc-label">Completed</div>
              <div class="sc-val">{{ a.completedDate | date:'MMM d, y' }}</div>
            </div>
          }
          <div class="summary-card">
            <div class="sc-label">Findings</div>
            <div class="sc-val finding-val">
              <span class="finding-pill major">{{ majorCount() }} Major</span>
              <span class="finding-pill minor">{{ minorCount() }} Minor</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tab-bar mb-3">
          @for (tab of tabs; track tab.id) {
            <button class="tab-btn" [class.active]="activeTab() === tab.id" (click)="activeTab.set(tab.id)">
              <i [class]="'bi ' + tab.icon + ' me-1'"></i>{{ tab.label }}
              @if (tab.id === 'findings' && a.findings.length > 0) {
                <span class="tab-badge">{{ a.findings.length }}</span>
              }
            </button>
          }
        </div>

        <!-- Tab: Plan -->
        @if (activeTab() === 'plan') {
          <div class="q-card">
            <h3 class="section-h3">Scope</h3>
            <p class="plan-text">{{ a.scope }}</p>
            <h3 class="section-h3 mt-3">Objectives</h3>
            <p class="plan-text">{{ a.objectives }}</p>
            <h3 class="section-h3 mt-3">Standard</h3>
            <p class="plan-text">{{ a.standard }}</p>
          </div>
        }

        <!-- Tab: Checklist -->
        @if (activeTab() === 'checklist') {
          <div class="checklist-sections">
            @for (section of a.sections; track section.id) {
              <div class="q-card checklist-section">
                <div class="section-header">
                  <h3 class="ch-title">{{ section.title }}</h3>
                  <span class="clause-tag">{{ section.clauseGroup }}</span>
                  <span class="item-count ms-auto">{{ section.items.length }} items</span>
                </div>
                @for (item of section.items; track item.id) {
                  <div class="checklist-item" [class.has-finding]="item.findingId">
                    <div class="ci-main">
                      <div class="response-icon">
                        @if (item.response === 'Conforms') { <i class="bi bi-check-circle-fill text-success"></i> }
                        @if (item.response === 'Nonconformity') { <i class="bi bi-x-circle-fill text-danger"></i> }
                        @if (item.response === 'N/A') { <i class="bi bi-dash-circle text-secondary"></i> }
                        @if (!item.response) { <i class="bi bi-circle text-secondary"></i> }
                      </div>
                      <div class="ci-body">
                        <div class="ci-text">{{ item.text }}</div>
                        <div class="ci-meta">
                          <span class="clause-ref">{{ item.clauseRef }}</span>
                          @if (item.note) { <span class="ci-note">{{ item.note }}</span> }
                        </div>
                      </div>
                      @if (item.findingId) {
                        <a class="finding-link" [routerLink]="['/findings', item.findingId]">{{ item.findingId }}</a>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Tab: Findings -->
        @if (activeTab() === 'findings') {
          <div class="findings-list">
            @for (f of a.findings; track f.id) {
              <div class="q-card finding-card" (click)="router.navigate(['/findings', f.id])">
                <div class="fc-header">
                  <span class="grade-badge grade-{{ f.grade.toLowerCase() }}">{{ f.grade }}</span>
                  <span class="fc-id">{{ f.id }}</span>
                  <span class="fc-clause">{{ f.clauseRef }}</span>
                  <span class="finding-status-badge status-{{ f.status.toLowerCase() }}">{{ f.status }}</span>
                  <span class="ms-auto age-text">{{ f.ageInDays === 0 ? 'Today' : f.ageInDays + 'd ago' }}</span>
                </div>
                <p class="fc-desc">{{ f.description }}</p>
                <div class="fc-footer">
                  <div class="avatar-name">
                    <div class="avatar-sm" [style.background]="f.ownerColor">{{ f.ownerInitials }}</div>
                    <span class="fc-owner">{{ f.owner }}</span>
                  </div>
                  <span class="fc-due">Due {{ f.dueDate | date:'MMM d' }}</span>
                  @if (f.capaId) {
                    <a class="capa-link" [routerLink]="['/capas', f.capaId]" (click)="$event.stopPropagation()">{{ f.capaId }}</a>
                  }
                  @if (f.evidenceCount > 0) {
                    <span class="evidence-count"><i class="bi bi-paperclip"></i> {{ f.evidenceCount }}</span>
                  }
                </div>
              </div>
            }
            @empty {
              <div class="q-card empty-findings"><i class="bi bi-check-circle text-success me-2"></i>No findings recorded for this audit.</div>
            }
          </div>
        }

        <!-- Tab: Report -->
        @if (activeTab() === 'report') {
          <div class="q-card report-placeholder">
            <i class="bi bi-file-earmark-pdf report-icon"></i>
            <h3>Audit Report</h3>
            <p class="text-muted">The formal audit report will appear here once the audit is closed and signed off.</p>
            @if (a.status === 'Completed') {
              <button class="btn btn-primary mt-3"><i class="bi bi-download me-1"></i>Download PDF</button>
            }
          </div>
        }

        <!-- Tab: History -->
        @if (activeTab() === 'history') {
          <div class="q-card">
            <div class="timeline">
              @for (h of a.history; track h.id) {
                <div class="tl-item">
                  <div class="tl-avatar" [style.background]="h.actorColor">{{ h.actorInitials }}</div>
                  <div class="tl-body">
                    <div class="tl-header">
                      <span class="tl-actor">{{ h.actor }}</span>
                      <span class="tl-action">{{ h.action }}</span>
                      <span class="tl-time ms-auto">{{ h.timestamp | date:'MMM d, y HH:mm' }}</span>
                    </div>
                    @if (h.detail) { <div class="tl-detail">{{ h.detail }}</div> }
                  </div>
                </div>
              }
            </div>
          </div>
        }

      } @else {
        <div class="q-card not-found">Audit not found.</div>
      }

    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1280px; margin: 0 auto; }
    .breadcrumb-nav { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 1rem; font-size: 0.8125rem; }
    .bc-link { color: #2563EB; text-decoration: none; &:hover { text-decoration: underline; } }
    .bc-sep { color: #CBD5E1; font-size: 0.625rem; }
    .bc-current { color: #64748B; }

    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
    .header-left h1 { font-size: 1.375rem; font-weight: 700; margin: 0 0 0.375rem; }
    .header-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .meta-sep { color: #CBD5E1; }
    .meta-text { font-size: 0.8125rem; color: #64748B; }
    .header-actions { display: flex; align-items: center; gap: 0.5rem; }

    .status-badge { border-radius: 20px; padding: 0.2rem 0.75rem; font-size: 0.75rem; font-weight: 600; }
    .status-planned { background: #DBEAFE; color: #1E40AF; }
    .status-in-progress { background: #FEF9C3; color: #713F12; }
    .status-completed { background: #DCFCE7; color: #166534; }
    .status-cancelled { background: #F1F5F9; color: #64748B; }

    .summary-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .summary-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.75rem 1rem; min-width: 140px; }
    .sc-label { font-size: 0.7rem; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.375rem; }
    .sc-val { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .avatar-name { display: flex; align-items: center; gap: 0.5rem; }
    .avatar-sm { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .finding-val { display: flex; gap: 0.375rem; }
    .finding-pill { border-radius: 20px; padding: 0.15rem 0.5rem; font-size: 0.7rem; font-weight: 600; }
    .finding-pill.major { background: #FEE2E2; color: #DC2626; }
    .finding-pill.minor { background: #FEF9C3; color: #713F12; }

    .tab-bar { display: flex; gap: 0.25rem; border-bottom: 2px solid #E2E8F0; flex-wrap: wrap; }
    .tab-btn { background: none; border: none; padding: 0.625rem 1rem; font-size: 0.875rem; color: #64748B; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; display: flex; align-items: center; gap: 0.25rem; }
    .tab-btn.active { color: #2563EB; border-bottom-color: #2563EB; font-weight: 600; }
    .tab-btn:hover:not(.active) { color: #334155; }
    .tab-badge { background: #EF4444; color: #fff; border-radius: 20px; padding: 0 6px; font-size: 10px; font-weight: 700; }

    .section-h3 { font-size: 0.875rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 0.5rem; }
    .plan-text { font-size: 0.9375rem; color: #334155; line-height: 1.6; margin: 0; }

    .checklist-sections { display: flex; flex-direction: column; gap: 0.75rem; }
    .checklist-section { padding: 1rem 1.25rem; }
    .section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; padding-bottom: 0.625rem; border-bottom: 1px solid #E2E8F0; }
    .ch-title { font-size: 0.9375rem; font-weight: 700; color: #0F172A; margin: 0; }
    .clause-tag { background: #EDE9FE; color: #5B21B6; border-radius: 6px; padding: 0.1rem 0.5rem; font-size: 0.75rem; font-weight: 600; }
    .item-count { font-size: 0.75rem; color: #94A3B8; }

    .checklist-item { display: flex; padding: 0.625rem 0; border-bottom: 1px solid #F1F5F9; &:last-child { border-bottom: none; } }
    .checklist-item.has-finding { background: #FFF7F7; margin: 0 -1.25rem; padding-left: 1.25rem; padding-right: 1.25rem; }
    .ci-main { display: flex; align-items: flex-start; gap: 0.75rem; width: 100%; }
    .response-icon { font-size: 1rem; margin-top: 1px; flex-shrink: 0; }
    .ci-body { flex: 1; min-width: 0; }
    .ci-text { font-size: 0.875rem; color: #0F172A; line-height: 1.4; }
    .ci-meta { display: flex; gap: 0.75rem; margin-top: 0.25rem; flex-wrap: wrap; }
    .clause-ref { font-size: 0.75rem; color: #94A3B8; font-family: monospace; }
    .ci-note { font-size: 0.75rem; color: #DC2626; }
    .finding-link { font-size: 0.75rem; color: #DC2626; text-decoration: none; font-weight: 600; white-space: nowrap; &:hover { text-decoration: underline; } }

    .findings-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .finding-card { padding: 1rem 1.25rem; cursor: pointer; &:hover { border-color: #CBD5E1; } }
    .fc-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .grade-badge { border-radius: 20px; padding: 0.15rem 0.625rem; font-size: 0.7rem; font-weight: 700; }
    .grade-major { background: #FEE2E2; color: #DC2626; }
    .grade-minor { background: #FEF9C3; color: #713F12; }
    .grade-ofi { background: #DBEAFE; color: #1E40AF; }
    .fc-id { font-family: monospace; font-size: 0.75rem; color: #64748B; }
    .fc-clause { font-size: 0.75rem; color: #94A3B8; }
    .finding-status-badge { border-radius: 20px; padding: 0.15rem 0.5rem; font-size: 0.7rem; font-weight: 600; }
    .status-open { background: #FEE2E2; color: #DC2626; }
    .status-submitted { background: #FEF9C3; color: #713F12; }
    .status-verified { background: #DBEAFE; color: #1E40AF; }
    .status-closed { background: #DCFCE7; color: #166534; }
    .age-text { font-size: 0.75rem; color: #94A3B8; }
    .fc-desc { font-size: 0.875rem; color: #334155; margin: 0 0 0.5rem; line-height: 1.5; }
    .fc-footer { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .fc-owner { font-size: 0.8125rem; color: #334155; }
    .fc-due { font-size: 0.75rem; color: #94A3B8; }
    .capa-link { font-size: 0.75rem; color: #2563EB; text-decoration: none; font-weight: 600; }
    .evidence-count { font-size: 0.75rem; color: #94A3B8; display: flex; align-items: center; gap: 2px; }
    .empty-findings { padding: 1.5rem; text-align: center; color: #64748B; }

    .report-placeholder { padding: 3rem; text-align: center; }
    .report-icon { font-size: 3rem; color: #CBD5E1; display: block; margin-bottom: 1rem; }
    .report-placeholder h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem; }

    .timeline { display: flex; flex-direction: column; gap: 0; }
    .tl-item { display: flex; gap: 1rem; padding: 0.875rem 0; border-bottom: 1px solid #F1F5F9; &:last-child { border-bottom: none; } }
    .tl-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .tl-body { flex: 1; min-width: 0; }
    .tl-header { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.25rem; }
    .tl-actor { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .tl-action { font-size: 0.875rem; color: #475569; }
    .tl-time { font-size: 0.75rem; color: #94A3B8; white-space: nowrap; }
    .tl-detail { font-size: 0.8125rem; color: #64748B; }

    .not-found { padding: 2rem; text-align: center; color: #94A3B8; }
  `],
})
export class AuditDetailComponent {
  readonly mock = inject(MockDataService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal<AuditTab>('plan');

  readonly tabs = [
    { id: 'plan' as AuditTab, label: 'Plan', icon: 'bi-clipboard' },
    { id: 'checklist' as AuditTab, label: 'Checklist', icon: 'bi-list-check' },
    { id: 'findings' as AuditTab, label: 'Findings', icon: 'bi-exclamation-triangle' },
    { id: 'report' as AuditTab, label: 'Report', icon: 'bi-file-earmark-text' },
    { id: 'history' as AuditTab, label: 'History', icon: 'bi-clock-history' },
  ];

  readonly audit = computed<AuditDetail | undefined>(() => {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    return this.mock.getAuditDetail(id);
  });

  readonly majorCount = computed(() => this.audit()?.findings.filter(f => f.grade === 'Major').length ?? 0);
  readonly minorCount = computed(() => this.audit()?.findings.filter(f => f.grade === 'Minor').length ?? 0);
}
