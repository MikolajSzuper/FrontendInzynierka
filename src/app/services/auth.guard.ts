import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { apiUrl } from './api';

// Pomocnicza funkcja do pobierania ciasteczka po nazwie
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export const AuthGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const http = inject(HttpClient);

  try {
    //console.log('[AuthGuard] Próba auto-login przez /auth/auto-login');
    const user = await firstValueFrom(
      http.get<{ name: string; surname: string; userType: string }>(apiUrl('/auth/auto-login'), { withCredentials: true })
    );
    //console.log('[AuthGuard] Auto-login OK, user:', user);
    localStorage.setItem('user_name', `${user.name} ${user.surname}`);
    localStorage.setItem('user_type', user.userType);
    return true;
  } catch (err) {
    //console.error('[AuthGuard] Auto-login nieudany:', err);
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_type');
    router.navigate(['/']);
    return false;
  }
};
