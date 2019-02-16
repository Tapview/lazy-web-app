import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionsSentComponent } from './connections-sent.component';

describe('ConnectionsSentComponent', () => {
  let component: ConnectionsSentComponent;
  let fixture: ComponentFixture<ConnectionsSentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectionsSentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectionsSentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
