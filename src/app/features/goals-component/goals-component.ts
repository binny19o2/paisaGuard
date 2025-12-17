import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from "../../shared/components/navbar-component/navbar-component";
import { GoalService } from '../../core/services/goal-service';
import { AuthService } from '../../core/services/auth-service';
import { Goal } from '../../core/models';
import { Observable, of, switchMap } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-goals-component',
  imports: [NavbarComponent, CommonModule, FormsModule],
  templateUrl: './goals-component.html',
  styleUrl: './goals-component.css',
})
export class GoalsComponent implements OnInit {
  goalService = inject(GoalService);
  authService = inject(AuthService);

  goals$: Observable<Goal[]> = of([]);
  showForm = false;
  showModal = false;
  selectedGoal: Goal | null = null;
  editingId: string | null = null;

  form = {
    name: '',
    targetAmount: null as number | null,
    currentSaved: null as number | null,
    targetDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  };

  isSubmitting = false;
  showMessage = false;
  messageText = '';
  messageType: 'success' | 'error' = 'success';

  ngOnInit() {
    this.goals$ = this.authService.currentUser$.pipe(
      switchMap(user => user ? this.goalService.getAllGoals(user.uid) : of([]))
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

  onEdit(goal: Goal, event: Event) {
    event.stopPropagation();
    this.editingId = goal.id || null;
    this.form = {
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentSaved: goal.currentSaved,
      targetDate: this.toDateString(goal.targetDate),
      priority: goal.priority
    };
    this.showForm = true;
  }

  onDelete(goal: Goal, event: Event) {
    event.stopPropagation();
    const confirmed = window.confirm(`Are you sure you want to delete "${goal.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    if (!goal.id) return;
    this.goalService.deleteGoal(goal.id).then(() => {
      this.showUserMessage('Goal deleted successfully.', 'success');
    }).catch(err => {
      console.error('Error deleting goal', err);
      this.showUserMessage('Failed to delete goal.', 'error');
    });
  }

  openModal(goal: Goal) {
    this.selectedGoal = goal;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedGoal = null;
  }

  resetForm() {
    this.form = {
      name: '',
      targetAmount: null,
      currentSaved: null,
      targetDate: '',
      priority: 'medium'
    };
    this.editingId = null;
  }

  async submit() {
    const userId = this.authService.getCurrentUserId();
    if (!userId || !this.form.name || !this.form.targetAmount || !this.form.targetDate) {
      this.showUserMessage('Please fill in all required fields.', 'error');
      return;
    }

    if (this.form.currentSaved === null) {
      this.form.currentSaved = 0;
    }

    if (this.form.currentSaved < 0 || this.form.targetAmount <= 0) {
      this.showUserMessage('Amounts must be valid positive numbers.', 'error');
      return;
    }

    this.isSubmitting = true;
    try {
      if (this.editingId) {
        await this.goalService.updateGoal(this.editingId, {
          name: this.form.name,
          targetAmount: Number(this.form.targetAmount),
          currentSaved: Number(this.form.currentSaved),
          targetDate: Timestamp.fromDate(new Date(this.form.targetDate)),
          priority: this.form.priority
        });
        this.showUserMessage('Goal updated successfully!', 'success');
      } else {
        await this.goalService.addGoal({
          userId,
          name: this.form.name,
          targetAmount: Number(this.form.targetAmount),
          currentSaved: Number(this.form.currentSaved),
          targetDate: Timestamp.fromDate(new Date(this.form.targetDate)),
          priority: this.form.priority
        });
        this.showUserMessage('Goal created successfully!', 'success');
      }

      this.closeForm();
    } catch (error) {
      console.error('Error saving goal', error);
      this.showUserMessage('Failed to save goal. Please try again.', 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

  getProgressPercentage(goal: Goal): number {
    if (!goal.targetAmount || goal.targetAmount === 0) return 0;
    return Math.min((goal.currentSaved / goal.targetAmount) * 100, 100);
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
