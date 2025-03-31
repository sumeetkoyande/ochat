import { Injectable } from '@angular/core';
import {
  Auth,
  authState,
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  authState$: Observable<User | null>;
  authStateSubscription: Subscription;
  user: User | null = null;
  userRole: string | null = null;

  constructor(private auth: Auth, private router: Router) {
    this.authState$ = authState(this.auth);
    this.authStateSubscription = this.authState$.subscribe(
      (firebaseUser: User | null) => {
        this.user = firebaseUser;
      }
    );
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const tokenResult = await user.getIdTokenResult(true); // Force refresh
        const role = tokenResult.claims['role'] || 'user'; // Default to "user"
        this.userRole = role as string;
      }
    });
  }

  async loginWithEmailAndPassword(email: string, password: string) {
    try {
      await setPersistence(this.auth, browserLocalPersistence);
      await signInWithEmailAndPassword(this.auth, email, password);
      this.router.navigate(['/']);
    } catch (error) {
      console.log('unable to login', error);
      throw error;
    }
  }

  logout() {
    signOut(this.auth)
      .then(() => {
        this.router.navigate(['/login']);
      })
      .catch((err) => {
        console.log('Unable to logout', err);
      });
  }
}
