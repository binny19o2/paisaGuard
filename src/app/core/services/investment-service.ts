import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, query, where, orderBy, doc, updateDoc, deleteDoc, Timestamp } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Investment } from '../models';

@Injectable({
  providedIn: 'root',
})
export class InvestmentService {
  constructor(private firestore: Firestore) {}

  addInvestment(investment: Omit<Investment, 'id' | 'createdAt'>): Promise<any> {
    const ref = collection(this.firestore, 'investments');
    return addDoc(ref, {
      ...investment,
      createdAt: Timestamp.now()
    });
  }

  getAllInvestments(userId: string): Observable<Investment[]> {
    const ref = query(
      collection(this.firestore, 'investments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return collectionData(ref, { idField: 'id' }).pipe(
      map((investments: any[]) =>
        investments.map(inv => ({
          ...inv,
          startDate: inv.startDate?.toDate ? inv.startDate.toDate() : inv.startDate,
          createdAt: inv.createdAt?.toDate ? inv.createdAt.toDate() : inv.createdAt
        }))
      )
    ) as Observable<Investment[]>;
  }

  updateInvestment(id: string, data: Partial<Investment>): Promise<void> {
    const ref = doc(this.firestore, 'investments', id);
    return updateDoc(ref, data as any);
  }

  deleteInvestment(id: string): Promise<void> {
    const ref = doc(this.firestore, 'investments', id);
    return deleteDoc(ref);
  }
}
