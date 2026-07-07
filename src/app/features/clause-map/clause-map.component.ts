import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/ui/services/toast.service';

type CovStatus = 'covered' | 'sparse' | 'none';

interface SubClause {
  id: string; title: string; status: CovStatus;
  docs?: string[]; audits?: string[]; findings?: string[]; ncrs?: string[];
  iatfText: string;
}

interface Section {
  id: string; title: string; status: CovStatus;
  children: SubClause[];
}

interface Chapter {
  id: string; title: string; status: CovStatus;
  sections: Section[];
}

const TREE: Chapter[] = [
  {
    id: '4', title: 'Context of the Organization', status: 'covered',
    sections: [
      { id: '4.1', title: 'Understanding the organization', status: 'covered', children: [
        { id: '4.1', title: 'Understanding the organization and its context', status: 'covered', docs: ['DOC-0001'], audits: ['AUD-2026-001'], findings: [], ncrs: [], iatfText: 'The organization shall determine external and internal issues that are relevant to its purpose and that affect its ability to achieve the intended results of its quality management system.' },
      ]},
      { id: '4.2', title: 'Needs of interested parties', status: 'sparse', children: [
        { id: '4.2', title: 'Understanding needs and expectations of interested parties', status: 'sparse', docs: ['DOC-0002'], audits: [], findings: [], ncrs: [], iatfText: 'Due to the effect or potential effect on the organization\'s ability to consistently provide products and services, the organization shall determine the interested parties and their relevant requirements.' },
      ]},
      { id: '4.4', title: 'QMS and its processes', status: 'covered', children: [
        { id: '4.4.1', title: 'QMS and its processes — requirements', status: 'covered', docs: ['DOC-0001', 'DOC-0009'], audits: ['AUD-2026-001'], findings: [], ncrs: [], iatfText: 'The organization shall establish, implement, maintain and continually improve a quality management system, including the processes needed and their interactions.' },
      ]},
    ],
  },
  {
    id: '5', title: 'Leadership', status: 'covered',
    sections: [
      { id: '5.1', title: 'Leadership and commitment', status: 'covered', children: [
        { id: '5.1.1', title: 'General leadership and commitment', status: 'covered', docs: ['DOC-0005'], audits: ['AUD-2026-001'], findings: [], ncrs: [], iatfText: 'Top management shall demonstrate leadership and commitment with respect to the quality management system by taking accountability for the effectiveness of the quality management system.' },
        { id: '5.1.2', title: 'Customer focus', status: 'covered', docs: ['DOC-0005'], audits: [], findings: [], ncrs: [], iatfText: 'Top management shall demonstrate leadership and commitment with respect to customer focus by ensuring that customer requirements and applicable statutory and regulatory requirements are determined, understood and consistently met.' },
      ]},
      { id: '5.3', title: 'Roles and responsibilities', status: 'sparse', children: [
        { id: '5.3', title: 'Organizational roles, responsibilities and authorities', status: 'sparse', docs: ['DOC-0006'], audits: [], findings: [], ncrs: [], iatfText: 'Top management shall ensure that the responsibilities and authorities for relevant roles are assigned, communicated and understood within the organization.' },
      ]},
    ],
  },
  {
    id: '6', title: 'Planning', status: 'sparse',
    sections: [
      { id: '6.1', title: 'Actions to address risks and opportunities', status: 'sparse', children: [
        { id: '6.1', title: 'Actions to address risks and opportunities', status: 'sparse', docs: [], audits: ['AUD-2026-001'], findings: [], ncrs: [], iatfText: 'When planning for the quality management system, the organization shall consider external and internal issues and the requirements of interested parties, and determine the risks and opportunities that need to be addressed.' },
      ]},
      { id: '6.2', title: 'Quality objectives', status: 'covered', children: [
        { id: '6.2', title: 'Quality objectives and planning to achieve them', status: 'covered', docs: ['DOC-0007'], audits: ['AUD-2026-001'], findings: [], ncrs: [], iatfText: 'The organization shall establish quality objectives at relevant functions, levels and processes needed for the quality management system.' },
      ]},
    ],
  },
  {
    id: '7', title: 'Support', status: 'covered',
    sections: [
      { id: '7.1', title: 'Resources', status: 'covered', children: [
        { id: '7.1.5', title: 'Monitoring and measuring resources', status: 'covered', docs: ['DOC-0018', 'DOC-0031'], audits: ['AUD-2026-011'], findings: [], ncrs: [], iatfText: 'The organization shall determine and provide the resources needed to ensure valid and reliable results when monitoring or measuring is used to verify the conformity of products and services to requirements.' },
        { id: '7.1.6', title: 'Organizational knowledge', status: 'sparse', docs: ['DOC-0009'], audits: [], findings: [], ncrs: [], iatfText: 'The organization shall determine the knowledge necessary for the operation of its processes and to achieve conformity of products and services.' },
      ]},
      { id: '7.2', title: 'Competence', status: 'covered', children: [
        { id: '7.2', title: 'Competence', status: 'covered', docs: ['DOC-0042'], audits: ['AUD-2026-011'], findings: [], ncrs: [], iatfText: 'The organization shall determine the necessary competence of persons doing work under its control that affects the performance and effectiveness of the quality management system.' },
      ]},
      { id: '7.5', title: 'Documented information', status: 'covered', children: [
        { id: '7.5.1', title: 'General documented information requirements', status: 'covered', docs: ['DOC-0001', 'DOC-0009', 'DOC-0018'], audits: [], findings: [], ncrs: [], iatfText: "The organization's quality management system shall include documented information required by this document, and documented information determined by the organization as being necessary for the effectiveness of the quality management system." },
      ]},
    ],
  },
  {
    id: '8', title: 'Operation', status: 'covered',
    sections: [
      { id: '8.2', title: 'Requirements for products and services', status: 'covered', children: [
        { id: '8.2.3', title: 'Review of requirements for products and services', status: 'covered', docs: ['DOC-0018', 'DOC-0031'], audits: ['AUD-2026-007'], findings: ['FND-2026-0055'], ncrs: ['NCR-2026-0147'], iatfText: 'The organization shall ensure that it has the ability to meet the requirements for products and services to be offered to customers. The organization shall conduct a review before committing to supply products and services to a customer.' },
        { id: '8.2.4', title: 'Changes to requirements for products and services', status: 'sparse', docs: [], audits: ['AUD-2026-007'], findings: ['FND-2026-0056'], ncrs: [], iatfText: 'The organization shall ensure that relevant documented information is amended, and that relevant persons are made aware of the changed requirements, when the requirements for products and services are changed.' },
      ]},
      { id: '8.4', title: 'Control of externally provided processes', status: 'sparse', children: [
        { id: '8.4.1', title: 'Control of externally provided processes, products and services', status: 'sparse', docs: ['DOC-0018'], audits: ['AUD-2026-003'], findings: ['FND-2026-0035'], ncrs: ['NCR-2026-0147'], iatfText: 'The organization shall ensure that externally provided processes, products and services conform to requirements. The organization shall determine the controls to be applied to externally provided processes, products and services.' },
      ]},
      { id: '8.5', title: 'Production and service provision', status: 'covered', children: [
        { id: '8.5.1', title: 'Control of production and service provision', status: 'covered', docs: ['DOC-0042', 'DOC-0018', 'DOC-0031', 'DOC-0009'], audits: ['AUD-2026-011', 'AUD-2026-008'], findings: ['FND-2026-0061'], ncrs: ['NCR-2026-0147', 'CAPA-2026-0032'], iatfText: 'The organization shall implement production and service provision under controlled conditions. Controlled conditions shall include, as applicable: the implementation of control plans; the use of suitable infrastructure and environment for the operation of processes.' },
        { id: '8.5.2', title: 'Identification and traceability', status: 'covered', docs: ['DOC-0018', 'DOC-0009'], audits: ['AUD-2026-011'], findings: [], ncrs: [], iatfText: 'The organization shall use suitable means to identify outputs when it is necessary to ensure the conformity of products and services. The organization shall identify the status of outputs with respect to monitoring and measurement requirements throughout production and service provision.' },
        { id: '8.5.6', title: 'Control of changes', status: 'covered', docs: ['DOC-0042', 'DOC-0018', 'DOC-0031', 'DOC-0009'], audits: ['AUD-2026-011', 'AUD-2026-008'], findings: ['FND-2026-0061'], ncrs: ['NCR-2026-0147', 'CAPA-2026-0032'], iatfText: 'The organization shall review and control changes for production or service provision, to the extent necessary to ensure continuing conformity with requirements. The organization shall retain documented information describing the results of the review of changes, the persons authorizing the change, and any necessary actions arising from the review.' },
      ]},
      { id: '8.7', title: 'Control of nonconforming outputs', status: 'covered', children: [
        { id: '8.7.1', title: 'Control of nonconforming outputs — general', status: 'covered', docs: ['DOC-0009'], audits: ['AUD-2026-011'], findings: ['FND-2026-0062'], ncrs: ['NCR-2026-0147'], iatfText: 'The organization shall ensure that outputs that do not conform to their requirements are identified and controlled to prevent their unintended use or delivery. The organization shall take appropriate action based on the nature of the nonconformity and its effect on the conformity of products and services.' },
      ]},
    ],
  },
  {
    id: '9', title: 'Performance Evaluation', status: 'sparse',
    sections: [
      { id: '9.1', title: 'Monitoring, measurement, analysis and evaluation', status: 'covered', children: [
        { id: '9.1.1', title: 'General monitoring and measurement', status: 'covered', docs: ['DOC-0018', 'DOC-0031'], audits: ['AUD-2026-011'], findings: [], ncrs: [], iatfText: 'The organization shall determine what needs to be monitored and measured, the methods for monitoring, measurement, analysis and evaluation needed to ensure valid results, when the monitoring and measuring shall be performed, and when the results from monitoring and measurement shall be analysed and evaluated.' },
      ]},
      { id: '9.2', title: 'Internal audit', status: 'covered', children: [
        { id: '9.2', title: 'Internal audit requirements', status: 'covered', docs: ['DOC-0007'], audits: ['AUD-2026-001', 'AUD-2026-011'], findings: [], ncrs: [], iatfText: 'The organization shall conduct internal audits at planned intervals to provide information on whether the quality management system conforms to the requirements of this document and the organization\'s own requirements, and is effectively implemented and maintained.' },
      ]},
      { id: '9.3', title: 'Management review', status: 'sparse', children: [
        { id: '9.3', title: 'Management review — general', status: 'sparse', docs: [], audits: ['AUD-2026-005'], findings: [], ncrs: [], iatfText: 'Top management shall review the organization\'s quality management system, at planned intervals, to ensure its continuing suitability, adequacy, effectiveness and alignment with the strategic direction of the organization.' },
      ]},
    ],
  },
  {
    id: '10', title: 'Improvement', status: 'covered',
    sections: [
      { id: '10.2', title: 'Nonconformity and corrective action', status: 'covered', children: [
        { id: '10.2', title: 'Nonconformity and corrective action', status: 'covered', docs: ['DOC-0009'], audits: ['AUD-2026-011'], findings: ['FND-2026-0061', 'FND-2026-0062'], ncrs: ['NCR-2026-0147', 'CAPA-2026-0032'], iatfText: 'When a nonconformity occurs, including any arising from complaints, the organization shall react to the nonconformity and, as applicable, take action to control and correct it, and deal with the consequences.' },
      ]},
      { id: '10.3', title: 'Continual improvement', status: 'sparse', children: [
        { id: '10.3', title: 'Continual improvement requirements', status: 'sparse', docs: ['DOC-0007'], audits: [], findings: [], ncrs: [], iatfText: 'The organization shall continually improve the suitability, adequacy and effectiveness of the quality management system. The organization shall consider the results of analysis and evaluation, and the outputs from management review, to determine if there are needs or opportunities that shall be addressed as part of continual improvement.' },
      ]},
    ],
  },
];

const CHIP_ROUTES: Record<string, string> = {
  'DOC-0042': '/documents/DOC-0042', 'DOC-0018': '/documents/DOC-0018',
  'DOC-0031': '/documents/DOC-0031', 'DOC-0009': '/documents/DOC-0009',
  'DOC-0001': '/documents/DOC-0001', 'DOC-0002': '/documents/DOC-0002',
  'DOC-0005': '/documents/DOC-0005', 'DOC-0006': '/documents/DOC-0006',
  'DOC-0007': '/documents/DOC-0007',
  'AUD-2026-011': '/audits/AUD-2026-011', 'AUD-2026-007': '/audits/AUD-2026-007',
  'AUD-2026-003': '/audits/AUD-2026-003', 'AUD-2026-008': '/audits/AUD-2026-008',
  'AUD-2026-001': '/audits/AUD-2026-001', 'AUD-2026-005': '/audits/AUD-2026-005',
  'FND-2026-0061': '/findings/FND-2026-0061', 'FND-2026-0062': '/findings/FND-2026-0062',
  'FND-2026-0055': '/findings/FND-2026-0055', 'FND-2026-0056': '/findings/FND-2026-0056',
  'FND-2026-0035': '/findings/FND-2026-0035',
  'NCR-2026-0147': '/ncrs/NCR-2026-0147', 'CAPA-2026-0032': '/capas/CAPA-2026-0032',
};

@Component({
  selector: 'app-clause-map',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="map-layout">

      <!-- ── LEFT PANEL: tree ──────────────────────────────────────────── -->
      <aside class="tree-panel">
        <div class="tree-header">
          <h2 class="tree-heading">IATF 16949 Clause Coverage</h2>
        </div>

        <div class="tree-body">
          @for (chapter of tree; track chapter.id) {
            <!-- Chapter row -->
            <button class="tree-chapter" (click)="toggleChapter(chapter.id)">
              <i class="bi tree-caret" [class.bi-chevron-down]="isChapterOpen(chapter.id)" [class.bi-chevron-right]="!isChapterOpen(chapter.id)"></i>
              <span class="ch-num">{{ chapter.id }}</span>
              <span class="ch-title">{{ chapter.title }}</span>
              <span class="status-dot dot-{{ chapter.status }}"></span>
            </button>

            @if (isChapterOpen(chapter.id)) {
              @for (section of chapter.sections; track section.id) {
                <!-- Section row -->
                <button class="tree-section" (click)="toggleSection(section.id)">
                  <i class="bi sec-caret" [class.bi-chevron-down]="isSectionOpen(section.id)" [class.bi-chevron-right]="!isSectionOpen(section.id)"></i>
                  <span class="sec-num">{{ section.id }}</span>
                  <span class="sec-title">{{ section.title }}</span>
                  <span class="status-dot dot-{{ section.status }}"></span>
                </button>

                @if (isSectionOpen(section.id)) {
                  @for (clause of section.children; track clause.id) {
                    <button class="tree-clause"
                            [class.active-clause]="activeClause()?.id === clause.id"
                            (click)="selectClause(clause)">
                      <span class="cl-num">{{ clause.id }}</span>
                      <span class="cl-title">{{ clause.title }}</span>
                      <span class="status-dot dot-{{ clause.status }}"></span>
                    </button>
                  }
                }
              }
            }
          }
        </div>

        <!-- Legend -->
        <div class="tree-legend">
          <div class="legend-item"><span class="status-dot dot-covered"></span>Linked ≥ threshold</div>
          <div class="legend-item"><span class="status-dot dot-sparse"></span>Sparse evidence</div>
          <div class="legend-item"><span class="status-dot dot-none"></span>No links</div>
        </div>
      </aside>

      <!-- ── RIGHT PANEL: clause detail ───────────────────────────────── -->
      <main class="detail-panel">
        @if (activeClause(); as clause) {

          <!-- Export action bar -->
          <div class="export-action-bar">
            <div class="eab-left">
              <span class="eab-clause-id">{{ clause.id }}</span>
              <span class="eab-sep">—</span>
              <span class="eab-title">{{ clause.title }}</span>
            </div>
            <button class="btn btn-primary eab-btn" (click)="exportEvidence(clause.id)" [disabled]="exporting()">
              @if (!exporting()) {
                <i class="bi bi-box-arrow-up me-2"></i>Export Evidence Package
              } @else {
                <i class="bi bi-hourglass-split me-2"></i>Generating…
              }
            </button>
          </div>

          @if (exporting()) {
            <div class="export-progress-bar">
              <div class="export-progress-fill" [style.width.%]="exportProgress()"></div>
            </div>
          }

          <!-- IATF clause text -->
          <div class="q-card clause-text-card">
            <p class="clause-iatf-text"><em>{{ clause.iatfText }}</em></p>
          </div>

          <!-- Evidence sections -->
          <div class="evidence-sections">

            <!-- Documents -->
            <div class="evidence-block q-card">
              <div class="eb-header">
                <i class="bi bi-file-earmark-text eb-icon text-primary"></i>
                <h4 class="eb-title">Documents</h4>
                <span class="eb-count">{{ (clause.docs ?? []).length }}</span>
              </div>
              @if ((clause.docs ?? []).length > 0) {
                <div class="chip-row">
                  @for (doc of clause.docs ?? []; track doc) {
                    <a class="ev-chip chip-doc" [routerLink]="chipRoute(doc)">{{ doc }}</a>
                  }
                </div>
              } @else {
                <p class="eb-empty">No documents linked</p>
              }
            </div>

            <!-- Audits -->
            <div class="evidence-block q-card">
              <div class="eb-header">
                <i class="bi bi-clipboard-check eb-icon" style="color:#7C3AED"></i>
                <h4 class="eb-title">Audits Covering Clause</h4>
                <span class="eb-count">{{ (clause.audits ?? []).length }}</span>
              </div>
              @if ((clause.audits ?? []).length > 0) {
                <div class="chip-row">
                  @for (aud of clause.audits ?? []; track aud) {
                    <a class="ev-chip chip-audit" [routerLink]="chipRoute(aud)">{{ aud }}</a>
                  }
                </div>
              } @else {
                <p class="eb-empty">No audits covering this clause</p>
              }
            </div>

            <!-- Findings -->
            <div class="evidence-block q-card">
              <div class="eb-header">
                <i class="bi bi-exclamation-triangle eb-icon text-danger"></i>
                <h4 class="eb-title">Findings</h4>
                <span class="eb-count" [class.count-red]="(clause.findings ?? []).length > 0">{{ (clause.findings ?? []).length }}</span>
              </div>
              @if ((clause.findings ?? []).length > 0) {
                <div class="chip-row">
                  @for (f of clause.findings ?? []; track f) {
                    <a class="ev-chip chip-finding" [routerLink]="chipRoute(f)">{{ f }}</a>
                  }
                </div>
              } @else {
                <p class="eb-empty">No findings — <span class="text-success">conforming</span></p>
              }
            </div>

            <!-- NCRs / CAPAs -->
            <div class="evidence-block q-card">
              <div class="eb-header">
                <i class="bi bi-tools eb-icon text-warning"></i>
                <h4 class="eb-title">NCRs / CAPAs</h4>
                <span class="eb-count">{{ (clause.ncrs ?? []).length }}</span>
              </div>
              @if ((clause.ncrs ?? []).length > 0) {
                <div class="chip-row">
                  @for (n of clause.ncrs ?? []; track n) {
                    <a class="ev-chip" [class.chip-ncr]="n.startsWith('NCR')" [class.chip-capa]="n.startsWith('CAPA')" [routerLink]="chipRoute(n)">{{ n }}</a>
                  }
                </div>
              } @else {
                <p class="eb-empty">No linked NCRs or CAPAs</p>
              }
            </div>

          </div>

        } @else {
          <!-- Empty state -->
          <div class="detail-empty">
            <i class="bi bi-diagram-3 empty-icon"></i>
            <h3>Select a clause</h3>
            <p>Click any clause in the tree to see its evidence coverage.</p>
          </div>
        }
      </main>

    </div>
  `,
  styles: [`
    :host { display: block; height: calc(100vh - 60px); overflow: hidden; }

    .map-layout { display: flex; height: 100%; overflow: hidden; }

    /* Tree panel */
    .tree-panel { width: 320px; min-width: 300px; background: #fff; border-right: 1px solid #E2E8F0; display: flex; flex-direction: column; overflow: hidden; }
    .tree-header { padding: 1rem 1.25rem; border-bottom: 1px solid #E2E8F0; flex-shrink: 0; }
    .tree-heading { font-size: 0.875rem; font-weight: 700; color: #0F172A; margin: 0; }
    .tree-body { flex: 1; overflow-y: auto; }

    .tree-chapter { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.625rem 1rem; background: none; border: none; text-align: left; cursor: pointer; border-bottom: 1px solid #F1F5F9; }
    .tree-chapter:hover { background: #F8FAFC; }
    .tree-caret { font-size: 0.625rem; color: #94A3B8; flex-shrink: 0; width: 12px; }
    .ch-num { font-size: 0.8125rem; font-weight: 800; color: #0F172A; min-width: 18px; }
    .ch-title { font-size: 0.8125rem; font-weight: 600; color: #0F172A; flex: 1; text-align: left; line-height: 1.3; }

    .tree-section { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem 1rem 0.5rem 2rem; background: #F8FAFC; border: none; text-align: left; cursor: pointer; border-bottom: 1px solid #F1F5F9; }
    .tree-section:hover { background: #F0F9FF; }
    .sec-caret { font-size: 0.5625rem; color: #94A3B8; flex-shrink: 0; width: 10px; }
    .sec-num { font-size: 0.75rem; font-weight: 700; color: #475569; min-width: 32px; font-family: monospace; }
    .sec-title { font-size: 0.75rem; color: #475569; flex: 1; text-align: left; line-height: 1.3; }

    .tree-clause { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.4375rem 1rem 0.4375rem 2.75rem; background: none; border: none; text-align: left; cursor: pointer; border-bottom: 1px solid #F8FAFC; }
    .tree-clause:hover { background: #F0F9FF; }
    .tree-clause.active-clause { background: #EFF6FF; border-left: 3px solid #2563EB; padding-left: calc(2.75rem - 3px); }
    .cl-num { font-size: 0.7rem; font-weight: 700; color: #2563EB; min-width: 36px; font-family: monospace; }
    .cl-title { font-size: 0.75rem; color: #334155; flex: 1; text-align: left; line-height: 1.3; }

    .status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-left: auto; }
    .dot-covered { background: #22C55E; }
    .dot-sparse  { background: linear-gradient(to right, #F59E0B 50%, transparent 50%); border: 1.5px solid #F59E0B; border-radius: 50%; }
    .dot-none    { background: transparent; border: 1.5px solid #CBD5E1; }

    .tree-legend { flex-shrink: 0; padding: 0.875rem 1.25rem; border-top: 1px solid #E2E8F0; background: #F8FAFC; display: flex; flex-direction: column; gap: 0.375rem; }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #64748B; }

    /* Detail panel */
    .detail-panel { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; background: #F8FAFC; }

    .export-action-bar { background: #fff; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.875rem 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .eab-left { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; flex-wrap: wrap; }
    .eab-clause-id { font-family: monospace; font-size: 0.875rem; font-weight: 800; color: #2563EB; white-space: nowrap; }
    .eab-sep { color: #CBD5E1; }
    .eab-title { font-size: 0.9375rem; font-weight: 600; color: #0F172A; }
    .eab-btn { height: 44px; font-size: 0.9375rem; padding: 0 1.5rem; white-space: nowrap; }

    .export-progress-bar { height: 4px; background: #E2E8F0; border-radius: 2px; overflow: hidden; }
    .export-progress-fill { height: 100%; background: #2563EB; border-radius: 2px; transition: width 0.3s; }

    .clause-text-card { padding: 1.25rem; }
    .clause-iatf-text { font-size: 0.9375rem; color: #475569; line-height: 1.7; margin: 0; font-style: italic; }

    .evidence-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 900px) { .evidence-sections { grid-template-columns: 1fr; } }

    .evidence-block { padding: 1rem 1.25rem; }
    .eb-header { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.75rem; }
    .eb-icon { font-size: 1rem; }
    .eb-title { font-size: 0.875rem; font-weight: 700; color: #0F172A; margin: 0; }
    .eb-count { background: #E2E8F0; color: #475569; border-radius: 20px; padding: 0.05rem 0.5rem; font-size: 0.75rem; font-weight: 600; margin-left: auto; }
    .eb-count.count-red { background: #FEE2E2; color: #DC2626; }
    .chip-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .ev-chip { border-radius: 8px; padding: 0.25rem 0.75rem; font-size: 0.8125rem; font-weight: 600; text-decoration: none; cursor: pointer; font-family: monospace; transition: filter 0.15s; &:hover { filter: brightness(0.92); } }
    .chip-doc   { background: #DBEAFE; color: #1E40AF; }
    .chip-audit { background: #EDE9FE; color: #5B21B6; }
    .chip-finding { background: #FEE2E2; color: #DC2626; }
    .chip-ncr   { background: #FEF9C3; color: #713F12; }
    .chip-capa  { background: #DCFCE7; color: #166534; }
    .eb-empty { font-size: 0.8125rem; color: #94A3B8; margin: 0; }

    .detail-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 4rem; text-align: center; color: #94A3B8; }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; display: block; }
    .detail-empty h3 { font-size: 1.125rem; font-weight: 700; color: #334155; margin-bottom: 0.5rem; }
    .detail-empty p { font-size: 0.875rem; max-width: 280px; }
  `],
})
export class ClauseMapComponent {
  readonly toast = inject(ToastService);

  readonly tree = TREE;
  readonly activeClause = signal<SubClause | null>(null);

  // Open/close state maps
  private readonly openChapters = signal<Set<string>>(new Set(['8']));
  private readonly openSections = signal<Set<string>>(new Set(['8.5']));

  readonly exporting = signal(false);
  readonly exportProgress = signal(0);

  isChapterOpen(id: string): boolean { return this.openChapters().has(id); }
  isSectionOpen(id: string): boolean { return this.openSections().has(id); }

  toggleChapter(id: string): void {
    this.openChapters.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  toggleSection(id: string): void {
    this.openSections.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  selectClause(clause: SubClause): void { this.activeClause.set(clause); }

  chipRoute(id: string): string { return CHIP_ROUTES[id] ?? '/'; }

  exportEvidence(clauseId: string): void {
    this.exporting.set(true);
    this.exportProgress.set(0);
    const interval = setInterval(() => {
      this.exportProgress.update(p => {
        if (p >= 100) {
          clearInterval(interval);
          this.exporting.set(false);
          this.toast.show(`Clause ${clauseId} evidence package PDF ready`, 'success');
          return 0;
        }
        return p + 5;
      });
    }, 100);
  }
}
