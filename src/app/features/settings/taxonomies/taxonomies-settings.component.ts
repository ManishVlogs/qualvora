import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/ui/services/toast.service';

const DEFAULT_DEFECTS = [
  'Dimensional Out-of-Spec','Surface Scratch','Wrong Material','Missing Component',
  'Weld Defect','Paint Adhesion','Torque Non-Conformance','Contamination',
  'Label Error','Packaging Damage','Assembly Error','Crack / Fracture',
];
const DEFAULT_DOC_TYPES = ['Control Plan','PFMEA','Work Instruction','Quality Plan','Inspection Report','Procedure','Form'];
const DEFAULT_DISPOSITIONS = ['Use As-Is','Rework','Scrap','Return to Supplier','Concession'];

interface AreaNode { id: string; name: string; children: string[]; }
const DEFAULT_AREAS: AreaNode[] = [
  { id: 'a1', name: 'Stamping', children: ['Cell 1','Cell 2','Cell 3'] },
  { id: 'a2', name: 'Welding', children: ['MIG Station','Spot Weld Line'] },
  { id: 'a3', name: 'Assembly', children: ['Line A','Line B','Final Assembly'] },
  { id: 'a4', name: 'Inspection', children: ['Incoming','In-Process','Final'] },
];

@Component({
  selector: 'app-taxonomies-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-1">
          <li class="breadcrumb-item text-muted">Settings</li>
          <li class="breadcrumb-item active">Taxonomies</li>
        </ol>
      </nav>
      <h1 class="page-title">Taxonomies</h1>
      <p class="page-sub">Defect codes, document types, areas and disposition options used across forms</p>
    </div>

    <div class="card settings-card">
      <div class="card-body">
        <ul class="nav nav-tabs mb-4">
          @for (tab of tabs; track tab) {
            <li class="nav-item">
              <button class="nav-link" [class.active]="activeTab() === tab"
                (click)="activeTab.set(tab)">{{ tab }}</button>
            </li>
          }
        </ul>

        @if (activeTab() === 'Defect Codes') {
          <div>
            <div class="chips-grid">
              @for (chip of defectCodes(); track chip; let i = $index) {
                <span class="chip">
                  {{ chip }}
                  <i class="bi bi-x chip-x" (click)="removeDefect(i)"></i>
                </span>
              }
            </div>
            <div class="add-row mt-3">
              <input class="form-control form-control-sm" style="max-width:240px"
                [(ngModel)]="newDefect" placeholder="New defect code..."
                (keyup.enter)="addDefect()" />
              <button class="btn btn-sm btn-outline-primary" (click)="addDefect()">
                <i class="bi bi-plus me-1"></i>Add
              </button>
              <button class="btn btn-sm btn-outline-secondary ms-auto" (click)="resetDefects()">
                Reset to Defaults
              </button>
            </div>
          </div>
        }

        @if (activeTab() === 'Document Types') {
          <div>
            <ul class="list-group mb-3" style="max-width:400px">
              @for (dt of docTypes(); track dt; let i = $index) {
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>{{ dt }}</span>
                  <i class="bi bi-x text-muted" style="cursor:pointer" (click)="removeDocType(i)"></i>
                </li>
              }
            </ul>
            <div class="add-row">
              <input class="form-control form-control-sm" style="max-width:240px"
                [(ngModel)]="newDocType" placeholder="New document type..."
                (keyup.enter)="addDocType()" />
              <button class="btn btn-sm btn-outline-primary" (click)="addDocType()">
                <i class="bi bi-plus me-1"></i>Add
              </button>
              <button class="btn btn-sm btn-outline-secondary ms-auto" (click)="resetDocTypes()">
                Reset to Defaults
              </button>
            </div>
          </div>
        }

        @if (activeTab() === 'Areas') {
          <div style="max-width:480px">
            @for (area of areas(); track area.id) {
              <div class="area-node">
                <div class="area-name">
                  <i class="bi bi-folder2 text-warning me-2"></i>
                  <span class="fw-semibold">{{ area.name }}</span>
                </div>
                <ul class="area-children">
                  @for (child of area.children; track child; let ci = $index) {
                    <li class="area-child">
                      <i class="bi bi-dash me-1 text-muted"></i>{{ child }}
                      <i class="bi bi-x text-muted ms-auto" style="cursor:pointer"
                        (click)="removeChild(area.id, ci)"></i>
                    </li>
                  }
                  <li class="area-child text-primary" style="cursor:pointer"
                    (click)="addChild(area.id)">
                    <i class="bi bi-plus me-1"></i>Add sub-area
                  </li>
                </ul>
              </div>
            }
            <button class="btn btn-sm btn-outline-primary mt-2" (click)="addArea()">
              <i class="bi bi-plus me-1"></i>Add Area
            </button>
          </div>
        }

        @if (activeTab() === 'Disposition Types') {
          <div>
            <ul class="list-group mb-3" style="max-width:400px">
              @for (d of dispositions(); track d; let i = $index) {
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>{{ d }}</span>
                  <i class="bi bi-x text-muted" style="cursor:pointer" (click)="removeDisposition(i)"></i>
                </li>
              }
            </ul>
            <div class="add-row">
              <input class="form-control form-control-sm" style="max-width:240px"
                [(ngModel)]="newDisposition" placeholder="New disposition..."
                (keyup.enter)="addDisposition()" />
              <button class="btn btn-sm btn-outline-primary" (click)="addDisposition()">
                <i class="bi bi-plus me-1"></i>Add
              </button>
              <button class="btn btn-sm btn-outline-secondary ms-auto" (click)="resetDispositions()">
                Reset to Defaults
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
    .chips-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      display: inline-flex; align-items: center; gap: 4px;
      background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 20px;
      padding: 4px 10px; font-size: 12px; color: #334155;
    }
    .chip-x { cursor: pointer; opacity: 0.5; }
    .chip-x:hover { opacity: 1; color: #EF4444; }
    .add-row { display: flex; align-items: center; gap: 8px; }
    .area-node { margin-bottom: 12px; }
    .area-name { display: flex; align-items: center; padding: 8px 0; }
    .area-children { list-style: none; padding: 0 0 0 24px; margin: 0; }
    .area-child {
      display: flex; align-items: center; padding: 4px 0;
      font-size: 13px; color: #475569;
    }
    .area-child .bi-x { margin-left: auto; }
  `]
})
export class TaxonomiesSettingsComponent {
  private toast = inject(ToastService);

  readonly tabs = ['Defect Codes','Document Types','Areas','Disposition Types'];
  readonly activeTab = signal('Defect Codes');
  readonly defectCodes = signal([...DEFAULT_DEFECTS]);
  readonly docTypes = signal([...DEFAULT_DOC_TYPES]);
  readonly areas = signal<AreaNode[]>(DEFAULT_AREAS.map(a => ({ ...a, children: [...a.children] })));
  readonly dispositions = signal([...DEFAULT_DISPOSITIONS]);

  newDefect = ''; newDocType = ''; newDisposition = '';

  addDefect(): void { if (this.newDefect.trim()) { this.defectCodes.update(l => [...l, this.newDefect.trim()]); this.newDefect = ''; } }
  removeDefect(i: number): void { this.defectCodes.update(l => l.filter((_, idx) => idx !== i)); }
  resetDefects(): void { this.defectCodes.set([...DEFAULT_DEFECTS]); this.toast.show('Defect codes reset', 'info'); }

  addDocType(): void { if (this.newDocType.trim()) { this.docTypes.update(l => [...l, this.newDocType.trim()]); this.newDocType = ''; } }
  removeDocType(i: number): void { this.docTypes.update(l => l.filter((_, idx) => idx !== i)); }
  resetDocTypes(): void { this.docTypes.set([...DEFAULT_DOC_TYPES]); this.toast.show('Document types reset', 'info'); }

  addDisposition(): void { if (this.newDisposition.trim()) { this.dispositions.update(l => [...l, this.newDisposition.trim()]); this.newDisposition = ''; } }
  removeDisposition(i: number): void { this.dispositions.update(l => l.filter((_, idx) => idx !== i)); }
  resetDispositions(): void { this.dispositions.set([...DEFAULT_DISPOSITIONS]); this.toast.show('Dispositions reset', 'info'); }

  addArea(): void {
    const name = `Area-${this.areas().length + 1}`;
    this.areas.update(l => [...l, { id: 'a' + Date.now(), name, children: [] }]);
  }
  addChild(areaId: string): void {
    this.areas.update(l => l.map(a => a.id === areaId
      ? { ...a, children: [...a.children, `Sub-${a.children.length + 1}`] } : a));
  }
  removeChild(areaId: string, ci: number): void {
    this.areas.update(l => l.map(a => a.id === areaId
      ? { ...a, children: a.children.filter((_, i) => i !== ci) } : a));
  }
}
