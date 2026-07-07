import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/ui/services/toast.service';

interface AuditEntry {
  id: string; user: string; entityType: string; entityId: string;
  event: string; before: string; after: string; timestamp: string; ip: string;
}

const MOCK_ENTRIES: AuditEntry[] = [
  { id: '1', user: 'Maria Chen', entityType: 'NCR', entityId: 'NCR-2026-0147', event: 'Status Changed', before: 'Open', after: 'Contained', timestamp: '2026-06-13T09:12:00Z', ip: '10.0.1.45' },
  { id: '2', user: 'James Rodriguez', entityType: 'Document', entityId: 'DOC-2026-0032', event: 'Approved', before: 'In Review', after: 'Released', timestamp: '2026-06-13T08:55:00Z', ip: '10.0.1.23' },
  { id: '3', user: 'Maria Chen', entityType: 'CAPA', entityId: 'CAPA-2026-031', event: 'Created', before: '—', after: 'Open', timestamp: '2026-06-13T08:30:00Z', ip: '10.0.1.45' },
  { id: '4', user: 'Sandra Kim', entityType: 'User', entityId: 'U5', event: 'Deactivated', before: 'Active', after: 'Inactive', timestamp: '2026-06-12T16:44:00Z', ip: '10.0.2.11' },
  { id: '5', user: 'Tom Baker', entityType: 'Audit', entityId: 'AUD-2026-011', event: 'Finding Raised', before: '—', after: 'Minor', timestamp: '2026-06-12T14:22:00Z', ip: '10.0.2.34' },
  { id: '6', user: 'David Okonkwo', entityType: 'Settings', entityId: 'escalation.ncr_containment', event: 'Threshold Changed', before: '48 hours', after: '24 hours', timestamp: '2026-06-11T11:05:00Z', ip: '10.0.1.67' },
  { id: '7', user: 'Maria Chen', entityType: 'Document', entityId: 'DOC-2026-0031', event: 'Obsoleted', before: 'Released', after: 'Obsolete', timestamp: '2026-06-11T09:00:00Z', ip: '10.0.1.45' },
  { id: '8', user: 'James Rodriguez', entityType: 'LPA', entityId: 'LPA-RUN-0042', event: 'Submitted', before: 'In Progress', after: 'Complete', timestamp: '2026-06-10T17:30:00Z', ip: '10.0.1.23' },
];

const ENTITY_TYPES = ['All','NCR','CAPA','Document','Audit','LPA','User','Settings'];
const EVENT_TYPES = ['All','Created','Status Changed','Approved','Rejected','Deactivated','Threshold Changed','Finding Raised','Obsoleted','Submitted'];

@Component({
  selector: 'app-audit-trail-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-1">
          <li class="breadcrumb-item text-muted">Settings</li>
          <li class="breadcrumb-item active">Audit Trail</li>
        </ol>
      </nav>
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h1 class="page-title">Audit Trail</h1>
          <p class="page-sub">Immutable log of every action taken in the system — required for IATF compliance</p>
        </div>
        <button class="btn btn-outline-primary" (click)="exportCsv()">
          <i class="bi bi-download me-1"></i>Export CSV
        </button>
      </div>
    </div>

    <div class="alert alert-warning d-flex align-items-center gap-2 mb-4">
      <i class="bi bi-shield-exclamation"></i>
      <span><strong>Immutable audit log</strong> — records cannot be edited or deleted.</span>
    </div>

    <!-- Filters -->
    <div class="filter-bar mb-3">
      <select class="form-select form-select-sm" style="max-width:160px" [(ngModel)]="filterEntity">
        @for (et of entityTypes; track et) { <option [value]="et">{{ et }}</option> }
      </select>
      <select class="form-select form-select-sm" style="max-width:200px" [(ngModel)]="filterEvent">
        @for (ev of eventTypes; track ev) { <option [value]="ev">{{ ev }}</option> }
      </select>
      <input class="form-control form-control-sm" style="max-width:180px"
        [(ngModel)]="filterUser" placeholder="Filter by user..." />
      <div class="d-flex gap-2 align-items-center">
        <label class="text-muted small">From</label>
        <input class="form-control form-control-sm" type="date" [(ngModel)]="filterFrom" style="max-width:140px" />
        <label class="text-muted small">To</label>
        <input class="form-control form-control-sm" type="date" [(ngModel)]="filterTo" style="max-width:140px" />
      </div>
    </div>

    <div class="card settings-card">
      <div class="card-body p-0">
        <table class="table table-hover mb-0 small">
          <thead class="table-light">
            <tr>
              <th>User</th>
              <th>Entity Type</th>
              <th>Entity ID</th>
              <th>Event</th>
              <th>Before</th>
              <th>After</th>
              <th>Timestamp</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            @for (entry of filtered(); track entry.id) {
              <tr>
                <td class="fw-semibold">{{ entry.user }}</td>
                <td>
                  <span class="badge bg-light text-dark border">{{ entry.entityType }}</span>
                </td>
                <td class="font-monospace text-muted">{{ entry.entityId }}</td>
                <td>{{ entry.event }}</td>
                <td class="text-muted">{{ entry.before }}</td>
                <td class="fw-semibold text-dark">{{ entry.after }}</td>
                <td class="text-muted">{{ formatTs(entry.timestamp) }}</td>
                <td class="font-monospace text-muted">{{ entry.ip }}</td>
              </tr>
            }
            @if (filtered().length === 0) {
              <tr>
                <td colspan="8" class="text-center text-muted py-4">No matching records.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0; }
    .page-sub { font-size: 13px; color: #64748B; margin: 4px 0 0; }
    .breadcrumb { font-size: 13px; }
    .settings-card { border: none; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
    .filter-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  `]
})
export class AuditTrailSettingsComponent {
  private toast = inject(ToastService);

  readonly entityTypes = ENTITY_TYPES;
  readonly eventTypes = EVENT_TYPES;

  filterEntity = 'All';
  filterEvent = 'All';
  filterUser = '';
  filterFrom = '';
  filterTo = '';

  readonly filtered = computed(() => {
    return MOCK_ENTRIES.filter(e => {
      if (this.filterEntity !== 'All' && e.entityType !== this.filterEntity) return false;
      if (this.filterEvent !== 'All' && e.event !== this.filterEvent) return false;
      if (this.filterUser && !e.user.toLowerCase().includes(this.filterUser.toLowerCase())) return false;
      return true;
    });
  });

  formatTs(ts: string): string {
    return ts.replace('T', ' ').replace('Z', '').substring(0, 16);
  }

  exportCsv(): void {
    this.toast.show('Audit trail CSV exported', 'success');
  }
}
