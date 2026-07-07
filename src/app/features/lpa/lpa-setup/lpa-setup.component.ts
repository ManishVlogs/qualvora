import { Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { LpaTemplate, LpaQuestion, LpaScheduleEntry } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-lpa-setup',
  standalone: true,
  imports: [CommonModule, RouterLink, DragDropModule],
  template: `
    <div class="page-wrapper">

      <div class="page-header">
        <div>
          <h1>LPA Program Setup</h1>
          <p>Configure Layered Process Audit templates and schedules</p>
        </div>
        <div class="header-actions">
          <span class="chip chip-blue">SCR-056</span>
          <button class="btn btn-primary ms-2" (click)="newTemplate()">
            <i class="bi bi-plus-lg me-1"></i>New Template
          </button>
        </div>
      </div>

      <div class="setup-layout">

        <!-- Template editor panel -->
        <div class="template-panel q-card">
          <div class="panel-header">
            <h3 class="panel-title">Template Editor</h3>
          </div>

          <!-- Template selector tabs -->
          <div class="tabs-track-wrapper">
            <button class="tab-scroll-btn" (click)="scrollTabs(-180)" aria-label="Scroll left">
              <i class="bi bi-chevron-left"></i>
            </button>
            <div class="template-tabs" #tabsEl>
              @for (g of templateGroups(); track g.area; let first = $first) {
                @if (!first) { <span class="tab-divider"></span> }
                <span class="tab-group-label">{{ g.area }}</span>
                @for (t of g.templates; track t.id) {
                  <button
                    class="tt-btn tt-{{ t.layer.toLowerCase() }}"
                    [class.active]="activeTemplateId() === t.id"
                    (click)="activeTemplateId.set(t.id)">
                    <span class="tt-layer-dot"></span>
                    <span class="tt-name">{{ t.layer }}</span>
                  </button>
                }
              }
            </div>
            <button class="tab-scroll-btn" (click)="scrollTabs(180)" aria-label="Scroll right">
              <i class="bi bi-chevron-right"></i>
            </button>
          </div>

          @if (activeTemplate(); as tpl) {
            <div class="template-meta">
              <div class="tm-field">
                <label class="field-label">Template Name</label>
                <input class="field-input" [value]="tpl.name" readonly />
              </div>
              <div class="tm-row">
                <div class="tm-field">
                  <label class="field-label">Layer</label>
                  <div class="layer-pill layer-{{ tpl.layer.toLowerCase() }}">{{ tpl.layer }}</div>
                </div>
                <div class="tm-field">
                  <label class="field-label">Frequency</label>
                  <div class="freq-pill">{{ tpl.frequency }}</div>
                </div>
                <div class="tm-field">
                  <label class="field-label">Areas</label>
                  <div class="areas-list">
                    @for (area of tpl.areas; track area) {
                      <span class="area-chip">{{ area }}</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div class="questions-section">
              <div class="qs-header">
                <h4 class="qs-title">Audit Questions ({{ tpl.questions.length }})</h4>
                <button class="btn btn-sm btn-outline-secondary" (click)="addQuestion()">
                  <i class="bi bi-plus-lg me-1"></i>Add Question
                </button>
              </div>

              <div class="questions-list"
                   cdkDropList
                   [cdkDropListData]="editQuestions()"
                   (cdkDropListDropped)="dropQuestion($event)">
                @for (q of editQuestions(); track q.id; let i = $index) {
                  <div class="question-row" cdkDrag>
                    <div class="q-drag-handle" cdkDragHandle>
                      <i class="bi bi-grip-vertical drag-icon"></i>
                    </div>
                    <div class="q-num">{{ i + 1 }}</div>
                    <div class="q-text">{{ q.text }}</div>
                    <button class="btn btn-xs btn-link text-danger" (click)="removeQuestion(i)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                }
              </div>
            </div>

            <div class="panel-footer">
              <button class="btn btn-primary">
                <i class="bi bi-floppy me-1"></i>Save Template
              </button>
              <button class="btn btn-outline-danger ms-2">
                <i class="bi bi-trash me-1"></i>Delete
              </button>
            </div>
          }
        </div>

        <!-- Schedule table panel -->
        <div class="schedule-panel">
          <div class="q-card p-0">
            <div class="schedule-header">
              <h3 class="panel-title">Active Schedules</h3>
              <button class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-plus-lg me-1"></i>Add Schedule
              </button>
            </div>
            <table class="q-table">
              <thead>
                <tr>
                  <th>Template</th>
                  <th>Layer</th>
                  <th>Area</th>
                  <th>Frequency</th>
                  <th>Assignee</th>
                  <th>Start Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (s of schedules(); track s.id) {
                  <tr>
                    <td class="tpl-name">{{ s.templateName }}</td>
                    <td><span class="layer-pill layer-{{ s.layer.toLowerCase() }}">{{ s.layer }}</span></td>
                    <td>{{ s.area }}</td>
                    <td>{{ getFrequency(s.templateId) }}</td>
                    <td>
                      <div class="avatar-name">
                        <div class="avatar-sm" [style.background]="s.assigneeColor">{{ s.assigneeInitials }}</div>
                        <span>{{ s.assignee }}</span>
                      </div>
                    </td>
                    <td>{{ s.startDate | date:'MMM d, y' }}</td>
                    <td class="action-cell">
                      <button class="btn btn-xs btn-link"><i class="bi bi-pencil"></i></button>
                      <button class="btn btn-xs btn-link text-danger"><i class="bi bi-trash"></i></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1440px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; margin: 0 0 0.25rem; }
    .page-header p { font-size: 0.875rem; color: #64748B; margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 0.5rem; }

    .setup-layout { display: flex; flex-direction: column; gap: 1.25rem; }

    /* Template panel */
    .template-panel { padding: 0; overflow: hidden; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; border-bottom: 1px solid #E2E8F0; }
    .panel-title { font-size: 0.875rem; font-weight: 700; color: #0F172A; margin: 0; }

    /* ── Premium Tab Track ── */
    .tabs-track-wrapper { display: flex; align-items: center; gap: 0.3125rem; padding: 0 0.5rem; border-bottom: 1px solid #E2E8F0; background: linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%); }
    .tab-scroll-btn { flex-shrink: 0; width: 26px; height: 26px; border: 1px solid #E2E8F0; background: #FFFFFF; border-radius: 7px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #94A3B8; transition: all 0.15s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.07); font-size: 0.7rem; padding: 0; line-height: 1; }
    .tab-scroll-btn:hover { background: #F1F5F9; border-color: #CBD5E1; color: #475569; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
    .tab-scroll-btn:active { transform: scale(0.93); }
    .template-tabs { display: flex; flex: 1; gap: 0.3125rem; padding: 0.5625rem 0.125rem; overflow-x: auto; scrollbar-width: none; scroll-behavior: smooth; align-items: center; }
    .template-tabs::-webkit-scrollbar { display: none; }
    .tt-btn { display: flex; align-items: center; gap: 0.4375rem; padding: 0.4375rem 0.6875rem 0.4375rem 0.5625rem; border: 1.5px solid transparent; background: transparent; font-size: 0.8rem; font-weight: 500; color: #64748B; cursor: pointer; white-space: nowrap; border-radius: 10px; transition: all 0.18s cubic-bezier(0.4,0,0.2,1); letter-spacing: -0.01em; line-height: 1; }
    .tt-btn:hover:not(.active) { background: rgba(15,23,42,0.04); color: #334155; border-color: #E2E8F0; }
    .tt-layer-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; transition: transform 0.18s ease; }
    .tt-operator .tt-layer-dot { background: #7C3AED; }
    .tt-supervisor .tt-layer-dot { background: #2563EB; }
    .tt-manager .tt-layer-dot { background: #16A34A; }
    .tt-badge { font-size: 0.625rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; padding: 0.125rem 0.4375rem; border-radius: 5px; line-height: 1.4; transition: all 0.18s ease; }
    .tt-operator .tt-badge { background: #EDE9FE; color: #5B21B6; }
    .tt-supervisor .tt-badge { background: #DBEAFE; color: #1D4ED8; }
    .tt-manager .tt-badge { background: #DCFCE7; color: #15803D; }
    .tt-btn.active { color: #FFFFFF; font-weight: 600; transform: translateY(-1px); border-color: transparent; }
    .tt-btn.active .tt-layer-dot { background: rgba(255,255,255,0.65); transform: scale(1.2); }
    .tt-btn.active .tt-badge { background: rgba(255,255,255,0.2); color: rgba(255,255,255,0.92); }
    .tt-btn.active.tt-operator { background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); box-shadow: 0 4px 14px rgba(109,40,217,0.38), 0 1px 4px rgba(109,40,217,0.2); }
    .tt-btn.active.tt-supervisor { background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); box-shadow: 0 4px 14px rgba(37,99,235,0.38), 0 1px 4px rgba(37,99,235,0.2); }
    .tt-btn.active.tt-manager { background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); box-shadow: 0 4px 14px rgba(22,163,74,0.35), 0 1px 4px rgba(22,163,74,0.2); }
    .tab-group-label { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94A3B8; white-space: nowrap; flex-shrink: 0; padding: 0 0.125rem; align-self: center; }
    .tab-divider { width: 1px; height: 20px; background: linear-gradient(to bottom, transparent, #CBD5E1, transparent); flex-shrink: 0; margin: 0 0.375rem; align-self: center; }

    .template-meta { padding: 1rem 1.25rem; border-bottom: 1px solid #E2E8F0; }
    .tm-field { margin-bottom: 0.75rem; }
    .tm-row { display: flex; gap: 2rem; flex-wrap: wrap; }
    .field-label { display: block; font-size: 0.7rem; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.25rem; }
    .field-input { border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.375rem 0.75rem; font-size: 0.875rem; font-weight: 600; background: #F8FAFC; width: 100%; outline: none; }

    .layer-pill { border-radius: 20px; padding: 0.25rem 0.875rem; font-size: 0.75rem; font-weight: 700; display: inline-block; }
    .layer-operator { background: #EDE9FE; color: #5B21B6; }
    .layer-supervisor { background: #DBEAFE; color: #1E40AF; }
    .layer-manager { background: #DCFCE7; color: #166534; }
    .layer-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .layer-dot.layer-operator { background: #7C3AED; }
    .layer-dot.layer-supervisor { background: #2563EB; }
    .layer-dot.layer-manager { background: #16A34A; }

    .freq-pill { background: #FEF9C3; color: #713F12; border-radius: 20px; padding: 0.25rem 0.875rem; font-size: 0.75rem; font-weight: 700; display: inline-block; }
    .areas-list { display: flex; gap: 0.375rem; flex-wrap: wrap; }
    .area-chip { background: #F1F5F9; color: #334155; border-radius: 6px; padding: 0.2rem 0.625rem; font-size: 0.75rem; }

    .questions-section { padding: 1rem 1.25rem; }
    .qs-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.875rem; }
    .qs-title { font-size: 0.875rem; font-weight: 700; color: #0F172A; margin: 0; }
    .questions-list { display: flex; flex-direction: column; gap: 0.375rem; min-height: 40px; }
    .question-row { display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0.625rem; border: 1px solid #E2E8F0; border-radius: 8px; background: #FAFAFA; }
    .q-drag-handle { cursor: grab; padding: 0 2px; flex-shrink: 0; }
    .drag-icon { color: #CBD5E1; }
    .q-num { width: 20px; height: 20px; background: #E2E8F0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 700; color: #475569; flex-shrink: 0; }
    .q-text { flex: 1; font-size: 0.875rem; color: #334155; }
    .btn-xs { padding: 0.125rem 0.375rem; font-size: 0.75rem; }

    .panel-footer { padding: 1rem 1.25rem; border-top: 1px solid #E2E8F0; }

    .cdk-drag-placeholder { opacity: 0.3; background: #E0F2FE; border: 2px dashed #38BDF8; }

    /* Schedule table */
    .schedule-header { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; border-bottom: 1px solid #E2E8F0; }
    .q-table { width: 100%; border-collapse: collapse; }
    .q-table th { background: #F8FAFC; font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; padding: 0.625rem 1rem; text-align: left; border-bottom: 2px solid #E2E8F0; }
    .q-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #F1F5F9; font-size: 0.875rem; color: #334155; vertical-align: middle; }
    .tpl-name { font-weight: 500; color: #0F172A; max-width: 220px; }
    .action-cell { text-align: right; }
    .avatar-name { display: flex; align-items: center; gap: 0.5rem; }
    .avatar-sm { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0; }
  `],
})
export class LpaSetupComponent {
  @ViewChild('tabsEl') tabsEl!: ElementRef<HTMLDivElement>;
  readonly mock = inject(MockDataService);

  scrollTabs(amount: number): void {
    this.tabsEl?.nativeElement.scrollBy({ left: amount, behavior: 'smooth' });
  }

  readonly activeTemplateId = signal<string>('LPAT-001');
  private readonly _templates = signal<LpaTemplate[]>(this.mock.getLpaTemplates());
  readonly templates = this._templates.asReadonly();
  readonly schedules = signal<LpaScheduleEntry[]>(this.mock.getLpaSchedules());

  readonly activeTemplate = computed(() => this._templates().find(t => t.id === this.activeTemplateId()) ?? null);

  readonly templateGroups = computed(() => {
    const map = new Map<string, LpaTemplate[]>();
    for (const t of this._templates()) {
      const area = t.name.split(' – ')[0].trim();
      if (!map.has(area)) map.set(area, []);
      map.get(area)!.push(t);
    }
    return Array.from(map.entries()).map(([area, templates]) => ({ area, templates }));
  });

  private readonly _editQuestions = signal<LpaQuestion[]>([]);

  readonly editQuestions = computed<LpaQuestion[]>(() => {
    const tpl = this.activeTemplate();
    return tpl ? [...tpl.questions] : [];
  });

  getFrequency(templateId: string): string {
    return this._templates().find(t => t.id === templateId)?.frequency ?? '—';
  }

  newTemplate(): void { /* wireframe no-op */ }
  addQuestion(): void { /* wireframe no-op */ }

  removeQuestion(index: number): void {
    const tpl = this.activeTemplate();
    if (!tpl) return;
    const updated = this._templates().map(t => {
      if (t.id !== tpl.id) return t;
      const questions = [...t.questions];
      questions.splice(index, 1);
      return { ...t, questions };
    });
    this._templates.set(updated);
  }

  dropQuestion(event: CdkDragDrop<LpaQuestion[]>): void {
    const tpl = this.activeTemplate();
    if (!tpl) return;
    const updated = this._templates().map(t => {
      if (t.id !== tpl.id) return t;
      const questions = [...t.questions];
      moveItemInArray(questions, event.previousIndex, event.currentIndex);
      return { ...t, questions };
    });
    this._templates.set(updated);
  }
}
