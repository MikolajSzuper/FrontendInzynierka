import { Component } from '@angular/core';
import { NgClass, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../services/api';

@Component({
  selector: 'app-halls',
  imports: [NgClass, CommonModule],
  templateUrl: './halls.html',
  styleUrl: './halls.css'
})
export class Halls {
  halls: any[] = [];
  selectedHall: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<{ halls: any[] }>(apiUrl('/halls')).subscribe({
      next: (data) => {
        this.halls = data.halls;
        if (this.halls.length > 0) this.selectedHall = this.halls[0];
      },
      error: (err) => console.error('Error fetching halls:', err)
    });
  }

  selectHall(hall: any) {
    this.selectedHall = hall;
  }
}
