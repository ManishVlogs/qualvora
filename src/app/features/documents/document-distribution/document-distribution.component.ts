import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { AuthStore } from '../../../core/auth/stores/auth.store';

interface DistUser { id: string; name: string; role: string; initials: string; color: string; selected: boolean; }

@Component({
  selector: 'app-document-distribution',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <button class="back-btn" title="Return to the document detail page"
              (click)="router.navigate(['/documents', docId])">
        <i class="bi bi-arrow-left me-1"></i> Back to Document
      </button>

      <div class="page-header">
        <h1 class="page-title">Distribution Manager</h1>
        <div class="doc-ref">
          <span class="record-id">{{ docId }}</span>
          <span class="ms-2 text-muted">{{ docTitle() }} · Rev {{ docRevision() }}</span>
        </div>
      </div>

      <div class="dist-grid">
        <!-- Left: Audience form -->
        <div class="q-card form-card">
          <div class="form-card-header">Audience Selection</div>

          <!-- Role checkboxes -->
          <div class="form-section-inner">
            <div class="field-label"
                 title="Select an entire job-role group — all users in that role at this site will be added">
              By Role
            </div>
            <div class="role-checks">
              @for (r of roles; track r.name) {
                <label class="role-check-item" [class.selected]="r.selected"
                       [title]="'Select all ' + r.name + ' at this site (' + r.count + ' users)'">
                  <input type="checkbox" [(ngModel)]="r.selected" (change)="syncRoleUsers(r)" />
                  <div class="role-check-content">
                    <span class="role-name">{{ r.name }}</span>
                    <span class="role-count">{{ r.count }} users</span>
                  </div>
                </label>
              }
            </div>
          </div>

          <div class="form-divider"></div>

          <!-- Named users -->
          <div class="form-section-inner">
            <div class="field-label">Named Users</div>
            <div class="user-search">
              <i class="bi bi-search search-icon"></i>
              <input class="user-search-input" placeholder="Search users…" [(ngModel)]="userSearch" />
            </div>
            <div class="user-list">
              @for (u of filteredUsers(); track u.id) {
                <label class="user-item" [class.selected]="u.selected">
                  <div class="user-av" [style.background]="u.color">{{ u.initials }}</div>
                  <div class="user-info">
                    <span class="user-name">{{ u.name }}</span>
                    <span class="user-role">{{ u.role }}</span>
                  </div>
                  <input type="checkbox" class="user-check" [(ngModel)]="u.selected" />
                </label>
              }
            </div>
          </div>

          <div class="form-divider"></div>

          <!-- Options -->
          <div class="form-section-inner">
            <div class="field-label">Options</div>
            <label class="toggle-row"
                   title="When on, each recipient must open the document and click 'Acknowledge' — tracked in the Distribution & Receipts tab">
              <div class="toggle-wrap">
                <input type="checkbox" class="toggle-input" [(ngModel)]="ackRequired" />
                <span class="toggle-slider"></span>
              </div>
              <span>Acknowledgment Required</span>
            </label>
            @if (ackRequired) {
              <div class="mt-2">
                <label class="field-label-sm">Acknowledgment Due Date</label>
                <input type="date" class="form-control form-control-sm due-date-input" [(ngModel)]="dueDate" />
              </div>
            }
          </div>
        </div>

        <!-- Right: Preview -->
        <div class="q-card preview-card">
          <div class="preview-header">
            <span class="preview-title">Distribution Preview</span>
            <span class="recipient-count-badge">{{ selectedUsers().length }} recipients</span>
          </div>

          @if (selectedUsers().length === 0) {
            <div class="empty-preview">
              <i class="bi bi-people empty-icon"></i>
              <p>No recipients selected. Use the audience form to add users.</p>
            </div>
          } @else {
            <div class="preview-list">
              @for (u of selectedUsers(); track u.id) {
                <div class="preview-row">
                  <div class="user-av" [style.background]="u.color">{{ u.initials }}</div>
                  <div class="user-info">
                    <span class="user-name">{{ u.name }}</span>
                    <span class="user-role">{{ u.role }}</span>
                  </div>
                  @if (ackRequired) {
                    <span class="ack-badge"><i class="bi bi-clock me-1"></i>Ack required</span>
                  }
                </div>
              }
            </div>

            <div class="preview-summary">
              <div class="summary-row">
                <span class="summary-label">Total Recipients</span>
                <span class="summary-val">{{ selectedUsers().length }}</span>
              </div>
              @if (ackRequired && dueDate) {
                <div class="summary-row">
                  <span class="summary-label">Ack Due</span>
                  <span class="summary-val">{{ dueDate }}</span>
                </div>
              }
            </div>

            <div class="send-footer">
              <button class="btn btn-primary send-btn"
                      [title]="'Send this document to ' + selectedUsers().length + ' recipients' + (ackRequired ? ' — they will be asked to acknowledge receipt by ' + dueDate : '')"
                      (click)="sendDistribution()">
                <i class="bi bi-send me-2"></i>
                Send Distribution to {{ selectedUsers().length }} recipients
              </button>
            </div>
          }
        </div>
      </div>
    </div>

    @if (toast()) {
      <div class="action-toast"><i class="bi bi-check-circle-fill me-2"></i>{{ toast() }}</div>
    }
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .back-btn { background: none; border: none; font-size: 0.8125rem; color: #64748B; cursor: pointer; padding: 0 0 0.625rem; display: flex; align-items: center; &:hover { color: #2563EB; } }
    .page-header { margin-bottom: 1.25rem; }
    .page-title { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0 0 0.25rem; }
    .doc-ref { font-size: 0.875rem; display: flex; align-items: center; gap: 0.375rem; }
    .text-muted { color: #64748B; }

    .dist-grid { display: grid; grid-template-columns: 380px 1fr; gap: 1rem; }

    .form-card { overflow: hidden; }
    .form-card-header { padding: 0.875rem 1.25rem; font-weight: 700; font-size: 0.9375rem; color: #0F172A; border-bottom: 1px solid #F1F5F9; }
    .form-section-inner { padding: 1rem 1.25rem; }
    .field-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94A3B8; margin-bottom: 0.625rem; }
    .field-label-sm { font-size: 0.8125rem; font-weight: 600; color: #334155; display: block; margin-bottom: 0.25rem; }
    .form-divider { height: 1px; background: #F1F5F9; }

    .role-checks { display: flex; flex-direction: column; gap: 0.375rem; }
    .role-check-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1.5px solid #E2E8F0; cursor: pointer; transition: border-color 150ms; input { margin: 0; } &.selected { border-color: #2563EB; background: #EFF6FF; } }
    .role-check-content { display: flex; justify-content: space-between; flex: 1; }
    .role-name { font-size: 0.875rem; font-weight: 500; color: #0F172A; }
    .role-count { font-size: 0.8125rem; color: #94A3B8; }

    .user-search { position: relative; margin-bottom: 0.625rem; }
    .search-icon { position: absolute; left: 0.625rem; top: 50%; transform: translateY(-50%); color: #94A3B8; font-size: 0.875rem; pointer-events: none; }
    .user-search-input { width: 100%; padding: 0.375rem 0.75rem 0.375rem 2rem; border: 1.5px solid #E2E8F0; border-radius: 6px; font-size: 0.8125rem; outline: none; &:focus { border-color: #2563EB; } }
    .user-list { max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
    .user-item { display: flex; align-items: center; gap: 0.625rem; padding: 0.375rem 0.5rem; border-radius: 6px; cursor: pointer; transition: background 120ms; &:hover { background: #F8FAFC; } &.selected { background: #EFF6FF; } }
    .user-av { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .user-info { flex: 1; }
    .user-name { font-size: 0.875rem; font-weight: 500; color: #0F172A; display: block; }
    .user-role { font-size: 0.75rem; color: #94A3B8; }
    .user-check { flex-shrink: 0; }

    .toggle-row { display: flex; align-items: center; gap: 0.625rem; font-size: 0.875rem; color: #475569; cursor: pointer; }
    .toggle-wrap { position: relative; width: 36px; height: 20px; flex-shrink: 0; }
    .toggle-input { opacity: 0; width: 0; height: 0; position: absolute; }
    .toggle-slider { position: absolute; inset: 0; background: #E2E8F0; border-radius: 10px; transition: 200ms; cursor: pointer; &::before { content: ''; position: absolute; width: 14px; height: 14px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: 200ms; } }
    .toggle-input:checked + .toggle-slider { background: #2563EB; }
    .toggle-input:checked + .toggle-slider::before { transform: translateX(16px); }
    .due-date-input { font-size: 0.8125rem; }

    /* Preview */
    .preview-card { overflow: hidden; display: flex; flex-direction: column; }
    .preview-header { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1.25rem; border-bottom: 1px solid #F1F5F9; }
    .preview-title { font-weight: 700; font-size: 0.9375rem; color: #0F172A; }
    .recipient-count-badge { background: #EFF6FF; color: #2563EB; border-radius: 20px; padding: 2px 10px; font-size: 0.8125rem; font-weight: 700; }
    .empty-preview { padding: 3rem; text-align: center; color: #94A3B8; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
    .empty-icon { font-size: 2.5rem; color: #CBD5E1; }
    .empty-preview p { font-size: 0.875rem; margin: 0; }
    .preview-list { flex: 1; overflow-y: auto; padding: 0.75rem 1.25rem; display: flex; flex-direction: column; gap: 4px; max-height: 360px; }
    .preview-row { display: flex; align-items: center; gap: 0.625rem; padding: 0.375rem 0; }
    .ack-badge { background: #FEF3C7; color: #92400E; border-radius: 4px; padding: 2px 6px; font-size: 11px; font-weight: 500; margin-left: auto; display: flex; align-items: center; }
    .preview-summary { padding: 0.75rem 1.25rem; border-top: 1px solid #F1F5F9; }
    .summary-row { display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.25rem; }
    .summary-label { color: #64748B; }
    .summary-val { font-weight: 600; color: #0F172A; }
    .send-footer { padding: 1rem 1.25rem; border-top: 1px solid #F1F5F9; }
    .send-btn { width: 100%; font-weight: 600; }

    .action-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: #0F172A; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; z-index: 400; box-shadow: 0 4px 20px rgba(0,0,0,0.2); display: flex; align-items: center; }
  `]
})
export class DocumentDistributionComponent {
  readonly router = inject(Router);
  private readonly mock = inject(MockDataService);
  private readonly auth = inject(AuthStore);
  readonly docId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? 'DOC-0048';

  userSearch = '';
  ackRequired = true;
  dueDate = '2026-06-27';
  readonly toast = signal('');

  // Dynamic document details
  private readonly doc = computed(() => this.mock.documents().find(d => d.id === this.docId));
  readonly docTitle = computed(() => this.doc()?.title ?? 'Document');
  readonly docRevision = computed(() => this.doc()?.revision ?? 'A');

  // Site-aware user list — Directors see all users, others see only their site
  readonly allUsers: DistUser[] = this._buildSiteUserList();

  private _buildSiteUserList(): DistUser[] {
    const siteId = this.auth.currentUser()?.siteId;
    const isDirector = this.auth.hasRole('Director');
    const source = isDirector
      ? this.mock.users
      : this.mock.users.filter(u => u.siteId === siteId);
    return source.map((u, i) => ({
      id: u.id,
      name: u.fullName,
      role: u.role,
      initials: u.initials,
      color: u.avatarColor ?? '#64748B',
      selected: i < 2,
    }));
  }

  // Role counts derived from the actual user list
  readonly roles = this._buildRoles();

  private _buildRoles(): { name: string; count: number; selected: boolean }[] {
    const users = this.allUsers;
    return [
      { name: 'Operators', count: users.filter(u => u.role === 'Operator' || u.role === 'QT').length, selected: false },
      { name: 'Quality Engineers', count: users.filter(u => u.role === 'QE' || u.role === 'ME').length, selected: false },
      { name: 'Supervisors', count: users.filter(u => u.role === 'QS' || u.role === 'Supervisor').length, selected: false },
      { name: 'Quality Managers', count: users.filter(u => u.role === 'QM' || u.role === 'PM').length, selected: false },
    ];
  }

  filteredUsers(): DistUser[] {
    const q = this.userSearch.toLowerCase();
    if (!q) return this.allUsers;
    return this.allUsers.filter(u => u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  }

  selectedUsers(): DistUser[] { return this.allUsers.filter(u => u.selected); }

  syncRoleUsers(role: { name: string; selected: boolean }): void {
    const roleMap: Record<string, string[]> = {
      'Operators': ['Operator', 'QT'],
      'Quality Engineers': ['QE', 'ME'],
      'Supervisors': ['QS', 'Supervisor'],
      'Quality Managers': ['QM', 'PM'],
    };
    const codes = roleMap[role.name] ?? [];
    this.allUsers.filter(u => codes.includes(u.role)).forEach(u => u.selected = role.selected);
  }

  sendDistribution(): void {
    const count = this.selectedUsers().length;
    this.toast.set(`Distribution sent to ${count} recipients`);
    setTimeout(() => { this.toast.set(''); this.router.navigate(['/documents', this.docId]); }, 2500);
  }
}
