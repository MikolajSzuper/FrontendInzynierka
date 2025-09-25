import { HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
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

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('jwt');
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err) => {
      if (err.status === 401) {
        logout();
      }
      return throwError(() => err);
    })
  );
};