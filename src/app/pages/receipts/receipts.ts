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
  selector: 'app-receipts',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './receipts.html',
  styleUrl: './receipts.css'
})
export class Receipts implements OnInit {
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
    this.http.get<any>(apiUrl('/products?is_active=false&issued=false'), { withCredentials: true }).subscribe({
      next: (data) => {
        this.products = data.content ?? [];
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

  addReceipt() {
    if (!this.selectedContractor || this.selectedProducts.size === 0) return;
    const payload = {
      contractor: String(this.selectedContractor),
      products: Array.from(this.selectedProducts)
    };
    this.http.post(apiUrl('/productService/receipts'), payload, {
      withCredentials: true,
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const filename = 'przyjecie.docx';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toast.show('success', 'Sukces', 'Przyjęcie zostało dodane, plik został pobrany.');
        this.selectedProducts.clear();
        this.selectedContractor = '';
        this.loadProducts();
      },
      error: (err) => {
        if (err.status === 200 && err.error instanceof Blob) {
          const filename = 'przyjecie.docx';
          const url = window.URL.createObjectURL(err.error);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
          this.toast.show('success', 'Sukces', 'Przyjęcie zostało dodane, plik został pobrany.');
          this.selectedProducts.clear();
          this.selectedContractor = '';
          this.loadProducts();
          return;
        }
        if (err.status === 400 && err.error instanceof Blob) {
          err.error.text().then((msg: string) => {
            this.toast.show('error', 'Błąd', msg);
            console.error('Błąd dodawania produktu:', msg);
          });
          return;
        }
        this.toast.show('error', 'Błąd', 'Nie udało się dodać przyjęcia');
        console.error('Błąd dodawania produktu:', err);
      }
    });
  }
}
