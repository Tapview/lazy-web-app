import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactsGroupViewComponent } from './contacts-group-view.component';

describe('ContactsGroupViewComponent', () => {
  let component: ContactsGroupViewComponent;
  let fixture: ComponentFixture<ContactsGroupViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactsGroupViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactsGroupViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
