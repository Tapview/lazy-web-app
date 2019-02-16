import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionsRequestComponent } from './connections-request.component';

describe('ConnectionRequestsComponent', () => {
  let component: ConnectionsRequestComponent;
  let fixture: ComponentFixture<ConnectionsRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectionsRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectionsRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
