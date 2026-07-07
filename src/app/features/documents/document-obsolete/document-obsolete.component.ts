import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

interface ObsoleteDoc {
  id: string; title: string; type: string; rev: string;
  obsoletedDate: string; obsoletedBy: string; reason: string;
}

@Component({
  selector: 'app-document-obsolete',
  standalone: true,
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <button class="back-btn" (click)="router.navigate(['/documents'])">
          <i class="bi bi-arrow-left me-1"></i> Document Library
        </button>
        <h1 class="page-title">Obsolete Document Archive</h1>
        <p class="page-sub">Documents retired from active use — retained for audit purposes</p>
      </div>

      <div class="info-banner">
        <i class="bi bi-archive me-2"></i>
        Retained for audit purposes only. These documents cannot be revised or redistributed.
      </div>

      <div class="q-card table-card">
        <div class="table-meta">
          <span class="result-count">{{ docs.length }} obsolete documents</span>
        </div>
        <table class="q-table">
          <thead>
            <tr>
              <th style="width:110px">ID</th>
              <th>Title</th>
              <th style="width:150px">Type</th>
              <th style="width:55px">Rev</th>
              <th style="width:130px">Obsoleted Date</th>
              <th style="width:140px">Obsoleted By</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            @for (d of docs; track d.id) {
              <tr class="obs-row">
                <td><span class="record-id">{{ d.id }}</span></td>
                <td class="title-cell">{{ d.title }}</td>
                <td><span class="type-badge">{{ d.type }}</span></td>
                <td class="text-center fw-600">Rev {{ d.rev }}</td>
                <td class="text-muted">{{ d.obsoletedDate }}</td>
                <td>{{ d.obsoletedBy }}</td>
                <td class="reason-cell">{{ d.reason }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1300px; margin: 0 auto; }
    .page-header { margin-bottom: 1.25rem; }
    .back-btn { background: none; border: none; font-size: 0.8125rem; color: #64748B; cursor: pointer; padding: 0 0 0.75rem; display: flex; align-items: center; &:hover { color: #2563EB; } }
    .page-title { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0 0 0.2rem; }
    .page-sub { font-size: 0.875rem; color: #64748B; margin: 0; }
    .info-banner { background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.875rem; color: #92400E; margin-bottom: 1.25rem; display: flex; align-items: center; }
    .table-card { overflow: hidden; }
    .table-meta { padding: 0.625rem 1.25rem; border-bottom: 1px solid #F1F5F9; }
    .result-count { font-size: 0.8125rem; color: #64748B; }
    .obs-row { opacity: 0.8; }
    .title-cell { font-weight: 500; color: #475569; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .type-badge { font-size: 11px; background: #F1F5F9; color: #475569; border-radius: 4px; padding: 2px 6px; }
    .fw-600 { font-weight: 600; font-size: 0.8125rem; }
    .text-muted { color: #94A3B8; font-size: 0.8125rem; }
    .reason-cell { font-size: 0.8125rem; color: #64748B; max-width: 200px; }
  `]
})
export class DocumentObsoleteComponent {
  readonly router = inject(Router);

  readonly docs: ObsoleteDoc[] = [
    { id: 'DOC-0002', title: 'Weld Station 4 Work Instruction', type: 'Work Instruction', rev: 'B', obsoletedDate: '2026-01-15', obsoletedBy: 'Dev Patel', reason: 'Superseded by DOC-0001 Rev C with updated parameters' },
    { id: 'DOC-0006', title: 'Incoming Inspection Procedure v1', type: 'Quality Procedure', rev: 'A', obsoletedDate: '2025-11-01', obsoletedBy: 'James Okonkwo', reason: 'Replaced by DOC-0021 with AQL-indexed sampling plan' },
    { id: 'DOC-0014', title: 'Customer Complaint Form – Legacy', type: 'Form', rev: 'C', obsoletedDate: '2025-09-15', obsoletedBy: 'Maria Delgado', reason: 'Replaced by updated digital workflow' },
    { id: 'DOC-0023', title: 'Paint Line Procedure v1', type: 'Quality Procedure', rev: 'A', obsoletedDate: '2025-08-20', obsoletedBy: 'Priya Nair', reason: 'Process re-engineered, full rewrite required' },
    { id: 'DOC-0029', title: 'Calibration Log – CMM-01 (manual)', type: 'Form', rev: 'B', obsoletedDate: '2025-07-01', obsoletedBy: 'Tom Braswell', reason: 'Replaced by electronic calibration records system' },
    { id: 'DOC-0045', title: 'End-of-Line Audit Checklist v3', type: 'Form', rev: 'B', obsoletedDate: '2025-12-01', obsoletedBy: 'James Okonkwo', reason: 'Superseded by v4 checklist with expanded criteria' },
  ];
}
