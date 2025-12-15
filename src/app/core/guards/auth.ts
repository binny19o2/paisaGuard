import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  // Temporarily disable guard: always allow navigation.
  // Original logic preserved below for easy revert.
  // return true;

  
  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login page
  router.navigate(['/auth']);
  return false;
  
};

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  // Temporarily disable guard: always allow navigation.
  // Original logic preserved below for easy revert.
  // return true;

  
  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect to dashboard if already logged in
  router.navigate(['/dashboard']);
  return false;
  
};