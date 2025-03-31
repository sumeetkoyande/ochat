import { inject, Injectable } from '@angular/core';
import {
  Auth,
  authState,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
import {
  doc,
  Firestore,
  serverTimestamp,
  setDoc,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { catchError, from, Observable, Subscription, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  authState$: Observable<User | null>;
  authStateSubscription: Subscription;
  user: User | null = null;
  userRole: string | null = null;

  // injectors
  private firestore: Firestore = inject(Firestore);

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

  signUp(email: string, password: string, displayName: string) {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
    ).pipe(
      switchMap(({ user }) => {
        if (!user) {
          throw new Error('User creation failed');
        }

        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        return from(
          setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            createdAt: serverTimestamp(), // Better to use server timestamp
            lastLogin: serverTimestamp(),
          })
        );
      }),
      catchError((error) => {
        console.error('Signup error:', error);
        // Optionally delete the user if Firestore fails
        if (this.auth.currentUser) {
          this.auth.currentUser.delete();
        }
        throw error; // Re-throw to let caller handle it
      })
    );
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
