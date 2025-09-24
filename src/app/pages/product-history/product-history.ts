import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../services/api';

@Component({
  selector: 'app-product-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-history.html',
  styleUrl: './product-history.css'
})
export class ProductHistory {
  uuid = '';
  loading = false;
  history: any[] = [];

  constructor(private http: HttpClient) {}

  fetchHistory() {
    this.history = [];
    if (!this.uuid.trim()) return;
    this.loading = true;
    this.http.get<any>(apiUrl(`/products/history/${this.uuid.trim()}`), { withCredentials: true }).subscribe({
      next: (res) => {
        this.history = (res.productHistory || []).sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
      }
    });
  }
}
