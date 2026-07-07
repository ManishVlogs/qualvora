import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { AuditChecklistSection, AuditChecklistItem } from '../../../shared/interfaces/models';

interface ChecklistTemplate {
  id: string;
  name: string;
  standard: string;
  sectionCount: number;
  itemCount: number;
  lastModified: string;
}

@Component({
  selector: 'app-checklist-builder',
  standalone: true,
  imports: [CommonModule, RouterLink, DragDropModule],
  template: `
    <div class="page-wrapper">

      <div class="page-header">
        <div>
          <h1>Checklist Builder</h1>
          <p>Create and manage audit checklist templates</p>
        </div>
        <div class="header-actions">
          <span class="chip chip-blue">SCR-054</span>
          <button class="btn btn-primary ms-2" (click)="newTemplate()">
            <i class="bi bi-plus-lg me-1"></i>New Template
          </button>
        </div>
      </div>

      <div class="builder-layout">

        <!-- Left: Template list -->
        <aside class="templates-panel q-card">
          <div class="panel-header">
            <h3 class="panel-title">Templates</h3>
            <span class="item-count">{{ templates.length }}</span>
          </div>
          <div class="template-list">
            @for (t of templates; track t.id) {
              <button class="template-item" [class.active]="activeTemplateId() === t.id" (click)="activeTemplateId.set(t.id)">
                <div class="ti-top">
                  <span class="ti-name">{{ t.name }}</span>
                  <span class="ti-std">{{ t.standard }}</span>
                </div>
                <div class="ti-meta">
                  <span>{{ t.sectionCount }} sections</span>
                  <span>{{ t.itemCount }} items</span>
                  <span>{{ t.lastModified }}</span>
                </div>
              </button>
            }
          </div>
        </aside>

        <!-- Right: Editor -->
        <main class="editor-panel">
          @if (activeTemplate(); as tpl) {
            <div class="editor-toolbar q-card mb-3">
              <input class="template-name-input" [value]="tpl.name" readonly />
              <div class="toolbar-actions">
                <button class="btn btn-sm btn-outline-secondary" (click)="showIatfModal.set(true)">
                  <i class="bi bi-book me-1"></i>IATF Library
                </button>
                <button class="btn btn-sm btn-outline-secondary">
                  <i class="bi bi-plus-lg me-1"></i>Add Section
                </button>
                <button class="btn btn-sm btn-primary">
                  <i class="bi bi-floppy me-1"></i>Save
                </button>
              </div>
            </div>

            <div class="sections-editor"
                 cdkDropList
                 [cdkDropListData]="editSections()"
                 (cdkDropListDropped)="dropSection($event)">
              @for (section of editSections(); track section.id; let si = $index) {
                <div class="section-block q-card" cdkDrag>
                  <div class="section-drag-handle" cdkDragHandle>
                    <i class="bi bi-grip-vertical drag-icon"></i>
                  </div>
                  <div class="section-content">
                    <div class="section-head">
                      <div class="sh-left">
                        <input class="section-title-input" [value]="section.title" readonly />
                        <span class="clause-tag">{{ section.clauseGroup }}</span>
                      </div>
                      <div class="sh-right">
                        <span class="item-count-badge">{{ section.items.length }} items</span>
                        <button class="btn btn-sm btn-outline-secondary ms-2" (click)="addItem(si)">
                          <i class="bi bi-plus-lg"></i>
                        </button>
                      </div>
                    </div>

                    <div class="items-list"
                         cdkDropList
                         [cdkDropListData]="section.items"
                         [id]="'section-' + section.id"
                         (cdkDropListDropped)="dropItem($event, si)">
                      @for (item of section.items; track item.id; let ii = $index) {
                        <div class="item-row" cdkDrag>
                          <div class="item-drag-handle" cdkDragHandle>
                            <i class="bi bi-grip-vertical item-drag-icon"></i>
                          </div>
                          <div class="item-content">
                            <div class="item-text">{{ item.text }}</div>
                            <div class="item-meta">
                              <span class="item-clause">{{ item.clauseRef }}</span>
                              <span class="item-guidance">{{ item.guidance | slice:0:60 }}{{ item.guidance.length > 60 ? '…' : '' }}</span>
                            </div>
                          </div>
                          <div class="item-actions">
                            <button class="btn btn-xs btn-link text-secondary" title="Edit">
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-xs btn-link text-danger" title="Remove" (click)="removeItem(si, ii)">
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="q-card editor-empty">
              <i class="bi bi-list-check editor-empty-icon"></i>
              <p>Select a template to begin editing</p>
            </div>
          }
        </main>

      </div>

      <!-- IATF Library Modal -->
      @if (showIatfModal()) {
        <div class="modal-backdrop" (click)="showIatfModal.set(false)">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title"><i class="bi bi-book me-2"></i>IATF 16949 Clause Library</h3>
              <button class="btn btn-link modal-close" (click)="showIatfModal.set(false)"><i class="bi bi-x-lg"></i></button>
            </div>
            <div class="modal-body">
              <div class="modal-search">
                <i class="bi bi-search modal-search-icon"></i>
                <input class="modal-search-input" placeholder="Search clauses…" />
              </div>
              <div class="iatf-clause-list">
                @for (clause of iatfClauses; track clause.ref) {
                  <div class="iatf-clause-item">
                    <div class="ic-ref">{{ clause.ref }}</div>
                    <div class="ic-body">
                      <div class="ic-title">{{ clause.title }}</div>
                      <div class="ic-desc">{{ clause.desc }}</div>
                    </div>
                    <button class="btn btn-sm btn-outline-primary ms-2" (click)="importClause(clause)">
                      <i class="bi bi-plus-lg"></i> Add
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1440px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; margin: 0 0 0.25rem; }
    .page-header p { font-size: 0.875rem; color: #64748B; margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 0.5rem; }

    .builder-layout { display: flex; gap: 1.25rem; align-items: flex-start; }

    /* Template list */
    .templates-panel { width: 280px; min-width: 260px; padding: 0; overflow: hidden; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; border-bottom: 1px solid #E2E8F0; }
    .panel-title { font-size: 0.875rem; font-weight: 700; color: #0F172A; margin: 0; }
    .item-count { background: #E2E8F0; color: #475569; border-radius: 20px; padding: 0.1rem 0.5rem; font-size: 0.75rem; font-weight: 600; }

    .template-list { overflow-y: auto; max-height: calc(100vh - 220px); }
    .template-item { display: block; width: 100%; padding: 0.75rem 1rem; border: none; background: none; text-align: left; cursor: pointer; border-left: 3px solid transparent; border-bottom: 1px solid #F1F5F9; }
    .template-item.active { background: #F0F9FF; border-left-color: #2563EB; }
    .template-item:hover:not(.active) { background: #F8FAFC; }
    .ti-top { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.25rem; }
    .ti-name { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
    .ti-std { font-size: 0.7rem; color: #64748B; }
    .ti-meta { display: flex; gap: 0.75rem; font-size: 0.75rem; color: #94A3B8; }

    /* Editor */
    .editor-panel { flex: 1; min-width: 0; }
    .editor-toolbar { padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .template-name-input { flex: 1; min-width: 200px; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.375rem 0.75rem; font-size: 0.9375rem; font-weight: 700; background: #F8FAFC; outline: none; }
    .toolbar-actions { display: flex; gap: 0.5rem; }

    .sections-editor { display: flex; flex-direction: column; gap: 0.75rem; }
    .section-block { padding: 0; overflow: hidden; display: flex; gap: 0; }
    .section-drag-handle { width: 32px; display: flex; align-items: flex-start; justify-content: center; padding-top: 1rem; background: #F8FAFC; border-right: 1px solid #E2E8F0; cursor: grab; flex-shrink: 0; }
    .drag-icon { color: #CBD5E1; font-size: 1rem; }
    .section-content { flex: 1; padding: 1rem; }
    .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; }
    .sh-left { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
    .sh-right { display: flex; align-items: center; }
    .section-title-input { border: 1px solid #E2E8F0; border-radius: 6px; padding: 0.25rem 0.625rem; font-size: 0.875rem; font-weight: 700; background: #F8FAFC; flex: 1; outline: none; }
    .clause-tag { background: #EDE9FE; color: #5B21B6; border-radius: 6px; padding: 0.15rem 0.5rem; font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
    .item-count-badge { font-size: 0.75rem; color: #94A3B8; }

    .items-list { display: flex; flex-direction: column; gap: 0.25rem; min-height: 40px; }
    .item-row { display: flex; align-items: flex-start; gap: 0.5rem; padding: 0.5rem; border: 1px solid #E2E8F0; border-radius: 8px; background: #FAFAFA; }
    .item-drag-handle { padding: 2px 4px; cursor: grab; flex-shrink: 0; }
    .item-drag-icon { color: #CBD5E1; font-size: 0.875rem; }
    .item-content { flex: 1; min-width: 0; }
    .item-text { font-size: 0.875rem; color: #0F172A; margin-bottom: 0.25rem; }
    .item-meta { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .item-clause { font-size: 0.7rem; font-family: monospace; color: #94A3B8; }
    .item-guidance { font-size: 0.7rem; color: #94A3B8; }
    .item-actions { display: flex; gap: 0.25rem; flex-shrink: 0; }
    .btn-xs { padding: 0.125rem 0.375rem; font-size: 0.75rem; }

    .editor-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; text-align: center; color: #94A3B8; }
    .editor-empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }

    /* CDK drag placeholder */
    .cdk-drag-placeholder { opacity: 0.4; background: #E0F2FE; }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }

    /* IATF Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.5); z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-panel { background: #fff; border-radius: 12px; width: 640px; max-width: 100%; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #E2E8F0; }
    .modal-title { font-size: 1rem; font-weight: 700; margin: 0; }
    .modal-close { color: #94A3B8; padding: 0; }
    .modal-body { flex: 1; overflow-y: auto; padding: 1rem 1.25rem; }
    .modal-search { position: relative; margin-bottom: 1rem; }
    .modal-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
    .modal-search-input { width: 100%; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.375rem 0.75rem 0.375rem 2rem; font-size: 0.875rem; outline: none; }
    .iatf-clause-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .iatf-clause-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem; border: 1px solid #E2E8F0; border-radius: 8px; }
    .ic-ref { font-family: monospace; font-size: 0.8125rem; font-weight: 700; color: #5B21B6; min-width: 52px; }
    .ic-body { flex: 1; }
    .ic-title { font-size: 0.875rem; font-weight: 600; color: #0F172A; margin-bottom: 0.25rem; }
    .ic-desc { font-size: 0.75rem; color: #64748B; }
  `],
})
export class ChecklistBuilderComponent {
  readonly mock = inject(MockDataService);

  readonly showIatfModal = signal(false);
  readonly activeTemplateId = signal<string | null>('CT-001');

  readonly templates: ChecklistTemplate[] = [
    { id: 'CT-001', name: 'Process Audit Standard v2.3', standard: 'IATF 16949', sectionCount: 4, itemCount: 12, lastModified: 'Jun 2, 2026' },
    { id: 'CT-002', name: 'Supplier Qualification Audit', standard: 'IATF 16949', sectionCount: 5, itemCount: 18, lastModified: 'May 15, 2026' },
    { id: 'CT-003', name: 'Internal System Audit – Full', standard: 'IATF 16949', sectionCount: 8, itemCount: 32, lastModified: 'Apr 28, 2026' },
    { id: 'CT-004', name: 'Product Audit Checklist', standard: 'IATF 16949', sectionCount: 3, itemCount: 10, lastModified: 'Mar 12, 2026' },
  ];

  // Use audit detail sections as editable content for demo
  private readonly _sections = signal<AuditChecklistSection[]>(
    this.mock.getAuditDetail('AUD-2026-011')?.sections.map(s => ({ ...s, items: [...s.items] })) ?? []
  );
  readonly editSections = this._sections.asReadonly();

  readonly activeTemplate = computed(() => this.templates.find(t => t.id === this.activeTemplateId()) ?? null);

  newTemplate(): void { /* wireframe no-op */ }

  dropSection(event: CdkDragDrop<AuditChecklistSection[]>): void {
    const arr = [...this._sections()];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this._sections.set(arr);
  }

  dropItem(event: CdkDragDrop<AuditChecklistItem[]>, sectionIndex: number): void {
    const sections = [...this._sections()];
    const items = [...sections[sectionIndex].items];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    sections[sectionIndex] = { ...sections[sectionIndex], items };
    this._sections.set(sections);
  }

  removeItem(sectionIndex: number, itemIndex: number): void {
    const sections = [...this._sections()];
    const items = [...sections[sectionIndex].items];
    items.splice(itemIndex, 1);
    sections[sectionIndex] = { ...sections[sectionIndex], items };
    this._sections.set(sections);
  }

  addItem(sectionIndex: number): void { /* wireframe no-op */ }

  importClause(clause: { ref: string; title: string; desc: string }): void {
    this.showIatfModal.set(false);
  }

  readonly iatfClauses = [
    { ref: '4.1', title: 'Understanding the organization and its context', desc: 'Determine external and internal issues relevant to the organization\'s quality objectives.' },
    { ref: '4.2', title: 'Understanding needs and expectations of interested parties', desc: 'Identify interested parties and their relevant requirements.' },
    { ref: '5.1', title: 'Leadership and commitment', desc: 'Top management shall demonstrate leadership and commitment to the QMS.' },
    { ref: '7.1.5', title: 'Monitoring and measuring resources', desc: 'Equipment used for monitoring and measuring shall be calibrated and maintained.' },
    { ref: '8.2.3', title: 'Review of requirements for products and services', desc: 'The organization shall review requirements related to products prior to committing.' },
    { ref: '8.4.1', title: 'Control of externally provided processes', desc: 'The organization shall ensure that externally provided processes conform to requirements.' },
    { ref: '8.5.1', title: 'Control of production and service provision', desc: 'Controlled conditions shall include control plans, work instructions, monitoring activities.' },
    { ref: '8.7.1', title: 'Control of nonconforming outputs', desc: 'Outputs that do not conform to requirements shall be identified and controlled.' },
    { ref: '9.1.1', title: 'Monitoring, measurement, analysis and evaluation', desc: 'The organization shall determine what needs to be monitored and measured.' },
    { ref: '10.2', title: 'Nonconformity and corrective action', desc: 'When a nonconformity occurs, take action to control and correct it.' },
  ];
}
