import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  // During SSR there is no sessionStorage — let the client handle auth
  if (!isPlatformBrowser(platformId)) return true;

  const authStore = inject(AuthStore);
  const router = inject(Router);
  if (authStore.isAuthenticated()) return true;
  return router.createUrlTree(['/signin']);
};
