import { Component, OnInit, OnDestroy } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { Profile } from '../profile/profile';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  imports: [Sidebar, Profile, RouterOutlet, CommonModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout implements OnInit, OnDestroy {
  public currentYear: number = new Date().getFullYear();
  private authSubscription?: Subscription;
  
  constructor(private authService: AuthService) {}
  
  ngOnInit() {
    // Autoryzacja na start
    this.authService.checkAuth();
    
    // Zmiany w autoryzacji
    this.authSubscription = this.authService.isAuthenticated$.subscribe(isAuth => {
      if (!isAuth) {
        console.log('[MainLayout] Utrata autoryzacji');
      }
    });
  }
  
  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
  }
}