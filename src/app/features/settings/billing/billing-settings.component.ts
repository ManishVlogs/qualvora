import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/ui/services/toast.service';

interface Invoice { date: string; amount: string; id: string; }

const INVOICES: Invoice[] = [
  { id: 'INV-2026-06', date: '2026-06-01', amount: '$799.00' },
  { id: 'INV-2026-05', date: '2026-05-01', amount: '$799.00' },
  { id: 'INV-2026-04', date: '2026-04-01', amount: '$799.00' },
  { id: 'INV-2026-03', date: '2026-03-01', amount: '$799.00' },
  { id: 'INV-2026-02', date: '2026-02-01', amount: '$799.00' },
];

@Component({
  selector: 'app-billing-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-1">
          <li class="breadcrumb-item text-muted">Settings</li>
          <li class="breadcrumb-item active">Billing & Plan</li>
        </ol>
      </nav>
      <h1 class="page-title">Billing & Plan</h1>
      <p class="page-sub">Your subscription plan, seat usage and payment history</p>
    </div>

    <!-- Plan summary -->
    <div class="card settings-card mb-4">
      <div class="card-body">
        <div class="plan-summary">
          <div class="plan-info">
            <div class="plan-chip">Professional</div>
            <div class="plan-detail text-muted mt-1">
              <i class="bi bi-calendar3 me-1"></i>Next billing: <strong>July 1, 2026</strong>
              &nbsp;·&nbsp;
              <i class="bi bi-credit-card me-1"></i>Visa •••• 4242
            </div>
          </div>
          <button class="btn btn-outline-primary" (click)="showUpgrade.set(true)">
            <i class="bi bi-arrow-up-circle me-1"></i>Upgrade Plan
          </button>
        </div>

        <div class="seats-bar mt-4">
          <div class="d-flex justify-content-between mb-1">
            <span class="fw-semibold text-dark">Seats Used</span>
            <span class="fw-bold">18 / 50</span>
          </div>
          <div class="progress" style="height: 8px">
            <div class="progress-bar bg-primary" style="width:36%"></div>
          </div>
          <div class="form-text">32 seats remaining. <a href="#">Add seats</a></div>
        </div>
      </div>
    </div>

    <!-- Invoice table -->
    <div class="card settings-card">
      <div class="card-body">
        <h6 class="section-label">Invoice History</h6>
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Amount</th>
              <th style="width:120px"></th>
            </tr>
          </thead>
          <tbody>
            @for (inv of invoices; track inv.id) {
              <tr>
                <td class="text-muted small font-monospace">{{ inv.id }}</td>
                <td class="text-muted small">{{ inv.date }}</td>
                <td class="fw-semibold">{{ inv.amount }}</td>
                <td>
                  <button class="btn btn-sm btn-outline-secondary" (click)="downloadInvoice(inv.id)">
                    <i class="bi bi-download me-1"></i>PDF
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Upgrade Modal -->
    @if (showUpgrade()) {
      <div class="modal-backdrop-custom" (click)="showUpgrade.set(false)"></div>
      <div class="modal-custom">
        <div class="modal-header-custom">
          <h6 class="fw-bold mb-0">Upgrade to Enterprise</h6>
          <button class="btn btn-sm btn-outline-secondary" (click)="showUpgrade.set(false)">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body-custom">
          <div class="enterprise-promo">
            <div class="promo-icon"><i class="bi bi-building-check"></i></div>
            <h5>Enterprise Plan</h5>
            <p class="text-muted">Unlimited users, multi-site SSO, SLA guarantee, and a dedicated Customer Success Manager.</p>
            <ul class="promo-list">
              <li><i class="bi bi-check-circle-fill text-success me-2"></i>Unlimited seats</li>
              <li><i class="bi bi-check-circle-fill text-success me-2"></i>SAML / SSO integration</li>
              <li><i class="bi bi-check-circle-fill text-success me-2"></i>99.9% SLA uptime guarantee</li>
              <li><i class="bi bi-check-circle-fill text-success me-2"></i>Dedicated CSM + training</li>
              <li><i class="bi bi-check-circle-fill text-success me-2"></i>Custom data retention policies</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer-custom">
          <button class="btn btn-outline-secondary" (click)="showUpgrade.set(false)">Cancel</button>
          <button class="btn btn-primary" (click)="contactSales()">
            <i class="bi bi-envelope me-1"></i>Contact Sales
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0; }
    .page-sub { font-size: 13px; color: #64748B; margin: 4px 0 0; }
    .breadcrumb { font-size: 13px; }
    .settings-card { border: none; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94A3B8; margin-bottom: 16px; }
    .plan-summary { display: flex; align-items: center; justify-content: space-between; }
    .plan-chip {
      display: inline-block; background: #2563EB; color: #fff;
      font-size: 13px; font-weight: 700; padding: 4px 14px; border-radius: 20px;
    }
    .plan-detail { font-size: 13px; }
    .modal-backdrop-custom { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; }
    .modal-custom {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
      background: #fff; border-radius: 16px; width: 480px; max-width: 95vw;
      z-index: 201; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
    .modal-header-custom { padding: 20px 24px; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; }
    .modal-body-custom { padding: 20px 24px; }
    .modal-footer-custom { padding: 16px 24px; border-top: 1px solid #E2E8F0; display: flex; justify-content: flex-end; gap: 12px; }
    .enterprise-promo { text-align: center; }
    .promo-icon { font-size: 40px; color: #2563EB; margin-bottom: 12px; }
    .promo-list { list-style: none; padding: 0; text-align: left; margin-top: 16px; }
    .promo-list li { padding: 4px 0; font-size: 14px; }
  `]
})
export class BillingSettingsComponent {
  private toast = inject(ToastService);
  readonly showUpgrade = signal(false);
  readonly invoices = INVOICES;

  downloadInvoice(id: string): void {
    this.toast.show(`Downloading ${id}.pdf`, 'info');
  }

  contactSales(): void {
    this.toast.show('Sales team notified — expect a call within 24 hours', 'success');
    this.showUpgrade.set(false);
  }
}
