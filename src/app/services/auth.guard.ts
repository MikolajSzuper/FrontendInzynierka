import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const AuthGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  //console.log('[AuthGuard] Sprawdzanie autoryzacji dla:', state.url);
  
  const isAuthenticated = await authService.checkAuth();
  
  if (!isAuthenticated) {
    //console.log('[AuthGuard] Brak autoryzacji, przekierowanie do logowania');
    router.navigate(['/']);
    return false;
  }

  //console.log('[AuthGuard] Autoryzacja OK');
  return true;
};
