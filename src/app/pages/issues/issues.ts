import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../services/api';
import { ToastService } from '../../services/toast-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Product {
  uuid: string;
  name: string;
  category: { id: number; name: string };
  spot: {
    id: number;
    name: string;
    shelf: { name: string; hall: { name: string } };
  };
  contractor: string;
  updated_at: string;
  rfid: string;
}

interface Contractor {
  id: number;
  name: string;
}

@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './issues.html',
  styleUrl: './issues.css'
})
export class Issues implements OnInit {
  products: Product[] = [];
  contractors: Contractor[] = [];
  selectedProducts: Set<string> = new Set();
  selectedContractor: number | '' = '';

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit() {
    this.loadProducts();
    this.loadContractors();
  }

  loadProducts() {
    this.http.get<any>(apiUrl('/products?is_active=true'), { withCredentials: true }).subscribe({
      next: (data) => {
        this.products = data.content;
      },
      error: (err) => {
        if (err.status === 400) {
          this.products = [];
        } else {
          this.toast.show('error', 'Błąd', 'Nie udało się pobrać produktów');
        }
      }
    });
  }

  loadContractors() {
    this.http.get<Contractor[]>(apiUrl('/contractors/'), { withCredentials: true }).subscribe({
      next: (data) => {
        this.contractors = data;
      },
      error: () => {
        this.toast.show('error', 'Błąd', 'Nie udało się pobrać kontrahentów');
      }
    });
  }

  toggleProduct(uuid: string, checked: boolean) {
    if (checked) {
      this.selectedProducts.add(uuid);
    } else {
      this.selectedProducts.delete(uuid);
    }
  }

  issueProducts() {
    if (!this.selectedContractor || this.selectedProducts.size === 0) return;
    const payload = {
      contractor: String(this.selectedContractor),
      products: Array.from(this.selectedProducts)
    };
    this.http.post(apiUrl('/productService/issues'), payload, {
      withCredentials: true,
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const filename = 'wydanie.docx';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.show('success', 'Sukces', 'Wydanie zostało dodane, plik został pobrany.');
        this.selectedProducts.clear();
        this.selectedContractor = '';
        this.loadProducts();
      },
      error: (err) => {
        if (err.status === 200 && err.error instanceof Blob) {
          const filename = 'wydanie.docx';
          const url = window.URL.createObjectURL(err.error);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
          this.toast.show('success', 'Sukces', 'Wydanie zostało dodane, plik został pobrany.');
          this.selectedProducts.clear();
          this.selectedContractor = '';
          this.loadProducts();
          return;
        }
        this.toast.show('error', 'Błąd', 'Nie udało się dodać wydania');
        console.error('Błąd wydania produktu:', err);
      }
    });
  }
}
