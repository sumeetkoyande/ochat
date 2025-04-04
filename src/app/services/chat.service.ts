import { Injectable } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  doc,
  docData,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable, map, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

export interface Chat {
  id: string;
  participants: string[];
  startedBy: string;
  createdAt: Date;
  status: 'active' | 'awaiting' | 'closed';
  lastMessage?: {
    text: string;
    timestamp: Date;
    senderId: string;
  };
  closedAt?: Date;
}

export interface Message {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private activeChats = new BehaviorSubject<Chat[]>([]);
  private currentUserId: string | null = null;
  private readonly MESSAGE_LIMIT = 50;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private authService: AuthService
  ) {
    this.auth.onAuthStateChanged((user) => {
      this.currentUserId = user?.uid || null;
    });
  }

  // Get active chats for admin
  getAdminActiveChats(): Observable<Chat[]> {
    const chatsRef = collection(this.firestore, 'chats');
    const q = query(
      chatsRef,
      where('status', 'in', ['active', 'awaiting']),
      orderBy('createdAt', 'desc')
    );

    return collectionData(q, { idField: 'id' }).pipe(
      map((chats) => {
        this.activeChats.next(chats as Chat[]);
        return chats as Chat[];
      })
    );
  }

  // Get all chats including closed ones for history
  getAllUserChats(): Observable<Chat[]> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const chatsRef = collection(this.firestore, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', this.currentUserId),
      orderBy('createdAt', 'desc')
    );

    return collectionData(q, { idField: 'id' }) as Observable<Chat[]>;
  }

  // Get or create a chat between current user and support
  async getOrCreateSupportChat(): Promise<string> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    // First try to find existing active chat
    const existingChat = await this.findExistingChat(this.currentUserId);
    if (existingChat) {
      return existingChat.id;
    }

    // If no existing chat, create a new one
    return this.createSupportChat(this.currentUserId);
  }

  private async findExistingChat(userId: string): Promise<Chat | null> {
    const chatsRef = collection(this.firestore, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId),
      where('status', '!=', 'closed'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data(),
      } as Chat;
    }
    return null;
  }

  private async createSupportChat(userId: string): Promise<string> {
    const chatsRef = collection(this.firestore, 'chats');
    const newChat = {
      participants: [userId, 'support'],
      startedBy: this.authService.userInfo?.displayName,
      createdAt: serverTimestamp(),
      status: 'awaiting',
    };

    const docRef = await addDoc(chatsRef, newChat);
    return docRef.id;
  }

  // Get messages with pagination support
  getMessages(chatId: string, lastMessage?: Message): Observable<Message[]> {
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    let q;

    if (lastMessage) {
      q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastMessage.timestamp),
        limit(this.MESSAGE_LIMIT)
      );
    } else {
      q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        limit(this.MESSAGE_LIMIT)
      );
    }

    return collectionData(q, { idField: 'id' }).pipe(
      map((messages) => messages.reverse()) // Reverse to maintain chronological order
    ) as Observable<Message[]>;
  }

  // Load more historical messages
  loadMoreMessages(
    chatId: string,
    oldestMessage: Message
  ): Observable<Message[]> {
    return this.getMessages(chatId, oldestMessage);
  }

  // Send a new message
  async sendMessage(chatId: string, text: string): Promise<void> {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }

    const user = this.auth.currentUser;
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);

    // Add the new message
    await addDoc(messagesRef, {
      text,
      senderId: this.currentUserId,
      senderName: user?.displayName || 'Anonymous',
      timestamp: serverTimestamp(),
      read: false,
    });

    // Update chat last message and status
    const chatRef = doc(this.firestore, `chats/${chatId}`);
    await updateDoc(chatRef, {
      lastMessage: {
        text,
        timestamp: serverTimestamp(),
        senderId: this.currentUserId,
      },
      status: 'active',
    });
  }

  // Mark messages as read
  async markMessagesAsRead(
    chatId: string,
    messageIds: string[]
  ): Promise<void> {
    if (!messageIds.length) return;

    const batch = writeBatch(this.firestore);
    messageIds.forEach((id) => {
      const messageRef = doc(this.firestore, `chats/${chatId}/messages/${id}`);
      batch.update(messageRef, { read: true });
    });
    await batch.commit();
  }

  // Reopen a closed chat
  async reopenChat(chatId: string): Promise<void> {
    const chatRef = doc(this.firestore, `chats/${chatId}`);
    await updateDoc(chatRef, {
      status: 'active',
      reopenedAt: serverTimestamp(),
    });
  }

  // Close a chat
  async closeChat(chatId: string): Promise<void> {
    const chatRef = doc(this.firestore, `chats/${chatId}`);
    await updateDoc(chatRef, {
      status: 'closed',
      closedAt: serverTimestamp(),
    });
  }

  getUnreadCount(chatId: string): Observable<number> {
    return user(this.auth).pipe(
      switchMap((user) => {
        if (!user?.uid) return of(0);

        const messagesRef = collection(
          this.firestore,
          `chats/${chatId}/messages`
        );
        const q = query(
          messagesRef,
          where('read', '==', false),
          where('senderId', '!=', user.uid)
        );

        return collectionData(q).pipe(map((messages) => messages.length));
      })
    );
  }

  // Get the most recent message in a chat
  async getLastMessage(chatId: string): Promise<Message | null> {
    const messagesRef = collection(this.firestore, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as Message;
  }

  // get a single chat by ID
  getChatById(chatId: string): Observable<Chat | null> {
    const chatRef = doc(this.firestore, 'chats', chatId);
    return docData(chatRef, { idField: 'id' }) as Observable<Chat | null>;
  }
}
