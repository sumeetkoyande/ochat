import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatManagerComponent } from './chat-manager.component';

describe('ChatManagerComponent', () => {
  let component: ChatManagerComponent;
  let fixture: ComponentFixture<ChatManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
