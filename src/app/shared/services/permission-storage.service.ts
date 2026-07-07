import { Injectable, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserSessionService } from './user-session.service';

// Fine-grained permission strings for document operations.
// Using constants ensures typo-safe checks throughout the app.
export const DOC_PERMISSIONS = {
  VIEW:      'doc.view',
  APPROVE:   'doc.approve',
  REVISE:    'doc.revise',
  DISTRIBUTE:'doc.distribute',
  OBSOLETE:  'doc.obsolete',
  PRINT:     'doc.print',
  MOBILE:    'doc.mobile',
  COMPARE:   'doc.compare',
  EXPORT:    'doc.export',
  IMPORT:    'doc.import',
  ADMIN:     'doc.admin',
} as const;

// Role → permission mapping. Stored here rather than hardcoded in components.
// Future: replace with API call returning per-user permission sets.
const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  Admin: Object.values(DOC_PERMISSIONS),
  QM: [
    DOC_PERMISSIONS.VIEW, DOC_PERMISSIONS.APPROVE, DOC_PERMISSIONS.REVISE,
    DOC_PERMISSIONS.DISTRIBUTE, DOC_PERMISSIONS.OBSOLETE, DOC_PERMISSIONS.PRINT,
    DOC_PERMISSIONS.MOBILE, DOC_PERMISSIONS.COMPARE, DOC_PERMISSIONS.EXPORT,
  ],
  Director: [
    DOC_PERMISSIONS.VIEW, DOC_PERMISSIONS.APPROVE, DOC_PERMISSIONS.REVISE,
    DOC_PERMISSIONS.DISTRIBUTE, DOC_PERMISSIONS.PRINT,
    DOC_PERMISSIONS.MOBILE, DOC_PERMISSIONS.COMPARE, DOC_PERMISSIONS.EXPORT,
  ],
  QE: [
    DOC_PERMISSIONS.VIEW, DOC_PERMISSIONS.REVISE, DOC_PERMISSIONS.DISTRIBUTE,
    DOC_PERMISSIONS.PRINT, DOC_PERMISSIONS.MOBILE, DOC_PERMISSIONS.COMPARE,
    DOC_PERMISSIONS.EXPORT,
  ],
  ME: [
    DOC_PERMISSIONS.VIEW, DOC_PERMISSIONS.REVISE, DOC_PERMISSIONS.DISTRIBUTE,
    DOC_PERMISSIONS.PRINT, DOC_PERMISSIONS.MOBILE, DOC_PERMISSIONS.COMPARE,
  ],
  QS: [
    DOC_PERMISSIONS.VIEW, DOC_PERMISSIONS.DISTRIBUTE,
    DOC_PERMISSIONS.PRINT, DOC_PERMISSIONS.MOBILE,
  ],
  PM:         [DOC_PERMISSIONS.VIEW, DOC_PERMISSIONS.PRINT, DOC_PERMISSIONS.MOBILE],
  QT:         [DOC_PERMISSIONS.VIEW, DOC_PERMISSIONS.PRINT, DOC_PERMISSIONS.MOBILE],
  Supervisor: [DOC_PERMISSIONS.VIEW, DOC_PERMISSIONS.PRINT, DOC_PERMISSIONS.MOBILE],
  Operator:   [DOC_PERMISSIONS.VIEW, DOC_PERMISSIONS.MOBILE],
};

const OVERRIDES_KEY = 'q_doc_permission_overrides';

@Injectable({ providedIn: 'root' })
export class PermissionStorageService {
  private userSession = inject(UserSessionService);
  private platformId = inject(PLATFORM_ID);

  // Returns the full set of doc permissions for the current user.
  // Checks localStorage for admin-applied overrides; falls back to role defaults.
  readonly documentPermissions = computed((): Set<string> => {
    const role = this.userSession.currentUserRole();
    const override = this._loadOverride(role);
    if (override) return new Set(override);
    return new Set(ROLE_PERMISSION_MAP[role] ?? [DOC_PERMISSIONS.VIEW]);
  });

  hasPerm(permission: string): boolean {
    return this.documentPermissions().has(permission)
        || this.documentPermissions().has(DOC_PERMISSIONS.ADMIN);
  }

  private _loadOverride(role: string): string[] | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem(OVERRIDES_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw) as Record<string, string[]>;
      return map[role] ?? null;
    } catch { return null; }
  }
}
