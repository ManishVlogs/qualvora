import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

// Single source of truth: role code → dashboard path
const ROLE_TO_DASHBOARD: Record<string, string> = {
  Director: '/dashboard/director',
  QE:       '/dashboard/qe',
  ME:       '/dashboard/qe',
  QS:       '/dashboard/supervisor',
  QT:       '/dashboard/operator',
  Operator: '/dashboard/operator',
  // QM and PM are not listed — they fall back to /dashboard
};

function ownDashboard(roles: string[]): string {
  for (const role of roles) {
    const path = ROLE_TO_DASHBOARD[role];
    if (path) return path;
  }
  return '/dashboard';
}

/**
 * Protects each dashboard sub-route.
 * Usage in routes: canActivate: [dashboardAccessGuard], data: { allowedRoles: ['QE', 'ME'] }
 * If the logged-in user's role is not in allowedRoles, they are redirected to their own dashboard.
 */
export const dashboardAccessGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth    = inject(AuthStore);
  const router  = inject(Router);
  const roles   = auth.currentUser()?.roles ?? [];
  const allowed = (route.data['allowedRoles'] as string[]) ?? [];

  if (roles.some(r => allowed.includes(r))) return true;

  return router.createUrlTree([ownDashboard(roles)]);
};
