import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NotificationStore, AppNotification } from '../../../core/notifications/stores/notification.store';
import { ToastService } from '../../../core/ui/services/toast.service';

type NotifTab = 'All' | 'Approvals' | 'NCRs' | 'CAPAs' | 'Audits' | 'System';

// Extended 30-row notification set
const NOTIFS: AppNotification[] = [
  { id:'N-001', title:'NCR Assigned to You', message:'NCR-2026-0147 "Bracket dimensional OOT" assigned for disposition', type:'warning', entityType:'NCR', entityId:'NCR-2026-0147', link:'/ncrs/NCR-2026-0147', isRead:false, createdAt:'2026-06-13T08:30:00Z' },
  { id:'N-002', title:'Document Approval Required', message:'DOC-0048 "Torque Verification WI" awaiting your approval', type:'info', entityType:'Approvals', entityId:'DOC-0048', link:'/documents/DOC-0048', isRead:false, createdAt:'2026-06-13T07:15:00Z' },
  { id:'N-003', title:'CAPA Step Overdue', message:'CAPA-2026-0021 containment step is 3 days overdue', type:'error', entityType:'CAPAs', entityId:'CAPA-2026-0021', link:'/capas/CAPA-2026-0021', isRead:false, createdAt:'2026-06-13T06:00:00Z' },
  { id:'N-004', title:'Audit Scheduled', message:'AUD-2026-011 scheduled for 2026-07-10 — Process audit, Weld Zone', type:'info', entityType:'Audits', entityId:'AUD-2026-011', link:'/audits/AUD-2026-011', isRead:true, createdAt:'2026-06-12T14:00:00Z' },
  { id:'N-005', title:'Finding Response Due Soon', message:'FND-2026-0035 response is due in 9 days', type:'warning', entityType:'Audits', entityId:'FND-2026-0035', link:'/findings/FND-2026-0035', isRead:true, createdAt:'2026-06-12T09:30:00Z' },
  { id:'N-006', title:'Document Approved', message:'DOC-0042 "Control Plan BIW Brackets" approved by Dev Patel', type:'success', entityType:'Approvals', entityId:'DOC-0042', link:'/documents/DOC-0042', isRead:true, createdAt:'2026-06-11T16:45:00Z' },
  { id:'N-007', title:'LPA Run Overdue', message:'LPA-2026-0088 Paint Shop daily LPA overdue by 2 days', type:'error', entityType:'System', entityId:'LPA-2026-0088', link:'/lpa', isRead:false, createdAt:'2026-06-13T08:00:00Z' },
  { id:'N-008', title:'New NCR Opened', message:'NCR-2026-0148 "Surface defect weld panel" opened by Priya Nair', type:'warning', entityType:'NCRs', entityId:'NCR-2026-0148', link:'/ncrs/NCR-2026-0148', isRead:false, createdAt:'2026-06-13T05:30:00Z' },
  { id:'N-009', title:'CAPA D4 Root Cause Submitted', message:'CAPA-2026-0023 root cause analysis submitted by Tom Braswell', type:'success', entityType:'CAPAs', entityId:'CAPA-2026-0023', link:'/capas/CAPA-2026-0023', isRead:true, createdAt:'2026-06-13T03:00:00Z' },
  { id:'N-010', title:'Audit Finding Raised', message:'Major finding FND-2026-0061 raised on AUD-2026-011', type:'error', entityType:'Audits', entityId:'FND-2026-0061', link:'/findings/FND-2026-0061', isRead:false, createdAt:'2026-06-12T11:00:00Z' },
  { id:'N-011', title:'Document Review Due', message:'DOC-0031 "Weld Process PFMEA" scheduled for review in 7 days', type:'warning', entityType:'Approvals', entityId:'DOC-0031', link:'/documents/DOC-0031', isRead:true, createdAt:'2026-06-12T08:00:00Z' },
  { id:'N-012', title:'Customer Complaint Received', message:'CC-2026-0019 from Ford Motor Company — dimensional bracket issue', type:'error', entityType:'System', entityId:'CC-2026-0019', link:'/complaints', isRead:false, createdAt:'2026-06-11T14:30:00Z' },
  { id:'N-013', title:'CAPA Effectiveness Verified', message:'CAPA-2026-0018 effectiveness verification passed — ready to close', type:'success', entityType:'CAPAs', entityId:'CAPA-2026-0018', link:'/capas/CAPA-2026-0018', isRead:true, createdAt:'2026-06-11T10:00:00Z' },
  { id:'N-014', title:'NCR Dispositioned', message:'NCR-2026-0141 dispositioned as Rework by Maria Delgado', type:'info', entityType:'NCRs', entityId:'NCR-2026-0141', link:'/ncrs/NCR-2026-0141', isRead:true, createdAt:'2026-06-11T09:15:00Z' },
  { id:'N-015', title:'Audit Completed', message:'AUD-2026-009 Supplier Audit – Nova Steel completed with 2 findings', type:'info', entityType:'Audits', entityId:'AUD-2026-009', link:'/audits/AUD-2026-009', isRead:true, createdAt:'2026-06-10T17:00:00Z' },
  { id:'N-016', title:'Document Distribution Required', message:'DOC-0042 Rev D requires acknowledgement from 14 personnel', type:'info', entityType:'Approvals', entityId:'DOC-0042', link:'/documents/DOC-0042/distribution', isRead:true, createdAt:'2026-06-10T13:00:00Z' },
  { id:'N-017', title:'LPA Compliance Alert', message:'Weld Zone B L2 compliance dropped below 65% threshold', type:'warning', entityType:'System', entityId:'LPA', link:'/lpa', isRead:true, createdAt:'2026-06-10T08:00:00Z' },
  { id:'N-018', title:'CAPA D5 Permanent Actions Overdue', message:'CAPA-2026-0032 permanent corrective actions due — 5 days overdue', type:'error', entityType:'CAPAs', entityId:'CAPA-2026-0032', link:'/capas/CAPA-2026-0032', isRead:false, createdAt:'2026-06-09T16:00:00Z' },
  { id:'N-019', title:'NCR Escalated to MRB', message:'NCR-2026-0139 escalated to Material Review Board by QM', type:'warning', entityType:'NCRs', entityId:'NCR-2026-0139', link:'/ncrs/NCR-2026-0139', isRead:true, createdAt:'2026-06-09T11:30:00Z' },
  { id:'N-020', title:'Supplier Audit Scheduled', message:'AUD-2026-P07 Customer Dock Audit – Ford scheduled for Nov 15', type:'info', entityType:'Audits', entityId:'AUD-2026-P07', link:'/audits/program', isRead:true, createdAt:'2026-06-08T14:00:00Z' },
  { id:'N-021', title:'System Maintenance', message:'Planned maintenance window Sat 2026-06-15 02:00–04:00 EST', type:'info', entityType:'System', entityId:'SYS', link:'', isRead:true, createdAt:'2026-06-08T10:00:00Z' },
  { id:'N-022', title:'CAPA Champion Changed', message:'CAPA-2026-0030 champion changed from Tom Braswell to Dev Patel', type:'info', entityType:'CAPAs', entityId:'CAPA-2026-0030', link:'/capas/CAPA-2026-0030', isRead:true, createdAt:'2026-06-07T09:00:00Z' },
  { id:'N-023', title:'Document Rejected', message:'DOC-0049 returned by QM — see review comments', type:'error', entityType:'Approvals', entityId:'DOC-0049', link:'/documents/DOC-0049', isRead:true, createdAt:'2026-06-06T15:30:00Z' },
  { id:'N-024', title:'NCR Closed', message:'NCR-2026-0133 closed after successful rework verification', type:'success', entityType:'NCRs', entityId:'NCR-2026-0133', link:'/ncrs/NCR-2026-0133', isRead:true, createdAt:'2026-06-06T11:00:00Z' },
  { id:'N-025', title:'Finding Response Submitted', message:'FND-2026-0040 response submitted by Tom Braswell — awaiting verification', type:'info', entityType:'Audits', entityId:'FND-2026-0040', link:'/findings/FND-2026-0040', isRead:true, createdAt:'2026-06-05T14:00:00Z' },
  { id:'N-026', title:'Audit Checklist Assigned', message:'AUD-2026-011 assigned "Process Audit Standard v2.3" checklist', type:'info', entityType:'Audits', entityId:'AUD-2026-011', link:'/audits/AUD-2026-011', isRead:true, createdAt:'2026-06-04T09:00:00Z' },
  { id:'N-027', title:'LPA Template Updated', message:'Weld Zone Operator Daily Check updated to v1.4 — 2 questions added', type:'info', entityType:'System', entityId:'LPAT-001', link:'/lpa/setup', isRead:true, createdAt:'2026-06-03T13:00:00Z' },
  { id:'N-028', title:'CAPA Overdue Alert', message:'3 CAPAs across SITE-001 are past due date — review required', type:'error', entityType:'CAPAs', entityId:'', link:'/capas', isRead:true, createdAt:'2026-06-02T08:00:00Z' },
  { id:'N-029', title:'Document Revision Approved', message:'DOC-0018 Rev C approved and released to production floor', type:'success', entityType:'Approvals', entityId:'DOC-0018', link:'/documents/DOC-0018', isRead:true, createdAt:'2026-06-01T16:00:00Z' },
  { id:'N-030', title:'System Update', message:'Qualvora v2.4.1 deployed — release notes available in settings', type:'info', entityType:'System', entityId:'SYS', link:'/settings', isRead:true, createdAt:'2026-05-31T10:00:00Z' },
];

function timeAgo(isoDate: string): string {
  const diff = new Date('2026-06-13T09:14:00Z').getTime() - new Date(isoDate).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  if (d === 1) return '1d ago';
  return `${d}d ago`;
}

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">

      <div class="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{{ unreadCount() }} unread</p>
        </div>
        <div class="header-actions">
          <span class="chip chip-blue">SCR-100</span>
          <button class="btn btn-outline-secondary ms-2" (click)="markAllRead()">
            <i class="bi bi-check-all me-1"></i>Mark all read
          </button>
          <a class="btn btn-outline-secondary ms-2" [routerLink]="['/notifications/preferences']">
            <i class="bi bi-sliders me-1"></i>Preferences
          </a>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="tab-bar mb-3">
        @for (tab of tabs; track tab) {
          <button class="tab-btn" [class.active]="activeTab() === tab" (click)="activeTab.set(tab)">
            {{ tab }}
            @if (tab === 'All') {
              <span class="tab-count">{{ allNotifs.length }}</span>
            } @else {
              <span class="tab-count">{{ tabCount(tab) }}</span>
            }
          </button>
        }
      </div>

      <!-- Notification rows -->
      <div class="q-card p-0 notif-list">
        @for (n of filteredNotifs(); track n.id) {
          <div class="notif-row"
               [class.unread]="!n.isRead"
               (click)="openNotif(n)">
            <div class="notif-icon-wrap">
              <i class="bi {{ iconFor(n.type) }} notif-icon notif-{{ n.type }}"></i>
            </div>
            <div class="notif-body">
              <div class="notif-title-row">
                <span class="notif-actor">{{ actorFor(n) }}</span>
                <span class="notif-action">{{ n.message }}</span>
              </div>
              <div class="notif-meta">
                <span class="notif-type-chip notif-type-{{ (n.entityType || 'System').toLowerCase() }}">{{ n.entityType }}</span>
                <span class="notif-time">{{ timeAgo(n.createdAt) }}</span>
              </div>
            </div>
            <div class="notif-right">
              @if (!n.isRead) {
                <span class="unread-dot"></span>
              }
              <button class="btn btn-xs btn-link dismiss-btn" title="Mark read" (click)="$event.stopPropagation(); markRead(n.id)">
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>
        }
        @empty {
          <div class="notif-empty"><i class="bi bi-bell-slash me-2"></i>No notifications in this category.</div>
        }
      </div>

    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; margin: 0 0 0.25rem; }
    .page-header p { font-size: 0.875rem; color: #64748B; margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

    .tab-bar { display: flex; gap: 0.25rem; border-bottom: 2px solid #E2E8F0; flex-wrap: wrap; }
    .tab-btn { background: none; border: none; padding: 0.625rem 1rem; font-size: 0.875rem; color: #64748B; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; display: flex; align-items: center; gap: 0.375rem; }
    .tab-btn.active { color: #2563EB; border-bottom-color: #2563EB; font-weight: 600; }
    .tab-count { background: #E2E8F0; color: #475569; border-radius: 20px; padding: 0.05rem 0.5rem; font-size: 0.7rem; font-weight: 600; }
    .tab-btn.active .tab-count { background: #DBEAFE; color: #1E40AF; }

    .notif-list { overflow: hidden; }
    .notif-row {
      display: flex; align-items: flex-start; gap: 0.875rem;
      padding: 1rem 1.25rem; border-bottom: 1px solid #F1F5F9;
      cursor: pointer; transition: background 0.1s;
      &:last-child { border-bottom: none; }
      &:hover { background: #F8FAFC; }
    }
    .notif-row.unread { background: #EFF6FF; border-left: 3px solid #2563EB; }
    .notif-row.unread:hover { background: #DBEAFE; }

    .notif-icon-wrap { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #F1F5F9; }
    .notif-icon { font-size: 1rem; }
    .notif-success { color: #16A34A; }
    .notif-info    { color: #2563EB; }
    .notif-warning { color: #D97706; }
    .notif-error   { color: #DC2626; }

    .notif-body { flex: 1; min-width: 0; }
    .notif-title-row { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-bottom: 0.25rem; }
    .notif-actor { font-size: 0.875rem; font-weight: 700; color: #0F172A; }
    .notif-action { font-size: 0.875rem; color: #475569; flex: 1; min-width: 0; }
    .notif-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .notif-type-chip { border-radius: 20px; padding: 0.1rem 0.5rem; font-size: 0.7rem; font-weight: 600; }
    .notif-type-ncrs { background: #FEE2E2; color: #DC2626; }
    .notif-type-capas { background: #DCFCE7; color: #166534; }
    .notif-type-approvals { background: #DBEAFE; color: #1E40AF; }
    .notif-type-audits { background: #EDE9FE; color: #5B21B6; }
    .notif-type-system { background: #F1F5F9; color: #475569; }
    .notif-time { font-size: 0.75rem; color: #94A3B8; }

    .notif-right { display: flex; align-items: center; gap: 0.375rem; flex-shrink: 0; padding-top: 2px; }
    .unread-dot { width: 8px; height: 8px; border-radius: 50%; background: #2563EB; flex-shrink: 0; }
    .dismiss-btn { color: #94A3B8 !important; padding: 0.125rem 0.25rem; opacity: 0; }
    .notif-row:hover .dismiss-btn { opacity: 1; }
    .btn-xs { padding: 0.125rem 0.375rem; font-size: 0.75rem; }
    .notif-empty { padding: 2rem; text-align: center; color: #94A3B8; font-size: 0.875rem; }
  `],
})
export class NotificationCenterComponent {
  readonly notifStore = inject(NotificationStore);
  readonly router = inject(Router);
  readonly toast = inject(ToastService);

  readonly tabs: NotifTab[] = ['All', 'Approvals', 'NCRs', 'CAPAs', 'Audits', 'System'];
  readonly activeTab = signal<NotifTab>('All');

  readonly allNotifs = signal<AppNotification[]>(NOTIFS).asReadonly()();
  private readonly _notifs = signal<AppNotification[]>(NOTIFS);

  readonly filteredNotifs = computed(() => {
    const tab = this.activeTab();
    if (tab === 'All') return this._notifs();
    return this._notifs().filter(n => n.entityType === tab || n.entityType === tab.slice(0, -1));
  });

  readonly unreadCount = computed(() => this._notifs().filter(n => !n.isRead).length);

  tabCount(tab: NotifTab): number {
    return this._notifs().filter(n => n.entityType === tab || n.entityType === tab.slice(0, -1)).length;
  }

  iconFor(type: string): string {
    return { success: 'bi-check-circle-fill', info: 'bi-info-circle-fill', warning: 'bi-exclamation-triangle-fill', error: 'bi-x-circle-fill' }[type] ?? 'bi-bell-fill';
  }

  actorFor(n: AppNotification): string { return n.title; }

  timeAgo(iso: string): string { return timeAgo(iso); }

  openNotif(n: AppNotification): void {
    this.markRead(n.id);
    if (n.link) this.router.navigate([n.link]);
  }

  markRead(id: string): void {
    this._notifs.update(list => list.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  markAllRead(): void {
    this._notifs.update(list => list.map(n => ({ ...n, isRead: true })));
    this.toast.show('All notifications marked as read', 'success');
  }
}
