import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './management.html',
  styleUrl: './management.css'
})
export class Management {
  activeTab: 'addItem' | 'halls' | 'categories' = 'addItem';

  isSupervisor = localStorage.getItem('user_type') === 'SUPERVISOR';

  item: {
    id: string;
    name: string;
    category: string;
    hall: string;
    rack: string;
    place: string;
  } = {
    id: '',
    name: '',
    category: '',
    hall: '',
    rack: '',
    place: ''
  };

  setTab(tab: 'addItem' | 'halls' | 'categories') {
    this.activeTab = tab;
    this.clearAllFields();
  }

  clearField(field: keyof typeof this.item) {
    this.item[field] = '';
  }

  clearAllFields() {
    this.item = {
      id: '',
      name: '',
      category: '',
      hall: '',
      rack: '',
      place: ''
    };
  }
}
