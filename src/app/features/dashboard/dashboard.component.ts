import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth-service';
import { User } from '../../core/models';
import { NavbarComponent } from '../../shared/components/navbar-component/navbar-component';
import { TransactionService } from '../../core/services/transaction-service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  txnService = inject(TransactionService);
  authService = inject(AuthService);
  currentUser: User | null = null;
  recentTransactions$ = this.authService.currentUser$.pipe(
    switchMap(user => user ? this.txnService.getRecentTransactions(user.uid) : of([]))
  );
  overview$ = this.authService.currentUser$.pipe(
    switchMap(user => user ? this.txnService.getUserOverview(user.uid) : of({ income: 0, expense: 0, balance: 0 }))
  );
  constructor(
    // private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth']);
  }
}