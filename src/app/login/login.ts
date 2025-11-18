import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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

  showForgotModal = false;
  forgotUsername = '';
  forgotEmail = '';
  forgotSending = false;

  constructor(
    private router: Router,
    private toast: ToastService,
    private http: HttpClient,
    private route: ActivatedRoute 
  ) {
    this.route.queryParams.subscribe(params => {
      if ('logout' in params) {
        this.toast.show('success', 'Wylogowano', 'Wylogowano pomyślnie!');
      }
    });
  }

  login() {
    const body = {
      username: this.username,
      password: this.password
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    this.http.post<{ userType: string }>(apiUrl('/auth/login'), body, { headers, withCredentials: true }).subscribe({
      next: (res) => {
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

  openForgotModal() {
    this.showForgotModal = true;
    this.forgotUsername = '';
    this.forgotEmail = '';
  }

  closeForgotModal() {
    this.showForgotModal = false;
  }

  sendForgotPassword() {
    const username = String(this.forgotUsername || '').trim();
    const email = String(this.forgotEmail || '').trim();

    const required = [
      { value: username, label: 'Login' },
      { value: email, label: 'E-mail' }
    ];
    const missing = required
      .filter(f => f.value === null || f.value === undefined || (typeof f.value === 'string' && f.value.trim() === ''))
      .map(f => f.label);
    if (missing.length > 0) {
      this.toast.show('error', 'Błąd', `Brakuje pól: ${missing.join(', ')}`);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.toast.show('error', 'Błąd', 'Nieprawidłowy format e-mail.');
      return;
    }
    this.forgotSending = true;
    const payload = {
      username: this.forgotUsername.trim(),
      email: this.forgotEmail.trim(),
      content: 'Proszę o zmianę hasła',
      type: 'PASSWORD'
    };
    this.http.post(apiUrl('/auth/reports'), payload, { withCredentials: true }).subscribe({
      next: () => {
        this.toast.show('success', 'Sukces', 'Prośba o zmianę hasła została wysłana!');
        this.forgotSending = false;
        this.closeForgotModal();
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        this.forgotSending = false;
      }
    });
  }
}