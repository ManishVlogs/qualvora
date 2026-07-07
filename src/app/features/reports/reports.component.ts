import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/ui/services/toast.service';
import { MockDataService } from '../../shared/services/mock-data.service';

interface ReportCard {
  id: string;
  name: string;
  module: string;
  moduleColor: string;
  description: string;
  chartType: 'column' | 'pareto' | 'donut' | 'heatmap' | 'table' | 'grouped-bar';
}

const REPORTS: ReportCard[] = [
  { id: 'R01', name: 'NCR Trend', module: 'NCR', moduleColor: '#DC2626', description: 'Weekly NCR count over the rolling 12-week period by plant.', chartType: 'column' },
  { id: 'R02', name: 'NCR Pareto', module: 'NCR', moduleColor: '#DC2626', description: 'Top 8 defect codes ranked by frequency with cumulative % line.', chartType: 'pareto' },
  { id: 'R03', name: 'COPQ Summary', module: 'NCR', moduleColor: '#DC2626', description: 'Cost of poor quality breakdown: scrap, rework, warranty by quarter.', chartType: 'column' },
  { id: 'R04', name: 'Disposition Cycle Time', module: 'NCR', moduleColor: '#DC2626', description: 'Average days to complete each NCR disposition type.', chartType: 'grouped-bar' },
  { id: 'R05', name: 'Customer Complaint Log', module: 'Complaints', moduleColor: '#F97316', description: 'All open customer complaints with status and due date.', chartType: 'table' },
  { id: 'R06', name: 'CAPA On-Time Rate', module: 'CAPA', moduleColor: '#059669', description: 'Percentage of CAPAs completed on time vs overdue this quarter.', chartType: 'donut' },
  { id: 'R07', name: 'CAPA Aging by Discipline', module: 'CAPA', moduleColor: '#059669', description: 'Open CAPA count grouped by root-cause discipline and age band.', chartType: 'column' },
  { id: 'R08', name: 'CAPA Recurrence', module: 'CAPA', moduleColor: '#059669', description: 'Rate of re-opened or recurrence CAPAs over the trailing 6 months.', chartType: 'column' },
  { id: 'R09', name: 'SCAR Response Time', module: 'CAPA', moduleColor: '#059669', description: 'Supplier corrective action response time vs 30-day target.', chartType: 'grouped-bar' },
  { id: 'R10', name: 'Audit Program Status', module: 'Audits', moduleColor: '#7C3AED', description: '12-month audit schedule completion rate with finding summary.', chartType: 'column' },
  { id: 'R11', name: 'Findings by Grade / Clause / Area', module: 'Audits', moduleColor: '#7C3AED', description: 'Open findings cross-tabulated by grade, IATF clause, and area.', chartType: 'grouped-bar' },
  { id: 'R12', name: 'LPA Completion', module: 'LPA', moduleColor: '#0891B2', description: 'Layer-by-area completion heatmap for the current calendar month.', chartType: 'heatmap' },
  { id: 'R13', name: 'Repeat Findings', module: 'Audits', moduleColor: '#7C3AED', description: 'Findings flagged as recurring across consecutive audit cycles.', chartType: 'column' },
  { id: 'R14', name: 'Document Register', module: 'Documents', moduleColor: '#2563EB', description: 'Full document register with status, owner and next review date.', chartType: 'table' },
  { id: 'R15', name: 'Distribution Compliance', module: 'Documents', moduleColor: '#2563EB', description: 'Acknowledgement rate per document distributed in last 90 days.', chartType: 'column' },
  { id: 'R16', name: 'IATF Evidence Package', module: 'Compliance', moduleColor: '#475569', description: 'Compiled evidence bundle for IATF 16949 clause coverage submission.', chartType: 'table' },
];

// NCR trend bar data (12 weeks, pre-computed positions)
const TREND_BARS = [
  { week:'W3',  val: 8,  x: 57,  y:108, h: 92 },
  { week:'W4',  val:11,  x:110,  y: 73, h:127 },
  { week:'W5',  val: 9,  x:163,  y: 96, h:104 },
  { week:'W6',  val:13,  x:217,  y: 50, h:150 },
  { week:'W7',  val:10,  x:270,  y: 84, h:116 },
  { week:'W8',  val: 7,  x:323,  y:119, h: 81 },
  { week:'W9',  val:12,  x:377,  y: 61, h:139 },
  { week:'W10', val:15,  x:430,  y: 27, h:173 },
  { week:'W11', val:11,  x:483,  y: 73, h:127 },
  { week:'W12', val: 9,  x:537,  y: 96, h:104 },
  { week:'W13', val:13,  x:590,  y: 50, h:150 },
  { week:'W14', val:14,  x:643,  y: 38, h:162 },
];

// Pareto bars: defect codes, widths from 540px canvas
const PARETO_BARS = [
  { code:'Dimensional',     pct:42, w:227, count:42 },
  { code:'Surface Defect',  pct:21, w:113, count:21 },
  { code:'Wrong Material',  pct:12, w: 65, count:12 },
  { code:'Assembly Error',  pct: 9, w: 49, count: 9 },
  { code:'Weld Defect',     pct: 7, w: 38, count: 7 },
  { code:'Marking Error',   pct: 5, w: 27, count: 5 },
  { code:'Contamination',   pct: 3, w: 16, count: 3 },
  { code:'Other',           pct: 1, w:  5, count: 1 },
];

// Heatmap cells for LPA
const HEATMAP = [
  { area:'Weld A',    l:'L1', s:100 }, { area:'Weld A',    l:'L2', s: 88 }, { area:'Weld A',    l:'L3', s: 92 },
  { area:'Weld B',    l:'L1', s: 75 }, { area:'Weld B',    l:'L2', s: 60 }, { area:'Weld B',    l:'L3', s: 83 },
  { area:'Assembly 1',l:'L1', s: 95 }, { area:'Assembly 1',l:'L2', s: 90 }, { area:'Assembly 2', l:'L1', s: 55 },
  { area:'Assembly 2',l:'L2', s: 72 }, { area:'Stamping',  l:'L1', s:100 }, { area:'Stamping',  l:'L2', s: 67 },
];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">

      @if (!selectedReport()) {
        <!-- ── LIBRARY VIEW ────────────────────────────────────────────── -->
        <div class="page-header">
          <div>
            <h1>Reports</h1>
            <p>{{ reports.length }} available reports</p>
          </div>
          <span class="chip chip-blue">SCR-070</span>
        </div>

        <div class="reports-grid">
          @for (r of reports; track r.id) {
            <div class="report-card q-card">
              <div class="rc-header">
                <span class="module-chip" [style.background]="r.moduleColor + '22'" [style.color]="r.moduleColor">{{ r.module }}</span>
              </div>
              <h3 class="rc-name">{{ r.name }}</h3>
              <p class="rc-desc">{{ r.description }}</p>
              <button class="btn btn-sm btn-outline-primary rc-btn" (click)="openReport(r)">
                <i class="bi bi-bar-chart me-1"></i>View Report
              </button>
            </div>
          }
        </div>

      } @else {
        <!-- ── VIEWER ────────────────────────────────────────────────────── -->
        @if (selectedReport(); as rep) {
          <!-- Back + header -->
          <div class="viewer-topbar">
            <button class="btn btn-link viewer-back" (click)="selectedReport.set(null)">
              <i class="bi bi-arrow-left me-1"></i>All Reports
            </button>
            <div class="viewer-title-block">
              <span class="module-chip" [style.background]="rep.moduleColor + '22'" [style.color]="rep.moduleColor">{{ rep.module }}</span>
              <h1 class="viewer-title">{{ rep.name }}</h1>
            </div>
          </div>

          <!-- Parameter bar -->
          <div class="q-card param-bar mb-3">
            <div class="param-controls">
              <select class="param-select"><option>Plant-1</option><option>Plant-2</option><option>All Sites</option></select>
              <select class="param-select"><option>Last 12 Weeks</option><option>YTD 2026</option><option>Q2 2026</option><option>Custom…</option></select>
              @if (rep.module === 'NCR') {
                <select class="param-select"><option>All Severities</option><option>Major</option><option>Minor</option></select>
              }
              @if (rep.module === 'CAPA') {
                <select class="param-select"><option>All Disciplines</option><option>Process</option><option>Design</option></select>
              }
              @if (rep.module === 'Audits') {
                <select class="param-select"><option>All Types</option><option>Process</option><option>System</option></select>
              }
              <button class="btn btn-sm btn-primary param-run">
                <i class="bi bi-arrow-clockwise me-1"></i>Refresh
              </button>
            </div>
            <div class="param-caption">As of 13 Jun 2026 09:14</div>
          </div>

          <!-- Chart area -->
          <div class="q-card chart-card mb-3">
            <div class="chart-title-row">
              <h3 class="chart-title">{{ rep.name }}</h3>
              <span class="chart-period">Weeks 3–14, 2026</span>
            </div>

            @if (rep.chartType === 'column') {
              <!-- Column chart SVG -->
              <svg viewBox="0 0 700 240" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
                <!-- Y-axis gridlines & labels -->
                <line x1="45" y1="200" x2="685" y2="200" stroke="#E2E8F0" stroke-width="1"/>
                <line x1="45" y1="142" x2="685" y2="142" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="4,3"/>
                <line x1="45" y1="85"  x2="685" y2="85"  stroke="#E2E8F0" stroke-width="1" stroke-dasharray="4,3"/>
                <line x1="45" y1="27"  x2="685" y2="27"  stroke="#E2E8F0" stroke-width="1" stroke-dasharray="4,3"/>
                <text x="38" y="204" text-anchor="end" font-size="11" fill="#94A3B8">0</text>
                <text x="38" y="146" text-anchor="end" font-size="11" fill="#94A3B8">5</text>
                <text x="38" y="89"  text-anchor="end" font-size="11" fill="#94A3B8">10</text>
                <text x="38" y="31"  text-anchor="end" font-size="11" fill="#94A3B8">15</text>
                <!-- Bars -->
                @for (b of trendBars; track b.week) {
                  <rect [attr.x]="b.x" [attr.y]="b.y" width="30" [attr.height]="b.h" rx="3" fill="#3B82F6" opacity="0.85"/>
                  <text [attr.x]="b.x + 15" y="218" text-anchor="middle" font-size="10" fill="#94A3B8">{{ b.week }}</text>
                  <text [attr.x]="b.x + 15" [attr.y]="b.y - 4" text-anchor="middle" font-size="10" fill="#475569">{{ b.val }}</text>
                }
              </svg>
            }

            @if (rep.chartType === 'pareto') {
              <!-- Pareto horizontal bars -->
              <svg viewBox="0 0 700 305" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
                @for (b of paretoBars; track b.code; let i = $index) {
                  <text x="130" [attr.y]="25 + i*35 + 17" text-anchor="end" font-size="12" fill="#334155">{{ b.code }}</text>
                  <rect x="140" [attr.y]="25 + i*35" [attr.width]="b.w" height="22" rx="3" fill="#3B82F6" opacity="0.8"/>
                  <text [attr.x]="140 + b.w + 6" [attr.y]="25 + i*35 + 16" font-size="11" fill="#475569">{{ b.count }} ({{ b.pct }}%)</text>
                }
                <line x1="140" y1="15" x2="140" y2="300" stroke="#E2E8F0" stroke-width="1"/>
              </svg>
            }

            @if (rep.chartType === 'donut') {
              <!-- Donut SVG -->
              <div class="donut-wrap">
                <svg viewBox="0 0 200 200" class="donut-svg">
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#E2E8F0" stroke-width="18"/>
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#22C55E" stroke-width="18"
                          [attr.stroke-dasharray]="donutCircumference"
                          [attr.stroke-dashoffset]="donutOffset(0.73)"
                          stroke-linecap="round" transform="rotate(-90 100 100)"/>
                  <text x="100" y="96" text-anchor="middle" font-size="28" font-weight="800" fill="#0F172A">73%</text>
                  <text x="100" y="116" text-anchor="middle" font-size="12" fill="#64748B">On Time</text>
                </svg>
                <div class="donut-legend">
                  <div class="dl-item"><span class="dl-dot" style="background:#22C55E"></span>On Time — 73%</div>
                  <div class="dl-item"><span class="dl-dot" style="background:#EF4444"></span>Overdue — 18%</div>
                  <div class="dl-item"><span class="dl-dot" style="background:#FDE68A"></span>At Risk — 9%</div>
                </div>
              </div>
            }

            @if (rep.chartType === 'grouped-bar') {
              <!-- Grouped bar chart (simplified 5-group) -->
              <svg viewBox="0 0 700 240" xmlns="http://www.w3.org/2000/svg" class="chart-svg">
                <line x1="45" y1="200" x2="685" y2="200" stroke="#E2E8F0" stroke-width="1"/>
                @for (g of groupedBarData; track g.label; let i = $index) {
                  <rect [attr.x]="60 + i*120" y="200" [attr.width]="40" height="0" fill="none"/>
                  <rect [attr.x]="60 + i*120"       [attr.y]="200 - g.a" width="38" [attr.height]="g.a" rx="2" fill="#3B82F6" opacity="0.85"/>
                  <rect [attr.x]="60 + i*120 + 42"  [attr.y]="200 - g.b" width="38" [attr.height]="g.b" rx="2" fill="#22C55E" opacity="0.85"/>
                  <text [attr.x]="60 + i*120 + 39" y="218" text-anchor="middle" font-size="11" fill="#94A3B8">{{ g.label }}</text>
                }
                <text x="38" y="204" text-anchor="end" font-size="11" fill="#94A3B8">0</text>
                <text x="38" y="130" text-anchor="end" font-size="11" fill="#94A3B8">10</text>
                <text x="38" y="60"  text-anchor="end" font-size="11" fill="#94A3B8">20</text>
              </svg>
              <div class="chart-legend-row">
                <span class="cl-item"><span class="cl-dot" style="background:#3B82F6"></span>Major</span>
                <span class="cl-item"><span class="cl-dot" style="background:#22C55E"></span>Minor</span>
              </div>
            }

            @if (rep.chartType === 'heatmap') {
              <!-- LPA heatmap grid -->
              <div class="heatmap-grid">
                @for (cell of heatmapCells; track cell.area + cell.l) {
                  <div class="hm-cell" [style.background]="heatColor(cell.s)">
                    <div class="hm-layer">{{ cell.l }}</div>
                    <div class="hm-area">{{ cell.area }}</div>
                    <div class="hm-score" [style.color]="heatText(cell.s)">{{ cell.s }}%</div>
                  </div>
                }
              </div>
            }

            @if (rep.chartType === 'table') {
              <div class="table-only-msg">
                <i class="bi bi-table table-msg-icon"></i>
                <p>This report is data-table only. See table below.</p>
              </div>
            }
          </div>

          <!-- Data table -->
          <div class="q-card p-0 mb-3">
            <div class="dt-header">
              <span class="dt-title">Data</span>
              <span class="dt-count">{{ tableRows().length }} records</span>
            </div>
            <div class="table-scroll">
              <table class="q-table">
                <thead>
                  <tr>
                    @for (col of tableColumns(); track col) {
                      <th>{{ col }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of tableRows(); track row[0]) {
                    <tr>
                      @for (cell of row; track $index) {
                        <td>{{ cell }}</td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Export bar -->
          <div class="export-bar q-card">
            <span class="export-label">Export</span>
            <button class="btn btn-outline-secondary export-btn" (click)="downloadCSV()">
              <i class="bi bi-filetype-csv me-2"></i>Download CSV
            </button>
            <button class="btn btn-primary export-btn" (click)="downloadPDF()">
              <i class="bi bi-file-earmark-pdf me-2"></i>Download PDF
            </button>
          </div>
        }
      }

    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1280px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; margin: 0 0 0.25rem; }
    .page-header p { font-size: 0.875rem; color: #64748B; margin: 0; }

    /* Library */
    .reports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .report-card { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.625rem; cursor: default; transition: box-shadow 0.15s; &:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); } }
    .rc-header { display: flex; }
    .module-chip { border-radius: 20px; padding: 0.2rem 0.75rem; font-size: 0.7rem; font-weight: 700; }
    .rc-name { font-size: 1rem; font-weight: 700; color: #0F172A; margin: 0; }
    .rc-desc { font-size: 0.8125rem; color: #64748B; margin: 0; flex: 1; line-height: 1.5; }
    .rc-btn { align-self: flex-start; margin-top: auto; }

    /* Viewer */
    .viewer-topbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .viewer-back { color: #2563EB; font-size: 0.875rem; padding: 0; }
    .viewer-title-block { display: flex; align-items: center; gap: 0.75rem; }
    .viewer-title { font-size: 1.375rem; font-weight: 700; margin: 0; color: #0F172A; }

    .param-bar { padding: 0.875rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; }
    .param-controls { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
    .param-select { border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.3rem 0.75rem; font-size: 0.8125rem; color: #334155; background: #fff; cursor: pointer; outline: none; }
    .param-caption { font-size: 0.75rem; color: #94A3B8; }
    .param-run { }

    .chart-card { padding: 1.25rem; }
    .chart-title-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1rem; }
    .chart-title { font-size: 0.9375rem; font-weight: 700; color: #0F172A; margin: 0; }
    .chart-period { font-size: 0.75rem; color: #94A3B8; }

    .chart-svg { width: 100%; height: auto; display: block; }

    .donut-wrap { display: flex; align-items: center; gap: 3rem; padding: 1rem 0; }
    .donut-svg { width: 160px; height: 160px; flex-shrink: 0; }
    .donut-legend { display: flex; flex-direction: column; gap: 0.625rem; }
    .dl-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #334155; }
    .dl-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }

    .chart-legend-row { display: flex; gap: 1.25rem; margin-top: 0.5rem; }
    .cl-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: #475569; }
    .cl-dot { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }

    .heatmap-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.5rem; }
    .hm-cell { border-radius: 8px; padding: 0.625rem; }
    .hm-layer { font-size: 0.65rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; }
    .hm-area { font-size: 0.8rem; font-weight: 600; color: #0F172A; margin: 0.1rem 0; }
    .hm-score { font-size: 1.125rem; font-weight: 800; }

    .table-only-msg { display: flex; flex-direction: column; align-items: center; padding: 2rem; color: #94A3B8; text-align: center; }
    .table-msg-icon { font-size: 2rem; margin-bottom: 0.5rem; }

    /* Data table */
    .dt-header { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid #E2E8F0; }
    .dt-title { font-size: 0.875rem; font-weight: 700; color: #0F172A; }
    .dt-count { font-size: 0.75rem; color: #94A3B8; }
    .table-scroll { overflow-x: auto; }
    .q-table { width: 100%; border-collapse: collapse; min-width: 600px; }
    .q-table th { background: #F8FAFC; font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; padding: 0.625rem 1rem; text-align: left; border-bottom: 2px solid #E2E8F0; white-space: nowrap; }
    .q-table td { padding: 0.625rem 1rem; border-bottom: 1px solid #F1F5F9; font-size: 0.875rem; color: #334155; vertical-align: middle; }

    /* Export */
    .export-bar { padding: 0.875rem 1rem; display: flex; align-items: center; gap: 1rem; }
    .export-label { font-size: 0.875rem; font-weight: 600; color: #475569; margin-right: auto; }
    .export-btn { display: flex; align-items: center; }
  `],
})
export class ReportsComponent {
  readonly toast = inject(ToastService);
  readonly mock = inject(MockDataService);

  readonly reports = REPORTS;
  readonly selectedReport = signal<ReportCard | null>(null);
  readonly trendBars = TREND_BARS;
  readonly paretoBars = PARETO_BARS;
  readonly heatmapCells = HEATMAP;
  readonly groupedBarData = [
    { label:'Q1', a:120, b:75 }, { label:'Q2', a:95, b:110 },
    { label:'Q3', a:140, b:60 }, { label:'Q4', a:80, b:130 }, { label:'YTD', a:435, b:375 },
  ];

  readonly donutCircumference = 2 * Math.PI * 70;
  donutOffset(pct: number): number { return this.donutCircumference * (1 - pct); }

  heatColor(s: number): string { return s >= 90 ? '#DCFCE7' : s >= 70 ? '#FEF9C3' : '#FEE2E2'; }
  heatText(s: number): string  { return s >= 90 ? '#166534' : s >= 70 ? '#713F12' : '#DC2626'; }

  openReport(r: ReportCard): void { this.selectedReport.set(r); }

  tableColumns(): string[] {
    const rep = this.selectedReport();
    if (!rep) return [];
    if (rep.module === 'NCR') return ['Week', 'NCR Count', 'Major', 'Minor', 'OFI', 'Closed'];
    if (rep.module === 'CAPA') return ['CAPA ID', 'Title', 'Status', 'Step', 'Owner', 'Due Date', 'On Time'];
    if (rep.module === 'Audits') return ['Audit ID', 'Title', 'Type', 'Status', 'Auditor', 'Findings'];
    if (rep.module === 'Documents') return ['Doc ID', 'Title', 'Type', 'Revision', 'Status', 'Owner', 'Next Review'];
    if (rep.module === 'LPA') return ['Run ID', 'Layer', 'Zone', 'Owner', 'Due', 'Status', 'Completion'];
    if (rep.module === 'Complaints') return ['ID', 'Customer', 'Description', 'Received', 'Due', 'Status', 'Age'];
    return ['ID', 'Title', 'Status', 'Owner', 'Date'];
  }

  tableRows(): string[][] {
    const rep = this.selectedReport();
    if (!rep) return [];
    if (rep.module === 'NCR') return this.trendBars.map(b => [b.week, String(b.val), String(Math.ceil(b.val*0.4)), String(Math.ceil(b.val*0.4)), String(Math.floor(b.val*0.2)), String(Math.floor(b.val*0.6))]);
    if (rep.module === 'CAPA') return this.mock.capas.slice(0, 8).map((c: any) => [c.id, c.title, c.status, c.currentStep, c.owner, c.dueDate, c.onTime ? 'Yes' : 'No']);
    if (rep.module === 'Audits') return this.mock.audits.slice(0, 8).map((a: any) => [a.id, a.title, a.type, a.status, a.auditor, String(a.findingCount)]);
    if (rep.module === 'Documents') return this.mock.documents().slice(0, 8).map((d: any) => [d.id, d.title, d.type, d.revision, d.status, d.owner, d.nextReview]);
    if (rep.module === 'LPA') return this.mock.lpaRuns.slice(0, 8).map((r: any) => [r.id, r.layer, r.zone, r.owner, r.dueDate, r.status, r.completionRate + '%']);
    return [['—', '—', '—', '—', '—']];
  }

  downloadCSV(): void { this.toast.show('CSV downloaded successfully', 'success'); }
  downloadPDF(): void {
    this.toast.show('Generating PDF…', 'info', 1000);
    setTimeout(() => this.toast.show('Report downloaded', 'success'), 2100);
  }
}
