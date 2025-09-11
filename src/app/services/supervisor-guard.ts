import { CanActivateFn } from '@angular/router';

export const SupervisorGuard: CanActivateFn = () => {
  return localStorage.getItem('user_type') === 'SUPERVISOR';
};