import { Injectable, computed, signal } from '@angular/core';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  entityType?: string;
  entityId?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly _notifications = signal<AppNotification[]>([]);
  private readonly _unreadCount = signal(0);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly hasUnread = computed(() => this._unreadCount() > 0);

  setNotifications(notifications: AppNotification[]): void {
    this._notifications.set(notifications);
    this._unreadCount.set(notifications.filter(n => !n.isRead).length);
  }

  addNotification(notification: AppNotification): void {
    this._notifications.update(list => [notification, ...list]);
    if (!notification.isRead) this._unreadCount.update(c => c + 1);
  }

  markAsRead(id: string): void {
    this._notifications.update(list =>
      list.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    this._unreadCount.update(c => Math.max(0, c - 1));
  }

  markAllAsRead(): void {
    this._notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    this._unreadCount.set(0);
  }
}
