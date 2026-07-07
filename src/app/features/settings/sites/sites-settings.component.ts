import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/ui/services/toast.service';

interface Site {
  id: string; name: string; timezone: string; shifts: number;
  status: 'Active' | 'Inactive'; address: string;
}

const MOCK_SITES: Site[] = [
  { id: 'S001', name: 'Plant-1 Detroit', timezone: 'America/New_York', shifts: 3, status: 'Active', address: '1200 Quality Blvd, Detroit, MI 48201' },
  { id: 'S002', name: 'Plant-2 Toledo', timezone: 'America/New_York', shifts: 2, status: 'Active', address: '890 Manufacturing Ave, Toledo, OH 43601' },
  { id: 'S003', name: 'Plant-3 Lansing', timezone: 'America/New_York', shifts: 1, status: 'Inactive', address: '450 Industrial Dr, Lansing, MI 48906' },
];

@Component({
  selector: 'app-sites-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-1">
          <li class="breadcrumb-item text-muted">Settings</li>
          <li class="breadcrumb-item active">Sites</li>
        </ol>
      </nav>
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h1 class="page-title">Sites</h1>
          <p class="page-sub">Physical locations and facilities in your organisation</p>
        </div>
        <button class="btn btn-primary" (click)="openSlideOver(null)">
          <i class="bi bi-plus me-1"></i>Add Site
        </button>
      </div>
    </div>

    <div class="card settings-card">
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Site Name</th>
              <th>Address</th>
              <th>Timezone</th>
              <th class="text-center">Shifts</th>
              <th class="text-center">Status</th>
              <th style="width:48px"></th>
            </tr>
          </thead>
          <tbody>
            @for (site of sites(); track site.id) {
              <tr style="cursor:pointer" (click)="openSlideOver(site)">
                <td class="fw-semibold">{{ site.name }}</td>
                <td class="text-muted small">{{ site.address }}</td>
                <td class="text-muted small">{{ site.timezone }}</td>
                <td class="text-center">{{ site.shifts }}</td>
                <td class="text-center">
                  <span class="badge" [class.bg-success]="site.status === 'Active'"
                    [class.bg-secondary]="site.status !== 'Active'">
                    {{ site.status }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-outline-secondary"
                    (click)="$event.stopPropagation(); openSlideOver(site)">
                    <i class="bi bi-pencil"></i>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Slide-over -->
    @if (slideOverOpen()) {
      <div class="overlay" (click)="closeSlideOver()"></div>
      <div class="slide-over">
        <div class="slide-over-header">
          <h6 class="mb-0 fw-bold">{{ editingSite() ? 'Edit Site' : 'Add Site' }}</h6>
          <button class="btn btn-sm btn-outline-secondary" (click)="closeSlideOver()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="slide-over-body">
          <div class="mb-3">
            <label class="form-label">Site Name <span class="req">*</span></label>
            <input class="form-control" [(ngModel)]="formName" />
          </div>
          <div class="mb-3">
            <label class="form-label">Address</label>
            <input class="form-control" [(ngModel)]="formAddress" />
          </div>
          <div class="mb-3">
            <label class="form-label">Timezone</label>
            <select class="form-select" [(ngModel)]="formTimezone">
              <option>America/New_York</option><option>America/Chicago</option>
              <option>America/Los_Angeles</option><option>Europe/London</option>
              <option>Europe/Berlin</option><option>Asia/Tokyo</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Number of Shifts</label>
            <select class="form-select" [(ngModel)]="formShifts">
              <option [value]="1">1</option>
              <option [value]="2">2</option>
              <option [value]="3">3</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Status</label>
            <select class="form-select" [(ngModel)]="formStatus">
              <option>Active</option><option>Inactive</option>
            </select>
          </div>
        </div>
        <div class="slide-over-footer">
          <button class="btn btn-outline-secondary" (click)="closeSlideOver()">Cancel</button>
          <button class="btn btn-primary" (click)="saveSite()">
            <i class="bi bi-check-lg me-1"></i>Save Site
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
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 100;
    }
    .slide-over {
      position: fixed; right: 0; top: 0; bottom: 0; width: 400px;
      background: #fff; z-index: 101; display: flex; flex-direction: column;
      box-shadow: -4px 0 24px rgba(0,0,0,0.12);
    }
    .slide-over-header {
      padding: 20px; border-bottom: 1px solid #E2E8F0;
      display: flex; justify-content: space-between; align-items: center;
    }
    .slide-over-body { padding: 20px; flex: 1; overflow-y: auto; }
    .slide-over-footer {
      padding: 16px 20px; border-top: 1px solid #E2E8F0;
      display: flex; gap: 12px; justify-content: flex-end;
    }
  `]
})
export class SitesSettingsComponent {
  private toast = inject(ToastService);

  readonly sites = signal([...MOCK_SITES]);
  readonly slideOverOpen = signal(false);
  readonly editingSite = signal<Site | null>(null);

  formName = '';
  formAddress = '';
  formTimezone = 'America/New_York';
  formShifts: number = 2;
  formStatus: 'Active' | 'Inactive' = 'Active';

  openSlideOver(site: Site | null): void {
    this.editingSite.set(site);
    if (site) {
      this.formName = site.name;
      this.formAddress = site.address;
      this.formTimezone = site.timezone;
      this.formShifts = site.shifts;
      this.formStatus = site.status;
    } else {
      this.formName = ''; this.formAddress = '';
      this.formTimezone = 'America/New_York';
      this.formShifts = 2; this.formStatus = 'Active';
    }
    this.slideOverOpen.set(true);
  }

  closeSlideOver(): void { this.slideOverOpen.set(false); }

  saveSite(): void {
    const es = this.editingSite();
    if (es) {
      this.sites.update(list => list.map(s => s.id === es.id
        ? { ...s, name: this.formName, address: this.formAddress, timezone: this.formTimezone, shifts: this.formShifts, status: this.formStatus }
        : s));
      this.toast.show('Site updated', 'success');
    } else {
      const newSite: Site = {
        id: 'S' + Date.now(), name: this.formName, address: this.formAddress,
        timezone: this.formTimezone, shifts: this.formShifts, status: this.formStatus,
      };
      this.sites.update(list => [...list, newSite]);
      this.toast.show('Site added', 'success');
    }
    this.closeSlideOver();
  }
}
