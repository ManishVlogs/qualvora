import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/ui/services/toast.service';

interface EscalationRule {
  id: string; rule: string; default: string; current: string; unit: string;
}

const ESCALATION_RULES: EscalationRule[] = [
  { id: 'r1', rule: 'NCR open without containment', default: '24', current: '24', unit: 'hours' },
  { id: 'r2', rule: 'NCR open without disposition', default: '72', current: '72', unit: 'hours' },
  { id: 'r3', rule: 'CAPA past due date', default: '0', current: '0', unit: 'days' },
  { id: 'r4', rule: 'CAPA D4 not started', default: '5', current: '5', unit: 'days' },
  { id: 'r5', rule: 'Audit finding response overdue', default: '14', current: '14', unit: 'days' },
  { id: 'r6', rule: 'Document pending approval', default: '5', current: '5', unit: 'days' },
  { id: 'r7', rule: 'LPA run not completed', default: '1', current: '1', unit: 'days' },
  { id: 'r8', rule: 'Guest auditor credential expiring', default: '2', current: '2', unit: 'days' },
];

interface ApprovalStep { role: string; order: number; }
interface ApprovalChain { id: string; docType: string; steps: ApprovalStep[]; requiresEsig: boolean; }

const DOC_CHAINS: ApprovalChain[] = [
  { id: 'c1', docType: 'Procedure', requiresEsig: true, steps: [
    { role: 'Author', order: 1 }, { role: 'Quality Manager', order: 2 }, { role: 'Director', order: 3 },
  ]},
  { id: 'c2', docType: 'Work Instruction', requiresEsig: false, steps: [
    { role: 'Author', order: 1 }, { role: 'Quality Engineer', order: 2 },
  ]},
  { id: 'c3', docType: 'Control Plan', requiresEsig: true, steps: [
    { role: 'Author', order: 1 }, { role: 'Quality Manager', order: 2 },
  ]},
];

@Component({
  selector: 'app-workflows-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-1">
          <li class="breadcrumb-item text-muted">Settings</li>
          <li class="breadcrumb-item active">Workflows & Thresholds</li>
        </ol>
      </nav>
      <h1 class="page-title">Workflows & Thresholds</h1>
      <p class="page-sub">Escalation rules, approval chains and overdue alert thresholds</p>
    </div>

    <div class="card settings-card mb-4">
      <div class="card-body">
        <h6 class="section-label">Escalation Thresholds</h6>
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Rule</th>
              <th>Default</th>
              <th style="width:160px">Current Value</th>
            </tr>
          </thead>
          <tbody>
            @for (rule of rules(); track rule.id) {
              <tr>
                <td>{{ rule.rule }}</td>
                <td class="text-muted small">{{ rule.default }} {{ rule.unit }}</td>
                <td>
                  <div class="input-group input-group-sm">
                    <input type="number" class="form-control" [(ngModel)]="rule.current"
                      style="max-width:70px" />
                    <span class="input-group-text">{{ rule.unit }}</span>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
        <button class="btn btn-primary mt-3" (click)="saveRules()">
          <i class="bi bi-check-lg me-1"></i>Save Thresholds
        </button>
      </div>
    </div>

    <div class="card settings-card">
      <div class="card-body">
        <h6 class="section-label">Document Approval Chains</h6>
        @for (chain of chains; track chain.id) {
          <div class="chain-row mb-4">
            <div class="chain-header">
              <span class="fw-semibold">{{ chain.docType }}</span>
              <label class="esig-toggle">
                <input type="checkbox" [(ngModel)]="chain.requiresEsig" />
                <span class="ms-2 text-muted small">Requires e-signature</span>
              </label>
            </div>
            <div class="chain-steps">
              @for (step of chain.steps; track step.order) {
                <div class="chain-step">
                  <div class="step-order">{{ step.order }}</div>
                  <select class="form-select form-select-sm" [(ngModel)]="step.role"
                    style="max-width:180px">
                    <option>Author</option><option>Quality Engineer</option>
                    <option>Quality Manager</option><option>Director</option>
                    <option>Supervisor</option>
                  </select>
                  @if (chain.steps.length > 1) {
                    <button class="btn btn-sm btn-outline-danger ms-2"
                      (click)="removeStep(chain, step.order)">
                      <i class="bi bi-x"></i>
                    </button>
                  }
                </div>
              }
              <button class="btn btn-sm btn-outline-primary mt-2" (click)="addStep(chain)">
                <i class="bi bi-plus me-1"></i>Add Step
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0; }
    .page-sub { font-size: 13px; color: #64748B; margin: 4px 0 0; }
    .breadcrumb { font-size: 13px; }
    .settings-card { border: none; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94A3B8; margin-bottom: 16px; }
    .chain-row { border-bottom: 1px solid #F1F5F9; padding-bottom: 16px; }
    .chain-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .chain-steps { padding-left: 8px; }
    .chain-step { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .step-order {
      width: 24px; height: 24px; border-radius: 50%; background: #E2E8F0;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600; color: #64748B; flex-shrink: 0;
    }
    .esig-toggle { display: flex; align-items: center; cursor: pointer; }
  `]
})
export class WorkflowsSettingsComponent {
  private toast = inject(ToastService);
  readonly rules = signal(ESCALATION_RULES.map(r => ({ ...r })));
  readonly chains = DOC_CHAINS.map(c => ({ ...c, steps: c.steps.map(s => ({ ...s })) }));

  saveRules(): void { this.toast.show('Escalation thresholds saved', 'success'); }

  addStep(chain: ApprovalChain): void {
    chain.steps.push({ role: 'Quality Engineer', order: chain.steps.length + 1 });
  }
  removeStep(chain: ApprovalChain, order: number): void {
    chain.steps = chain.steps.filter(s => s.order !== order)
      .map((s, i) => ({ ...s, order: i + 1 }));
  }
}
