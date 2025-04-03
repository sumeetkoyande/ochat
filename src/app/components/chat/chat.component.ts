import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import {
  combineLatest,
  from,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Chat, ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatInputModule,
    MatBadgeModule,
    FormsModule,
  ],
})
export class ChatComponent implements OnInit, OnChanges {
  // For admin view
  userChats$!: Observable<Chat[]>;

  // For single chat view (regular users)
  currentChatId: string | null = null;
  expanded = false;
  newMessage = '';
  messages$!: Observable<any[]>;
  unreadCount$!: Observable<number>;
  chatPartnerName$!: Observable<string>;

  // For multiple chat management (admin)
  expandedChats: { [chatId: string]: boolean } = {};
  messages: { [chatId: string]: Observable<any[]> } = {};
  unreadCounts: { [chatId: string]: Observable<number> } = {};
  newMessages: { [chatId: string]: string } = {};

  @Input() openChat: Chat | null = null;
  @Input() allOpenChat: Chat[] = [];

  constructor(
    public authService: AuthService,
    private chatService: ChatService,
    public userService: UserService
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.authService.userInfo?.role === 'admin') {
      this.userChats$ = this.chatService.getAllUserChats().pipe(
        map((chats) =>
          chats.map((chat) => ({
            ...chat,
            partner: chat.participants.find(
              (id) => id !== this.userService.currentUser?.uid
            ),
          }))
        )
      );

      // Load any initially passed chats
      if (this.openChat) {
        this.loadChat(this.openChat.id);
      }
    } else {
      // Regular user gets or creates their support chat
      this.currentChatId = await this.chatService.getOrCreateSupportChat();
      this.loadSingleChat(this.currentChatId);
      // await this.initializeUserChat();
    }
  }

  private async initializeUserChat(): Promise<void> {
    try {
      this.currentChatId = await this.chatService.getOrCreateSupportChat();
      this.loadSingleChat(this.currentChatId);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['allOpenChat'] && this.authService.userInfo?.role === 'admin') {
      // Initialize or update all chat windows
      this.allOpenChat.forEach((chat) => {
        if (!this.messages[chat.id]) {
          this.loadChat(chat.id);
        }
      });
    }
  }

  // For admin - load multiple chats
  loadChat(chatId: string): void {
    this.messages[chatId] = this.chatService.getMessages(chatId);
    this.unreadCounts[chatId] = this.chatService.getUnreadCount(chatId);
    this.newMessages[chatId] = '';
    this.expandedChats[chatId] = true;
  }

  // For regular users - load single chat
  loadSingleChat(chatId: string): void {
    this.currentChatId = chatId;
    this.messages$ = this.chatService.getMessages(chatId);
    this.unreadCount$ = this.chatService.getUnreadCount(chatId);

    // this.chatPartnerName$ =
    //   this.userService.getUserName('support') || of('Support Team');
  }

  toggleExpand(chatId?: string): void {
    if (this.authService.userInfo?.role === 'admin' && chatId) {
      this.expandedChats[chatId] = !this.expandedChats[chatId];
      if (this.expandedChats[chatId]) {
        this.markMessagesAsRead(chatId).subscribe();
      }
    } else {
      this.expanded = !this.expanded;
      if (this.expanded && this.currentChatId) {
        this.markMessagesAsRead(this.currentChatId).subscribe();
      }
    }
  }

  async sendMessage(chatId?: string): Promise<void> {
    const targetChatId = chatId || this.currentChatId;
    if (!targetChatId) return;

    const message = chatId
      ? this.newMessages[chatId]?.trim()
      : this.newMessage?.trim();

    if (message) {
      await this.chatService.sendMessage(targetChatId, message);

      if (chatId) {
        this.newMessages[chatId] = '';
      } else {
        this.newMessage = '';
      }
    }
  }

  private markMessagesAsRead(chatId: string): Observable<void> {
    const messages$ =
      this.authService.userInfo?.role === 'admin'
        ? this.messages[chatId].pipe(take(1))
        : this.messages$.pipe(take(1));

    return combineLatest([of(chatId), messages$]).pipe(
      switchMap(([id, messages]) => {
        const unreadIds = messages
          .filter(
            (m) => !m.read && m.senderId !== this.userService.currentUser?.uid
          )
          .map((m) => m.id);

        return unreadIds.length > 0
          ? from(this.chatService.markMessagesAsRead(id, unreadIds))
          : of(undefined);
      })
    );
  }

  async closeChat(chatId?: string): Promise<void> {
    const targetChatId = chatId || this.currentChatId;
    if (!targetChatId) return;

    await this.chatService.closeChat(targetChatId);

    if (this.authService.userInfo?.role === 'admin' && chatId) {
      // Remove from local state
      delete this.messages[chatId];
      delete this.unreadCounts[chatId];
      delete this.newMessages[chatId];
      delete this.expandedChats[chatId];
    } else {
      this.currentChatId = null;
    }
  }
}
