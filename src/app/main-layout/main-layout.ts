import { Component } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { Profile } from '../profile/profile';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [Sidebar, Profile, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout {
  public currentYear: number = new Date().getFullYear();
}