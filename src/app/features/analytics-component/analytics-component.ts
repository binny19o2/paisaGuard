import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../shared/components/navbar-component/navbar-component';
import { AnalyticsService, CategoryExpense, MonthlyData } from '../../core/services/analytics-service';
import { AuthService } from '../../core/services/auth-service';
import { Observable, of, switchMap, Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics-component',
  imports: [CommonModule, NavbarComponent],
  templateUrl: './analytics-component.html',
  styleUrl: './analytics-component.css',
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  analyticsService = inject(AnalyticsService);
  authService = inject(AuthService);

  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;

  currentView: 'breakdown' | 'trend' = 'breakdown';
  currentDate = new Date();
  currentYear = this.currentDate.getFullYear();
  currentMonth = this.currentDate.getMonth();

  pieChart: Chart<'doughnut'> | null = null;
  lineChart: Chart<'line'> | null = null;
  categoryExpenses$: Observable<CategoryExpense[]> = of([]);
  monthlyTrend$: Observable<MonthlyData[]> = of([]);
  totalExpense$: Observable<number> = of(0);

  private subscriptions = new Subscription();

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    // Small delay to ensure canvas elements are rendered
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy() {
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    if (this.lineChart) {
      this.lineChart.destroy();
    }
    this.subscriptions.unsubscribe();
  }

  loadData() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    this.categoryExpenses$ = this.analyticsService.getExpensesByCategory(
      userId,
      this.currentYear,
      this.currentMonth
    );

    this.monthlyTrend$ = this.analyticsService.getMonthlyTrend(userId, 6);

    this.totalExpense$ = this.analyticsService.getTotalExpenseForMonth(
      userId,
      this.currentYear,
      this.currentMonth
    );

    // Subscribe to update charts when data changes
    this.subscriptions.add(
      this.categoryExpenses$.subscribe(data => {
        if (this.currentView === 'breakdown') {
          this.updatePieChart(data);
        }
      })
    );

    this.subscriptions.add(
      this.monthlyTrend$.subscribe(data => {
        if (this.currentView === 'trend') {
          this.updateLineChart(data);
        }
      })
    );
  }

  initializeCharts() {
    if (this.currentView === 'breakdown') {
      this.categoryExpenses$.subscribe(data => {
        this.createPieChart(data);
      });
    } else {
      this.monthlyTrend$.subscribe(data => {
        this.createLineChart(data);
      });
    }
  }

  createPieChart(data: CategoryExpense[]) {
    if (!this.pieChartCanvas) return;

    if (this.pieChart) {
      this.pieChart.destroy();
    }

    const ctx = this.pieChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = data.map(d => d.category);
    const amounts = data.map(d => d.amount);
    const colors = data.map(d => {
      // Extract color from Tailwind classes or use default
      const colorMatch = d.color.match(/bg-(\w+)-(\d+)/);
      if (colorMatch) {
        const colorMap: { [key: string]: string } = {
          red: '#ef4444',
          orange: '#f97316',
          yellow: '#eab308',
          green: '#22c55e',
          blue: '#3b82f6',
          purple: '#a855f7',
          pink: '#ec4899',
          indigo: '#6366f1',
          teal: '#14b8a6',
          emerald: '#10b981',
          rose: '#f43f5e',
          slate: '#64748b'
        };
        return colorMap[colorMatch[1]] || '#6b7280';
      }
      return '#6b7280';
    });

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: amounts,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = amounts.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.pieChart = new Chart(ctx, config);
  }

  updatePieChart(data: CategoryExpense[]) {
    if (!this.pieChart) {
      this.createPieChart(data);
      return;
    }

    const labels = data.map(d => d.category);
    const amounts = data.map(d => d.amount);
    const colors = data.map(d => {
      const colorMatch = d.color.match(/bg-(\w+)-(\d+)/);
      if (colorMatch) {
        const colorMap: { [key: string]: string } = {
          red: '#ef4444',
          orange: '#f97316',
          yellow: '#eab308',
          green: '#22c55e',
          blue: '#3b82f6',
          purple: '#a855f7',
          pink: '#ec4899',
          indigo: '#6366f1',
          teal: '#14b8a6',
          emerald: '#10b981',
          rose: '#f43f5e',
          slate: '#64748b'
        };
        return colorMap[colorMatch[1]] || '#6b7280';
      }
      return '#6b7280';
    });

    this.pieChart.data.labels = labels;
    this.pieChart.data.datasets[0].data = amounts;
    this.pieChart.data.datasets[0].backgroundColor = colors;
    this.pieChart.update();
  }

  createLineChart(data: MonthlyData[]) {
    if (!this.lineChartCanvas) return;

    if (this.lineChart) {
      this.lineChart.destroy();
    }

    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = data.map(d => {
      const [year, month] = d.month.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const expenses = data.map(d => d.expense);
    const incomes = data.map(d => d.income);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Expense',
            data: expenses,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          },
          {
            label: 'Income',
            data: incomes,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#22c55e',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y ?? 0;
                const label = context.dataset.label || '';
                return `${label}: ₹${value.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `₹${value}`
            }
          }
        }
      }
    };

    this.lineChart = new Chart(ctx, config);
  }

  updateLineChart(data: MonthlyData[]) {
    if (!this.lineChart) {
      this.createLineChart(data);
      return;
    }

    const labels = data.map(d => {
      const [year, month] = d.month.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const expenses = data.map(d => d.expense);
    const incomes = data.map(d => d.income);

    this.lineChart.data.labels = labels;
    this.lineChart.data.datasets[0].data = expenses;
    this.lineChart.data.datasets[1].data = incomes;
    this.lineChart.update();
  }

  switchView(view: 'breakdown' | 'trend') {
    this.currentView = view;
    setTimeout(() => {
      if (view === 'breakdown') {
        this.categoryExpenses$.subscribe(data => {
          this.createPieChart(data);
        });
      } else {
        this.monthlyTrend$.subscribe(data => {
          this.createLineChart(data);
        });
      }
    }, 100);
  }

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.loadData();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.loadData();
  }

  getCurrentMonthName(): string {
    const date = new Date(this.currentYear, this.currentMonth, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  canGoToNextMonth(): boolean {
    const now = new Date();
    return !(this.currentYear === now.getFullYear() && this.currentMonth === now.getMonth());
  }
}
