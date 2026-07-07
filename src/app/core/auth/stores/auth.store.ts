import { Injectable, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  companyId: string;
  siteId: string;
  roles: string[];
  avatarColor?: string;
  jobTitle?: string;
  workArea?: string;
}

const SESSION_KEY = 'q_auth';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private _loadSession(): { user: AuthUser; token: string; perms: string[] } | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private _savedSession = this._loadSession();

  private readonly _currentUser = signal<AuthUser | null>(this._savedSession?.user ?? null);
  private readonly _permissions = signal<Set<string>>(new Set(this._savedSession?.perms ?? []));
  private readonly _accessToken = signal<string | null>(this._savedSession?.token ?? null);
  private readonly _refreshToken = signal<string | null>(null);
  private readonly _isLoading = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly permissions = this._permissions.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null && this._accessToken() !== null);
  readonly fullName = computed(() => {
    const u = this._currentUser();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  hasPermission(permission: string): boolean {
    return this._permissions().has(permission) || this._permissions().has('*');
  }

  hasRole(role: string): boolean {
    return this._currentUser()?.roles.includes(role) ?? false;
  }

  setAuth(user: AuthUser, accessToken: string, refreshToken: string, permissions: string[]): void {
    this._currentUser.set(user);
    this._accessToken.set(accessToken);
    this._refreshToken.set(refreshToken);
    this._permissions.set(new Set(permissions));
    if (isPlatformBrowser(this.platformId)) {
      // Only write the session key — all other localStorage keys (app data cache, etc.) are intentionally preserved.
      // DO NOT call localStorage.clear() or localStorage.removeItem() for any other key here.
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token: accessToken, perms: permissions }));
    }
  }

  updateAccessToken(accessToken: string): void {
    this._accessToken.set(accessToken);
  }

  clearAuth(): void {
    this._currentUser.set(null);
    this._permissions.set(new Set());
    this._accessToken.set(null);
    this._refreshToken.set(null);
    if (isPlatformBrowser(this.platformId)) {
      // Only remove the session key — all other localStorage keys (app data cache, etc.) are intentionally preserved.
      // DO NOT call localStorage.clear() or localStorage.removeItem() for any other key here.
      localStorage.removeItem(SESSION_KEY);
    }
  }

  getRefreshToken(): string | null { return this._refreshToken(); }
  setLoading(loading: boolean): void { this._isLoading.set(loading); }
}
