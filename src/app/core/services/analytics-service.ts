import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, query, where } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Transaction } from '../models';

export interface CategoryExpense {
  category: string;
  amount: number;
  color: string;
}

export interface MonthlyData {
  month: string;
  expense: number;
  income: number;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  constructor(private firestore: Firestore) {}

  getExpensesByCategory(userId: string, year: number, month: number): Observable<CategoryExpense[]> {
    const ref = query(
      collection(this.firestore, 'transactions'),
      where('userId', '==', userId),
      where('type', '==', 'expense')
    );

    return collectionData(ref).pipe(
      map((txns: any[]) => {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);

        const monthlyExpenses = txns.filter(t => {
          const txnDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
          return txnDate >= startDate && txnDate <= endDate;
        });

        const categoryMap = new Map<string, { amount: number; color: string }>();

        monthlyExpenses.forEach(txn => {
          const existing = categoryMap.get(txn.category) || { amount: 0, color: txn.color || '' };
          categoryMap.set(txn.category, {
            amount: existing.amount + txn.amount,
            color: existing.color || txn.color || ''
          });
        });

        return Array.from(categoryMap.entries()).map(([category, data]) => ({
          category,
          amount: data.amount,
          color: data.color
        })).sort((a, b) => b.amount - a.amount);
      })
    );
  }

  getMonthlyTrend(userId: string, months: number = 6): Observable<MonthlyData[]> {
    const ref = query(
      collection(this.firestore, 'transactions'),
      where('userId', '==', userId)
    );

    return collectionData(ref).pipe(
      map((txns: any[]) => {
        const monthlyData = new Map<string, { expense: number; income: number }>();
        const now = new Date();

        // Initialize last N months
        for (let i = months - 1; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
          const key = `${date.getFullYear()}-${monthStr}`;
          monthlyData.set(key, { expense: 0, income: 0 });
        }

        // Calculate totals for each month
        txns.forEach(txn => {
          const txnDate = txn.createdAt?.toDate ? txn.createdAt.toDate() : new Date(txn.createdAt);
          const monthStr = (txnDate.getMonth() + 1).toString().padStart(2, '0');
          const key = `${txnDate.getFullYear()}-${monthStr}`;
          
          if (monthlyData.has(key)) {
            const data = monthlyData.get(key)!;
            if (txn.type === 'expense') {
              data.expense += txn.amount;
            } else if (txn.type === 'income') {
              data.income += txn.amount;
            }
            monthlyData.set(key, data);
          }
        });

        return Array.from(monthlyData.entries()).map(([month, data]) => ({
          month,
          expense: data.expense,
          income: data.income
        }));
      })
    );
  }

  getTotalExpenseForMonth(userId: string, year: number, month: number): Observable<number> {
    const ref = query(
      collection(this.firestore, 'transactions'),
      where('userId', '==', userId),
      where('type', '==', 'expense')
    );

    return collectionData(ref).pipe(
      map((txns: any[]) => {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0, 23, 59, 59);

        return txns
          .filter(t => {
            const txnDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
            return txnDate >= startDate && txnDate <= endDate;
          })
          .reduce((sum, t) => sum + t.amount, 0);
      })
    );
  }
}
