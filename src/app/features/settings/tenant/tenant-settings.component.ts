import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/ui/services/toast.service';

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-1">
          <li class="breadcrumb-item text-muted">Settings</li>
          <li class="breadcrumb-item active">Tenant Profile</li>
        </ol>
      </nav>
      <h1 class="page-title">Tenant Profile</h1>
      <p class="page-sub">Your organisation's name, logo, subdomain and regional settings</p>
    </div>

    <div class="card settings-card">
      <div class="card-body">
        <h6 class="section-label">Company Information</h6>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Company Name <span class="req">*</span></label>
            <input class="form-control" [(ngModel)]="companyName" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Industry</label>
            <select class="form-select" [(ngModel)]="industry">
              <option>Automotive</option><option>Aerospace</option>
              <option>Medical Devices</option><option>Electronics</option>
              <option>Defense</option><option>Industrial Equipment</option>
            </select>
          </div>
          <div class="col-12">
            <label class="form-label">Logo</label>
            <div class="logo-zone" (click)="logoClick()">
              @if (logoSet()) {
                <div class="logo-preview">
                  <div class="logo-swatch">AC</div>
                  <div>
                    <div class="fw-semibold text-dark">company-logo.png</div>
                    <div class="text-muted small">Click to change</div>
                  </div>
                </div>
              } @else {
                <i class="bi bi-cloud-upload fs-3 text-muted"></i>
                <p class="text-muted mb-0 mt-2">Drop logo here or <span class="text-primary">browse</span></p>
                <small class="text-muted">PNG, SVG · Max 2MB</small>
              }
            </div>
          </div>
        </div>

        <hr class="my-4" />
        <h6 class="section-label">Workspace</h6>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Subdomain</label>
            <div class="input-group">
              <input class="form-control" [value]="subdomain" readonly
                style="background:#F8FAFC; cursor:not-allowed" />
              <span class="input-group-text">.qualvora.com</span>
            </div>
            <div class="form-text">Contact support to change your subdomain.</div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Region</label>
            <select class="form-select" [(ngModel)]="region">
              <option>US — Virginia</option>
              <option>EU — Frankfurt</option>
              <option>APAC — Singapore</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Default Timezone</label>
            <select class="form-select" [(ngModel)]="timezone">
              <option>America/New_York</option><option>America/Chicago</option>
              <option>America/Los_Angeles</option><option>Europe/London</option>
              <option>Europe/Berlin</option><option>Asia/Tokyo</option>
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Date Format</label>
            <select class="form-select" [(ngModel)]="dateFormat">
              <option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        <div class="mt-4 d-flex align-items-center gap-3">
          <button class="btn btn-primary" (click)="save()">
            <i class="bi bi-check-lg me-1"></i>Save Changes
          </button>
          @if (saved()) {
            <span class="text-success fw-semibold">
              <i class="bi bi-check-circle-fill me-1"></i>Saved
            </span>
          }
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
    .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94A3B8; margin-bottom: 16px; }
    .req { color: #EF4444; }
    .logo-zone {
      border: 2px dashed #CBD5E1; border-radius: 10px; padding: 24px;
      text-align: center; cursor: pointer; background: #F8FAFC;
      transition: border-color 0.2s;
    }
    .logo-zone:hover { border-color: #2563EB; }
    .logo-preview { display: flex; align-items: center; gap: 16px; justify-content: center; }
    .logo-swatch {
      width: 56px; height: 56px; border-radius: 12px; background: #2563EB;
      color: #fff; font-size: 18px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
  `]
})
export class TenantSettingsComponent {
  private toast = inject(ToastService);

  companyName = 'Acme Manufacturing Co.';
  industry = 'Automotive';
  subdomain = 'acme';
  region = 'US — Virginia';
  timezone = 'America/New_York';
  dateFormat = 'MM/DD/YYYY';
  readonly logoSet = signal(true);
  readonly saved = signal(false);

  logoClick(): void { this.logoSet.update(v => !v); }

  save(): void {
    this.saved.set(true);
    this.toast.show('Tenant profile saved', 'success');
    setTimeout(() => this.saved.set(false), 3000);
  }
}
