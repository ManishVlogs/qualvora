import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const SITE_MAP: Record<string, string> = {
  'Plant-1': 'SITE-001',
  'Plant-2': 'SITE-002',
  'Plant-3': 'SITE-003',
};

export const SITE_ID_TO_NAME: Record<string, string> = {
  'SITE-001': 'Plant-1',
  'SITE-002': 'Plant-2',
  'SITE-003': 'Plant-3',
};

const SITE_SESSION_KEY = 'q_site';

@Injectable({ providedIn: 'root' })
export class SiteStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private _loadSaved(): string {
    if (!this.isBrowser) return 'Plant-1';
    const saved = localStorage.getItem(SITE_SESSION_KEY);
    if (saved) return saved;
    try {
      const auth = JSON.parse(localStorage.getItem('q_auth') ?? 'null');
      const fromAuth = SITE_ID_TO_NAME[auth?.user?.siteId];
      if (fromAuth) return fromAuth;
    } catch { /* ignore */ }
    return 'Plant-1';
  }

  readonly currentSite = signal<string>(this._loadSaved());
  readonly currentSiteId = computed(() => SITE_MAP[this.currentSite()] ?? 'SITE-001');

  switchSite(name: string): void {
    this.currentSite.set(name);
    if (this.isBrowser) localStorage.setItem(SITE_SESSION_KEY, name);
  }
}
