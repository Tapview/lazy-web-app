import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionsRequestDetailsComponent } from './connections-request-details.component';

describe('ViewConnectionsComponent', () => {
  let component: ConnectionsRequestDetailsComponent;
  let fixture: ComponentFixture<ConnectionsRequestDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectionsRequestDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectionsRequestDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
