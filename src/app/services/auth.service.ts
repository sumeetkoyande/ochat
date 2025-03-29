import { inject, Injectable } from '@angular/core';
import { Auth, authState, user } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth);
  user$ = user(this.auth);
  authState$ = authState(this.auth);

  constructor() {}
  loginWithEmailAndPassword(email: String, password: String) {}

  logout() {}
}
