import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../shared/services/mock-data.service';
import { CustomerComplaint } from '../../shared/interfaces/models';

@Component({
  selector: 'app-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Customer Complaints</h1>
          <p class="page-sub">{{ mock.complaints().length }} complaints across all customers</p>
        </div>
        <button class="btn btn-primary new-btn" (click)="slideOverOpen.set(!slideOverOpen())">
          <i class="bi bi-plus-lg me-1"></i> New Complaint
        </button>
      </div>

      <div class="split-layout" [class.slide-open]="slideOverOpen()">

        <!-- Left: Complaints table -->
        <div class="q-card table-card">
          <div class="table-meta">
            <span class="result-count">{{ mock.complaints().length }} records</span>
          </div>
          <div class="table-scroll">
            <table class="q-table comp-table">
              <thead>
                <tr>
                  <th style="width:130px">ID</th>
                  <th style="width:150px">Customer</th>
                  <th style="width:140px">Reference #</th>
                  <th style="width:110px">Received</th>
                  <th style="width:110px">Due</th>
                  <th style="width:130px">NCR Link</th>
                  <th style="width:120px">Status</th>
                </tr>
              </thead>
              <tbody>
                @for (c of mock.complaints(); track c.id) {
                  <tr class="comp-row" (click)="selectedComplaint.set(c)">
                    <td><span class="record-id">{{ c.id }}</span></td>
                    <td>
                      <div class="customer-cell">
                        <span class="cust-avatar">{{ c.customer[0] }}</span>
                        <span class="cust-name">{{ c.customer }}</span>
                      </div>
                    </td>
                    <td class="ref-cell">{{ c.customerRef }}</td>
                    <td class="text-muted-sm">{{ c.receivedDate }}</td>
                    <td>
                      <span class="{{ dueClass(c) }}">{{ c.dueDate }}</span>
                    </td>
                    <td>
                      @if (c.ncrId) {
                        <button class="ncr-link" (click)="$event.stopPropagation(); router.navigate(['/ncrs', c.ncrId])">
                          <span class="record-id-sm">{{ c.ncrId }}</span>
                          <i class="bi bi-arrow-right ms-1"></i>
                        </button>
                      } @else { <span class="text-muted-sm">—</span> }
                    </td>
                    <td><span class="chip chip-sm {{ statusClass(c.status) }}">{{ c.status }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right: Slide-over form -->
        <div class="slide-over" [class.open]="slideOverOpen()">
          <div class="so-header">
            <h2 class="so-title">New Complaint</h2>
            <button class="so-close" (click)="slideOverOpen.set(false)">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="so-body">

            <div class="form-field" [class.has-error]="submitted() && !form.customer">
              <label class="field-label">Customer <span class="req">*</span></label>
              <select class="form-select field-input" [(ngModel)]="form.customer">
                <option value="">Select customer…</option>
                @for (c of customers; track c) { <option [value]="c">{{ c }}</option> }
              </select>
              @if (submitted() && !form.customer) {
                <div class="field-error"><i class="bi bi-exclamation-circle me-1"></i>Required</div>
              }
            </div>

            <div class="form-field" [class.has-error]="submitted() && !form.customerRef">
              <label class="field-label">Customer Reference # <span class="req">*</span></label>
              <input type="text" class="form-control field-input" [(ngModel)]="form.customerRef"
                     placeholder="e.g. FORD-CR-44821" />
              @if (submitted() && !form.customerRef) {
                <div class="field-error"><i class="bi bi-exclamation-circle me-1"></i>Required</div>
              }
            </div>

            <div class="form-field" [class.has-error]="submitted() && !form.description">
              <label class="field-label">Description <span class="req">*</span></label>
              <textarea class="form-control field-input" rows="4" [(ngModel)]="form.description"
                        placeholder="Describe the complaint in detail…"></textarea>
              @if (submitted() && !form.description) {
                <div class="field-error"><i class="bi bi-exclamation-circle me-1"></i>Required</div>
              }
            </div>

            <div class="field-row-2">
              <div class="form-field">
                <label class="field-label">Received Date</label>
                <input type="date" class="form-control field-input" [(ngModel)]="form.receivedDate" />
              </div>
              <div class="form-field">
                <label class="field-label">Due Date</label>
                <input type="date" class="form-control field-input" [(ngModel)]="form.dueDate" />
              </div>
            </div>

            <div class="auto-ncr-notice">
              <i class="bi bi-info-circle me-2"></i>
              A linked NCR will be automatically created when this complaint is submitted.
            </div>
          </div>
          <div class="so-footer">
            <button class="btn btn-outline-secondary me-2" (click)="slideOverOpen.set(false)">Cancel</button>
            <button class="btn btn-danger submit-btn" (click)="submitComplaint()">
              <i class="bi bi-send me-1"></i> Submit Complaint
            </button>
          </div>
        </div>
      </div>

      <!-- Detail panel (when row selected) -->
      @if (selectedComplaint()) {
        <div class="q-card detail-card mt-3">
          <div class="detail-header">
            <span class="record-id">{{ selectedComplaint()!.id }}</span>
            <span class="chip chip-sm {{ statusClass(selectedComplaint()!.status) }} ms-2">{{ selectedComplaint()!.status }}</span>
            <button class="close-detail" (click)="selectedComplaint.set(null)"><i class="bi bi-x"></i></button>
          </div>
          <div class="detail-body">
            <div class="detail-col">
              <div class="detail-row"><span class="dk">Customer</span><span class="dv">{{ selectedComplaint()!.customer }}</span></div>
              <div class="detail-row"><span class="dk">Reference</span><span class="dv">{{ selectedComplaint()!.customerRef }}</span></div>
              <div class="detail-row"><span class="dk">Received</span><span class="dv">{{ selectedComplaint()!.receivedDate }}</span></div>
              <div class="detail-row"><span class="dk">Due</span><span class="dv">{{ selectedComplaint()!.dueDate }}</span></div>
            </div>
            <div class="detail-desc">
              <div class="dk mb-1">Description</div>
              <p class="desc-text">{{ selectedComplaint()!.description }}</p>
              @if (selectedComplaint()!.ncrId) {
                <button class="btn btn-outline-primary btn-sm" (click)="router.navigate(['/ncrs', selectedComplaint()!.ncrId])">
                  <i class="bi bi-arrow-right me-1"></i> View NCR {{ selectedComplaint()!.ncrId }}
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>

    @if (toast()) {
      <div class="action-toast"><i class="bi bi-check-circle-fill me-2"></i>{{ toast() }}</div>
    }
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem; }
    .page-title { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0 0 0.2rem; }
    .page-sub { font-size: 0.875rem; color: #64748B; margin: 0; }
    .new-btn { background: #DC2626; border: none; font-weight: 600; font-size: 0.875rem; padding: 0.5rem 1rem; border-radius: 8px; }

    .split-layout { display: grid; grid-template-columns: 1fr; gap: 1rem; transition: grid-template-columns 300ms; }
    .split-layout.slide-open { grid-template-columns: 1fr 400px; }
    .table-card { overflow: hidden; min-width: 0; }
    .table-meta { padding: 0.625rem 1.25rem; border-bottom: 1px solid #F1F5F9; }
    .result-count { font-size: 0.8125rem; color: #64748B; }
    .table-scroll { overflow-x: auto; }
    .comp-table { width: 100%; }
    .comp-row { cursor: pointer; &:hover { background: #F8FAFC; } }
    .customer-cell { display: flex; align-items: center; gap: 0.5rem; }
    .cust-avatar { width: 26px; height: 26px; background: #EA580C; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
    .cust-name { font-size: 0.8125rem; font-weight: 500; color: #0F172A; }
    .ref-cell { font-family: monospace; font-size: 0.8125rem; color: #475569; }
    .text-muted-sm { font-size: 0.8125rem; color: #94A3B8; }
    .ncr-link { background: none; border: none; cursor: pointer; display: flex; align-items: center; color: #2563EB; font-size: 0.8125rem; padding: 0; &:hover { text-decoration: underline; } }
    .record-id-sm { font-family: monospace; font-size: 0.8125rem; font-weight: 700; }
    .chip-sm { font-size: 11px; padding: 2px 8px; }
    .due-ok { font-size: 0.8125rem; color: #94A3B8; }
    .due-warn { font-size: 0.8125rem; color: #B45309; font-weight: 600; }
    .due-over { font-size: 0.8125rem; color: #DC2626; font-weight: 600; }

    /* Slide-over */
    .slide-over { width: 400px; background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; display: flex; flex-direction: column; max-height: 600px; overflow: hidden; transition: transform 300ms, opacity 300ms; opacity: 0; transform: translateX(20px); pointer-events: none; &.open { opacity: 1; transform: translateX(0); pointer-events: auto; } }
    .so-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #F1F5F9; }
    .so-title { font-size: 1rem; font-weight: 700; color: #0F172A; margin: 0; }
    .so-close { background: none; border: none; cursor: pointer; color: #94A3B8; font-size: 1rem; padding: 4px; &:hover { color: #475569; } }
    .so-body { flex: 1; overflow-y: auto; padding: 1.25rem; }
    .so-footer { padding: 1rem 1.25rem; border-top: 1px solid #F1F5F9; display: flex; justify-content: flex-end; }
    .form-field { margin-bottom: 1rem; }
    .field-label { font-size: 0.8125rem; font-weight: 600; color: #334155; display: block; margin-bottom: 0.375rem; }
    .req { color: #DC2626; }
    .field-input { font-size: 0.875rem; border: 1.5px solid #E2E8F0; border-radius: 6px; &:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); outline: none; } }
    .has-error .field-input { border-color: #DC2626; }
    .field-error { font-size: 0.75rem; color: #DC2626; margin-top: 0.25rem; display: flex; align-items: center; }
    .field-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .auto-ncr-notice { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 0.625rem 0.875rem; font-size: 0.8125rem; color: #1D4ED8; display: flex; align-items: center; }
    .submit-btn { background: #DC2626; border: none; color: #fff; font-weight: 600; }

    /* Detail panel */
    .detail-card { padding: 1.25rem; }
    .detail-header { display: flex; align-items: center; margin-bottom: 1rem; }
    .close-detail { margin-left: auto; background: none; border: none; cursor: pointer; color: #94A3B8; font-size: 1rem; }
    .detail-body { display: grid; grid-template-columns: 240px 1fr; gap: 1.5rem; }
    .detail-row { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #F8FAFC; }
    .dk { font-size: 0.8125rem; color: #64748B; }
    .dv { font-size: 0.8125rem; font-weight: 500; color: #0F172A; }
    .desc-text { font-size: 0.875rem; color: #475569; line-height: 1.6; }

    .action-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: #0F172A; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; z-index: 400; display: flex; align-items: center; }
  `]
})
export class ComplaintsComponent {
  readonly router = inject(Router);
  readonly mock = inject(MockDataService);

  readonly slideOverOpen = signal(false);
  readonly submitted = signal(false);
  readonly toast = signal('');
  readonly selectedComplaint = signal<CustomerComplaint | null>(null);

  readonly customers = ['Ford Motor Company', 'GM', 'Stellantis', 'Toyota', 'BMW Group', 'Rivian', 'Mercedes-Benz'];

  form = { customer: '', customerRef: '', description: '', receivedDate: '2026-06-13', dueDate: '2026-06-27' };

  statusClass(s: string): string {
    const m: Record<string, string> = { 'Open': 'chip-major', 'Under Review': 'chip-in-approval', 'Closed': 'chip-released', 'Rejected': 'chip-superseded' };
    return m[s] ?? '';
  }

  dueClass(c: CustomerComplaint): string {
    const due = new Date(c.dueDate), now = new Date('2026-06-13');
    const diff = Math.floor((due.getTime() - now.getTime()) / 86400000);
    if (diff < 0) return 'due-over';
    if (diff <= 7) return 'due-warn';
    return 'due-ok';
  }

  submitComplaint(): void {
    this.submitted.set(true);
    if (!this.form.customer || !this.form.customerRef || !this.form.description) return;
    const complaint = this.mock.addComplaint({
      customer: this.form.customer,
      customerRef: this.form.customerRef,
      description: this.form.description,
      receivedDate: this.form.receivedDate,
      dueDate: this.form.dueDate,
      status: 'Open',
      ageInDays: 0,
    });
    this.slideOverOpen.set(false);
    this.submitted.set(false);
    this.toast.set(`${complaint.id} created.`);
    this.form = { customer: '', customerRef: '', description: '', receivedDate: '2026-06-13', dueDate: '2026-06-27' };
    setTimeout(() => this.toast.set(''), 4000);
  }
}
