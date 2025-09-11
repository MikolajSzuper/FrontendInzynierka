import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from '../services/toast-service';
import { apiUrl } from '../services/api';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  username = '';
  password = '';

  constructor(private router: Router, private toast: ToastService, private http: HttpClient) {}

  login() {
    const body = {
      username: this.username,
      password: this.password
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    this.http.post<{ token: string; userType: string }>(apiUrl('/auth/login'), body, { headers, withCredentials: true }).subscribe({
      next: (res) => {
        localStorage.setItem('jwt', res.token);
        localStorage.setItem('user_type', res.userType);
        this.toast.show('success', 'Sukces', 'Zalogowano pomyślnie!');
        if (res.userType === 'ADMIN') {
          this.router.navigate(['/app/users']);
        } else {
          this.router.navigate(['/app/halls']);
        }
      },
      error: (err) => {
        this.toast.show('error', 'Błąd', err?.error?.message || 'Nieprawidłowy login lub hasło.');
      }
    });
  }
}