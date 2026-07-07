import { Component, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/ui/services/toast.service';

@Component({
  selector: 'app-data-export-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-1">
          <li class="breadcrumb-item text-muted">Settings</li>
          <li class="breadcrumb-item active">Data Export</li>
        </ol>
      </nav>
      <h1 class="page-title">Data Export</h1>
      <p class="page-sub">Export your quality data as CSV or JSON for reporting and migration</p>
    </div>

    <div class="card settings-card" style="max-width:560px">
      <div class="card-body">
        <div class="export-icon">
          <i class="bi bi-archive"></i>
        </div>
        <h5 class="fw-bold text-dark mb-2">Export All Data</h5>
        <p class="text-muted">Download a complete export of your Qualvora workspace including all NCRs, CAPAs, Documents, Audits, LPA runs, and audit trail. Data is exported as CSV, JSON, and attached files in a single ZIP archive.</p>

        <ul class="export-includes mb-4">
          @for (item of includeItems; track item) {
            <li><i class="bi bi-check-circle-fill text-success me-2"></i>{{ item }}</li>
          }
        </ul>

        @if (progress() > 0 && progress() < 100) {
          <div class="mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted small">Preparing export...</span>
              <span class="text-muted small">{{ progress() }}%</span>
            </div>
            <div class="progress" style="height:8px">
              <div class="progress-bar bg-primary" [style.width.%]="progress()"></div>
            </div>
          </div>
        }

        <button class="btn btn-primary px-4" (click)="startExport()"
          [disabled]="progress() > 0 && progress() < 100">
          @if (progress() > 0 && progress() < 100) {
            <span class="spinner-border spinner-border-sm me-2"></span>Exporting...
          } @else {
            <i class="bi bi-download me-2"></i>Export All Data
          }
        </button>
        <p class="text-muted small mt-2">Export is encrypted and available for 24 hours. Estimated size: 48 MB.</p>

        <hr />
        <h6 class="section-label">Scheduled Exports</h6>
        <p class="text-muted small">Automatically email a data export every month to the tenant admin.</p>
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" id="schedExport"
            [(ngModel)]="scheduledExport" [ngModelOptions]="{standalone: true}" />
          <label class="form-check-label" for="schedExport">
            Monthly scheduled export
          </label>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0; }
    .page-sub { font-size: 13px; color: #64748B; margin: 4px 0 0; }
    .breadcrumb { font-size: 13px; }
    .settings-card { border: none; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .export-icon {
      width: 64px; height: 64px; border-radius: 16px; background: #EFF6FF;
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; color: #2563EB; margin-bottom: 16px;
    }
    .export-includes { list-style: none; padding: 0; }
    .export-includes li { padding: 4px 0; font-size: 14px; color: #475569; }
    .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94A3B8; }
  `]
})
export class DataExportSettingsComponent implements OnDestroy {
  private toast = inject(ToastService);
  readonly progress = signal(0);
  scheduledExport = false;
  private interval: ReturnType<typeof setInterval> | null = null;

  readonly includeItems = [
    'Non-Conformance Reports (CSV + attachments)',
    'Corrective Action Records (CSV)',
    'Document Library (PDF/DOCX files + metadata CSV)',
    'Audit Records & Findings (CSV)',
    'LPA Runs & Responses (CSV)',
    'Immutable Audit Trail (JSON)',
    'User & Role Configuration (JSON)',
  ];

  startExport(): void {
    this.progress.set(1);
    this.interval = setInterval(() => {
      this.progress.update(p => {
        if (p >= 100) {
          clearInterval(this.interval!);
          this.interval = null;
          this.toast.show('qualvora-export.zip ready — download link emailed', 'success');
          return 100;
        }
        return p + 5;
      });
    }, 200);
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }
}
