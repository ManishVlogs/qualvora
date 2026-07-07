import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { MockDataService } from '../../shared/services/mock-data.service';
import { AuthStore } from '../../core/auth/stores/auth.store';
import { WorkItem } from '../../shared/interfaces/models';

type FilterTab = 'all' | 'overdue' | 'today' | 'this-week';

@Component({
  selector: 'app-my-work',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet],
  template: `
    <div class="page-wrapper">

      <!-- Header -->
      <div class="mw-header">
        <div class="mw-title-row">
          <h1>My Work</h1>
          <span class="badge bg-danger ms-2" style="font-size:12px;padding:4px 10px;border-radius:20px;">
            {{ totalCount }}
          </span>
        </div>
        <p class="mw-subtitle">All tasks, approvals, and action items assigned to you</p>
      </div>

      <!-- Filter tabs -->
      <div class="filter-tabs">
        @for (tab of tabs(); track tab.key) {
          <button
            class="filter-tab"
            [class.active]="activeTab() === tab.key"
            (click)="activeTab.set(tab.key)">
            {{ tab.label }}
            @if (tab.count > 0) {
              <span class="tab-badge {{ tab.badgeClass }}">{{ tab.count }}</span>
            }
          </button>
        }
      </div>

      <!-- Overdue section -->
      @if (showSection('overdue')) {
        <div class="work-section">
          <div class="section-header section-overdue">
            <i class="bi bi-exclamation-circle-fill me-2"></i>
            Overdue
            <span class="section-count">{{ overdueItems().length }}</span>
          </div>
          <div class="q-card work-card">
            @for (item of overdueItems(); track item.id) {
              <ng-container *ngTemplateOutlet="workRow; context: { $implicit: item }"></ng-container>
            }
          </div>
        </div>
      }

      <!-- Due Today section -->
      @if (showSection('today')) {
        <div class="work-section">
          <div class="section-header section-today">
            <i class="bi bi-clock-fill me-2"></i>
            Due Today
            <span class="section-count">{{ todayItems().length }}</span>
          </div>
          <div class="q-card work-card">
            @for (item of todayItems(); track item.id) {
              <ng-container *ngTemplateOutlet="workRow; context: { $implicit: item }"></ng-container>
            }
          </div>
        </div>
      }

      <!-- This Week section -->
      @if (showSection('this-week')) {
        <div class="work-section">
          <div class="section-header section-week">
            <i class="bi bi-calendar3 me-2"></i>
            This Week
            <span class="section-count">{{ weekItems().length }}</span>
          </div>
          <div class="q-card work-card">
            @for (item of weekItems(); track item.id) {
              <ng-container *ngTemplateOutlet="workRow; context: { $implicit: item }"></ng-container>
            }
          </div>
        </div>
      }

      @if (visibleItems.length === 0) {
        <div class="empty-state">
          <i class="bi bi-check2-all empty-icon"></i>
          <p>No items in this filter. You're all caught up!</p>
        </div>
      }

    </div>

    <!-- Work Row Template -->
    <ng-template #workRow let-item>
      <div class="work-row" (click)="navigate(item)">
        <!-- Type icon -->
        <div class="work-type-icon">
          <i class="bi {{ typeIcon(item.type) }}" [style.color]="typeColor(item.type)"></i>
        </div>

        <!-- ID + Title -->
        <div class="work-main">
          <div class="work-meta-row">
            <span class="record-id">{{ item.entityId }}</span>
            <span class="work-type-label">{{ item.type }}</span>
          </div>
          <div class="work-title">{{ item.title }}</div>
        </div>

        <!-- Owner -->
        <div class="work-owner">
          <div class="owner-avatar" [style.background]="item.ownerColor">{{ item.ownerInitials }}</div>
          <span class="owner-name d-none d-md-inline">{{ item.owner }}</span>
        </div>

        <!-- Due chip -->
        <div class="work-due">
          <span class="chip {{ dueChip(item.dueCategory) }}">
            {{ dueLabel(item) }}
          </span>
        </div>

        <!-- Action -->
        <div class="work-action">
          <button class="btn btn-sm action-btn {{ actionBtnClass(item.dueCategory) }}"
                  (click)="$event.stopPropagation(); onAction(item)">
            {{ item.actionLabel }}
          </button>
        </div>
      </div>
    </ng-template>

    <!-- Toast -->
    @if (toast()) {
      <div class="action-toast">
        <i class="bi bi-check-circle-fill me-2"></i>{{ toast() }}
      </div>
    }
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; max-width: 1280px; margin: 0 auto; }
    .mw-header { margin-bottom: 1.25rem; }
    .mw-title-row { display: flex; align-items: center; margin-bottom: 0.25rem; }
    .mw-title-row h1 { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0; }
    .mw-subtitle { font-size: 0.875rem; color: #64748B; margin: 0; }

    /* Filter tabs */
    .filter-tabs { display: flex; gap: 0.25rem; border-bottom: 2px solid #E2E8F0; margin-bottom: 1.5rem; }
    .filter-tab {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748B;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      transition: color 150ms, border-color 150ms;
      &:hover { color: #2563EB; }
      &.active { color: #2563EB; border-bottom-color: #2563EB; }
    }
    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      font-size: 10px;
      font-weight: 700;
      padding: 0 5px;
      &.badge-red { background: #FEE2E2; color: #DC2626; }
      &.badge-amber { background: #FEF3C7; color: #B45309; }
      &.badge-blue { background: #DBEAFE; color: #2563EB; }
      &.badge-gray { background: #F1F5F9; color: #64748B; }
    }

    /* Sections */
    .work-section { margin-bottom: 1.5rem; }
    .section-header {
      display: flex;
      align-items: center;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      margin-bottom: 0.625rem;
    }
    .section-overdue { background: #FEE2E2; color: #DC2626; }
    .section-today { background: #FEF3C7; color: #B45309; }
    .section-week { background: #DBEAFE; color: #2563EB; }
    .section-count {
      margin-left: auto;
      background: rgba(0,0,0,0.1);
      padding: 1px 7px;
      border-radius: 12px;
      font-size: 11px;
    }

    /* Work card */
    .work-card { overflow: hidden; }
    .work-row {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid #F1F5F9;
      cursor: pointer;
      min-height: 64px;
      transition: background 150ms;
      &:last-child { border-bottom: none; }
      &:hover { background: #F8FAFC; }
    }
    .work-type-icon { font-size: 1.125rem; flex-shrink: 0; width: 24px; text-align: center; }
    .work-main { flex: 1; min-width: 0; }
    .work-meta-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.125rem; flex-wrap: wrap; }
    .work-type-label { font-size: 11px; color: #94A3B8; font-weight: 500; }
    .work-title { font-size: 0.875rem; font-weight: 500; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .work-owner { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
    .owner-avatar { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px; color: #fff; flex-shrink: 0; }
    .owner-name { font-size: 0.8125rem; color: #475569; }
    .work-due { flex-shrink: 0; }
    .work-action { flex-shrink: 0; }
    .action-btn { font-size: 0.75rem; padding: 4px 12px; border-radius: 20px; font-weight: 500; white-space: nowrap; }
    .action-btn-red { background: #FEE2E2 !important; color: #DC2626 !important; border: none !important; }
    .action-btn-amber { background: #FEF3C7 !important; color: #B45309 !important; border: none !important; }
    .action-btn-blue { background: #DBEAFE !important; color: #2563EB !important; border: none !important; }

    /* Empty state */
    .empty-state { text-align: center; padding: 3rem; color: #94A3B8; }
    .empty-icon { font-size: 3rem; color: #CBD5E1; display: block; margin-bottom: 1rem; }

    /* Toast */
    .action-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: #0F172A; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; z-index: 400; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }

    @media (max-width: 768px) {
      .work-owner, .work-due { display: none; }
      .work-row { padding: 0.75rem 1rem; }
    }
  `]
})
export class MyWorkComponent {
  private mock = inject(MockDataService);
  private auth = inject(AuthStore);
  private router = inject(Router);

  readonly activeTab = signal<FilterTab>('all');
  readonly toast = signal('');

  // Scoped to the signed-in user's own tasks within the currently selected plant.
  readonly myWorkItems = computed(() => {
    const userId = this.auth.currentUser()?.id;
    return this.mock.siteWorkItems().filter(w => w.ownerId === userId);
  });

  readonly overdueItems = computed(() => this.myWorkItems().filter(w => w.dueCategory === 'overdue'));
  readonly todayItems = computed(() => this.myWorkItems().filter(w => w.dueCategory === 'today'));
  readonly weekItems = computed(() => this.myWorkItems().filter(w => w.dueCategory === 'this-week'));

  get totalCount(): number { return this.myWorkItems().length; }

  readonly tabs = computed(() => [
    { key: 'all' as FilterTab, label: 'All', count: this.myWorkItems().length, badgeClass: 'badge-gray' },
    { key: 'overdue' as FilterTab, label: 'Overdue', count: this.overdueItems().length, badgeClass: 'badge-red' },
    { key: 'today' as FilterTab, label: 'Today', count: this.todayItems().length, badgeClass: 'badge-amber' },
    { key: 'this-week' as FilterTab, label: 'This Week', count: this.weekItems().length, badgeClass: 'badge-blue' },
  ]);

  get visibleItems(): WorkItem[] {
    const tab = this.activeTab();
    if (tab === 'all') return this.myWorkItems();
    return this.myWorkItems().filter(w => w.dueCategory === tab);
  }

  showSection(cat: string): boolean {
    const tab = this.activeTab();
    return tab === 'all' || tab === cat;
  }

  navigate(item: WorkItem): void {
    this.router.navigate([item.route]);
  }

  typeIcon(type: string): string {
    const m: Record<string, string> = {
      'Document Approval': 'bi-file-earmark-text',
      'NCR Disposition': 'bi-exclamation-triangle',
      'CAPA Review': 'bi-tools',
      'LPA Run': 'bi-clipboard-check',
      'Finding Response': 'bi-search',
    };
    return m[type] ?? 'bi-circle';
  }

  typeColor(type: string): string {
    const m: Record<string, string> = {
      'Document Approval': '#2563EB',
      'NCR Disposition': '#DC2626',
      'CAPA Review': '#059669',
      'LPA Run': '#7C3AED',
      'Finding Response': '#B45309',
    };
    return m[type] ?? '#64748B';
  }

  dueChip(cat: string): string {
    return cat === 'overdue' ? 'chip-breached' : cat === 'today' ? 'chip-warning' : 'chip-within-sla';
  }

  dueLabel(item: WorkItem): string {
    if (item.dueCategory === 'overdue') return `${item.ageDays}d overdue`;
    if (item.dueCategory === 'today') return 'Due today';
    return 'This week';
  }

  actionBtnClass(cat: string): string {
    return cat === 'overdue' ? 'action-btn-red' : cat === 'today' ? 'action-btn-amber' : 'action-btn-blue';
  }

  onAction(item: WorkItem): void {
    this.mock.removeWorkItem(item.id);
    this.toast.set(`"${item.actionLabel}" initiated for ${item.entityId}`);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
