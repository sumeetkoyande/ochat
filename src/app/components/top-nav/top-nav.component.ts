import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'top-nav',
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
  ],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.css',
})
export class TopNavComponent {
  auth = inject(AuthService);

  userName = this.auth.user?.displayName || ''; // Replace with actual user name from your auth service
  userInitials = this.getInitials(this.userName);
  userEmail = this.auth.user?.email; // Replace with actual user email

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  onLogout(): void {
    // Implement your logout logic here
    this.auth.logout();
  }

  onProfile(): void {
    // Navigate to profile page
    console.log('Navigate to profile');
  }

  onSettings(): void {
    // Navigate to settings page
    console.log('Navigate to settings');
  }
}
