import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Chat, ChatService } from '../../services/chat.service';
import { DataService } from '../../services/data.service';
import { ChatComponent } from '../chat/chat.component';

interface User {
  displayName: string;
  chatViewed: boolean;
}

@Component({
  selector: 'side-panel',
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    ChatComponent,
  ],
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.css',
})
export class SidePanelComponent implements OnInit, OnDestroy {
  // services
  dataService = inject(DataService);
  router = inject(Router);
  authService = inject(AuthService);
  chatService = inject(ChatService);

  // inputs
  @Input() users: User[] = [];
  selectedChat: Chat[] = [];
  activeChats: Chat[] | null = null;

  constructor() {
    this.dataService.users$.subscribe((user) => {
      user.forEach((u) => {
        this.users.push(u);
      });
    });
  }

  ngOnInit() {
    this.chatService.getAdminActiveChats().subscribe((chats) => {
      this.activeChats = chats;
    });
  }

  navigate(chatId: string) {
    console.log('from navigate method', chatId);
    // this.router.navigate(['/dashboard']);
  }

  openChat(chatId: string) {
    console.log(chatId);
    this.chatService.getChatById(chatId).subscribe((chat) => {
      if (!chat) return;

      // Check if the chat already exists in selectedChat
      const exists = this.selectedChat.some((s) => s.id === chat.id);

      if (!exists) {
        this.selectedChat.push(chat);
      }
    });
  }

  testFunction() {
    console.log(this.selectedChat);
  }

  ngOnDestroy(): void {
    this.dataService.users$.subscribe().unsubscribe();
  }
}
