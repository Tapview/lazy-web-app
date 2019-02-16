import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionsAddComponent } from './connections-add.component';

describe('Add', () => {
  let component: ConnectionsAddComponent;
  let fixture: ComponentFixture<ConnectionsAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectionsAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectionsAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
