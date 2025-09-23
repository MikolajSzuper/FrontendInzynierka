import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { apiUrl } from '../../services/api';
import { ToastService } from '../../services/toast-service';

@Component({
  selector: 'app-help',
  imports: [CommonModule, FormsModule],
  templateUrl: './help.html',
  styleUrl: './help.css'
})
export class Help {
  content = '';
  sending = false;
  username = '';
  email = '';

  constructor(private http: HttpClient, private toast: ToastService) {}

  sendReport() {
    if (!this.username.trim() || !this.email.trim() || !this.content.trim()) return;
    this.sending = true;
    const payload = {
      username: this.username.trim(),
      email: this.email.trim(),
      content: this.content.trim(),
      type: 'NORMAL'
    };
    this.http.post(apiUrl('/auth/reports'), payload, { withCredentials: true }).subscribe({
      next: () => {
        this.content = '';
        this.username = '';
        this.email = '';
        this.sending = false;
        this.toast.show('success', 'Sukces', 'Zgłoszenie zostało wysłane!');
      },
      error: (err) => {
        const msg = err?.error?.[0]?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        this.sending = false;
      }
    });
  }
}
