import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router, RouterOutlet } from '@angular/router';
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
export class SidePanelComponent implements OnDestroy {
  // services
  dataService = inject(DataService);
  router = inject(Router);

  // inputs
  @Input() users: User[] = [];

  constructor() {
    this.dataService.users$.subscribe((user) => {
      user.forEach((u) => {
        this.users.push(u);
      });
    });
  }

  navigate(user: User) {
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy(): void {
    this.dataService.users$.subscribe().unsubscribe();
  }
}
