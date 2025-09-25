import { Component } from '@angular/core';
import { NgClass, CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../services/api';
import { WAREHOUSE_UUID } from '../../app.config';

interface Location {
  id: number;
  spot_uuid: string;
  spot_name: string;
  shelf: number;
  shelf_uuid: string;
  shelf_name: string;
  hall: number;
  hall_uuid: string;
  hall_name: string;
  warehouse: number;
  warehouse_uuid: string;
  warehouse_name: string;
  _free: boolean;
}

interface ShelfView {
  id: string;
  name: string;
  occupied: number;
  total: number;
}

interface HallView {
  id: string;
  name: string;
  racks: ShelfView[];
}

@Component({
  selector: 'app-halls',
  imports: [NgClass, CommonModule],
  templateUrl: './halls.html',
  styleUrl: './halls.css'
})
export class Halls {
  halls: HallView[] = [];
  selectedHall: HallView | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any>(apiUrl(`/warehouseManagement/warehouses/${WAREHOUSE_UUID}`), { withCredentials: true }).subscribe({
      next: (data) => {
        this.halls = this.mapLocationsToHalls(data.locations);
        if (this.halls.length > 0) this.selectedHall = this.halls[0];
      },
      error: (err) => console.error('Error fetching halls:', err)
    });
  }

  selectHall(hall: HallView) {
    this.selectedHall = hall;
  }

  private mapLocationsToHalls(locations: Location[]): HallView[] {
    const hallsMap = new Map<string, { name: string; racks: Map<string, ShelfView> }>();

    for (const loc of locations) {
      if (!hallsMap.has(loc.hall_uuid)) {
        hallsMap.set(loc.hall_uuid, {
          name: loc.hall_name,
          racks: new Map<string, ShelfView>()
        });
      }
      const hall = hallsMap.get(loc.hall_uuid)!;

      if (!hall.racks.has(loc.shelf_uuid)) {
        hall.racks.set(loc.shelf_uuid, {
          id: loc.shelf_uuid,
          name: loc.shelf_name,
          occupied: 0,
          total: 0
        });
      }
      const shelf = hall.racks.get(loc.shelf_uuid)!;
      shelf.total += 1;
      if (!loc._free) shelf.occupied += 1;
    }

    return Array.from(hallsMap.entries()).map(([id, hall]) => ({
      id,
      name: hall.name,
      racks: Array.from(hall.racks.values())
    }));
  }
}
