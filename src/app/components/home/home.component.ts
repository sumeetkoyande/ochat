import { Component } from '@angular/core';
import { SidePanelComponent } from '../side-panel/side-panel.component';
import { TopNavComponent } from '../top-nav/top-nav.component';

@Component({
  selector: 'app-home',
  imports: [TopNavComponent, SidePanelComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {}
