import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, query, where, orderBy, doc, updateDoc, deleteDoc, Timestamp } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Goal } from '../models';

@Injectable({
  providedIn: 'root',
})
export class GoalService {
  constructor(private firestore: Firestore) {}

  addGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<any> {
    const ref = collection(this.firestore, 'goals');
    return addDoc(ref, {
      ...goal,
      createdAt: Timestamp.now()
    });
  }

  getAllGoals(userId: string): Observable<Goal[]> {
    const ref = query(
      collection(this.firestore, 'goals'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return collectionData(ref, { idField: 'id' }).pipe(
      map((goals: any[]) =>
        goals.map(g => ({
          ...g,
          targetDate: g.targetDate?.toDate ? g.targetDate.toDate() : g.targetDate,
          createdAt: g.createdAt?.toDate ? g.createdAt.toDate() : g.createdAt
        }))
      )
    ) as Observable<Goal[]>;
  }

  updateGoal(id: string, data: Partial<Goal>): Promise<void> {
    const ref = doc(this.firestore, 'goals', id);
    return updateDoc(ref, data as any);
  }

  deleteGoal(id: string): Promise<void> {
    const ref = doc(this.firestore, 'goals', id);
    return deleteDoc(ref);
  }
}
