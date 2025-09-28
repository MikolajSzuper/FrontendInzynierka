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
  tab: 'add' | 'list' = 'add';

  products: Product[] = [];
  contractors: Contractor[] = [];
  selectedProducts: Set<string> = new Set();
  selectedContractor: number | '' = '';

  issuesList: any[] = [];
  selectedIssue: any = null;
  loadingIssues = false;
  loadingIssueDetails = false;

  editIssueUuid: string | null = null;
  editIssueData: any = {};
  productsToAdd: { [uuid: string]: boolean } = {};
  removedProducts: Set<string> = new Set();

  isSupervisor = localStorage.getItem('user_type') === 'SUPERVISOR';

  constructor(private http: HttpClient, private toast: ToastService) {}

  ngOnInit() {
    this.loadProducts();
    this.loadContractors();
  }

  loadProducts() {
    this.http.get<any>(apiUrl('/products?is_active=true'), { withCredentials: true }).subscribe({
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

  setTab(tab: 'add' | 'list') {
    this.tab = tab;
    if (tab === 'list') this.fetchIssuesList();
    if (tab === 'add') this.selectedIssue = null;
  }

  fetchIssuesList() {
    this.loadingIssues = true;
    this.http.get<any[]>(apiUrl('/productService/issues'), { withCredentials: true }).subscribe({
      next: (data) => {
        this.issuesList = (data ?? []).sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        this.loadingIssues = false;
      },
      error: () => {
        this.issuesList = [];
        this.loadingIssues = false;
        this.toast.show('error', 'Błąd', 'Nie udało się pobrać listy wydań');
      }
    });
  }

  showIssueDetails(uuid: string) {
    this.loadingIssueDetails = true;
    this.selectedIssue = null;
    this.http.get<any>(apiUrl(`/productService/issues/${uuid}`), { withCredentials: true }).subscribe({
      next: (data) => {
        this.selectedIssue = data;
        this.loadingIssueDetails = false;
      },
      error: () => {
        this.selectedIssue = null;
        this.loadingIssueDetails = false;
        this.toast.show('error', 'Błąd', 'Nie udało się pobrać szczegółów wydania');
      }
    });
  }

  closeIssueDetails() {
    this.selectedIssue = null;
  }

  get availableProductsForEdit() {
    const usedUuids = new Set([
      ...(this.selectedIssue?.products?.map((p: any) => p.uuid) ?? []),
      ...Array.from(this.removedProducts)
    ]);
    return this.products.filter(p => !usedUuids.has(p.uuid));
  }

  startEditIssue(issue: any) {
    this.editIssueUuid = issue.uuid;
    let contractorId = this.contractors.find(c => c.name === issue.contractor)?.id;
    if (!contractorId && typeof issue.contractor === 'number') {
      contractorId = issue.contractor;
    }
    this.editIssueData = {
      contractor: contractorId ?? '',
      products: issue.products.map((p: any) => p.uuid)
    };
    this.removedProducts = new Set();
    this.productsToAdd = {};
  }

  removeProductFromEdit(uuid: string) {
    if (this.removedProducts.has(uuid)) {
      this.removedProducts.delete(uuid);
    } else {
      this.removedProducts.add(uuid);
    }
  }

  cancelEditIssue() {
    this.editIssueUuid = null;
    this.editIssueData = {};
    this.removedProducts = new Set();
    this.productsToAdd = {};
  }

  saveEditIssue() {
    if (!this.editIssueUuid) return;
    const original = this.selectedIssue.products.map((p: any) => p.uuid);
    const kept: string[] = original.filter((uuid: string) => !this.removedProducts.has(uuid));
    const added = Object.entries(this.productsToAdd)
      .filter(([uuid, checked]) => checked)
      .map(([uuid]) => uuid);
    const payload = {
      contractor: String(this.editIssueData.contractor),
      products: [...kept, ...added]
    };
    this.http.put(apiUrl(`/productService/issues/${this.editIssueUuid}`), payload, {
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

        this.editIssueUuid = null;
        this.editIssueData = {};
        this.removedProducts = new Set();
        this.productsToAdd = {};
        this.showIssueDetails(this.selectedIssue.uuid);
        this.fetchIssuesList();
        this.loadProducts();
        this.toast.show('success', 'Sukces', 'Wydanie zostało zaktualizowane, plik został pobrany.');
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

          this.editIssueUuid = null;
          this.editIssueData = {};
          this.removedProducts = new Set();
          this.productsToAdd = {};
          this.showIssueDetails(this.selectedIssue.uuid);
          this.fetchIssuesList();
          this.loadProducts();
          this.toast.show('success', 'Sukces', 'Wydanie zostało zaktualizowane, plik został pobrany.');
          return;
        }
        this.toast.show('error', 'Błąd', 'Nie udało się zaktualizować wydania');
      }
    });
  }

  deleteIssue(uuid: string) {
    if (!confirm('Czy na pewno chcesz usunąć to wydanie?')) return;
    this.http.delete(apiUrl(`/productService/issues/${uuid}`), { withCredentials: true }).subscribe({
      next: () => {
        this.selectedIssue = null;
        this.fetchIssuesList();
        this.loadProducts();
        this.toast.show('success', 'Sukces', 'Wydanie zostało usunięte.');
      },
      error: (err) => {
        this.toast.show('error', 'Błąd', 'Nie udało się usunąć wydania');
      }
    });
  }
}
