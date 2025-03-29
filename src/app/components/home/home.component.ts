import { Component, inject } from '@angular/core';
import { DataService } from '../../services/data.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [AsyncPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  public dataService = inject(DataService);
  constructor() {}
}
