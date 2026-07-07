import { Injectable, computed, inject } from '@angular/core';
import { AuthStore } from '../../core/auth/stores/auth.store';
import { MockDataService } from './mock-data.service';
import { QUser } from '../interfaces/models';

// Bridge between AuthStore (auth session) and QUser (app data model).
// When real APIs replace MockDataService, only this service changes.
@Injectable({ providedIn: 'root' })
export class UserSessionService {
  private auth = inject(AuthStore);
  private mock = inject(MockDataService);

  readonly currentAuthUser = this.auth.currentUser;

  readonly currentQUser = computed((): QUser | null => {
    const authUser = this.auth.currentUser();
    if (!authUser) return null;
    return this.mock.users.find(u => u.email === authUser.email) ?? null;
  });

  readonly currentUserRole = computed((): string => {
    const qUser = this.currentQUser();
    if (qUser) return qUser.role;
    return this.auth.currentUser()?.roles?.[0] ?? '';
  });

  readonly currentSiteId = computed((): string => {
    return this.currentQUser()?.siteId ?? this.auth.currentUser()?.siteId ?? '';
  });

  readonly currentUserInitials = computed((): string => {
    const qUser = this.currentQUser();
    if (qUser) return qUser.initials;
    const auth = this.auth.currentUser();
    if (!auth) return '?';
    return (auth.firstName[0] + auth.lastName[0]).toUpperCase();
  });

  readonly currentUserAvatarColor = computed((): string => {
    return this.currentQUser()?.avatarColor ?? this.auth.currentUser()?.avatarColor ?? '#64748B';
  });

  readonly currentUserFullName = computed((): string => {
    const qUser = this.currentQUser();
    if (qUser) return qUser.fullName;
    return this.auth.fullName();
  });
}
