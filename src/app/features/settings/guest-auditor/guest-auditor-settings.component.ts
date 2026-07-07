import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/ui/services/toast.service';

type CredStatus = 'Active' | 'Expired' | 'Revoked';
interface GuestCred {
  id: string; name: string; email: string; site: string;
  issuedBy: string; issued: string; expiry: string; status: CredStatus;
}

const MOCK_CREDS: GuestCred[] = [
  { id: 'GA001', name: 'Alex Thompson', email: 'alex.t@ext-auditor.com', site: 'Plant-1', issuedBy: 'Maria Chen', issued: '2026-06-10', expiry: '2026-06-24', status: 'Active' },
  { id: 'GA002', name: 'Rachel Torres', email: 'r.torres@cert-body.org', site: 'Plant-2', issuedBy: 'Tom Baker', issued: '2026-05-20', expiry: '2026-06-03', status: 'Expired' },
  { id: 'GA003', name: 'Chris Nguyen', email: 'cng@supplier-audit.com', site: 'Plant-1', issuedBy: 'Maria Chen', issued: '2026-06-01', expiry: '2026-06-15', status: 'Revoked' },
];

const STATUS_CLASS: Record<CredStatus, string> = {
  Active: 'bg-success', Expired: 'bg-secondary', Revoked: 'bg-danger',
};

@Component({
  selector: 'app-guest-auditor-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-1">
          <li class="breadcrumb-item text-muted">Settings</li>
          <li class="breadcrumb-item active">Guest Auditor Access</li>
        </ol>
      </nav>
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h1 class="page-title">Guest Auditor Access</h1>
          <p class="text-muted small mb-0">Issue temporary credentials for external auditors. Max 14-day validity.</p>
        </div>
        <button class="btn btn-primary" (click)="showModal.set(true)">
          <i class="bi bi-person-plus me-1"></i>Issue New Credential
        </button>
      </div>
    </div>

    <div class="card settings-card">
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Site</th>
              <th>Issued By</th>
              <th>Issued</th>
              <th>Expiry</th>
              <th class="text-center">Status</th>
              <th style="width:80px"></th>
            </tr>
          </thead>
          <tbody>
            @for (cred of creds(); track cred.id) {
              <tr>
                <td class="fw-semibold">{{ cred.name }}</td>
                <td class="text-muted small">{{ cred.email }}</td>
                <td>{{ cred.site }}</td>
                <td class="text-muted small">{{ cred.issuedBy }}</td>
                <td class="text-muted small">{{ cred.issued }}</td>
                <td class="text-muted small">{{ cred.expiry }}</td>
                <td class="text-center">
                  <span class="badge" [class]="statusClass(cred.status)">{{ cred.status }}</span>
                </td>
                <td>
                  @if (cred.status === 'Active') {
                    <button class="btn btn-sm btn-outline-danger" (click)="revoke(cred)">
                      Revoke
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Issue Modal -->
    @if (showModal()) {
      <div class="modal-backdrop-custom" (click)="showModal.set(false)"></div>
      <div class="modal-custom">
        <div class="modal-header-custom">
          <h6 class="fw-bold mb-0">Issue Guest Credential</h6>
          <button class="btn btn-sm btn-outline-secondary" (click)="showModal.set(false)">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body-custom">
          <div class="mb-3">
            <label class="form-label">Full Name <span class="req">*</span></label>
            <input class="form-control" [(ngModel)]="formName" placeholder="Guest Auditor Name" />
          </div>
          <div class="mb-3">
            <label class="form-label">Email <span class="req">*</span></label>
            <input class="form-control" type="email" [(ngModel)]="formEmail" />
          </div>
          <div class="mb-3">
            <label class="form-label">Site <span class="req">*</span></label>
            <select class="form-select" [(ngModel)]="formSite">
              <option>Plant-1</option><option>Plant-2</option><option>Plant-3</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Expiry Date <span class="req">*</span></label>
            <input class="form-control" type="date" [(ngModel)]="formExpiry"
              [max]="maxExpiry()" />
            <div class="form-text">Maximum 14 days from today.</div>
          </div>
          <div class="mb-3">
            <label class="form-label">Purpose</label>
            <textarea class="form-control" rows="2" [(ngModel)]="formPurpose"
              placeholder="e.g. Annual IATF surveillance audit"></textarea>
          </div>
        </div>
        <div class="modal-footer-custom">
          <button class="btn btn-outline-secondary" (click)="showModal.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="issueCredential()">
            <i class="bi bi-send me-1"></i>Issue Credential
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { position: relative; display: block; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0; }
    .breadcrumb { font-size: 13px; }
    .settings-card { border: none; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden; }
    .req { color: #EF4444; }
    .modal-backdrop-custom { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; }
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
  `]
})
export class GuestAuditorSettingsComponent {
  private toast = inject(ToastService);

  readonly creds = signal([...MOCK_CREDS]);
  readonly showModal = signal(false);

  formName = '';
  formEmail = '';
  formSite = 'Plant-1';
  formExpiry = '';
  formPurpose = '';

  maxExpiry(): string {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  }

  statusClass(s: CredStatus): string { return STATUS_CLASS[s]; }

  revoke(cred: GuestCred): void {
    this.creds.update(list => list.map(c => c.id === cred.id ? { ...c, status: 'Revoked' } : c));
    this.toast.show(`Credential for ${cred.name} revoked`, 'warning');
  }

  issueCredential(): void {
    const newCred: GuestCred = {
      id: 'GA' + Date.now(), name: this.formName, email: this.formEmail,
      site: this.formSite, issuedBy: 'Maria Chen', issued: '2026-06-13',
      expiry: this.formExpiry, status: 'Active',
    };
    this.creds.update(list => [newCred, ...list]);
    this.toast.show(`Credential issued to ${this.formName}`, 'success');
    this.showModal.set(false);
    this.formName = ''; this.formEmail = ''; this.formExpiry = ''; this.formPurpose = '';
  }
}
