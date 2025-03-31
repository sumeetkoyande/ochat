import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  doc,
  orderBy,
  query,
  writeBatch,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private activeChats = new BehaviorSubject<string[]>([]);

  constructor(private firestore: Firestore, private auth: Auth) {}

  getActiveChats$(): Observable<string[]> {
    return this.activeChats.asObservable();
  }

  openChat(userId: string): void {
    const current = this.activeChats.value;
    if (!current.includes(userId)) {
      this.activeChats.next([...current, userId]);
    }
  }

  closeChat(userId: string): void {
    const current = this.activeChats.value.filter((id) => id !== userId);
    this.activeChats.next(current);
  }

  getMessages(chatId: string): Observable<any[]> {
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('timestamp'));
    return collectionData(q, { idField: 'id' });
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    await addDoc(messagesRef, {
      text: message,
      senderId: user.uid,
      timestamp: new Date(),
      read: false,
    });
  }

  async markAsRead(chatId: string, messageIds: string[]): Promise<void> {
    const batch = writeBatch(this.firestore);
    messageIds.forEach((id) => {
      const messageRef = doc(this.firestore, `chats/${chatId}/messages/${id}`);
      batch.update(messageRef, { read: true });
    });
    await batch.commit();
  }
}
