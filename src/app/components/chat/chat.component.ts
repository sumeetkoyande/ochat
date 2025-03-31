// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-chat',
//   imports: [],
//   templateUrl: './chat.component.html',
//   styleUrl: './chat.component.css'
// })
// export class ChatComponent {

// }
import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
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
    FormsModule,
  ],
})
export class ChatComponent implements OnInit {
  @Input() userId!: string;
  @Input() userName!: string;
  expanded = false;
  messages: any[] = [];
  newMessage = '';
  unreadCount = 0;

  activeChats: { userId: string; userName: string }[] = [];

  public auth = inject(AuthService);

  constructor(
    private chatService: ChatService,
    public userService: UserService
  ) {}

  ngOnInit(): void {
    this.chatService.getActiveChats$().subscribe((chatIds) => {
      this.activeChats = chatIds.map((id) => ({
        userId: id,
        userName:
          this.userService.getUserName(id) || `User ${id.substring(0, 6)}`,
      }));
    });

    this.chatService.getMessages(this.userId).subscribe((messages) => {
      this.messages = messages;
      this.updateUnreadCount();
    });
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    if (this.expanded) {
      this.markMessagesAsRead();
    }
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.userId, this.newMessage).then(() => {
        this.newMessage = '';
      });
    }
  }

  private updateUnreadCount(): void {
    this.unreadCount = this.messages.filter(
      (m) => !m.read && m.senderId !== this.userService.currentUser?.uid
    ).length;
  }

  private markMessagesAsRead(): void {
    const unreadIds = this.messages
      .filter(
        (m) => !m.read && m.senderId !== this.userService.currentUser?.uid
      )
      .map((m) => m.id);

    if (unreadIds.length) {
      this.chatService.markAsRead(this.userId, unreadIds);
      this.unreadCount = 0;
    }
  }

  closeChat(e: Event): void {
    console.log(e);
    this.chatService.closeChat(this.userId);
  }

  trackByUserId(
    index: number,
    chat: { userId: string; userName: string }
  ): string {
    return chat.userId;
  }
}
