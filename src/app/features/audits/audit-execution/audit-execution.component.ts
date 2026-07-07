import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { AuditChecklistItem, AuditChecklistSection, AuditDetail } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-audit-execution',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="exec-layout">

      <!-- Left panel: section nav + progress -->
      <aside class="exec-sidebar">
        <div class="sidebar-header">
          <button class="btn btn-sm btn-link sidebar-back" [routerLink]="['/audits', auditId()]">
            <i class="bi bi-arrow-left me-1"></i>Back
          </button>
          <span class="chip chip-blue sidebar-scr">SCR-053</span>
        </div>

        @if (audit(); as a) {
          <div class="sidebar-title-block">
            <div class="sidebar-audit-id">{{ a.id }}</div>
            <div class="sidebar-audit-title">{{ a.title }}</div>
          </div>

          <div class="progress-block">
            <div class="prog-row">
              <span class="prog-label">Progress</span>
              <span class="prog-val">{{ answeredCount() }}/{{ totalItems() }}</span>
            </div>
            <div class="prog-bar">
              <div class="prog-fill" [style.width.%]="progressPct()"></div>
            </div>
            <div class="prog-status">
              <span class="prog-ok"><i class="bi bi-check-circle-fill"></i> {{ conformsCount() }} Conforms</span>
              <span class="prog-nc"><i class="bi bi-x-circle-fill"></i> {{ nonconformCount() }} NC</span>
              <span class="prog-na"><i class="bi bi-dash-circle"></i> {{ naCount() }} N/A</span>
            </div>
          </div>

          <nav class="section-nav">
            @for (section of a.sections; track section.id; let i = $index) {
              <button class="sec-nav-item" [class.active]="activeSection() === i" (click)="activeSection.set(i)">
                <span class="sec-nav-num">{{ section.clauseGroup }}</span>
                <span class="sec-nav-title">{{ section.title }}</span>
                <span class="sec-nav-count">{{ answeredInSection(section) }}/{{ section.items.length }}</span>
              </button>
            }
          </nav>
        }

        <div class="sidebar-footer">
          <button class="btn btn-success w-100" [disabled]="answeredCount() < totalItems()" (click)="closeAudit()">
            <i class="bi bi-check-lg me-1"></i>Close Audit
          </button>
        </div>
      </aside>

      <!-- Right panel: checklist items -->
      <main class="exec-main">
        @if (audit(); as a) {
          @if (currentSection(); as sec) {
            <div class="section-banner">
              <div class="sb-left">
                <span class="sb-clause">{{ sec.clauseGroup }}</span>
                <h2 class="sb-title">{{ sec.title }}</h2>
              </div>
              <div class="sb-nav">
                <button class="btn btn-sm btn-outline-secondary" [disabled]="activeSection() === 0" (click)="activeSection.set(activeSection() - 1)">
                  <i class="bi bi-chevron-left"></i> Prev
                </button>
                <span class="sb-page">{{ activeSection() + 1 }}/{{ a.sections.length }}</span>
                <button class="btn btn-sm btn-outline-secondary" [disabled]="activeSection() === a.sections.length - 1" (click)="activeSection.set(activeSection() + 1)">
                  Next <i class="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>

            <div class="checklist-items">
              @for (item of sec.items; track item.id; let idx = $index) {
                <div class="ci-card" [class.ci-nc]="getResponse(sec.id, item.id) === 'Nonconformity'" [class.ci-conforms]="getResponse(sec.id, item.id) === 'Conforms'">
                  <div class="ci-top">
                    <div class="ci-num">{{ idx + 1 }}</div>
                    <div class="ci-content">
                      <p class="ci-question">{{ item.text }}</p>
                      <div class="ci-clause"><i class="bi bi-tag"></i> {{ item.clauseRef }}</div>
                    </div>
                  </div>

                  <div class="ci-guidance">
                    <i class="bi bi-info-circle me-1"></i>{{ item.guidance }}
                  </div>

                  <div class="ci-response-row">
                    @for (opt of responseOptions; track opt.value) {
                      <button class="resp-btn"
                              [class.resp-selected]="getResponse(sec.id, item.id) === opt.value"
                              [class.resp-conforms]="opt.value === 'Conforms'"
                              [class.resp-nc]="opt.value === 'Nonconformity'"
                              [class.resp-na]="opt.value === 'N/A'"
                              (click)="setResponse(sec.id, item.id, opt.value)">
                        <i [class]="'bi ' + opt.icon + ' me-1'"></i>{{ opt.label }}
                      </button>
                    }
                  </div>

                  @if (getResponse(sec.id, item.id) === 'Nonconformity') {
                    <div class="nc-panel">
                      <div class="nc-panel-header"><i class="bi bi-exclamation-triangle-fill text-danger me-1"></i>Record Finding</div>
                      <textarea class="nc-textarea" placeholder="Describe the nonconformity…" rows="2"></textarea>
                      <button class="btn btn-sm btn-danger mt-2" (click)="raiseFinding(sec.id, item.id, item.clauseRef)">
                        <i class="bi bi-plus-lg me-1"></i>Raise Finding
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        } @else {
          <div class="exec-not-found">Audit not found.</div>
        }
      </main>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .exec-layout { display: flex; height: calc(100vh - 60px); overflow: hidden; }

    /* Sidebar */
    .exec-sidebar { width: 300px; min-width: 280px; background: #0F172A; color: #E2E8F0; display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0; }
    .sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #1E293B; }
    .sidebar-back { color: #94A3B8 !important; font-size: 0.8125rem; padding: 0; &:hover { color: #E2E8F0 !important; } }
    .sidebar-scr { font-size: 0.6875rem; }

    .sidebar-title-block { padding: 1rem; border-bottom: 1px solid #1E293B; }
    .sidebar-audit-id { font-size: 0.75rem; font-family: monospace; color: #64748B; margin-bottom: 0.25rem; }
    .sidebar-audit-title { font-size: 0.9375rem; font-weight: 700; color: #F1F5F9; line-height: 1.3; }

    .progress-block { padding: 0.875rem 1rem; border-bottom: 1px solid #1E293B; }
    .prog-row { display: flex; justify-content: space-between; margin-bottom: 0.375rem; }
    .prog-label { font-size: 0.75rem; color: #94A3B8; }
    .prog-val { font-size: 0.75rem; font-weight: 700; color: #E2E8F0; }
    .prog-bar { height: 6px; background: #1E293B; border-radius: 3px; overflow: hidden; margin-bottom: 0.5rem; }
    .prog-fill { height: 100%; background: #22C55E; border-radius: 3px; transition: width 0.3s; }
    .prog-status { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .prog-ok { font-size: 0.7rem; color: #22C55E; display: flex; align-items: center; gap: 3px; }
    .prog-nc { font-size: 0.7rem; color: #EF4444; display: flex; align-items: center; gap: 3px; }
    .prog-na { font-size: 0.7rem; color: #64748B; display: flex; align-items: center; gap: 3px; }

    .section-nav { flex: 1; overflow-y: auto; padding: 0.5rem 0; }
    .sec-nav-item { display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.625rem 1rem; background: none; border: none; text-align: left; cursor: pointer; border-left: 3px solid transparent; }
    .sec-nav-item.active { background: #1E293B; border-left-color: #3B82F6; }
    .sec-nav-item:hover:not(.active) { background: #1E293B80; }
    .sec-nav-num { font-size: 0.7rem; font-family: monospace; color: #94A3B8; min-width: 28px; }
    .sec-nav-title { font-size: 0.8125rem; color: #CBD5E1; flex: 1; line-height: 1.3; }
    .sec-nav-count { font-size: 0.7rem; color: #64748B; white-space: nowrap; }

    .sidebar-footer { padding: 1rem; border-top: 1px solid #1E293B; }

    /* Main panel */
    .exec-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #F8FAFC; }

    .section-banner { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: #fff; border-bottom: 1px solid #E2E8F0; flex-shrink: 0; flex-wrap: wrap; gap: 0.75rem; }
    .sb-left { display: flex; align-items: center; gap: 0.75rem; }
    .sb-clause { background: #EDE9FE; color: #5B21B6; border-radius: 6px; padding: 0.2rem 0.625rem; font-size: 0.75rem; font-weight: 700; }
    .sb-title { font-size: 1.0625rem; font-weight: 700; color: #0F172A; margin: 0; }
    .sb-nav { display: flex; align-items: center; gap: 0.5rem; }
    .sb-page { font-size: 0.8125rem; color: #64748B; min-width: 40px; text-align: center; }

    .checklist-items { flex: 1; overflow-y: auto; padding: 1rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }

    .ci-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1rem 1.25rem; }
    .ci-card.ci-nc { border-left: 3px solid #EF4444; }
    .ci-card.ci-conforms { border-left: 3px solid #22C55E; }
    .ci-top { display: flex; gap: 0.875rem; margin-bottom: 0.625rem; }
    .ci-num { width: 24px; height: 24px; background: #E2E8F0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: #475569; flex-shrink: 0; }
    .ci-content { flex: 1; }
    .ci-question { font-size: 0.9375rem; font-weight: 500; color: #0F172A; margin: 0 0 0.25rem; line-height: 1.4; }
    .ci-clause { font-size: 0.75rem; color: #94A3B8; font-family: monospace; display: flex; align-items: center; gap: 4px; }
    .ci-guidance { background: #F0F9FF; border-left: 3px solid #38BDF8; border-radius: 0 6px 6px 0; padding: 0.5rem 0.75rem; font-size: 0.8125rem; color: #0C4A6E; margin-bottom: 0.75rem; line-height: 1.4; }
    .ci-response-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .resp-btn { border: 1.5px solid #E2E8F0; background: #fff; border-radius: 8px; padding: 0.375rem 1rem; font-size: 0.8125rem; cursor: pointer; display: flex; align-items: center; transition: all 0.15s; }
    .resp-btn:hover { border-color: #CBD5E1; background: #F8FAFC; }
    .resp-btn.resp-selected.resp-conforms { background: #DCFCE7; border-color: #22C55E; color: #166534; font-weight: 600; }
    .resp-btn.resp-selected.resp-nc { background: #FEE2E2; border-color: #EF4444; color: #DC2626; font-weight: 600; }
    .resp-btn.resp-selected.resp-na { background: #F1F5F9; border-color: #94A3B8; color: #475569; font-weight: 600; }

    .nc-panel { margin-top: 0.875rem; padding: 0.875rem; background: #FFF7F7; border: 1px solid #FCA5A5; border-radius: 8px; }
    .nc-panel-header { font-size: 0.8125rem; font-weight: 700; color: #DC2626; margin-bottom: 0.5rem; display: flex; align-items: center; }
    .nc-textarea { width: 100%; border: 1px solid #FECACA; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.875rem; resize: vertical; outline: none; background: #fff; &:focus { border-color: #EF4444; } }

    .exec-not-found { flex: 1; display: flex; align-items: center; justify-content: center; color: #94A3B8; }
  `],
})
export class AuditExecutionComponent {
  readonly mock = inject(MockDataService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly activeSection = signal(0);

  readonly responseOptions = [
    { value: 'Conforms' as const, label: 'Conforms', icon: 'bi-check-circle' },
    { value: 'Nonconformity' as const, label: 'Nonconformity', icon: 'bi-x-circle' },
    { value: 'N/A' as const, label: 'N/A', icon: 'bi-dash-circle' },
  ];

  readonly auditId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  readonly audit = computed<AuditDetail | undefined>(() => this.mock.getAuditDetail(this.auditId()));

  readonly currentSection = computed<AuditChecklistSection | undefined>(() => this.audit()?.sections[this.activeSection()]);

  // In-memory response state keyed by "sectionId:itemId"
  private readonly responses = signal<Map<string, string>>(new Map());
  private readonly notes = signal<Map<string, string>>(new Map());

  getResponse(sectionId: string, itemId: string): string | null {
    // Use seeded data if available
    const audit = this.audit();
    if (audit) {
      const section = audit.sections.find(s => s.id === sectionId);
      const item = section?.items.find(i => i.id === itemId);
      const key = `${sectionId}:${itemId}`;
      if (this.responses().has(key)) return this.responses().get(key) ?? null;
      if (item?.response) return item.response;
    }
    return null;
  }

  setResponse(sectionId: string, itemId: string, value: string): void {
    const key = `${sectionId}:${itemId}`;
    const map = new Map(this.responses());
    map.set(key, value);
    this.responses.set(map);
  }

  getNoteSignal(sectionId: string, itemId: string) {
    const key = `${sectionId}:${itemId}`;
    return signal(this.notes().get(key) ?? '');
  }

  readonly totalItems = computed(() => this.audit()?.sections.reduce((acc, s) => acc + s.items.length, 0) ?? 0);

  readonly answeredCount = computed(() => {
    const audit = this.audit();
    if (!audit) return 0;
    let count = 0;
    for (const section of audit.sections) {
      for (const item of section.items) {
        if (this.getResponse(section.id, item.id)) count++;
      }
    }
    return count;
  });

  readonly conformsCount = computed(() => {
    const audit = this.audit();
    if (!audit) return 0;
    let count = 0;
    for (const section of audit.sections) {
      for (const item of section.items) {
        if (this.getResponse(section.id, item.id) === 'Conforms') count++;
      }
    }
    return count;
  });

  readonly nonconformCount = computed(() => {
    const audit = this.audit();
    if (!audit) return 0;
    let count = 0;
    for (const section of audit.sections) {
      for (const item of section.items) {
        if (this.getResponse(section.id, item.id) === 'Nonconformity') count++;
      }
    }
    return count;
  });

  readonly naCount = computed(() => {
    const audit = this.audit();
    if (!audit) return 0;
    let count = 0;
    for (const section of audit.sections) {
      for (const item of section.items) {
        if (this.getResponse(section.id, item.id) === 'N/A') count++;
      }
    }
    return count;
  });

  readonly progressPct = computed(() => this.totalItems() > 0 ? Math.round(this.answeredCount() / this.totalItems() * 100) : 0);

  answeredInSection(section: AuditChecklistSection): number {
    return section.items.filter(item => this.getResponse(section.id, item.id)).length;
  }

  raiseFinding(sectionId: string, itemId: string, clauseRef: string): void {
    // In a real app this would open a modal; for the wireframe, navigate to findings list
    this.router.navigate(['/audits', this.auditId()], { fragment: 'findings' });
  }

  closeAudit(): void {
    this.router.navigate(['/audits', this.auditId()]);
  }
}
