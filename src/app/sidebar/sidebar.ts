import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { apiUrl } from '../services/api';


@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  isAdmin = localStorage.getItem('user_type') === 'ADMIN';
  isSupervisor = localStorage.getItem('user_type') === 'SUPERVISOR';

  downloadReport() {
    fetch(apiUrl('/warehouseManagement/warehouses/report'), {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'raport_stan_magazynu.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }
}
