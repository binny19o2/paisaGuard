import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../../core/services/transaction-service';
import { TRANSACTION_CATEGORIES } from '../../shared/transaction.config';
import { NavbarComponent } from '../../shared/components/navbar-component/navbar-component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import { CommonModule, NgFor, NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-transactions',
  imports: [NavbarComponent,FormsModule,CommonModule,NgForOf,NgFor,NgIf],
  templateUrl: './transactions-component.html'
})
export class TransactionsComponent implements OnInit {

  type: 'income' | 'expense' = 'expense';
  categories = TRANSACTION_CATEGORIES.expense;

  form = {
    amount: null as number | null,
    category: '',
    account: 'cash',
    note: '',
    createdAt: this.defaultDateTime()
  };

  isSubmitting = false;
  showMessage = false;
  messageText = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private txnService: TransactionService,
    private authService: AuthService
  ) {}

  ngOnInit() {}

  onTypeChange() {
    this.categories = TRANSACTION_CATEGORIES[this.type];
    this.form.category = '';
  }

  private defaultDateTime() {
    const now = new Date();
    // datetime-local expects format YYYY-MM-DDTHH:MM
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }

  resetForm() {
    this.form = {
      amount: null,
      category: '',
      account: 'cash',
      note: '',
      createdAt: this.defaultDateTime()
    };
  }

  async submit() {
    const userId = this.authService.getCurrentUserId();
    if (!userId || !this.form.amount || !this.form.category) {
      this.showUserMessage('Please fill in all required fields.', 'error');
      return;
    }

    const selectedCategory = this.categories.find(c => c.name === this.form.category);

    this.isSubmitting = true;
    try {
      await this.txnService.addTransaction({
        userId,
        type: this.type,
        amount: Number(this.form.amount),
        category: this.form.category,
        account: this.form.account,
        note: this.form.note,
        color: selectedCategory?.color || '',
        createdAt: new Date(this.form.createdAt)
      });

      this.resetForm();
      this.showUserMessage('Transaction saved successfully.', 'success');
    } catch (error) {
      console.error('Error saving transaction', error);
      this.showUserMessage('Failed to save transaction. Please try again.', 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

  private showUserMessage(text: string, type: 'success' | 'error') {
    this.messageText = text;
    this.messageType = type;
    this.showMessage = true;
    setTimeout(() => {
      this.showMessage = false;
    }, 500);
  }
}
