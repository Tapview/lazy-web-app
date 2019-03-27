import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactsGroupDetailsComponent } from './contacts-group-details.component';

describe('ContactsGroupDetailsComponent', () => {
  let component: ContactsGroupDetailsComponent;
  let fixture: ComponentFixture<ContactsGroupDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactsGroupDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactsGroupDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
