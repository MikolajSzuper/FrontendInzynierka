import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { apiUrl } from './api';

export const AuthGuard: CanActivateFn = async (route, state) => {
  const token = localStorage.getItem('jwt');
  const router = inject(Router);
  const http = inject(HttpClient);

  if (!token) {
    router.navigate(['/']);
    return false;
  }

  try {
    const user = await firstValueFrom(
      http.get<{ name: string; surname: string; userType: string  }>(apiUrl('/auth/auto-login'), { withCredentials: true })
    );
    localStorage.setItem('user_name', `${user.name} ${user.surname}`);
    localStorage.setItem('user_type', user.userType);
    return true;
  } catch {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_type');
    router.navigate(['/']);
    return false;
  }
};
