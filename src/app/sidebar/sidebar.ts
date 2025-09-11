import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';


@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  isAdmin = localStorage.getItem('user_type') === 'ADMIN';
  isSupervisor = localStorage.getItem('user_type') === 'SUPERVISOR';
}
