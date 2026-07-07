import { Injectable, computed, signal } from '@angular/core';

export interface TenantConfig {
  tenantId: string;
  tenantName: string;
  companyId: string;
  siteId: string;
  siteName: string;
  features: Record<string, boolean>;
  industryProfile: string;
  logoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class TenantStore {
  private readonly _config = signal<TenantConfig | null>(null);

  readonly config = this._config.asReadonly();
  readonly tenantId = computed(() => this._config()?.tenantId ?? '');
  readonly siteId = computed(() => this._config()?.siteId ?? '');
  readonly features = computed(() => this._config()?.features ?? {});

  isFeatureEnabled(featureName: string): boolean {
    return this._config()?.features[featureName] === true;
  }

  setConfig(config: TenantConfig): void { this._config.set(config); }
  clear(): void { this._config.set(null); }
}
