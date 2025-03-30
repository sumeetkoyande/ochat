import { inject, Injectable } from '@angular/core';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  firestore: Firestore = inject(Firestore);
  users$: Observable<any[]>;
  constructor() {
    const aCollection = collection(this.firestore, 'users');
    this.users$ = collectionData(aCollection);
  }
}
