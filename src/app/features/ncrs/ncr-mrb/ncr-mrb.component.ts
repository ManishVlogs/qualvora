import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MockDataService } from '../../../shared/services/mock-data.service';
import { NCR } from '../../../shared/interfaces/models';

interface MrbCard {
  id: string;
  partNumber: string;
  defectCode: string;
  severity: string;
  ageInDays: number;
  reviewerInitials: string;
  reviewerColor: string;
  customer?: string;
  isCustomerFacing?: boolean;
}

@Component({
  selector: 'app-ncr-mrb',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <div class="page-wrapper">

      <div class="page-header">
        <div>
          <h1 class="page-title">MRB Queue</h1>
          <p class="page-sub">Material Review Board — drag cards to update status</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline-secondary btn-sm me-2" (click)="router.navigate(['/ncrs'])">
            <i class="bi bi-arrow-left me-1"></i> NCR List
          </button>
          <button class="btn btn-primary btn-sm">
            <i class="bi bi-calendar3 me-1"></i> Schedule MRB Meeting
          </button>
        </div>
      </div>

      <!-- Summary bar -->
      <div class="summary-bar q-card mb-3">
        @for (col of columns; track col.id) {
          <div class="summary-stat">
            <span class="stat-value">{{ col.cards.length }}</span>
            <span class="stat-label">{{ col.title }}</span>
          </div>
          @if (col.id !== 'dispositioned') { <div class="stat-sep"></div> }
        }
        <div class="stat-sep"></div>
        <div class="summary-stat">
          <span class="stat-value" style="color:#DC2626">{{ customerFacingCount }}</span>
          <span class="stat-label">Customer-Facing</span>
        </div>
      </div>

      <!-- Kanban board -->
      <div class="kanban-board">
        @for (col of columns; track col.id) {
          <div class="kanban-col" [class.col-muted]="col.id === 'dispositioned'">
            <div class="col-header" [style.border-top-color]="col.color">
              <span class="col-title">{{ col.title }}</span>
              <span class="col-count" [style.background]="col.color + '22'" [style.color]="col.color">{{ col.cards.length }}</span>
            </div>

            <div cdkDropList
                 [id]="col.id"
                 [cdkDropListData]="col.cards"
                 [cdkDropListConnectedTo]="connectedLists"
                 (cdkDropListDropped)="onDrop($event)"
                 class="drop-zone">

              @for (card of col.cards; track card.id) {
                <div class="mrb-card" cdkDrag
                     [class.card-muted]="col.id === 'dispositioned'"
                     (click)="router.navigate(['/ncrs', card.id])">
                  <div *cdkDragPlaceholder class="drag-placeholder"></div>

                  <div class="card-header">
                    <span class="card-id">{{ card.id }}</span>
                    @if (card.isCustomerFacing) {
                      <span class="c-badge" title="Customer-facing">C</span>
                    }
                    <span class="sev-badge sev-{{ card.severity.toLowerCase() }} ms-auto">{{ card.severity }}</span>
                  </div>

                  @if (card.partNumber) {
                    <div class="card-part">
                      <i class="bi bi-box me-1"></i>{{ card.partNumber }}
                    </div>
                  }

                  <div class="card-defect">
                    <span class="defect-tag">{{ card.defectCode }}</span>
                  </div>

                  <div class="card-footer">
                    <span class="age-chip chip-sm {{ ageChip(card.ageInDays) }}">{{ card.ageInDays }}d</span>
                    @if (card.customer) {
                      <span class="cust-tag">{{ card.customer }}</span>
                    }
                    <span class="reviewer-av ms-auto" [style.background]="card.reviewerColor"
                          [title]="card.reviewerInitials">{{ card.reviewerInitials }}</span>
                  </div>

                  <div class="drag-hint" *cdkDragPreview>
                    <i class="bi bi-arrows-move me-2"></i>{{ card.id }}
                  </div>
                </div>
              }

              @if (col.cards.length === 0) {
                <div class="empty-col">
                  <i class="bi bi-inbox empty-col-icon"></i>
                  <span>No cards</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>

    @if (toast()) {
      <div class="action-toast"><i class="bi bi-check-circle-fill me-2"></i>{{ toast() }}</div>
    }
  `,
  styles: [`
    .page-wrapper { padding: 1.5rem; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem; }
    .page-title { font-size: 1.375rem; font-weight: 700; color: #0F172A; margin: 0 0 0.2rem; }
    .page-sub { font-size: 0.875rem; color: #64748B; margin: 0; }
    .header-actions { display: flex; align-items: center; flex-shrink: 0; }

    .summary-bar { display: flex; align-items: center; padding: 0.875rem 1.5rem; gap: 1.5rem; }
    .summary-stat { display: flex; flex-direction: column; align-items: center; min-width: 60px; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: #0F172A; line-height: 1; }
    .stat-label { font-size: 0.75rem; color: #64748B; margin-top: 2px; white-space: nowrap; }
    .stat-sep { width: 1px; height: 36px; background: #F1F5F9; }

    .kanban-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; align-items: start; }
    .kanban-col { display: flex; flex-direction: column; }
    .col-muted .mrb-card { opacity: 0.65; }
    .col-header { background: #fff; border: 1px solid #E2E8F0; border-top: 3px solid #94A3B8; border-radius: 10px 10px 0 0; padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; }
    .col-title { font-size: 0.875rem; font-weight: 700; color: #334155; }
    .col-count { font-size: 0.8125rem; font-weight: 700; border-radius: 20px; padding: 2px 10px; }

    .drop-zone { min-height: 120px; background: #F8FAFC; border: 1px solid #E2E8F0; border-top: none; border-radius: 0 0 10px 10px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.625rem; transition: background 150ms; }
    .cdk-drop-list-dragging { background: #EFF6FF; }

    .mrb-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.875rem; cursor: grab; transition: box-shadow 150ms, transform 150ms; &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); } &:active { cursor: grabbing; } }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0,0,0.2,1); }
    .cdk-drag-preview { box-shadow: 0 16px 40px rgba(0,0,0,0.25); border-radius: 10px; }
    .drag-placeholder { background: #EFF6FF; border: 2px dashed #93C5FD; border-radius: 10px; height: 80px; }

    .card-header { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.5rem; }
    .card-id { font-family: monospace; font-size: 0.8125rem; font-weight: 700; color: #2563EB; }
    .c-badge { width: 18px; height: 18px; background: #EA580C; color: #fff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; }
    .sev-badge { font-size: 10px; padding: 1px 7px; border-radius: 4px; font-weight: 700; }
    .sev-major { background: #FEE2E2; color: #DC2626; }
    .sev-minor { background: #FEF3C7; color: #B45309; }
    .sev-ofi { background: #F1F5F9; color: #64748B; }
    .card-part { font-size: 0.8125rem; color: #475569; margin-bottom: 0.375rem; display: flex; align-items: center; }
    .card-defect { margin-bottom: 0.5rem; }
    .defect-tag { background: #F1F5F9; border: 1px solid #E2E8F0; font-size: 11px; border-radius: 4px; padding: 2px 7px; color: #475569; font-family: monospace; }
    .card-footer { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
    .chip-sm { font-size: 11px; padding: 2px 8px; }
    .age-chip { }
    .cust-tag { font-size: 10px; color: #EA580C; background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 4px; padding: 1px 6px; }
    .reviewer-av { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #fff; flex-shrink: 0; }
    .drag-hint { background: #0F172A; color: #fff; padding: 0.5rem 0.875rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; }

    .empty-col { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80px; color: #CBD5E1; gap: 0.375rem; font-size: 0.8125rem; }
    .empty-col-icon { font-size: 1.5rem; }

    .action-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: #0F172A; color: #fff; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; z-index: 400; display: flex; align-items: center; }
  `]
})
export class NcrMrbComponent {
  readonly router = inject(Router);
  readonly mock = inject(MockDataService);
  readonly toast = signal('');

  readonly connectedLists = ['awaiting', 'in-mrb', 'dispositioned'];

  private toCard(ncr: NCR): MrbCard {
    const colors: Record<string, string> = { 'DP': '#7C3AED', 'MD': '#2563EB', 'SC': '#059669', 'JK': '#D97706', 'TN': '#DC2626' };
    const initials = ncr.ownerInitials ?? (ncr.owner?.split(' ').map(n => n[0]).join('') ?? '??');
    return {
      id: ncr.id,
      partNumber: ncr.partNumber ?? '—',
      defectCode: ncr.defectCode ?? ncr.description.substring(0, 20),
      severity: ncr.severity,
      ageInDays: ncr.ageInDays,
      reviewerInitials: initials,
      reviewerColor: colors[initials] ?? '#64748B',
      customer: ncr.customer,
      isCustomerFacing: ncr.isCustomerFacing,
    };
  }

  get mrbNcrs() { return this.mock.ncrs().filter((n: NCR) => n.mrbRequired); }

  readonly columns = [
    {
      id: 'awaiting',
      title: 'Awaiting Review',
      color: '#F59E0B',
      cards: this.mock.ncrs().filter((n: NCR) => n.mrbRequired && (n.status === 'Open' || n.status === 'Under Review')).slice(0, 6).map((n: NCR) => this.toCard(n)),
    },
    {
      id: 'in-mrb',
      title: 'In MRB',
      color: '#2563EB',
      cards: this.mock.ncrs().filter((n: NCR) => n.mrbRequired && n.status === 'Dispositioned').slice(0, 2).map((n: NCR) => this.toCard(n)),
    },
    {
      id: 'dispositioned',
      title: 'Dispositioned',
      color: '#10B981',
      cards: this.mock.ncrs().filter((n: NCR) => n.status === 'Closed').slice(0, 4).map((n: NCR) => this.toCard(n)),
    },
  ];

  get customerFacingCount(): number {
    return this.columns.reduce((sum, col) => sum + col.cards.filter(c => c.isCustomerFacing).length, 0);
  }

  ageChip(d: number): string {
    if (d > 5) return 'chip-breached';
    if (d >= 3) return 'chip-warning';
    return 'chip-within-sla';
  }

  onDrop(event: CdkDragDrop<MrbCard[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      const targetCol = this.columns.find(c => c.id === event.container.id);
      const card = event.container.data[event.currentIndex];
      this.toast.set(`${card.id} moved to ${targetCol?.title}`);
      setTimeout(() => this.toast.set(''), 2500);
    }
  }
}
