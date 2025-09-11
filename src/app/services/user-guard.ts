import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const UserGuard: CanActivateFn = (route, state) => {
  const userType = localStorage.getItem('user_type');
  const router = inject(Router);
  
  if (userType !== 'ADMIN') {
    return true;
  }
  
  router.navigate(['/app/users']);
  return false;
};