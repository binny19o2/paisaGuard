import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../../core/services/transaction-service';
import { TRANSACTION_CATEGORIES } from '../../shared/transaction.config';
import { NavbarComponent } from '../../shared/components/navbar-component/navbar-component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth-service';
import { CommonModule} from '@angular/common';
import { Observable, of, switchMap } from 'rxjs';
import { Transaction } from '../../core/models';

@Component({
  selector: 'app-transactions',
  imports: [NavbarComponent,FormsModule,CommonModule],
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
  showForm = false;
  editingId: string | null = null;

  transactions$: Observable<Transaction[]> = of([]);
  pageSize = 10;
  currentPage = 1;

  constructor(
    private txnService: TransactionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.transactions$ = this.authService.currentUser$.pipe(
      switchMap(user => user ? this.txnService.getAllTransactions(user.uid) : of([]))
    );
  }

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
    this.editingId = null;
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
      if (this.editingId) {
        await this.txnService.updateTransaction(this.editingId, {
          userId,
          type: this.type,
          amount: Number(this.form.amount),
          category: this.form.category,
          account: this.form.account,
          note: this.form.note,
          color: selectedCategory?.color || '',
          createdAt: new Date(this.form.createdAt)
        });
        this.showUserMessage('Transaction updated successfully.', 'success');
      } else {
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
        this.showUserMessage('Transaction saved successfully.', 'success');
      }

      this.resetForm();
      this.showForm = false;
    } catch (error) {
      console.error('Error saving transaction', error);
      this.showUserMessage('Failed to save transaction. Please try again.', 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

  onEdit(txn: Transaction) {
    this.editingId = txn.id || null;
    this.type = txn.type;
    this.categories = TRANSACTION_CATEGORIES[this.type];
    this.form = {
      amount: txn.amount,
      category: txn.category,
      account: txn.account,
      note: txn.note || '',
      createdAt: this.toDateTimeLocal(txn.createdAt)
    };
    this.showForm = true;
  }

  onDelete(id?: string) {
    if (!id) return;
    const confirmed = window.confirm('Are you sure you want to delete this transaction?');
    if (!confirmed) return;
    this.txnService.deleteTransaction(id).catch(err => {
      console.error('Error deleting transaction', err);
      this.showUserMessage('Failed to delete transaction.', 'error');
    });
  }

  private toDateTimeLocal(dateValue: any) {
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }

  private showUserMessage(text: string, type: 'success' | 'error') {
    this.messageText = text;
    this.messageType = type;
    this.showMessage = true;
    setTimeout(() => {
      this.showMessage = false;
    }, 500);
  }

  onPageChange(direction: 'prev' | 'next', total: number) {
    const maxPage = this.calcMaxPage(total);
    if (direction === 'prev' && this.currentPage > 1) {
      this.currentPage--;
    } else if (direction === 'next' && this.currentPage < maxPage) {
      this.currentPage++;
    }
  }

  calcMaxPage(total: number): number {
    return total > 0 ? Math.ceil(total / this.pageSize) : 1;
  }
}
