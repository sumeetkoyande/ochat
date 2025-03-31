import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'chat-manager',
  templateUrl: './chat-manager.component.html',
  styleUrls: ['./chat-manager.component.css'],
  imports: [CommonModule],
})
export class ChatManagerComponent implements OnInit {
  activeChats: { userId: string; userName: string }[] = [];

  userService = inject(UserService);

  constructor() {}

  ngOnInit(): void {
    // this.chatService.getActiveChats$().subscribe((chatIds) => {
    //   this.activeChats = chatIds.map((id) => ({
    //     userId: id,
    //     userName:
    //       this.userService.getUserName(id) || `User ${id.substring(0, 6)}`,
    //   }));
    // });
  }

  trackByUserId(
    index: number,
    chat: { userId: string; userName: string }
  ): string {
    return chat.userId;
  }
}
