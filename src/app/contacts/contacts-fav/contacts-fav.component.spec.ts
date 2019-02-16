import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactsFavComponent } from './contacts-fav.component';

describe('ContactsComponent', () => {
  let component: ContactsFavComponent;
  let fixture: ComponentFixture<ContactsFavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactsFavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactsFavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
