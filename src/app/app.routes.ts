import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [noAuthGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'transactions',
    loadComponent: () => import('./features/transactions-component/transactions-component').then(m => m.TransactionsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'goals',
    loadComponent: () => import('./features/goals-component/goals-component').then(m => m.GoalsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics-component/analytics-component').then(m => m.AnalyticsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'investments',
    loadComponent: () => import('./features/investments-component/investments-component').then(m => m.InvestmentsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile-components/profile-components').then(m => m.ProfileComponents),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/auth'
  }

];