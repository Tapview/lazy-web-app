import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MailingListComponent } from './add-contact';

describe('MailingListComponent', () => {
  let component: MailingListComponent;
  let fixture: ComponentFixture<MailingListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MailingListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MailingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
