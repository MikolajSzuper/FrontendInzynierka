import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { apiUrl } from './api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  async checkAuth(): Promise<boolean> {
    try {
      const user = await this.http.get<{ name: string; surname: string; userType: string }>(
        apiUrl('/auth/auto-login'), 
        { withCredentials: true }
      ).toPromise();
      
      if (user) {
        localStorage.setItem('user_name', `${user.name} ${user.surname}`);
        localStorage.setItem('user_type', user.userType);
        this.isAuthenticatedSubject.next(true);
        return true;
      }
      
      this.isAuthenticatedSubject.next(false);
      return false;
    } catch (err) {
      this.isAuthenticatedSubject.next(false);
      return false;
    }
  }

  logout(): void {
    this.http.get(apiUrl('/auth/logout'), { withCredentials: true }).subscribe({
      next: () => {
        this.clearAuthData();
      },
      error: () => {
        this.clearAuthData();
      }
    });
  }

  private clearAuthData(): void {
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_type');
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/?logout=true']);
  }
}
