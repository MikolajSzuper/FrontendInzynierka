import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError, from } from 'rxjs';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { apiUrl } from './api';

function logout() {
  // Wywołanie logout na backendzie
  fetch(apiUrl('/auth/logout'), {
    method: 'GET',
    credentials: 'include'
  }).finally(() => {
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_type');
    window.location.href = '/?logout=true';
  });
}

async function validateAuth(http: HttpClient): Promise<boolean> {
  try {
    //console.log('[AuthInterceptor] Sprawdzanie autoryzacji...');
    const user = await http.get<{ name: string; surname: string; userType: string }>(
      apiUrl('/auth/auto-login'), 
      { withCredentials: true }
    ).toPromise();
    
    if (user) {
      localStorage.setItem('user_name', `${user.name} ${user.surname}`);
      localStorage.setItem('user_type', user.userType);
      //console.log('[AuthInterceptor] Autoryzacja OK:', user);
      return true;
    }
    return false;
  } catch (err) {
    //console.error('[AuthInterceptor] Błąd autoryzacji:', err);
    return false;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);
  
  if (req.url.includes('/auth/login') || req.url.includes('/auth/auto-login')) {
    return next(req.clone({ withCredentials: true }));
  }

  return from(validateAuth(http)).pipe(
    switchMap((isValid) => {
      if (!isValid) {
        logout();
        return throwError(() => new Error('Unauthorized'));
      }
      
      const authReq = req.clone({ withCredentials: true });
      return next(authReq).pipe(
        catchError((err) => {
          if (err.status === 401) {
            logout();
          }
          return throwError(() => err);
        })
      );
    })
  );
};