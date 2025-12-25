import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar-component/navbar-component';
import { InvestmentService } from '../../core/services/investment-service';
import { AuthService } from '../../core/services/auth-service';
import { Investment } from '../../core/models';
import { Observable, of, switchMap } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { INVESTMENT_TYPES } from '../../shared/investment.config';

@Component({
  selector: 'app-investments-component',
  imports: [NavbarComponent, CommonModule, FormsModule],
  templateUrl: './investments-component.html',
  styleUrl: './investments-component.css',
})
export class InvestmentsComponent implements OnInit {
  investmentService = inject(InvestmentService);
  authService = inject(AuthService);

  investments$: Observable<Investment[]> = of([]);
  showForm = false;
  showModal = false;
  selectedInvestment: Investment | null = null;
  editingId: string | null = null;
  investmentTypes = INVESTMENT_TYPES;

  form = {
    name: '',
    type: '',
    amount: null as number | null,
    interest: null as number | null,
    startDate: '',
    duration: null as number | null
  };

  isSubmitting = false;
  showMessage = false;
  messageText = '';
  messageType: 'success' | 'error' = 'success';

  ngOnInit() {
    this.investments$ = this.authService.currentUser$.pipe(
      switchMap(user => user ? this.investmentService.getAllInvestments(user.uid) : of([]))
    );
  }

  openAddForm() {
    this.editingId = null;
    this.resetForm();
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editingId = null;
    this.resetForm();
  }

  onEdit(investment: Investment, event: Event) {
    event.stopPropagation();
    this.editingId = investment.id || null;
    this.form = {
      name: investment.name,
      type: investment.type,
      amount: investment.amount,
      interest: investment.interest,
      startDate: this.toDateString(investment.startDate),
      duration: investment.duration || null
    };
    this.showForm = true;
  }

  onDelete(investment: Investment, event: Event) {
    event.stopPropagation();
    const confirmed = window.confirm(`Are you sure you want to delete "${investment.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    if (!investment.id) return;
    this.investmentService.deleteInvestment(investment.id).then(() => {
      this.showUserMessage('Investment deleted successfully.', 'success');
    }).catch(err => {
      console.error('Error deleting investment', err);
      this.showUserMessage('Failed to delete investment.', 'error');
    });
  }

  openModal(investment: Investment) {
    this.selectedInvestment = investment;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedInvestment = null;
  }

  resetForm() {
    this.form = {
      name: '',
      type: '',
      amount: null,
      interest: null,
      startDate: '',
      duration: null
    };
    this.editingId = null;
  }

  async submit() {
    const userId = this.authService.getCurrentUserId();
    if (!userId || !this.form.name || !this.form.type || !this.form.amount || !this.form.interest || !this.form.startDate) {
      this.showUserMessage('Please fill in all required fields.', 'error');
      return;
    }

    if (this.form.amount <= 0 || this.form.interest < 0) {
      this.showUserMessage('Amount must be greater than 0 and interest rate cannot be negative.', 'error');
      return;
    }

    this.isSubmitting = true;
    try {
      const investmentData: any = {
        userId,
        name: this.form.name,
        type: this.form.type,
        amount: Number(this.form.amount),
        interest: Number(this.form.interest),
        startDate: Timestamp.fromDate(new Date(this.form.startDate))
      };

      if (this.form.duration) {
        investmentData.duration = Number(this.form.duration);
      }

      if (this.editingId) {
        await this.investmentService.updateInvestment(this.editingId, investmentData);
        this.showUserMessage('Investment updated successfully!', 'success');
      } else {
        await this.investmentService.addInvestment(investmentData);
        this.showUserMessage('Investment created successfully!', 'success');
      }

      this.closeForm();
    } catch (error) {
      console.error('Error saving investment', error);
      this.showUserMessage('Failed to save investment. Please try again.', 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

  getExpectedReturn(investment: Investment): number {
    if (!investment.duration || investment.duration === 0) return investment.amount;
    const years = investment.duration / 12; // assuming duration is in months
    const principal = investment.amount;
    const rate = investment.interest / 100;
    return principal * Math.pow(1 + rate, years);
  }

  getMaturityDate(investment: Investment): Date | null {
    if (!investment.duration) return null;
    const startDate = this.toDate(investment.startDate);
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(maturityDate.getMonth() + investment.duration);
    return maturityDate;
  }

  getTypeColor(type: string): string {
    const investmentType = this.investmentTypes.find(t => t.name === type);
    return investmentType?.color || 'bg-gray-100 text-gray-700';
  }

  toDate(value: any): Date {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (value?.toDate) return value.toDate();
    return new Date(value);
  }

  toDateString(value: any): string {
    const date = this.toDate(value);
    return date.toISOString().split('T')[0];
  }

  private showUserMessage(text: string, type: 'success' | 'error') {
    this.messageText = text;
    this.messageType = type;
    this.showMessage = true;
    setTimeout(() => {
      this.showMessage = false;
    }, 1000);
  }
}
