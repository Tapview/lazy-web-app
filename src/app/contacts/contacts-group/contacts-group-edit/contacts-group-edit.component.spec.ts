import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactsGroupEditComponent } from './contacts-group-edit.component';

describe('ContactsGroupEditComponent', () => {
  let component: ContactsGroupEditComponent;
  let fixture: ComponentFixture<ContactsGroupEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactsGroupEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactsGroupEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
