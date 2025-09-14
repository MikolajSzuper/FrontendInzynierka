import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../services/api';
import { ToastService } from '../../services/toast-service';
import { CommonModule, DatePipe } from '@angular/common';
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
  weight?: number;
  height?: number;
  width?: number;
  description?: string;
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
  categories: Array<{ id: number, name: string }> = [];

  editProductUuid: string | null = null;
  editProductData: any = {};

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit() {
    this.loadProducts();
    this.loadContractors();
    this.loadCategories(); // Dodaj ładowanie kategorii
  }

  loadProducts() {
    this.http.get<any>(apiUrl('/products?is_active=false'), { withCredentials: true }).subscribe({
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

  loadCategories() {
    this.http.get<Array<{ id: number, name: string }>>(apiUrl('/products/categories'), { withCredentials: true }).subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        this.toast.show('error', 'Błąd', 'Nie udało się pobrać kategorii');
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
        // Jeśli status 200 i odpowiedź to blob, potraktuj jako sukces
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
        this.toast.show('error', 'Błąd', 'Nie udało się dodać przyjęcia');
        console.error('Błąd dodawania produktu:', err);
      }
    });
  }

  startEditProduct(product: Product) {
    this.editProductUuid = product.uuid;
    this.http.get<any>(apiUrl(`/products/${product.uuid}`), { withCredentials: true }).subscribe({
      next: (details) => {
        this.editProductData = {
          rfid: product.rfid,
          name: product.name,
          category: product.category.id,
          description: details.description || '',
          weight: details.weight ?? null,
          height: details.height ?? null,
          width: details.width ?? null,
          contractor: details.contractor
        };
      },
      error: () => {
        this.toast.show('error', 'Błąd', 'Nie udało się pobrać szczegółów produktu');
        this.editProductData = {
          rfid: product.rfid,
          name: product.name,
          category: product.category.id,
          description: '',
          weight: null,
          height: null,
          width: null,
          contractor: product.contractor
        };
      }
    });
  }

  cancelEditProduct() {
    this.editProductUuid = null;
    this.editProductData = {};
  }

  saveEditProduct() {
    if (!this.editProductUuid) return;
    const payload = {
      rfid: this.editProductData.rfid,
      name: this.editProductData.name,
      category: Number(this.editProductData.category),
      description: this.editProductData.description,
      weight: Number(this.editProductData.weight),
      height: Number(this.editProductData.height),
      width: Number(this.editProductData.width),
      contractor: this.editProductData.contractor
    };
    console.log(payload);
    this.http.put(apiUrl(`/products/${this.editProductUuid}`), payload, { withCredentials: true }).subscribe({
      next: () => {
        this.editProductUuid = null;
        this.editProductData = {};
        this.loadProducts();
        this.toast.show('success', 'Sukces', 'Produkt został pomyślnie edytowany.');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas edycji produktu:', err);
      }
    });
  }

  deleteProduct(uuid: string) {
    if (!confirm('Czy na pewno chcesz usunąć ten produkt?')) return;
    this.http.delete(apiUrl(`/products/${uuid}`), { withCredentials: true }).subscribe({
      next: () => {
        this.loadProducts();
        this.toast.show('success', 'Sukces', 'Produkt został pomyślnie usunięty.');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Wystąpił błąd';
        this.toast.show('error', 'Błąd', msg);
        console.error('Błąd podczas usuwania produktu:', err);
      }
    });
  }
}
