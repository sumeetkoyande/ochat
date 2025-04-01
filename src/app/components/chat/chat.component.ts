import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { map, Observable, of, switchMap, take } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
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
export class ChatComponent implements OnInit {
  expanded = false;
  newMessage = '';
  currentChatId: string | null = null;

  // For admin view
  userChats$!: Observable<any[]>;
  selectedChat: any = null;

  // For current chat
  messages$!: Observable<any[]>;
  unreadCount$!: Observable<number>;
  chatPartnerName$!: Observable<string>;

  constructor(
    public auth: AuthService,
    private chatService: ChatService,
    public userService: UserService
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.auth.userRole === 'admin') {
      // Admin sees all active chats
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
    } else {
      // Regular user gets or creates their support chat
      this.currentChatId = await this.chatService.getOrCreateSupportChat();
      this.loadChat(this.currentChatId);
    }
  }

  loadChat(chatId: string): void {
    this.currentChatId = chatId;
    this.messages$ = this.chatService.getMessages(chatId);

    // Get unread count
    // this.unreadCount$ = this.chatService.getUnreadCount(chatId);

    // Get chat partner name (for admin)
    if (this.auth.userRole === 'admin') {
      this.selectedChat = this.userChats$.pipe(
        map((chats) => chats.find((chat) => chat.id === chatId))
      );

      this.chatPartnerName$ = this.selectedChat.pipe(
        switchMap(
          (chat) => this.userService.getUserName('') || of('Support User')
        )
      );
    }
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    if (this.expanded && this.currentChatId) {
      this.markMessagesAsRead();
    }
  }

  async sendMessage(): Promise<void> {
    if (this.newMessage.trim() && this.currentChatId) {
      await this.chatService.sendMessage(this.currentChatId, this.newMessage);
      this.newMessage = '';
    }
  }

  private async markMessagesAsRead(): Promise<void> {
    if (!this.currentChatId) return;

    const messages = await this.messages$.pipe(take(1)).toPromise();
    const unreadIds =
      messages
        ?.filter(
          (m) => !m.read && m.senderId !== this.userService.currentUser?.uid
        )
        .map((m) => m.id) || [];

    if (unreadIds.length) {
      await this.chatService.markMessagesAsRead(this.currentChatId, unreadIds);
    }
  }

  async closeChat(): Promise<void> {
    if (this.currentChatId) {
      await this.chatService.closeChat(this.currentChatId);
      this.currentChatId = null;
      this.selectedChat = null;
    }
  }

  trackByChatId(index: number, chat: any): string {
    return chat.id;
  }
}
