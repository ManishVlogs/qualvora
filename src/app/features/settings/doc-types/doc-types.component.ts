import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocType, ApprovalChainStep } from '../../../shared/interfaces/models';
import { MockDataService } from '../../../shared/services/mock-data.service';

@Component({
  selector: 'app-doc-types',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <h1 class="page-title">Document Types & Approval Chains</h1>
        <p class="page-sub">Configure document type tiers and approval workflow chains</p>
      </div>

      <div class="split-layout">
        <!-- Left: Type list -->
        <div class="q-card type-list-card">
          <div class="list-header">Document Types</div>
          <div class="type-list">
            @for (t of docTypes; track t.id) {
              <button class="type-item" [class.active]="selectedType()?.id === t.id"
                      (click)="selectedType.set(t)">
                <div class="type-item-left">
                  <span class="type-name">{{ t.name }}</span>
                  <span class="tier-pill">T{{ t.tier }}</span>
                </div>
                <div class="type-item-right">
                  <span class="chain-count">{{ t.approvalChain.length }} steps</span>
                  <i class="bi bi-chevron-right type-arrow"></i>
                </div>
              </button>
            }
          </div>
          <div class="list-footer">
            <button class="btn btn-outline-primary btn-sm w-100" (click)="addNewType()">
              <i class="bi bi-plus me-1"></i> New Document Type
            </button>
          </div>
        </div>

        <!-- Right: Approval chain editor -->
        @if (selectedType()) {
          <div class="q-card chain-card">
            <div class="chain-header">
              <div>
                <h2 class="chain-title">{{ selectedType()!.name }}</h2>
                <div class="chain-meta">
                  Tier {{ selectedType()!.tier }} ·
                  <span class="tier-pill">T{{ selectedType()!.tier }}</span>
                </div>
              </div>
              <div class="chain-header-actions">
                @if (dirty()) {
                  <span class="unsaved-badge"><i class="bi bi-dot me-1"></i>Unsaved changes</span>
                }
                <button class="btn btn-primary btn-sm" (click)="saveChain()">
                  <i class="bi bi-floppy me-1"></i> Save Chain
                </button>
              </div>
            </div>

            <div class="chain-section-label">Approval Steps</div>

            <div class="chain-steps">
              @for (step of editableChain(); track step.step; let i = $index; let first = $first; let last = $last) {
                <div class="chain-step">
                  <div class="step-num-badge">{{ step.step }}</div>
                  <div class="step-body">
                    <div class="step-row">
                      <div class="step-role-field">
                        <label class="step-field-label">Role</label>
                        <select class="form-select step-select" [(ngModel)]="step.role" (change)="markDirty()">
                          @for (r of availableRoles; track r) {
                            <option [value]="r">{{ r }}</option>
                          }
                        </select>
                      </div>
                      <div class="step-esign-field">
                        <label class="step-field-label">Require E-Sign</label>
                        <label class="toggle-row">
                          <div class="toggle-wrap">
                            <input type="checkbox" class="toggle-input" [(ngModel)]="step.requiresESign" (change)="markDirty()" />
                            <span class="toggle-slider"></span>
                          </div>
                          <span class="toggle-val-label">{{ step.requiresESign ? 'Required' : 'Optional' }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="step-move-btns">
                    <button class="move-btn" [disabled]="first" (click)="moveUp(i)" title="Move up">
                      <i class="bi bi-chevron-up"></i>
                    </button>
                    <button class="move-btn" [disabled]="last" (click)="moveDown(i)" title="Move down">
                      <i class="bi bi-chevron-down"></i>
                    </button>
                    <button class="move-btn remove-btn" (click)="removeStep(i)" title="Remove step">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
                @if (!last) {
                  <div class="step-connector"><div class="connector-line"></div></div>
                }
              }
            </div>

            <button class="btn btn-outline-secondary btn-sm add-step-btn" (click)="addStep()">
              <i class="bi bi-plus me-1"></i> Add Step
            </button>

            <div class="chain-footer">
              <div class="chain-info">
                <i class="bi bi-info-circle me-1"></i>
                Changes apply to all new documents of this type. Existing in-approval documents are unaffected.
              </div>
            </div>
          </div>
        } @else {
          <div class="q-card empty-chain">
            <i class="bi bi-diagram-3 empty-icon"></i>
            <p>Select a document type to view and edit its approval chain</p>
          </div>
        }
      </div>
    </div>

    @if (toast()) {
      <div class="action-toast"><i class="bi bi-check-circle-fill me-2"></i>{{ toast() }}</div>
    }
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
    .page-header { margin-bottom: 1.25rem; }
    .page-title { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0 0 0.2rem; }
    .page-sub { font-size: 0.875rem; color: #64748B; margin: 0; }

    .split-layout { display: grid; grid-template-columns: 280px 1fr; gap: 1rem; align-items: start; }

    /* Type list */
    .type-list-card { overflow: hidden; }
    .list-header { padding: 0.875rem 1rem; font-weight: 700; font-size: 0.875rem; color: #0F172A; border-bottom: 1px solid #F1F5F9; }
    .type-list { padding: 0.5rem 0; }
    .type-item { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0.625rem 1rem; background: none; border: none; text-align: left; cursor: pointer; transition: background 120ms; &:hover { background: #F8FAFC; } &.active { background: #EFF6FF; } }
    .type-item-left { display: flex; align-items: center; gap: 0.5rem; }
    .type-name { font-size: 0.875rem; font-weight: 500; color: #0F172A; }
    .tier-pill { background: #E0E7FF; color: #4338CA; border-radius: 4px; padding: 1px 5px; font-size: 10px; font-weight: 700; }
    .type-item-right { display: flex; align-items: center; gap: 0.5rem; }
    .chain-count { font-size: 0.75rem; color: #94A3B8; }
    .type-arrow { font-size: 0.75rem; color: #CBD5E1; }
    .list-footer { padding: 0.75rem; border-top: 1px solid #F1F5F9; }

    /* Chain editor */
    .chain-card { padding: 0; overflow: hidden; }
    .chain-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.25rem; border-bottom: 1px solid #F1F5F9; }
    .chain-title { font-size: 1.125rem; font-weight: 700; color: #0F172A; margin: 0 0 0.25rem; }
    .chain-meta { font-size: 0.8125rem; color: #64748B; display: flex; align-items: center; gap: 0.375rem; }
    .chain-header-actions { display: flex; align-items: center; gap: 0.75rem; }
    .unsaved-badge { font-size: 0.8125rem; color: #B45309; font-weight: 500; display: flex; align-items: center; }
    .chain-section-label { padding: 0.75rem 1.25rem 0.25rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94A3B8; }

    .chain-steps { padding: 0 1.25rem; }
    .chain-step { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.875rem 0; }
    .step-num-badge { width: 28px; height: 28px; background: #EFF6FF; border: 2px solid #BFDBFE; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8125rem; font-weight: 700; color: #2563EB; flex-shrink: 0; margin-top: 4px; }
    .step-body { flex: 1; }
    .step-row { display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center; }
    .step-field-label { font-size: 0.75rem; font-weight: 600; color: #64748B; display: block; margin-bottom: 0.25rem; }
    .step-select { font-size: 0.875rem; border-color: #E2E8F0; height: 36px; }
    .step-esign-field { display: flex; flex-direction: column; }
    .toggle-row { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .toggle-wrap { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
    .toggle-input { opacity: 0; width: 0; height: 0; position: absolute; }
    .toggle-slider { position: absolute; inset: 0; background: #E2E8F0; border-radius: 10px; transition: 200ms; cursor: pointer; &::before { content: ''; position: absolute; width: 14px; height: 14px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: 200ms; } }
    .toggle-input:checked + .toggle-slider { background: #2563EB; }
    .toggle-input:checked + .toggle-slider::before { transform: translateX(16px); }
    .toggle-val-label { font-size: 0.8125rem; color: #475569; }

    .step-move-btns { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
    .move-btn { width: 26px; height: 26px; background: none; border: 1px solid #E2E8F0; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748B; font-size: 0.75rem; &:hover:not([disabled]) { border-color: #2563EB; color: #2563EB; } &[disabled] { opacity: 0.3; cursor: not-allowed; } }
    .remove-btn { &:hover:not([disabled]) { border-color: #DC2626; color: #DC2626; } }

    .step-connector { display: flex; justify-content: flex-start; padding-left: 14px; margin-left: 27px; }
    .connector-line { width: 2px; height: 12px; background: #E2E8F0; }

    .add-step-btn { margin: 0.5rem 1.25rem 1rem; }

    .chain-footer { padding: 1rem 1.25rem; border-top: 1px solid #F1F5F9; }
    .chain-info { font-size: 0.8125rem; color: #94A3B8; display: flex; align-items: flex-start; gap: 0.375rem; }

    .empty-chain { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 240px; color: #94A3B8; gap: 0.75rem; }
    .empty-icon { font-size: 3rem; color: #CBD5E1; }
    .empty-chain p { font-size: 0.875rem; margin: 0; }

    .action-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: #0F172A; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; z-index: 400; box-shadow: 0 4px 20px rgba(0,0,0,0.2); display: flex; align-items: center; }
  `]
})
export class DocTypesComponent {
  private readonly mock = inject(MockDataService);
  readonly toast = signal('');
  readonly dirty = signal(false);
  readonly selectedType = signal<DocType | null>(null);

  readonly availableRoles = ['QM', 'QE', 'Director', 'Supervisor', 'Author', 'Senior QE', 'Plant Manager'];

  get docTypes(): DocType[] { return this.mock.docTypes(); }

  editableChain(): ApprovalChainStep[] {
    return this.selectedType()?.approvalChain ?? [];
  }

  markDirty(): void { this.dirty.set(true); }

  addStep(): void {
    const t = this.selectedType();
    if (!t) return;
    const nextStep = t.approvalChain.length + 1;
    t.approvalChain.push({ step: nextStep, role: 'QM', requiresESign: false });
    this.markDirty();
  }

  removeStep(i: number): void {
    const t = this.selectedType();
    if (!t || t.approvalChain.length <= 1) return;
    t.approvalChain.splice(i, 1);
    t.approvalChain.forEach((s, idx) => s.step = idx + 1);
    this.markDirty();
  }

  moveUp(i: number): void {
    const chain = this.selectedType()?.approvalChain;
    if (!chain || i === 0) return;
    [chain[i - 1], chain[i]] = [chain[i], chain[i - 1]];
    chain.forEach((s, idx) => s.step = idx + 1);
    this.markDirty();
  }

  moveDown(i: number): void {
    const chain = this.selectedType()?.approvalChain;
    if (!chain || i >= chain.length - 1) return;
    [chain[i + 1], chain[i]] = [chain[i], chain[i + 1]];
    chain.forEach((s, idx) => s.step = idx + 1);
    this.markDirty();
  }

  saveChain(): void {
    this.dirty.set(false);
    this.toast.set(`Approval chain for "${this.selectedType()?.name}" saved`);
    setTimeout(() => this.toast.set(''), 2500);
  }

  addNewType(): void {
    const dt = this.mock.addDocType({
      name: 'New Document Type',
      tier: 3,
      approvalChain: [{ step: 1, role: 'QM', requiresESign: true }],
    });
    this.selectedType.set(dt);
    this.toast.set(`New type "${dt.id}" created — edit name and chain above`);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
