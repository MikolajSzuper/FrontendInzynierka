import { Component } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  imports: [NgClass, NgStyle, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  menuOpen = false;
  userName = localStorage.getItem('user_name') || 'Jan Kowalski';

  constructor(private http: HttpClient) {}

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  logout() {
    this.http.get('/api/auth/logout', { withCredentials: true }).subscribe({
      next: () => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_type');
        window.location.href = '/?logout=true';
      },
      error: () => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_type');
        window.location.href = '/?logout=true';
      }
    });
  }
}
