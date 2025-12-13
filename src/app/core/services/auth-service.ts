import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, updateProfile, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, setDoc, Timestamp } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { User as AppUser } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  public currentUser$: Observable<AppUser | null> = this.currentUserSubject.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    // Listen to auth state changes
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const appUser: AppUser = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
          createdAt: Timestamp.now()
        };
        this.currentUserSubject.next(appUser);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  /**
   * Sign up a new user with email and password
   */
  async signup(email: string, password: string, displayName: string): Promise<void> {
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Update the user's display name
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      const userDoc: AppUser = {
        uid: user.uid,
        email: user.email!,
        displayName: displayName,
        createdAt: Timestamp.now()
      };

      await setDoc(doc(this.firestore, 'users', user.uid), userDoc);

      this.currentUserSubject.next(userDoc);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      const appUser: AppUser = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        createdAt: Timestamp.now()
      };

      this.currentUserSubject.next(appUser);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get the current user
   */
  getCurrentUser(): AppUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get the current user's UID
   */
  getCurrentUserId(): string | null {
    return this.currentUserSubject.value?.uid || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }
}