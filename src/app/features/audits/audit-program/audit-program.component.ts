import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { AuditProgramEntry, AuditProgramType } from '../../../shared/interfaces/models';

const PROCESS_AREAS = [
  'Management & Planning',
  'Customer & Supplier',
  'Weld Zone Operations',
  'Stamping & Forming',
  'Assembly Operations',
  'Incoming Inspection',
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TYPE_COLORS: Record<AuditProgramType, { bg: string; text: string }> = {
  'System':  { bg: '#DBEAFE', text: '#1E40AF' },
  'Process': { bg: '#EDE9FE', text: '#5B21B6' },
  'Product': { bg: '#DCFCE7', text: '#166534' },
  'LPA':     { bg: '#FEF9C3', text: '#713F12' },
};

@Component({
  selector: 'app-audit-program',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">

      <div class="page-header">
        <div>
          <h1>Audit Program</h1>
          <p>2026 Annual Audit Schedule — IATF 16949 Coverage</p>
        </div>
        <div class="header-actions">
          <span class="chip chip-blue">SCR-050</span>
          <button class="btn btn-primary ms-2" [routerLink]="['/audits/new']">
            <i class="bi bi-plus-lg me-1"></i>Add Audit
          </button>
        </div>
      </div>

      <!-- Coverage strip -->
      <div class="q-card coverage-card mb-3">
        <div class="coverage-label">IATF Clause Coverage</div>
        <div class="coverage-bar-row">
          @for (seg of clauseSegs; track seg.label) {
            <div class="cov-seg" [style.flex]="seg.weight" [style.background]="seg.color" [title]="seg.label + ' — ' + seg.count + ' audits'">
              <span class="cov-seg-label">{{ seg.label }}</span>
            </div>
          }
        </div>
        <div class="coverage-legend">
          @for (seg of clauseSegs; track seg.label) {
            <span class="cov-legend-item"><span class="cov-dot" [style.background]="seg.color"></span>{{ seg.label }} ({{ seg.count }})</span>
          }
        </div>
      </div>

      <!-- Filter row -->
      <div class="filter-row mb-3">
        @for (type of typeFilters; track type) {
          <button class="btn btn-sm filter-btn"
                  [class.active]="activeType() === type"
                  (click)="activeType.set(type)">
            {{ type === 'All' ? 'All Types' : type }}
          </button>
        }
        <div class="ms-auto d-flex gap-2">
          @for (qtr of ['Q1','Q2','Q3','Q4']; track qtr; let i = $index) {
            <button class="btn btn-sm filter-btn"
                    [class.active]="activeQtr() === i + 1"
                    (click)="activeQtr.set(activeQtr() === i + 1 ? 0 : i + 1)">
              {{ qtr }}
            </button>
          }
        </div>
      </div>

      <!-- 12-month grid -->
      <div class="q-card p-0 overflow-hidden">
        <div class="grid-wrap">
          <table class="program-grid">
            <thead>
              <tr>
                <th class="area-col">Process Area</th>
                @for (m of months; track m; let i = $index) {
                  <th class="month-col" [class.dim-month]="isDimmedMonth(i + 1)">{{ m }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (area of processAreas; track area) {
                <tr>
                  <td class="area-cell">{{ area }}</td>
                  @for (m of months; track m; let mi = $index) {
                    <td class="month-cell" [class.dim-month]="isDimmedMonth(mi + 1)">
                      @for (entry of getCellEntries(area, mi + 1); track entry.auditId) {
                        <div class="audit-chip"
                             [style.background]="typeColors[entry.type].bg"
                             [style.color]="typeColors[entry.type].text"
                             [routerLink]="['/audits', entry.auditId]"
                             [title]="entry.title">
                          <span class="chip-initials">{{ entry.auditorInitials }}</span>
                          <span class="chip-text">{{ entry.title | slice:0:22 }}{{ entry.title.length > 22 ? '…' : '' }}</span>
                        </div>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Legend -->
      <div class="type-legend mt-3">
        @for (t of typeFilters.slice(1); track t) {
          <span class="type-pill" [style.background]="typeColors[asType(t)].bg" [style.color]="typeColors[asType(t)].text">{{ t }}</span>
        }
      </div>

    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1600px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; margin: 0 0 0.25rem; }
    .page-header p { font-size: 0.875rem; color: #64748B; margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 0.5rem; }

    .coverage-card { padding: 1rem 1.25rem; }
    .coverage-label { font-size: 0.75rem; font-weight: 600; color: #64748B; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .coverage-bar-row { display: flex; height: 20px; border-radius: 6px; overflow: hidden; gap: 2px; margin-bottom: 0.5rem; }
    .cov-seg { display: flex; align-items: center; justify-content: center; min-width: 0; transition: flex 0.3s; cursor: default; }
    .cov-seg-label { font-size: 10px; font-weight: 700; color: #0F172A; white-space: nowrap; overflow: hidden; padding: 0 4px; }
    .coverage-legend { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .cov-legend-item { font-size: 0.75rem; color: #475569; display: flex; align-items: center; gap: 4px; }
    .cov-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

    .filter-row { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
    .filter-btn { border: 1px solid #E2E8F0; background: #fff; color: #475569; border-radius: 8px; padding: 0.25rem 0.75rem; font-size: 0.8125rem; }
    .filter-btn.active { background: #0F172A; color: #fff; border-color: #0F172A; }

    .grid-wrap { overflow-x: auto; }
    .program-grid { width: 100%; border-collapse: collapse; min-width: 1100px; }
    .program-grid th, .program-grid td { border: 1px solid #E2E8F0; }
    .program-grid th { background: #F8FAFC; font-size: 0.75rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; padding: 0.5rem 0.625rem; text-align: center; }
    .area-col { width: 170px; text-align: left !important; }
    .month-col { width: 120px; }
    .area-cell { padding: 0.5rem 0.75rem; font-size: 0.8125rem; font-weight: 600; color: #0F172A; white-space: nowrap; background: #F8FAFC; }
    .month-cell { padding: 0.375rem; vertical-align: top; min-height: 52px; }
    .dim-month { opacity: 0.45; }

    .audit-chip {
      display: flex; align-items: center; gap: 4px;
      border-radius: 6px; padding: 3px 6px; margin-bottom: 3px;
      cursor: pointer; font-size: 11px; font-weight: 600;
      text-decoration: none;
      &:hover { filter: brightness(0.93); }
    }
    .chip-initials { font-size: 10px; font-weight: 800; opacity: 0.8; white-space: nowrap; }
    .chip-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .type-legend { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .type-pill { border-radius: 20px; padding: 0.25rem 0.875rem; font-size: 0.75rem; font-weight: 600; }
  `],
})
export class AuditProgramComponent {
  readonly mock = inject(MockDataService);

  readonly months = MONTHS;
  readonly processAreas = PROCESS_AREAS;
  readonly typeColors = TYPE_COLORS;
  readonly typeFilters = ['All', 'System', 'Process', 'Product', 'LPA'];

  readonly activeType = signal<string>('All');
  readonly activeQtr = signal<number>(0);

  private readonly allEntries = this.mock.getAuditProgramEntries();

  readonly filteredEntries = computed(() => {
    let entries = this.allEntries;
    if (this.activeType() !== 'All') {
      entries = entries.filter(e => e.type === this.activeType());
    }
    if (this.activeQtr() > 0) {
      const qtr = this.activeQtr();
      const qtrMonths = [1,2,3].map(m => (qtr - 1) * 3 + m);
      entries = entries.filter(e => qtrMonths.includes(e.month));
    }
    return entries;
  });

  getCellEntries(area: string, month: number): AuditProgramEntry[] {
    return this.filteredEntries().filter(e => e.processArea === area && e.month === month);
  }

  isDimmedMonth(month: number): boolean {
    if (this.activeQtr() === 0) return false;
    const qtr = this.activeQtr();
    const start = (qtr - 1) * 3 + 1;
    return month < start || month > start + 2;
  }

  asType(t: string): AuditProgramType { return t as AuditProgramType; }

  readonly clauseSegs = [
    { label: 'Clause 4–6', count: 3, weight: 3, color: '#BFDBFE' },
    { label: 'Clause 7', count: 4, weight: 4, color: '#A5F3FC' },
    { label: 'Clause 8', count: 9, weight: 9, color: '#C4B5FD' },
    { label: 'Clause 9', count: 3, weight: 3, color: '#86EFAC' },
    { label: 'Clause 10', count: 2, weight: 2, color: '#FDE68A' },
  ];
}
