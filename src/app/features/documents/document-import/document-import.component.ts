import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../../shared/services/mock-data.service';

type ImportStatus = 'ready' | 'warning' | 'blocked';

interface ImportRow {
  row: number; title: string; type: string; owner: string; site: string;
  status: ImportStatus; issue?: string;
}

@Component({
  selector: 'app-document-import',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <h1 class="page-title">Bulk Import Wizard</h1>
        <p class="page-sub">Import multiple documents at once using a CSV template</p>
      </div>

      <!-- Step stepper -->
      <div class="q-card stepper-card mb-3">
        <div class="stepper">
          @for (s of steps; track s.num) {
            <div class="step-item" [class.step-done]="currentStep() > s.num" [class.step-active]="currentStep() === s.num" [class.step-future]="currentStep() < s.num">
              <div class="step-circle">
                @if (currentStep() > s.num) { <i class="bi bi-check-lg"></i> }
                @else { {{ s.num }} }
              </div>
              <div class="step-meta">
                <div class="step-label">{{ s.label }}</div>
              </div>
              @if (s.num < steps.length) {
                <div class="step-line" [class.done-line]="currentStep() > s.num"></div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Step content -->
      <div class="step-content q-card">

        <!-- Step 1: Download Template -->
        @if (currentStep() === 1) {
          <div class="step-body">
            <div class="step-body-header">
              <i class="bi bi-download step-icon"></i>
              <div>
                <h2 class="step-title">Download Template</h2>
                <p class="step-desc">Download the CSV template and fill in your document metadata, then gather your document files.</p>
              </div>
            </div>
            <button class="btn btn-outline-primary download-btn">
              <i class="bi bi-file-earmark-spreadsheet me-2"></i>
              Download Import Template (CSV)
            </button>
            <div class="sample-preview">
              <div class="sample-label">Template Preview</div>
              <div class="table-scroll">
                <table class="q-table sample-table">
                  <thead>
                    <tr>
                      <th>title*</th><th>type*</th><th>tier</th><th>site*</th><th>owner*</th><th>revision</th><th>review_cycle</th><th>clauses</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="sample-row">
                      <td>Example Work Instruction</td><td>Work Instruction</td><td>3</td><td>Plant-1</td><td>dev.patel@…</td><td>A</td><td>12</td><td>8.5.1</td>
                    </tr>
                    <tr class="sample-row">
                      <td>Quality Procedure XYZ</td><td>Quality Procedure</td><td>2</td><td>Plant-2</td><td>priya.nair@…</td><td>B</td><td>24</td><td>9.2</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- Step 2: Upload -->
        @if (currentStep() === 2) {
          <div class="step-body">
            <div class="step-body-header">
              <i class="bi bi-cloud-upload step-icon"></i>
              <div>
                <h2 class="step-title">Upload Files</h2>
                <p class="step-desc">Upload your completed CSV and a folder of document files (PDF/DOCX).</p>
              </div>
            </div>
            <div class="upload-sections">
              <div class="upload-zone" [class.uploaded]="csvUploaded()"
                   (click)="csvUploaded.set(!csvUploaded())">
                @if (!csvUploaded()) {
                  <i class="bi bi-file-earmark-spreadsheet upload-z-icon text-success"></i>
                  <div class="upload-z-label">Drop CSV file here</div>
                  <div class="upload-z-sub">or click to browse</div>
                } @else {
                  <i class="bi bi-check-circle-fill upload-z-icon text-success"></i>
                  <div class="upload-z-label text-success">import_documents_2026.csv</div>
                  <div class="upload-z-sub">20 rows · 4 KB</div>
                }
              </div>
              <div class="upload-zone" [class.uploaded]="filesUploaded()"
                   (click)="filesUploaded.set(!filesUploaded())">
                @if (!filesUploaded()) {
                  <i class="bi bi-folder2-open upload-z-icon text-primary"></i>
                  <div class="upload-z-label">Drop document files</div>
                  <div class="upload-z-sub">PDF, DOCX — or click to browse</div>
                } @else {
                  <i class="bi bi-check-circle-fill upload-z-icon text-success"></i>
                  <div class="upload-z-label text-success">17 files uploaded</div>
                  <div class="upload-z-sub">Total: 23.4 MB</div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Step 3: Mapping & Validation -->
        @if (currentStep() === 3) {
          <div class="step-body">
            <div class="step-body-header">
              <i class="bi bi-table step-icon"></i>
              <div>
                <h2 class="step-title">Mapping & Validation</h2>
                <p class="step-desc">Review the import data. Fix errors before proceeding.</p>
              </div>
            </div>
            <div class="validation-stats">
              <div class="vstat-card vstat-green">
                <i class="bi bi-check-circle-fill vstat-icon"></i>
                <span class="vstat-num">16</span>
                <span class="vstat-label">Ready</span>
              </div>
              <div class="vstat-card vstat-amber">
                <i class="bi bi-exclamation-triangle-fill vstat-icon"></i>
                <span class="vstat-num">3</span>
                <span class="vstat-label">Warnings</span>
              </div>
              <div class="vstat-card vstat-red">
                <i class="bi bi-x-circle-fill vstat-icon"></i>
                <span class="vstat-num">1</span>
                <span class="vstat-label">Blocked</span>
              </div>
            </div>
            <div class="table-scroll">
              <table class="q-table val-table">
                <thead>
                  <tr>
                    <th style="width:40px">Row</th>
                    <th>Title</th>
                    <th style="width:140px">Type</th>
                    <th style="width:120px">Owner</th>
                    <th style="width:80px">Site</th>
                    <th style="width:100px">Status</th>
                    <th>Issue</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of importRows; track row.row) {
                    <tr [class.row-warn]="row.status==='warning'" [class.row-blocked]="row.status==='blocked'">
                      <td class="text-muted-sm">{{ row.row }}</td>
                      <td class="val-title">{{ row.title }}</td>
                      <td><span class="type-badge">{{ row.type }}</span></td>
                      <td class="text-muted-sm">{{ row.owner }}</td>
                      <td class="text-muted-sm">{{ row.site }}</td>
                      <td>
                        @if (row.status === 'ready') { <span class="val-badge val-ready"><i class="bi bi-check-circle me-1"></i>Ready</span> }
                        @if (row.status === 'warning') { <span class="val-badge val-warn"><i class="bi bi-exclamation-triangle me-1"></i>Warning</span> }
                        @if (row.status === 'blocked') { <span class="val-badge val-block"><i class="bi bi-x-circle me-1"></i>Blocked</span> }
                      </td>
                      <td class="issue-cell">
                        @if (row.issue) {
                          <span class="{{ row.status === 'blocked' ? 'issue-text-red' : 'issue-text-amber' }}">{{ row.issue }}</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Step 4: Dry Run Summary -->
        @if (currentStep() === 4) {
          <div class="step-body">
            <div class="step-body-header">
              <i class="bi bi-clipboard2-check step-icon"></i>
              <div>
                <h2 class="step-title">Dry Run Summary</h2>
                <p class="step-desc">Review what will happen when the import is executed.</p>
              </div>
            </div>
            <div class="dry-run-cards">
              <div class="dry-card dry-green">
                <div class="dry-num">16</div>
                <div class="dry-label">Documents will be created</div>
                <div class="dry-sub">Ready to import</div>
              </div>
              <div class="dry-card dry-amber">
                <div class="dry-num">3</div>
                <div class="dry-label">Will import with warnings</div>
                <div class="dry-sub">Missing optional fields</div>
              </div>
              <div class="dry-card dry-red">
                <div class="dry-num">1</div>
                <div class="dry-label">Will be skipped</div>
                <div class="dry-sub">Must fix before re-import</div>
              </div>
            </div>
            <div class="dry-detail">
              <div class="dry-detail-title">What happens next:</div>
              <ul class="dry-list">
                <li>16 documents created in Draft status</li>
                <li>3 documents created with incomplete metadata — review after import</li>
                <li>1 blocked document (invalid Document Type "OtherType") skipped</li>
                <li>All created documents will appear in your Document Library as Drafts</li>
              </ul>
            </div>
          </div>
        }

        <!-- Step 5: Execute -->
        @if (currentStep() === 5) {
          <div class="step-body center-body">
            <div class="step-body-header center-header">
              <i class="bi bi-lightning-charge step-icon-lg"></i>
              <h2 class="step-title">Executing Import</h2>
              <p class="step-desc">Please wait while your documents are being created…</p>
            </div>
            @if (!executeComplete()) {
              <div class="progress-area">
                <div class="progress exec-bar">
                  <div class="progress-bar bg-primary progress-bar-striped progress-bar-animated"
                       [style.width.%]="execProgress()"></div>
                </div>
                <div class="exec-label">{{ execProgress() }}% — Creating documents…</div>
              </div>
            } @else {
              <div class="exec-done">
                <i class="bi bi-check-circle-fill exec-done-icon"></i>
                <div class="exec-done-label">Import Complete</div>
              </div>
            }
          </div>
        }

        <!-- Step 6: Result Report -->
        @if (currentStep() === 6) {
          <div class="step-body">
            <div class="step-body-header">
              <i class="bi bi-clipboard2-data step-icon text-success"></i>
              <div>
                <h2 class="step-title">Import Complete</h2>
                <p class="step-desc">Your documents have been created successfully.</p>
              </div>
            </div>
            <div class="result-stats">
              <div class="result-stat result-green">
                <div class="rs-num">16</div>
                <div class="rs-label">Documents Created</div>
              </div>
              <div class="result-stat result-amber">
                <div class="rs-num">3</div>
                <div class="rs-label">Created with Warnings</div>
              </div>
              <div class="result-stat result-red">
                <div class="rs-num">1</div>
                <div class="rs-label">Skipped</div>
              </div>
            </div>
            <div class="result-actions">
              <button class="btn btn-outline-secondary me-2">
                <i class="bi bi-download me-1"></i> Download Error Report
              </button>
              <button class="btn btn-primary" (click)="router.navigate(['/documents'])">
                <i class="bi bi-grid me-1"></i> Go to Document Library
              </button>
            </div>
          </div>
        }

        <!-- Step navigation -->
        <div class="step-nav">
          <button class="btn btn-outline-secondary" [disabled]="currentStep() === 1"
                  (click)="prevStep()">
            <i class="bi bi-arrow-left me-1"></i> Previous
          </button>
          @if (currentStep() < 6) {
            <button class="btn btn-primary" (click)="nextStep()">
              {{ currentStep() === 5 ? 'View Results' : 'Next' }}
              <i class="bi bi-arrow-right ms-1"></i>
            </button>
          }
          @if (currentStep() === 6) {
            <button class="btn btn-primary" (click)="router.navigate(['/documents'])">
              <i class="bi bi-grid me-1"></i> Go to Document Library
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
    .page-header { margin-bottom: 1.25rem; }
    .page-title { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0 0 0.2rem; }
    .page-sub { font-size: 0.875rem; color: #64748B; margin: 0; }

    /* Stepper */
    .stepper-card { padding: 1.25rem; }
    .stepper { display: flex; align-items: center; }
    .step-item { display: flex; align-items: center; flex: 1; }
    .step-item:last-child { flex: 0; }
    .step-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.875rem; font-weight: 700; flex-shrink: 0; transition: all 150ms; }
    .step-done .step-circle { background: #DCFCE7; color: #166534; border: 2px solid #86EFAC; }
    .step-active .step-circle { background: #2563EB; color: #fff; border: none; }
    .step-future .step-circle { background: #F1F5F9; color: #94A3B8; border: 2px solid #E2E8F0; }
    .step-meta { margin: 0 0.5rem; min-width: 80px; }
    .step-label { font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
    .step-done .step-label { color: #059669; }
    .step-active .step-label { color: #2563EB; }
    .step-future .step-label { color: #94A3B8; }
    .step-line { flex: 1; height: 2px; background: #E2E8F0; }
    .done-line { background: #86EFAC; }

    /* Step content */
    .step-content { overflow: hidden; }
    .step-body { padding: 1.5rem; }
    .step-body-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
    .step-icon { font-size: 2rem; color: #2563EB; flex-shrink: 0; margin-top: 2px; }
    .step-title { font-size: 1.125rem; font-weight: 700; color: #0F172A; margin: 0 0 0.25rem; }
    .step-desc { font-size: 0.875rem; color: #64748B; margin: 0; }

    /* Step 1 */
    .download-btn { margin-bottom: 1.25rem; }
    .sample-preview { border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; }
    .sample-label { padding: 0.5rem 1rem; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; font-size: 0.75rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
    .table-scroll { overflow-x: auto; }
    .sample-table td { font-size: 0.75rem; color: #64748B; }
    .sample-row { background: #FEFCE8; }

    /* Step 2 */
    .upload-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .upload-zone { border: 2px dashed #CBD5E1; border-radius: 10px; padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 150ms; &:hover { border-color: #2563EB; background: #F8FAFC; } &.uploaded { border-color: #059669; background: #F0FDF4; border-style: solid; } }
    .upload-z-icon { font-size: 2.5rem; }
    .upload-z-label { font-size: 0.9375rem; font-weight: 500; color: #475569; }
    .upload-z-sub { font-size: 0.8125rem; color: #94A3B8; }
    .text-success { color: #059669 !important; }
    .text-primary { color: #2563EB !important; }

    /* Step 3 */
    .validation-stats { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; }
    .vstat-card { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; border-radius: 8px; }
    .vstat-green { background: #DCFCE7; color: #166534; }
    .vstat-amber { background: #FEF3C7; color: #92400E; }
    .vstat-red { background: #FEE2E2; color: #991B1B; }
    .vstat-icon { font-size: 1rem; }
    .vstat-num { font-size: 1.25rem; font-weight: 800; }
    .vstat-label { font-size: 0.8125rem; font-weight: 600; }
    .val-table .row-warn { background: #FFFBEB; }
    .val-table .row-blocked { background: #FEF2F2; }
    .type-badge { font-size: 11px; background: #F1F5F9; color: #475569; border-radius: 4px; padding: 2px 6px; }
    .val-title { font-size: 0.8125rem; font-weight: 500; }
    .text-muted-sm { font-size: 0.8125rem; color: #94A3B8; }
    .val-badge { font-size: 11px; border-radius: 4px; padding: 2px 6px; display: inline-flex; align-items: center; font-weight: 600; }
    .val-ready { background: #DCFCE7; color: #166534; }
    .val-warn { background: #FEF3C7; color: #92400E; }
    .val-block { background: #FEE2E2; color: #991B1B; }
    .issue-cell { font-size: 0.75rem; }
    .issue-text-red { color: #DC2626; }
    .issue-text-amber { color: #B45309; }

    /* Step 4 */
    .dry-run-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .dry-card { border-radius: 10px; padding: 1.25rem; text-align: center; }
    .dry-green { background: #DCFCE7; border: 1px solid #86EFAC; }
    .dry-amber { background: #FEF3C7; border: 1px solid #FCD34D; }
    .dry-red { background: #FEE2E2; border: 1px solid #FCA5A5; }
    .dry-num { font-size: 2rem; font-weight: 800; }
    .dry-green .dry-num { color: #166534; }
    .dry-amber .dry-num { color: #92400E; }
    .dry-red .dry-num { color: #991B1B; }
    .dry-label { font-size: 0.875rem; font-weight: 600; margin-top: 0.25rem; }
    .dry-sub { font-size: 0.75rem; color: #64748B; margin-top: 0.125rem; }
    .dry-detail-title { font-size: 0.875rem; font-weight: 700; color: #0F172A; margin-bottom: 0.5rem; }
    .dry-list { padding-left: 1.25rem; margin: 0; }
    .dry-list li { font-size: 0.875rem; color: #475569; margin-bottom: 0.375rem; }

    /* Step 5 */
    .center-body { display: flex; flex-direction: column; align-items: center; }
    .center-header { flex-direction: column; align-items: center; text-align: center; }
    .step-icon-lg { font-size: 3rem; color: #2563EB; margin-bottom: 0.5rem; }
    .progress-area { width: 100%; max-width: 480px; margin-top: 1rem; }
    .exec-bar { height: 12px; border-radius: 6px; }
    .exec-label { font-size: 0.875rem; color: #64748B; margin-top: 0.5rem; text-align: center; }
    .exec-done { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-top: 1.5rem; }
    .exec-done-icon { font-size: 3rem; color: #059669; }
    .exec-done-label { font-size: 1rem; font-weight: 700; color: #059669; }

    /* Step 6 */
    .result-stats { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .result-stat { flex: 1; border-radius: 10px; padding: 1.25rem; text-align: center; }
    .result-green { background: #DCFCE7; border: 1px solid #86EFAC; }
    .result-amber { background: #FEF3C7; border: 1px solid #FCD34D; }
    .result-red { background: #FEE2E2; border: 1px solid #FCA5A5; }
    .rs-num { font-size: 2rem; font-weight: 800; }
    .result-green .rs-num { color: #166534; }
    .result-amber .rs-num { color: #92400E; }
    .result-red .rs-num { color: #991B1B; }
    .rs-label { font-size: 0.875rem; font-weight: 600; margin-top: 0.25rem; }
    .result-actions { display: flex; }

    /* Footer nav */
    .step-nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-top: 1px solid #F1F5F9; }
  `]
})
export class DocumentImportComponent {
  readonly router = inject(Router);
  private readonly mock = inject(MockDataService);
  readonly currentStep = signal(1);
  readonly csvUploaded = signal(false);
  readonly filesUploaded = signal(false);
  readonly executeComplete = signal(false);
  readonly execProgress = signal(0);

  readonly steps = [
    { num: 1, label: 'Download Template' },
    { num: 2, label: 'Upload' },
    { num: 3, label: 'Mapping & Validation' },
    { num: 4, label: 'Dry Run' },
    { num: 5, label: 'Execute' },
    { num: 6, label: 'Result Report' },
  ];

  readonly importRows: ImportRow[] = [
    { row: 1, title: 'Weld Zone A Safety Procedure', type: 'Quality Procedure', owner: 'Dev Patel', site: 'Plant-1', status: 'ready' },
    { row: 2, title: 'CMM Measurement Log Form', type: 'Form', owner: 'Tom Braswell', site: 'Plant-3', status: 'ready' },
    { row: 3, title: 'Paint Shop PFMEA v2', type: 'PFMEA', owner: 'Priya Nair', site: 'Plant-2', status: 'warning', issue: 'Review cycle not specified — defaulting to 12 months' },
    { row: 4, title: 'Assembly Line 2 Control Plan', type: 'Control Plan', owner: 'Maria Delgado', site: 'Plant-1', status: 'ready' },
    { row: 5, title: 'Supplier Audit Form v4', type: 'OtherType', owner: 'Sarah Chen', site: 'Plant-1', status: 'blocked', issue: 'Invalid Document Type "OtherType" — not in system' },
    { row: 6, title: 'Torque Spec Sheet – M8 Fasteners', type: 'Work Instruction', owner: 'Dev Patel', site: 'Plant-1', status: 'ready' },
    { row: 7, title: 'Incoming Inspection Checklist', type: 'Form', owner: 'James Okonkwo', site: 'Plant-2', status: 'warning', issue: 'Owner email not found — will assign to site QM' },
    { row: 8, title: 'Customer Returns Procedure', type: 'Quality Procedure', owner: 'Maria Delgado', site: 'Plant-1', status: 'ready' },
    { row: 9, title: 'Dimensional Check Work Instruction', type: 'Work Instruction', owner: 'Dev Patel', site: 'Plant-1', status: 'ready' },
    { row: 10, title: 'Heat Treat Cycle Spec', type: 'Work Instruction', owner: 'Priya Nair', site: 'Plant-2', status: 'warning', issue: 'No document file uploaded for this row' },
  ];

  nextStep(): void {
    if (this.currentStep() === 5) {
      this.startExecution();
      return;
    }
    if (this.currentStep() < 6) this.currentStep.update(s => s + 1);
    if (this.currentStep() === 5) this.startExecution();
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
  }

  startExecution(): void {
    this.currentStep.set(5);
    this.execProgress.set(0);
    this.executeComplete.set(false);
    const interval = setInterval(() => {
      this.execProgress.update(p => {
        if (p >= 100) {
          clearInterval(interval);
          this.executeComplete.set(true);
          const siteMap: Record<string, string> = { 'Plant-1': 'SITE-001', 'Plant-2': 'SITE-002', 'Plant-3': 'SITE-003' };
          const iniMap: Record<string, string> = { 'Maria Delgado': 'MD', 'Dev Patel': 'DP', 'Sarah Chen': 'SC', 'James Okonkwo': 'JO', 'Priya Nair': 'PN', 'Tom Braswell': 'TB' };
          const readyRows = this.importRows.filter(r => r.status !== 'blocked');
          this.mock.addDocuments(readyRows.map(r => ({
            title: r.title,
            type: r.type as any,
            status: 'Draft' as const,
            owner: r.owner,
            ownerInitials: iniMap[r.owner] ?? r.owner.split(' ').map(n => n[0]).join(''),
            revision: 'A',
            lastReviewed: '',
            nextReview: '',
            siteId: siteMap[r.site] ?? 'SITE-001',
            daysUntilReview: -1,
          })));
          setTimeout(() => this.currentStep.set(6), 800);
          return 100;
        }
        return p + 5;
      });
    }, 150);
  }
}
