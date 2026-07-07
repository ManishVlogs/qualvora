import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item toast-{{ toast.type }}" (click)="toastService.dismiss(toast.id)">
          <i class="bi {{ iconFor(toast.type) }} toast-icon"></i>
          <span class="toast-msg">{{ toast.message }}</span>
          <button class="toast-close"><i class="bi bi-x"></i></button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
      display: flex; flex-direction: column; gap: 0.5rem; pointer-events: none;
    }
    .toast-item {
      display: flex; align-items: center; gap: 0.625rem;
      min-width: 280px; max-width: 420px;
      padding: 0.75rem 1rem; border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      pointer-events: all; cursor: pointer;
      animation: slideUp 0.2s ease;
      font-size: 0.875rem; font-weight: 500;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .toast-success { background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; }
    .toast-info    { background: #DBEAFE; color: #1E40AF; border: 1px solid #93C5FD; }
    .toast-warning { background: #FEF9C3; color: #713F12; border: 1px solid #FDE047; }
    .toast-error   { background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; }
    .toast-icon { font-size: 1rem; flex-shrink: 0; }
    .toast-msg { flex: 1; }
    .toast-close { background: none; border: none; color: inherit; opacity: 0.6; cursor: pointer; padding: 0; margin-left: 0.25rem; }
  `],
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  iconFor(type: string): string {
    return { success: 'bi-check-circle-fill', info: 'bi-info-circle-fill', warning: 'bi-exclamation-triangle-fill', error: 'bi-x-circle-fill' }[type] ?? 'bi-info-circle-fill';
  }
}
