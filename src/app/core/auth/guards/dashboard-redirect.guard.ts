import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

// QM and PM are not listed — they fall through to `return true` and stay at /dashboard
const ROLE_TO_PATH: Record<string, string> = {
  // Manager layer
  Director: '/dashboard/director',
  // Supervisor layer
  QE:       '/dashboard/qe',
  QS:       '/dashboard/supervisor',
  ME:       '/dashboard/qe',
  // Operator layer
  QT:       '/dashboard/operator',
  Operator: '/dashboard/operator',
};

export const dashboardRedirectGuard: CanActivateFn = () => {
  const auth   = inject(AuthStore);
  const router = inject(Router);
  const roles  = auth.currentUser()?.roles ?? [];

  for (const role of roles) {
    const path = ROLE_TO_PATH[role];
    if (path) return router.createUrlTree([path]);
  }
  return true; // fallback: render whatever component is here
};
