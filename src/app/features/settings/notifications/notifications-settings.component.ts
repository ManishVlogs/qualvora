import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/ui/services/toast.service';

interface EventClass {
  id: string; category: string; event: string;
  inApp: boolean; email: boolean; push: boolean;
  forced: boolean;
}

const EVENT_CLASSES: EventClass[] = [
  { id: 'e1', category: 'NCR', event: 'NCR Created', inApp: true, email: true, push: false, forced: false },
  { id: 'e2', category: 'NCR', event: 'NCR Assigned to Me', inApp: true, email: true, push: true, forced: false },
  { id: 'e3', category: 'NCR', event: 'NCR Past Containment Due', inApp: true, email: true, push: true, forced: false },
  { id: 'e4', category: 'CAPA', event: 'CAPA Assigned', inApp: true, email: true, push: false, forced: false },
  { id: 'e5', category: 'CAPA', event: 'CAPA Past Due', inApp: true, email: true, push: true, forced: false },
  { id: 'e6', category: 'Complaints', event: 'Customer Complaint Received', inApp: true, email: true, push: true, forced: true },
  { id: 'e7', category: 'Audits', event: 'Audit Scheduled', inApp: true, email: true, push: false, forced: false },
  { id: 'e8', category: 'Audits', event: 'Major Finding Raised', inApp: true, email: true, push: true, forced: true },
  { id: 'e9', category: 'Audits', event: 'Finding Response Due', inApp: true, email: false, push: false, forced: false },
  { id: 'e10', category: 'Documents', event: 'Document Pending Approval', inApp: true, email: true, push: false, forced: false },
  { id: 'e11', category: 'Documents', event: 'Document Approved', inApp: true, email: false, push: false, forced: false },
  { id: 'e12', category: 'Documents', event: 'Document Obsoleted', inApp: true, email: true, push: false, forced: false },
  { id: 'e13', category: 'LPA', event: 'LPA Run Overdue', inApp: true, email: true, push: true, forced: false },
  { id: 'e14', category: 'System', event: 'User Invited', inApp: true, email: true, push: false, forced: false },
  { id: 'e15', category: 'System', event: 'Guest Credential Expiring', inApp: true, email: true, push: false, forced: false },
  { id: 'e16', category: 'System', event: 'Data Export Ready', inApp: true, email: true, push: false, forced: false },
];

@Component({
  selector: 'app-notifications-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-1">
          <li class="breadcrumb-item text-muted">Settings</li>
          <li class="breadcrumb-item active">Notification Defaults</li>
        </ol>
      </nav>
      <h1 class="page-title">Notification Defaults</h1>
      <p class="text-muted small">Org-wide defaults. Users can override their own preferences in Notifications > Preferences.</p>
    </div>

    <div class="card settings-card">
      <div class="card-body p-0">
        <table class="table mb-0">
          <thead class="table-light">
            <tr>
              <th>Category</th>
              <th>Event</th>
              <th class="text-center" style="width:80px">
                In-App <i class="bi bi-lock-fill text-muted ms-1" style="font-size:11px" title="Always on"></i>
              </th>
              <th class="text-center" style="width:80px">Email</th>
              <th class="text-center" style="width:80px">Push</th>
            </tr>
          </thead>
          <tbody>
            @for (ev of events(); track ev.id) {
              <tr [class.forced-row]="ev.forced">
                <td>
                  <span class="badge bg-light text-dark border">{{ ev.category }}</span>
                </td>
                <td>
                  {{ ev.event }}
                  @if (ev.forced) {
                    <span class="ms-2" title="Cannot be disabled — required by policy">
                      <i class="bi bi-lock-fill text-warning" style="font-size:12px"></i>
                    </span>
                  }
                </td>
                <td class="text-center">
                  <div class="toggle-pill active disabled-toggle">
                    <div class="toggle-knob"></div>
                  </div>
                </td>
                <td class="text-center">
                  @if (ev.forced) {
                    <div class="toggle-pill active disabled-toggle">
                      <div class="toggle-knob"></div>
                    </div>
                  } @else {
                    <div class="toggle-pill" [class.active]="ev.email"
                      (click)="toggle(ev, 'email')">
                      <div class="toggle-knob"></div>
                    </div>
                  }
                </td>
                <td class="text-center">
                  @if (ev.forced) {
                    <div class="toggle-pill active disabled-toggle">
                      <div class="toggle-knob"></div>
                    </div>
                  } @else {
                    <div class="toggle-pill" [class.active]="ev.push"
                      (click)="toggle(ev, 'push')">
                      <div class="toggle-knob"></div>
                    </div>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="mt-3">
      <button class="btn btn-primary" (click)="save()">
        <i class="bi bi-check-lg me-1"></i>Save Defaults
      </button>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .breadcrumb { font-size: 13px; }
    .settings-card { border: none; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
    .forced-row { background: #FFFBEB; }
    .toggle-pill {
      width: 36px; height: 20px; border-radius: 10px; background: #CBD5E1;
      position: relative; cursor: pointer; transition: background 0.2s;
      display: inline-block;
    }
    .toggle-pill.active { background: #2563EB; }
    .toggle-pill.disabled-toggle { cursor: not-allowed; opacity: 0.7; }
    .toggle-knob {
      position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
      border-radius: 50%; background: #fff; transition: left 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .toggle-pill.active .toggle-knob { left: 18px; }
  `]
})
export class NotificationsSettingsComponent {
  private toast = inject(ToastService);
  readonly events = signal(EVENT_CLASSES.map(e => ({ ...e })));

  toggle(ev: EventClass, field: 'email' | 'push'): void {
    this.events.update(list => list.map(e => e.id === ev.id ? { ...e, [field]: !e[field] } : e));
  }

  save(): void { this.toast.show('Notification defaults saved', 'success'); }
}
