import { Routes } from '@angular/router';
import { Login } from './login/login';
import { MainLayout } from './main-layout/main-layout';
import { Halls } from './pages/halls/halls';
import { Management } from './pages/management/management';
import { Search } from './pages/search/search';
import { Inventory } from './pages/inventory/inventory';
import { Users } from './pages/users/users';
import { Help } from './pages/help/help';
import { AuthGuard } from './services/auth.guard';
import { adminGuard } from './services/admin-guard';
import { UserGuard } from './services/user-guard';

export const routes: Routes = [
  { path: '', component: Login },
  { 
    path: 'app', 
    component: MainLayout, 
    canActivate: [AuthGuard],
    children: [
      // Ścieżki tylko dla administratora
      { 
        path: 'users', 
        component: Users, 
        canActivate: [adminGuard]
      },
      
      // Ścieżki tylko dla zwykłego użytkownika
      { 
        path: 'halls', 
        component: Halls, 
        canActivate: [UserGuard]
      },
      { 
        path: 'management', 
        component: Management, 
        canActivate: [UserGuard]
      },
      { 
        path: 'search', 
        component: Search, 
        canActivate: [UserGuard]
      },
      { 
        path: 'inventory', 
        component: Inventory, 
        canActivate: [UserGuard]
      },
      
      // Ścieżki wspólne
      { 
        path: 'help', 
        component: Help
      },
      
      // Domyślne przekierowanie
      { 
        path: '', 
        redirectTo: localStorage.getItem('user_type') === 'ADMIN' ? 'users' : 'halls', 
        pathMatch: 'full'
      }
    ]
  }
];
