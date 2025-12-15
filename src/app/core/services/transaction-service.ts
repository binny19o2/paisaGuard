// src/app/services/transaction.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, query, orderBy, limit, where, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Transaction } from '../models'; 

@Injectable({ providedIn: 'root' })
export class TransactionService {

  constructor(private firestore: Firestore) {}

  addTransaction(txn: Transaction) {
    const ref = collection(this.firestore, 'transactions');
    return addDoc(ref, {
      ...txn,
      createdAt: txn.createdAt || new Date()
    });
  }

  getRecentTransactions(userId: string, limitCount = 3): Observable<Transaction[]> {
    const ref = query(
      collection(this.firestore, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return collectionData(ref, { idField: 'id' }).pipe(
      map((txns: any[]) =>
        txns.map(t => ({
          ...t,
          // normalize createdAt in case it is a Firestore Timestamp
          createdAt: (t.createdAt as any)?.toDate ? (t.createdAt as any).toDate() : t.createdAt
        }))
      )
    ) as Observable<Transaction[]>;
  }

  getTotalExpense(userId: string): Observable<number> {
    const ref = query(
      collection(this.firestore, 'transactions'),
      where('userId', '==', userId),
      where('type', '==', 'expense')
    );

    return collectionData(ref).pipe(
      map((txns: any[]) =>
        txns.reduce((sum, t) => sum + t.amount, 0)
      )
    );
  }

  getExpenseSummary(userId: string): Observable<{ total: number; count: number }> {
    const ref = query(
      collection(this.firestore, 'transactions'),
      where('userId', '==', userId),
      where('type', '==', 'expense')
    );

    return collectionData(ref).pipe(
      map((txns: any[]) => {
        const total = txns.reduce((sum, t) => sum + t.amount, 0);
        return { total, count: txns.length };
      })
    );
  }

  getUserOverview(userId: string): Observable<{ income: number; expense: number; balance: number }> {
    const ref = query(
      collection(this.firestore, 'transactions'),
      where('userId', '==', userId)
    );

    return collectionData(ref).pipe(
      map((txns: any[]) => {
        const income = txns
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = txns
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        return {
          income,
          expense,
          balance: income - expense
        };
      })
    );
  }

  updateTransaction(id: string, data: Partial<Transaction>) {
    const ref = doc(this.firestore, 'transactions', id);
    return updateDoc(ref, data as any);
  }

  deleteTransaction(id: string) {
    const ref = doc(this.firestore, 'transactions', id);
    return deleteDoc(ref);
  }

  getAllTransactions(userId: string): Observable<Transaction[]> {
    const ref = query(
      collection(this.firestore, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return collectionData(ref, { idField: 'id' }).pipe(
      map((txns: any[]) =>
        txns.map(t => ({
          ...t,
          createdAt: (t.createdAt as any)?.toDate ? (t.createdAt as any).toDate() : t.createdAt
        }))
      )
    ) as Observable<Transaction[]>;
  }
}
