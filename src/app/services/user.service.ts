import { Injectable } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  currentUser: User | null = null;
  constructor(private auth: Auth) {
    this.currentUser = this.auth.currentUser;
  }
  getUserName(id: string) {
    console.log(id);
    return 'test user';
  }
}
