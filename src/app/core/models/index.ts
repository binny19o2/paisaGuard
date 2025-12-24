import { Timestamp } from '@angular/fire/firestore';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
}

// export interface Transaction {
//   id?: string;
//   userId: string;
//   type: 'income' | 'expense';
//   amount: number;
//   category: string;
//   note?: string;
//   date: Timestamp;
//   createdAt: Timestamp;
// }

export interface Transaction {
  id?: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  account: string;
  note?: string;
  createdAt: any; 
  color: string; 
}


export interface Investment {
  id?: string;
  userId: string;
  type: string;
  amount: number;
  interest: number;
  name: string;
  startDate: Timestamp;
  duration?: number;
  createdAt: Timestamp;
}

export interface Goal {
  id?: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentSaved: number;
  targetDate: Timestamp;
  priority: 'low' | 'medium' | 'high';
  createdAt: Timestamp;
}