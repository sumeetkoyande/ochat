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

  constructor(private auth: Auth, private router: Router) {
    this.authState$ = authState(this.auth);
    this.authStateSubscription = this.authState$.subscribe(
      (aUser: User | null) => {
        this.user = aUser;
      }
    );
  }
  loginWithEmailAndPassword(email: string, password: string) {
    try {
      setPersistence(this.auth, browserLocalPersistence).then(() => {
        return signInWithEmailAndPassword(this.auth, email, password).then(
          () => {
            this.router.navigate(['/']);
          }
        );
      });
    } catch (error) {
      console.log('unable to login', error);
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
