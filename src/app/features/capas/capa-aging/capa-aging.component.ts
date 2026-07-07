import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { CAPA8D } from '../../../shared/interfaces/models';

type ViewMode = 'board' | 'table';

@Component({
  selector: 'app-capa-aging',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="aging-layout">

      <!-- Header -->
      <div class="aging-header">
        <div>
          <button class="back-btn" (click)="router.navigate(['/capas'])">
            <i class="bi bi-arrow-left me-1"></i> CAPA Register
          </button>
          <h1 class="page-title">CAPA Aging Board</h1>
          <p class="page-sub">Risk-stratified view of all open CAPAs</p>
        </div>
        <div class="view-toggle">
          <button class="vt-btn" [class.active]="viewMode() === 'board'" (click)="viewMode.set('board')">
            <i class="bi bi-columns-gap me-1"></i> Board
          </button>
          <button class="vt-btn" [class.active]="viewMode() === 'table'" (click)="viewMode.set('table')">
            <i class="bi bi-table me-1"></i> Table
          </button>
        </div>
      </div>

      <!-- Board view -->
      @if (viewMode() === 'board') {
        <div class="board-body">

          <!-- On Track column -->
          <div class="band-col">
            <div class="band-header green">
              <i class="bi bi-check-circle me-2"></i>On Track
              <span class="band-count ms-auto">{{ onTrack().length }}</span>
            </div>
            <div class="card-list">
              @for (c of onTrack(); track c.id) {
                <div class="aging-card" (click)="goTo(c)">
                  <div class="card-id-row">
                    <span class="card-id">{{ c.id }}</span>
                    <span class="step-badge">{{ c.activeStep }}</span>
                  </div>
                  <p class="card-title">{{ c.title }}</p>
                  <div class="card-meta">
                    <span><i class="bi bi-calendar3 me-1"></i>{{ c.dueDate }}</span>
                    <span class="days-open">{{ c.daysOpen }}d open</span>
                  </div>
                  <div class="card-footer">
                    <span class="avatar-sm" [style.background]="c.championColor">{{ c.championInitials }}</span>
                    <span class="champion-name ms-1">{{ c.champion.split(' ')[0] }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- At Risk column -->
          <div class="band-col">
            <div class="band-header amber">
              <i class="bi bi-exclamation-triangle me-2"></i>At Risk
              <span class="band-count ms-auto">{{ atRisk().length }}</span>
            </div>
            <div class="card-list">
              @for (c of atRisk(); track c.id) {
                <div class="aging-card at-risk" (click)="goTo(c)">
                  <div class="card-id-row">
                    <span class="card-id">{{ c.id }}</span>
                    <span class="step-badge">{{ c.activeStep }}</span>
                  </div>
                  <p class="card-title">{{ c.title }}</p>
                  <div class="card-meta">
                    <span><i class="bi bi-calendar3 me-1"></i>{{ c.dueDate }}</span>
                    <span class="days-open amber-text">{{ c.daysOpen }}d open</span>
                  </div>
                  <div class="card-footer">
                    <span class="avatar-sm" [style.background]="c.championColor">{{ c.championInitials }}</span>
                    <span class="champion-name ms-1">{{ c.champion.split(' ')[0] }}</span>
                    <span class="risk-chip ms-auto">{{ daysRemaining(c) }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Overdue column -->
          <div class="band-col">
            <div class="band-header red">
              <i class="bi bi-x-circle me-2"></i>Overdue
              <span class="band-count ms-auto">{{ overdue().length }}</span>
            </div>
            <div class="card-list">
              @for (c of overdue(); track c.id) {
                <div class="aging-card overdue" (click)="goTo(c)">
                  <div class="card-id-row">
                    <span class="card-id">{{ c.id }}</span>
                    <span class="step-badge">{{ c.activeStep }}</span>
                  </div>
                  <p class="card-title">{{ c.title }}</p>
                  <div class="card-meta">
                    <span><i class="bi bi-calendar3 me-1"></i>{{ c.dueDate }}</span>
                    <span class="days-open red-text">{{ c.daysOpen }}d open</span>
                  </div>
                  <div class="card-footer">
                    <span class="avatar-sm" [style.background]="c.championColor">{{ c.championInitials }}</span>
                    <span class="champion-name ms-1">{{ c.champion.split(' ')[0] }}</span>
                    <span class="overdue-chip ms-auto">{{ overdueBy(c) }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

        </div>
      }

      <!-- Table view -->
      @if (viewMode() === 'table') {
        <div class="table-wrap">
          <table class="q-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th style="width:90px">D-Step</th>
                <th style="width:100px;text-align:center">Days Open</th>
                <th style="width:100px">Due Date</th>
                <th style="width:110px;text-align:center">Status</th>
                <th style="width:130px">Champion</th>
              </tr>
            </thead>
            <tbody>
              @for (c of allCapas(); track c.id) {
                <tr class="data-row" (click)="goTo(c)">
                  <td><span class="record-id">{{ c.id }}</span></td>
                  <td><span class="row-title">{{ c.title }}</span></td>
                  <td><span class="dstep-badge">{{ c.activeStep }}</span></td>
                  <td style="text-align:center">
                    <span class="days-chip" [class.days-red]="c.onTimeStatus === 'overdue'" [class.days-amber]="c.onTimeStatus === 'at-risk'">
                      {{ c.daysOpen }}d
                    </span>
                  </td>
                  <td><span class="date-text">{{ c.dueDate }}</span></td>
                  <td style="text-align:center">
                    <span class="ontime-chip ontime-{{ c.onTimeStatus }}">
                      @if (c.onTimeStatus === 'on-track') { On Track }
                      @if (c.onTimeStatus === 'at-risk') { At Risk }
                      @if (c.onTimeStatus === 'overdue') { Overdue }
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px">
                      <span class="avatar-xs" [style.background]="c.championColor">{{ c.championInitials }}</span>
                      <span style="font-size:.83rem;color:#374151">{{ c.champion.split(' ')[0] }}</span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

    </div>
  `,
  styles: [`
    .aging-layout { display:flex; flex-direction:column; height:100%; background:#F8FAFC; }
    .aging-header { background:#fff; border-bottom:1px solid #E2E8F0; padding:16px 32px; flex-shrink:0; display:flex; align-items:flex-end; justify-content:space-between; }
    .back-btn { background:none; border:none; color:#2563EB; font-size:.82rem; cursor:pointer; padding:0 0 8px; display:flex; align-items:center; }
    .page-title { font-size:1.3rem; font-weight:700; color:#0F172A; margin:0 0 2px; }
    .page-sub { font-size:.83rem; color:#64748B; margin:0; }

    .view-toggle { display:flex; background:#F1F5F9; border-radius:8px; padding:3px; gap:2px; }
    .vt-btn { background:none; border:none; padding:5px 14px; border-radius:6px; font-size:.82rem; cursor:pointer; color:#64748B; }
    .vt-btn.active { background:#fff; color:#1E293B; font-weight:600; box-shadow:0 1px 4px rgba(0,0,0,.08); }

    /* Board */
    .board-body { flex:1; display:grid; grid-template-columns:repeat(3,1fr); gap:16px; padding:20px 24px; overflow:hidden; }
    .band-col { display:flex; flex-direction:column; overflow:hidden; }
    .band-header { padding:10px 16px; border-radius:8px 8px 0 0; display:flex; align-items:center; font-size:.88rem; font-weight:700; color:#fff; }
    .band-header.green { background:#059669; }
    .band-header.amber { background:#D97706; }
    .band-header.red { background:#DC2626; }
    .band-count { background:rgba(255,255,255,.3); border-radius:99px; padding:1px 8px; font-size:.78rem; }
    .card-list { flex:1; overflow-y:auto; background:#fff; border:1px solid #E2E8F0; border-top:none; border-radius:0 0 8px 8px; padding:8px; display:flex; flex-direction:column; gap:8px; }

    .aging-card {
      background:#fff; border:1px solid #E2E8F0; border-radius:8px; padding:12px 14px;
      cursor:pointer; transition:box-shadow .15s;
    }
    .aging-card:hover { box-shadow:0 2px 8px rgba(0,0,0,.1); }
    .aging-card.at-risk { border-left:3px solid #D97706; }
    .aging-card.overdue { border-left:3px solid #DC2626; background:#FFFBFB; }

    .card-id-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
    .card-id { font-family:monospace; font-size:.78rem; font-weight:700; color:#2563EB; }
    .step-badge { background:#1E40AF; color:#fff; font-size:.65rem; font-weight:700; padding:1px 5px; border-radius:4px; }
    .card-title { font-size:.82rem; color:#1E293B; font-weight:500; margin:0 0 6px; line-height:1.4; }
    .card-meta { display:flex; justify-content:space-between; font-size:.76rem; color:#64748B; margin-bottom:8px; }
    .days-open { font-weight:600; }
    .amber-text { color:#D97706; }
    .red-text { color:#DC2626; }
    .card-footer { display:flex; align-items:center; }
    .avatar-sm { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; color:#fff; font-size:.62rem; font-weight:700; flex-shrink:0; }
    .champion-name { font-size:.78rem; color:#374151; }
    .risk-chip { font-size:.7rem; background:#FEF3C7; color:#92400E; padding:1px 6px; border-radius:99px; }
    .overdue-chip { font-size:.7rem; background:#FEE2E2; color:#991B1B; padding:1px 6px; border-radius:99px; }

    /* Table */
    .table-wrap { flex:1; overflow-y:auto; padding:20px 24px; }
    .q-table { width:100%; border-collapse:collapse; background:#fff; border-radius:10px; overflow:hidden; border:1px solid #E2E8F0; }
    .q-table thead th {
      background:#F8FAFC; padding:10px 14px; font-size:.78rem; font-weight:600;
      text-transform:uppercase; letter-spacing:.04em; color:#64748B; border-bottom:1px solid #E2E8F0;
    }
    .q-table tbody td { padding:11px 14px; border-bottom:1px solid #F1F5F9; vertical-align:middle; }
    .data-row { cursor:pointer; }
    .data-row:hover td { background:#F8FAFC; }
    .record-id { font-family:monospace; font-size:.82rem; font-weight:600; color:#2563EB; }
    .row-title { font-size:.87rem; color:#1E293B; }
    .dstep-badge { background:#1E40AF; color:#fff; font-size:.72rem; font-weight:700; padding:1px 6px; border-radius:4px; }
    .date-text { font-size:.82rem; color:#475569; }
    .days-chip { font-size:.78rem; background:#F1F5F9; color:#475569; padding:2px 7px; border-radius:99px; }
    .days-amber { background:#FEF3C7; color:#92400E; }
    .days-red { background:#FEE2E2; color:#991B1B; }
    .ontime-chip { font-size:.75rem; font-weight:600; padding:2px 9px; border-radius:99px; }
    .ontime-on-track { background:#D1FAE5; color:#065F46; }
    .ontime-at-risk { background:#FEF3C7; color:#92400E; }
    .ontime-overdue { background:#FEE2E2; color:#991B1B; }
    .avatar-xs { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; color:#fff; font-size:.62rem; font-weight:700; }
  `],
})
export class CapaAgingComponent {
  readonly router = inject(Router);
  private readonly mock = inject(MockDataService);

  viewMode = signal<ViewMode>('board');

  readonly allCapas = computed(() => this.mock.capas8d().filter((c: CAPA8D) => c.status === 'Open'));
  readonly onTrack = computed(() => this.allCapas().filter((c: CAPA8D) => c.onTimeStatus === 'on-track'));
  readonly atRisk = computed(() => this.allCapas().filter((c: CAPA8D) => c.onTimeStatus === 'at-risk'));
  readonly overdue = computed(() => this.allCapas().filter((c: CAPA8D) => c.onTimeStatus === 'overdue'));

  goTo(c: CAPA8D): void {
    this.router.navigate(['/capas', c.id]);
  }

  daysRemaining(c: CAPA8D): string {
    const due = new Date(c.dueDate);
    const today = new Date('2026-06-13');
    const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    return diff >= 0 ? `${diff}d left` : `${Math.abs(diff)}d over`;
  }

  overdueBy(c: CAPA8D): string {
    const due = new Date(c.dueDate);
    const today = new Date('2026-06-13');
    const diff = Math.ceil((today.getTime() - due.getTime()) / 86400000);
    return diff > 0 ? `${diff}d over` : 'today';
  }
}
