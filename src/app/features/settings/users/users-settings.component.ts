import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/ui/services/toast.service';

type ViewMode = 'list' | 'matrix';

interface User {
  id: string; name: string; email: string; role: string;
  site: string; lastLogin: string; status: 'Active' | 'Inactive';
}

const MOCK_USERS: User[] = [
  { id: 'U1', name: 'Maria Chen', email: 'mchen@acme.com', role: 'Quality Manager', site: 'Plant-1', lastLogin: '2026-06-13', status: 'Active' },
  { id: 'U2', name: 'James Rodriguez', email: 'jrod@acme.com', role: 'Quality Engineer', site: 'Plant-1', lastLogin: '2026-06-12', status: 'Active' },
  { id: 'U3', name: 'Sandra Kim', email: 'skim@acme.com', role: 'Supervisor', site: 'Plant-2', lastLogin: '2026-06-11', status: 'Active' },
  { id: 'U4', name: 'David Okonkwo', email: 'dokonkwo@acme.com', role: 'Director', site: 'Plant-1', lastLogin: '2026-06-10', status: 'Active' },
  { id: 'U5', name: 'Lisa Wang', email: 'lwang@acme.com', role: 'Quality Engineer', site: 'Plant-3', lastLogin: '2026-05-28', status: 'Inactive' },
  { id: 'U6', name: 'Tom Baker', email: 'tbaker@acme.com', role: 'Auditor', site: 'Plant-2', lastLogin: '2026-06-09', status: 'Active' },
];
const SITES = ['Plant-1', 'Plant-2', 'Plant-3'];
const ROLES = ['Quality Manager','Quality Engineer','Supervisor','Director','Auditor','Guest'];

@Component({
  selector: 'app-users-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-1">
          <li class="breadcrumb-item text-muted">Settings</li>
          <li class="breadcrumb-item active">Users & Roles</li>
        </ol>
      </nav>
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h1 class="page-title">Users & Roles</h1>
          <p class="page-sub">Manage team members, permissions and role assignments</p>
        </div>
        <div class="d-flex gap-2">
          <div class="view-toggle">
            <button class="toggle-btn" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')">
              <i class="bi bi-list-ul me-1"></i>List
            </button>
            <button class="toggle-btn" [class.active]="viewMode() === 'matrix'" (click)="viewMode.set('matrix')">
              <i class="bi bi-grid me-1"></i>Matrix
            </button>
          </div>
          <button class="btn btn-primary" (click)="showInviteModal.set(true)">
            <i class="bi bi-person-plus me-1"></i>Invite User
          </button>
        </div>
      </div>
    </div>

    @if (viewMode() === 'list') {
      <div class="card settings-card">
        <div class="card-body p-0">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role / Site</th>
                <th>Last Login</th>
                <th class="text-center">Status</th>
                <th style="width:100px"></th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div class="user-avatar">{{ user.name.charAt(0) }}</div>
                      <span class="fw-semibold">{{ user.name }}</span>
                    </div>
                  </td>
                  <td class="text-muted small">{{ user.email }}</td>
                  <td>
                    <span class="badge bg-light text-dark border me-1">{{ user.role }}</span>
                    <span class="text-muted small">{{ user.site }}</span>
                  </td>
                  <td class="text-muted small">{{ user.lastLogin }}</td>
                  <td class="text-center">
                    <span class="badge" [class.bg-success]="user.status === 'Active'"
                      [class.bg-secondary]="user.status !== 'Active'">
                      {{ user.status }}
                    </span>
                  </td>
                  <td>
                    @if (user.status === 'Active') {
                      <button class="btn btn-sm btn-outline-danger"
                        (click)="deactivateUser(user)">
                        Deactivate
                      </button>
                    } @else {
                      <button class="btn btn-sm btn-outline-success"
                        (click)="reactivateUser(user)">
                        Reactivate
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    } @else {
      <!-- MATRIX VIEW -->
      <div class="card settings-card">
        <div class="card-body p-0">
          <table class="table table-bordered mb-0">
            <thead class="table-light">
              <tr>
                <th>User</th>
                @for (site of sites; track site) {
                  <th class="text-center">{{ site }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div class="user-avatar">{{ user.name.charAt(0) }}</div>
                      <div>
                        <div class="fw-semibold small">{{ user.name }}</div>
                        <div class="text-muted" style="font-size:11px">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  @for (site of sites; track site) {
                    <td class="text-center">
                      @if (user.site === site) {
                        <select class="form-select form-select-sm matrix-select"
                          [(ngModel)]="user.role">
                          @for (r of roles; track r) {
                            <option [value]="r">{{ r }}</option>
                          }
                        </select>
                      } @else {
                        <span class="text-muted">—</span>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- INVITE MODAL -->
    @if (showInviteModal()) {
      <div class="modal-backdrop-custom" (click)="showInviteModal.set(false)"></div>
      <div class="modal-custom">
        <div class="modal-header-custom">
          <h6 class="fw-bold mb-0">Invite User</h6>
          <button class="btn btn-sm btn-outline-secondary" (click)="showInviteModal.set(false)">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body-custom">
          <div class="mb-3">
            <label class="form-label">Email <span class="req">*</span></label>
            <input class="form-control" type="email" [(ngModel)]="inviteEmail"
              placeholder="colleague@company.com" />
          </div>
          <div class="mb-3">
            <label class="form-label">Role <span class="req">*</span></label>
            <select class="form-select" [(ngModel)]="inviteRole">
              @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Site <span class="req">*</span></label>
            <select class="form-select" [(ngModel)]="inviteSite">
              @for (s of sites; track s) { <option [value]="s">{{ s }}</option> }
            </select>
          </div>
        </div>
        <div class="modal-footer-custom">
          <button class="btn btn-outline-secondary" (click)="showInviteModal.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="sendInvite()">
            <i class="bi bi-envelope me-1"></i>Send Invite
          </button>
        </div>
      </div>
    }

    <!-- DEACTIVATE MODAL -->
    @if (deactivatingUser()) {
      <div class="modal-backdrop-custom" (click)="deactivatingUser.set(null)"></div>
      <div class="modal-custom">
        <div class="modal-header-custom">
          <h6 class="fw-bold mb-0">Deactivate {{ deactivatingUser()!.name }}</h6>
          <button class="btn btn-sm btn-outline-secondary" (click)="deactivatingUser.set(null)">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body-custom">
          <p class="text-muted">This user has open work items. Reassign before deactivating.</p>
          <div class="open-items-list mb-3">
            <div class="open-item"><i class="bi bi-file-text me-2 text-danger"></i>NCR-2026-0147 — Supplier part dimension</div>
            <div class="open-item"><i class="bi bi-clipboard-check me-2 text-warning"></i>CAPA-2026-031 — Root cause investigation</div>
          </div>
          <label class="form-label">Reassign to</label>
          <select class="form-select" [(ngModel)]="reassignTo">
            @for (u of otherUsers(); track u.id) {
              <option [value]="u.id">{{ u.name }} ({{ u.role }})</option>
            }
          </select>
        </div>
        <div class="modal-footer-custom">
          <button class="btn btn-outline-secondary" (click)="deactivatingUser.set(null)">Cancel</button>
          <button class="btn btn-danger" (click)="confirmDeactivate()">
            <i class="bi bi-person-x me-1"></i>Deactivate User
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { position: relative; display: block; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0; }
    .page-sub { font-size: 13px; color: #64748B; margin: 4px 0 0; }
    .breadcrumb { font-size: 13px; }
    .settings-card { border: none; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
    .req { color: #EF4444; }
    .view-toggle { display: flex; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; }
    .toggle-btn {
      padding: 7px 14px; font-size: 13px; border: none; background: #fff; cursor: pointer;
      color: #64748B;
    }
    .toggle-btn.active { background: #EFF6FF; color: #2563EB; font-weight: 600; }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: #2563EB;
      color: #fff; font-size: 13px; font-weight: 600;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .matrix-select { min-width: 120px; font-size: 12px; }
    .modal-backdrop-custom {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200;
    }
    .modal-custom {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      background: #fff; border-radius: 16px; width: 480px; max-width: 95vw;
      z-index: 201; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
    .modal-header-custom {
      padding: 20px 24px; border-bottom: 1px solid #E2E8F0;
      display: flex; justify-content: space-between; align-items: center;
    }
    .modal-body-custom { padding: 20px 24px; }
    .modal-footer-custom {
      padding: 16px 24px; border-top: 1px solid #E2E8F0;
      display: flex; justify-content: flex-end; gap: 12px;
    }
    .open-items-list { background: #FFF7ED; border-radius: 8px; padding: 12px; }
    .open-item { font-size: 13px; color: #1E293B; padding: 4px 0; }
  `]
})
export class UsersSettingsComponent {
  private toast = inject(ToastService);

  readonly users = signal([...MOCK_USERS]);
  readonly viewMode = signal<ViewMode>('list');
  readonly showInviteModal = signal(false);
  readonly deactivatingUser = signal<User | null>(null);

  sites = SITES;
  roles = ROLES;
  inviteEmail = '';
  inviteRole = 'Quality Engineer';
  inviteSite = 'Plant-1';
  reassignTo = 'U2';

  readonly otherUsers = computed(() =>
    this.users().filter(u => u.id !== this.deactivatingUser()?.id && u.status === 'Active')
  );

  sendInvite(): void {
    this.toast.show(`Invite sent to ${this.inviteEmail}`, 'success');
    this.inviteEmail = '';
    this.showInviteModal.set(false);
  }

  deactivateUser(user: User): void {
    this.deactivatingUser.set(user);
    this.reassignTo = this.users().find(u => u.id !== user.id && u.status === 'Active')?.id ?? '';
  }

  confirmDeactivate(): void {
    const user = this.deactivatingUser();
    if (user) {
      this.users.update(list => list.map(u => u.id === user.id ? { ...u, status: 'Inactive' } : u));
      this.toast.show(`${user.name} deactivated`, 'info');
    }
    this.deactivatingUser.set(null);
  }

  reactivateUser(user: User): void {
    this.users.update(list => list.map(u => u.id === user.id ? { ...u, status: 'Active' } : u));
    this.toast.show(`${user.name} reactivated`, 'success');
  }
}
