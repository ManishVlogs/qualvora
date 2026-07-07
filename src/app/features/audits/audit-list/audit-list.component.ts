import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { Audit } from '../../../shared/interfaces/models';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">

      <div class="page-header">
        <div>
          <h1>Audits</h1>
          <p>{{ filteredAudits().length }} records</p>
        </div>
        <div class="header-actions">
          <span class="chip chip-blue">SCR-051</span>
          <button class="btn btn-outline-secondary btn-sm" [routerLink]="['/audits/program']">
            <i class="bi bi-calendar3 me-1"></i>Program
          </button>
          <button class="btn btn-outline-secondary btn-sm" [routerLink]="['/audits/checklists']">
            <i class="bi bi-ui-checks me-1"></i>Checklists
          </button>
          <button class="btn btn-primary ms-2" [routerLink]="['/audits/new']">
            <i class="bi bi-plus-lg me-1"></i>New Audit
          </button>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="q-card filter-bar mb-3">
        <div class="filter-search">
          <i class="bi bi-search filter-search-icon"></i>
          <input class="filter-input" placeholder="Search audits…" [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)" />
        </div>
        <div class="filter-chips">
          @for (s of statusOptions; track s) {
            <button class="chip-filter" [class.active]="activeStatus() === s" (click)="activeStatus.set(s)">{{ s }}</button>
          }
        </div>
        <div class="filter-chips ms-2">
          @for (t of typeOptions; track t) {
            <button class="chip-filter" [class.active]="activeType() === t" (click)="activeType.set(t)">{{ t }}</button>
          }
        </div>
      </div>

      <!-- Table -->
      <div class="q-card p-0">
        <table class="q-table">
          <thead>
            <tr>
              <th>Audit ID</th>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Auditor</th>
              <th>Scheduled</th>
              <th>Findings</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (audit of filteredAudits(); track audit.id) {
              <tr class="table-row" (click)="router.navigate(['/audits', audit.id])">
                <td><span class="record-id">{{ audit.id }}</span></td>
                <td class="title-cell">{{ audit.title }}</td>
                <td><span class="type-badge type-{{ audit.type.toLowerCase().replace(' ', '-') }}">{{ audit.type }}</span></td>
                <td><span class="status-badge status-{{ audit.status.toLowerCase().replace(' ', '-') }}">{{ audit.status }}</span></td>
                <td>
                  <div class="avatar-name">
                    <div class="avatar-sm" [style.background]="audit.auditorColor">{{ audit.auditorInitials }}</div>
                    <span>{{ audit.auditor }}</span>
                  </div>
                </td>
                <td class="date-cell">{{ audit.scheduledDate | date:'MMM d, y' }}</td>
                <td>
                  <div class="finding-badges">
                    @if (audit.findingCount > 0) {
                      <span class="finding-pill total">{{ audit.findingCount }} total</span>
                    }
                    @if (audit.openFindingCount > 0) {
                      <span class="finding-pill open">{{ audit.openFindingCount }} open</span>
                    }
                    @if (audit.findingCount === 0) {
                      <span class="no-findings">—</span>
                    }
                  </div>
                </td>
                <td class="action-cell">
                  <button class="btn btn-sm btn-outline-secondary" (click)="$event.stopPropagation(); router.navigate(['/audits', audit.id])">
                    View
                  </button>
                </td>
              </tr>
            }
            @empty {
              <tr><td colspan="8" class="empty-row">No audits match the current filters.</td></tr>
            }
          </tbody>
        </table>
      </div>

    </div>
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1280px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.375rem; font-weight: 700; margin: 0 0 0.25rem; }
    .page-header p { font-size: 0.875rem; color: #64748B; margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 0.5rem; }

    .filter-bar { padding: 0.75rem 1rem; display: flex; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
    .filter-search { position: relative; flex: 1; min-width: 200px; }
    .filter-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94A3B8; font-size: 0.875rem; }
    .filter-input { width: 100%; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.375rem 0.75rem 0.375rem 2rem; font-size: 0.875rem; outline: none; &:focus { border-color: #2563EB; } }
    .filter-chips { display: flex; gap: 0.375rem; flex-wrap: wrap; }
    .chip-filter { border: 1px solid #E2E8F0; background: #fff; color: #475569; border-radius: 20px; padding: 0.2rem 0.75rem; font-size: 0.75rem; cursor: pointer; }
    .chip-filter.active { background: #0F172A; color: #fff; border-color: #0F172A; }

    .q-table { width: 100%; border-collapse: collapse; }
    .q-table th { background: #F8FAFC; font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.04em; padding: 0.625rem 1rem; text-align: left; border-bottom: 2px solid #E2E8F0; }
    .q-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #F1F5F9; font-size: 0.875rem; color: #334155; vertical-align: middle; }
    .table-row { cursor: pointer; &:hover td { background: #F8FAFC; } }
    .record-id { font-family: monospace; font-size: 0.8rem; color: #64748B; }
    .title-cell { font-weight: 500; color: #0F172A; max-width: 280px; }
    .date-cell { color: #64748B; white-space: nowrap; }
    .action-cell { text-align: right; }
    .empty-row { text-align: center; padding: 2rem !important; color: #94A3B8; }

    .type-badge { border-radius: 20px; padding: 0.2rem 0.625rem; font-size: 0.75rem; font-weight: 600; }
    .type-process { background: #EDE9FE; color: #5B21B6; }
    .type-system { background: #DBEAFE; color: #1E40AF; }
    .type-internal-quality { background: #DBEAFE; color: #1E40AF; }
    .type-supplier { background: #FEF9C3; color: #713F12; }
    .type-customer { background: #DCFCE7; color: #166534; }
    .type-management-review { background: #FCE7F3; color: #9D174D; }

    .status-badge { border-radius: 20px; padding: 0.2rem 0.625rem; font-size: 0.75rem; font-weight: 600; }
    .status-planned { background: #DBEAFE; color: #1E40AF; }
    .status-in-progress { background: #FEF9C3; color: #713F12; }
    .status-completed { background: #DCFCE7; color: #166534; }
    .status-cancelled { background: #F1F5F9; color: #64748B; }

    .avatar-name { display: flex; align-items: center; gap: 0.5rem; }
    .avatar-sm { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0; }

    .finding-badges { display: flex; gap: 0.25rem; }
    .finding-pill { border-radius: 20px; padding: 0.15rem 0.5rem; font-size: 0.7rem; font-weight: 600; }
    .finding-pill.total { background: #F1F5F9; color: #475569; }
    .finding-pill.open { background: #FEE2E2; color: #DC2626; }
    .no-findings { color: #CBD5E1; }
  `],
})
export class AuditListComponent {
  readonly mock = inject(MockDataService);
  readonly router = inject(Router);

  readonly statusOptions = ['All', 'Planned', 'In Progress', 'Completed', 'Cancelled'];
  readonly typeOptions = ['All Types', 'Internal Quality', 'Process', 'Supplier', 'Customer', 'Management Review'];

  readonly searchTerm = signal('');
  readonly activeStatus = signal('All');
  readonly activeType = signal('All Types');

  readonly filteredAudits = computed(() => {
    const q = this.searchTerm().toLowerCase();
    const status = this.activeStatus();
    const type = this.activeType();
    return this.mock.siteAudits().filter((a: Audit) => {
      if (q && !a.title.toLowerCase().includes(q) && !a.id.toLowerCase().includes(q)) return false;
      if (status !== 'All' && a.status !== status) return false;
      if (type !== 'All Types' && a.type !== type) return false;
      return true;
    });
  });
}
