import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: Toast['type'] = 'info', durationMs = 3500): void {
    const id = Math.random().toString(36).slice(2);
    this._toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => this._toasts.update(t => t.filter(x => x.id !== id)), durationMs);
  }

  dismiss(id: string): void {
    this._toasts.update(t => t.filter(x => x.id !== id));
  }
}
