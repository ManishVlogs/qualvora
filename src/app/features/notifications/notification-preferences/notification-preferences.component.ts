import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/ui/services/toast.service';

interface EventClass {
  id: string;
  name: string;
  category: string;
  forced: boolean;
  forcedTooltip?: string;
  inApp: boolean;        // always true, locked
  emailRealtime: boolean;
  emailDigest: boolean;
}

const EVENT_CLASSES: EventClass[] = [
  { id:'E01', name:'Customer Complaint Received',  category:'Complaints', forced:true, forcedTooltip:'Mandatory per quality policy — cannot be disabled', inApp:true, emailRealtime:true,  emailDigest:false },
  { id:'E02', name:'Major Finding Raised',          category:'Audits',    forced:true, forcedTooltip:'Mandatory — major findings require immediate awareness', inApp:true, emailRealtime:true,  emailDigest:false },
  { id:'E03', name:'Document Approval Request',     category:'Documents', forced:false, inApp:true, emailRealtime:true,  emailDigest:false },
  { id:'E04', name:'Document Approved / Rejected',  category:'Documents', forced:false, inApp:true, emailRealtime:false, emailDigest:true  },
  { id:'E05', name:'Document Review Due',           category:'Documents', forced:false, inApp:true, emailRealtime:false, emailDigest:true  },
  { id:'E06', name:'NCR Assigned to You',           category:'NCR',       forced:false, inApp:true, emailRealtime:true,  emailDigest:false },
  { id:'E07', name:'NCR Dispositioned',             category:'NCR',       forced:false, inApp:true, emailRealtime:false, emailDigest:true  },
  { id:'E08', name:'CAPA Step Due',                 category:'CAPA',      forced:false, inApp:true, emailRealtime:true,  emailDigest:false },
  { id:'E09', name:'CAPA Step Overdue',             category:'CAPA',      forced:false, inApp:true, emailRealtime:true,  emailDigest:false },
  { id:'E10', name:'CAPA Effectiveness Verified',   category:'CAPA',      forced:false, inApp:true, emailRealtime:false, emailDigest:true  },
  { id:'E11', name:'LPA Run Due',                   category:'LPA',       forced:false, inApp:true, emailRealtime:false, emailDigest:true  },
  { id:'E12', name:'LPA Run Overdue',               category:'LPA',       forced:false, inApp:true, emailRealtime:true,  emailDigest:false },
  { id:'E13', name:'Audit Scheduled',               category:'Audits',    forced:false, inApp:true, emailRealtime:false, emailDigest:true  },
  { id:'E14', name:'Audit Completed',               category:'Audits',    forced:false, inApp:true, emailRealtime:false, emailDigest:true  },
  { id:'E15', name:'Finding Response Due',          category:'Audits',    forced:false, inApp:true, emailRealtime:true,  emailDigest:false },
  { id:'E16', name:'System Maintenance',            category:'System',    forced:false, inApp:true, emailRealtime:true,  emailDigest:false },
];

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">

      <div class="page-header">
        <div>
          <nav class="breadcrumb-nav">
            <a [routerLink]="['/notifications']" class="bc-link">Notifications</a>
            <i class="bi bi-chevron-right bc-sep"></i>
            <span class="bc-current">Preferences</span>
          </nav>
          <h1>Notification Preferences</h1>
          <p>Choose how you receive notifications for each event type.</p>
        </div>
        <span class="chip chip-blue">SCR-100</span>
      </div>

      <div class="q-card p-0">
        <table class="pref-table">
          <thead>
            <tr>
              <th class="col-event">Event Class</th>
              <th class="col-toggle">
                <div class="th-inner">
                  <i class="bi bi-bell-fill text-primary me-1"></i>
                  In-App
                </div>
              </th>
              <th class="col-toggle">
                <div class="th-inner">
                  <i class="bi bi-envelope-fill text-danger me-1"></i>
                  Email Real-Time
                </div>
              </th>
              <th class="col-toggle">
                <div class="th-inner">
                  <i class="bi bi-calendar-week text-success me-1"></i>
                  Email Digest
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            @for (cat of categories; track cat) {
              <tr class="category-row">
                <td colspan="4" class="cat-label">{{ cat }}</td>
              </tr>
              @for (ev of eventsForCat(cat); track ev.id) {
                <tr class="event-row">
                  <td class="event-name-cell">
                    <span class="event-name">{{ ev.name }}</span>
                    @if (ev.forced) {
                      <span class="forced-badge" [title]="ev.forcedTooltip ?? ''">
                        <i class="bi bi-lock-fill me-1"></i>Required
                      </span>
                    }
                  </td>
                  <!-- In-App: always on + lock -->
                  <td class="toggle-cell">
                    <div class="toggle-wrap">
                      <span class="toggle active locked" title="In-app notifications cannot be disabled">
                        <span class="toggle-knob"></span>
                      </span>
                      <i class="bi bi-lock-fill lock-icon"></i>
                    </div>
                  </td>
                  <!-- Email real-time -->
                  <td class="toggle-cell">
                    <div class="toggle-wrap">
                      @if (ev.forced) {
                        <span class="toggle active locked" [title]="ev.forcedTooltip ?? ''">
                          <span class="toggle-knob"></span>
                        </span>
                        <i class="bi bi-lock-fill lock-icon"></i>
                      } @else {
                        <button class="toggle" [class.active]="getEmailRT(ev.id)" (click)="toggleEmailRT(ev.id)" role="switch" [attr.aria-checked]="getEmailRT(ev.id)">
                          <span class="toggle-knob"></span>
                        </button>
                      }
                    </div>
                  </td>
                  <!-- Email digest -->
                  <td class="toggle-cell">
                    <div class="toggle-wrap">
                      @if (ev.forced) {
                        <span class="toggle locked" title="Forced events use real-time only">
                          <span class="toggle-knob"></span>
                        </span>
                        <i class="bi bi-lock-fill lock-icon"></i>
                      } @else {
                        <button class="toggle" [class.active]="getEmailDigest(ev.id)" (click)="toggleEmailDigest(ev.id)" role="switch" [attr.aria-checked]="getEmailDigest(ev.id)">
                          <span class="toggle-knob"></span>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <div class="save-bar">
        <p class="save-note"><i class="bi bi-info-circle me-1"></i>Changes take effect immediately. Forced events are set by your organization's quality policy.</p>
        <button class="btn btn-primary save-btn" (click)="savePreferences()">
          <i class="bi bi-floppy me-1"></i>Save Preferences
        </button>
      </div>

    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 900px; margin: 0 auto; }
    .breadcrumb-nav { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.5rem; font-size: 0.8125rem; }
    .bc-link { color: #2563EB; text-decoration: none; &:hover { text-decoration: underline; } }
    .bc-sep { color: #CBD5E1; font-size: 0.625rem; }
    .bc-current { color: #64748B; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; margin: 0 0 0.25rem; }
    .page-header p { font-size: 0.875rem; color: #64748B; margin: 0; }

    .pref-table { width: 100%; border-collapse: collapse; }
    .pref-table th { background: #F8FAFC; padding: 0.75rem 1rem; border-bottom: 2px solid #E2E8F0; text-align: center; font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; }
    .col-event { text-align: left !important; width: 45%; }
    .col-toggle { width: 18%; }
    .th-inner { display: flex; align-items: center; justify-content: center; }
    .pref-table td { padding: 0.625rem 1rem; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }

    .category-row .cat-label { background: #F8FAFC; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #94A3B8; padding: 0.5rem 1rem; }
    .event-row:hover td { background: #F8FAFC; }

    .event-name-cell { }
    .event-name { font-size: 0.875rem; color: #0F172A; font-weight: 500; display: block; }
    .forced-badge { background: #FEF9C3; color: #713F12; border-radius: 6px; padding: 0.1rem 0.5rem; font-size: 0.7rem; font-weight: 600; display: inline-flex; align-items: center; margin-top: 0.25rem; }

    .toggle-cell { text-align: center; }
    .toggle-wrap { display: flex; align-items: center; justify-content: center; gap: 0.375rem; }
    .toggle {
      width: 36px; height: 20px; border-radius: 10px; border: none;
      background: #CBD5E1; cursor: pointer; position: relative; padding: 0;
      transition: background 0.2s;
    }
    .toggle.active { background: #2563EB; }
    .toggle.locked { opacity: 0.6; cursor: not-allowed; }
    .toggle-knob {
      display: block; width: 14px; height: 14px; border-radius: 50%; background: #fff;
      position: absolute; top: 3px; left: 3px; transition: left 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    .toggle.active .toggle-knob { left: 19px; }
    .lock-icon { font-size: 0.625rem; color: #CBD5E1; }

    .save-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-top: 1.25rem; }
    .save-note { font-size: 0.8125rem; color: #64748B; margin: 0; }
    .save-btn { padding: 0.5rem 1.5rem; }
  `],
})
export class NotificationPreferencesComponent {
  readonly toast = inject(ToastService);

  readonly categories = ['Documents', 'NCR', 'CAPA', 'Audits', 'LPA', 'Complaints', 'System'];

  private readonly prefs = signal<Map<string, EventClass>>(
    new Map(EVENT_CLASSES.map(e => [e.id, { ...e }]))
  );

  eventsForCat(cat: string): EventClass[] {
    return [...this.prefs().values()].filter(e => e.category === cat);
  }

  getEmailRT(id: string): boolean { return this.prefs().get(id)?.emailRealtime ?? false; }
  getEmailDigest(id: string): boolean { return this.prefs().get(id)?.emailDigest ?? false; }

  toggleEmailRT(id: string): void {
    this.prefs.update(m => { const n = new Map(m); const e = n.get(id); if (e) n.set(id, { ...e, emailRealtime: !e.emailRealtime }); return n; });
  }
  toggleEmailDigest(id: string): void {
    this.prefs.update(m => { const n = new Map(m); const e = n.get(id); if (e) n.set(id, { ...e, emailDigest: !e.emailDigest }); return n; });
  }

  savePreferences(): void { this.toast.show('Preferences saved', 'success'); }
}
