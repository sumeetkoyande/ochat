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
  getDoc,
  serverTimestamp,
  setDoc,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

interface userInfo {
  uid: string;
  displayName: string;
  email: string;
  role: string;
}
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  authState$: Observable<User | null>;
  authStateSubscription: Subscription;
  user: User | null = null;
  userRole: string | null = null;
  userInfo: userInfo | null = null;

  // injectors
  private firestore: Firestore = inject(Firestore);

  constructor(private auth: Auth, private router: Router) {
    this.authState$ = authState(this.auth);
    this.authStateSubscription = this.authState$.subscribe(
      async (firebaseUser: User | null) => {
        this.user = firebaseUser;
        if (firebaseUser) {
          await this.fetchUserInfo(firebaseUser.uid);
        }
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

  private async fetchUserInfo(uid: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        this.userInfo = userDocSnap.data() as userInfo;
      } else {
        console.warn('User document not found in Firestore');
        this.userInfo = null;
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      this.userInfo = null;
    }
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

  async signUp(email: string, password: string, displayName: string) {
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      const user = userCredential.user;

      if (!user) {
        throw new Error('User creation failed');
      }

      // Create user document in Firestore
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        role: 'admin',
        displayName: displayName,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

      console.log('User created successfully in both Auth and Firestore');
      return user;
    } catch (error) {
      console.error('Signup error:', error);

      // Clean up: Delete the auth user if Firestore failed
      if (this.auth.currentUser) {
        try {
          await this.auth.currentUser.delete();
          console.log('Rolled back auth user due to Firestore failure');
        } catch (deleteError) {
          console.error(
            'Failed to delete auth user during rollback:',
            deleteError
          );
        }
      }

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
