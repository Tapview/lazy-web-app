import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactsGroupAddComponent } from './contacts-group-add.component';

describe('ContactsGroupAddComponent', () => {
  let component: ContactsGroupAddComponent;
  let fixture: ComponentFixture<ContactsGroupAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactsGroupAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactsGroupAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
