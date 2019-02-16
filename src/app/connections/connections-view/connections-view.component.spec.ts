import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectionsViewComponent } from './connections-view.component';

describe('ViewConnectionsComponent', () => {
  let component: ConnectionsViewComponent;
  let fixture: ComponentFixture<ConnectionsViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectionsViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectionsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
