import { AsyncPipe } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-dashboard',
  imports: [AsyncPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnDestroy {
  public dataService = inject(DataService);
  public auth = inject(AuthService);
  constructor() {}
  ngOnDestroy(): void {
    this.dataService.users$.subscribe().unsubscribe();
  }
}
