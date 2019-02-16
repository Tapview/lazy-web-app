import {SelectionModel} from '@angular/cdk/collections';
import {MatTableDataSource} from '@angular/material';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface ContactElements {
  isFavorite: Boolean;
  isEditMode: Boolean;
  position: number;
  givenName: string;
  familyName: number;
  email: number;
}

@Component({
  selector: 'app-contacts-view',
  templateUrl: './contacts-view.component.html',
  styleUrls: ['./contacts-view.component.scss']
})
export class ContactsViewComponent implements OnInit {
  form: FormGroup;
  disableButton = true;
  submitSuccess = false;
  formErrorMessage: string;
  contactId: string;
  private allContacts = [];
  displayedColumns: string[] = ['select', 'Given Name', 'Family Name', 'Email', 'Action'];
  selection = new SelectionModel<ContactElements>(true, []);
  dataSource = new MatTableDataSource<ContactElements>(this.allContacts);

  constructor(
    private http: HttpClient,
  ) { }

  ngOnInit() {
    this.loadContacts();
  }


  loadContacts = function () {
    this.dataSource = [];
    this.allContacts = [];
    this.http.post('/api/contacts/view', { })
        .subscribe ((data: any) => {
          this.allContacts = data;
          this.dataSource = new MatTableDataSource<ContactElements>(this.allContacts);
        });
  };

  submit = function () { };

  deleteContact = function (contact) {
    this.http.post('/api/contacts/remove', {
      'contactId': contact.contactId,
    })
      .subscribe((result) => {
        if (result.message === 'Contact deleted' ) {
            this.loadContacts();
        }
      });
  };

  editContact = function (contact) {
    this.isEditMode = true;
    this.contactId = contact.contactId;
    this.form = new FormGroup({
      givenName: new FormControl(contact.givenName),
      familyName: new FormControl(contact.familyName),
      email: new FormControl(contact.email, [Validators.required, Validators.email]),
    });

  };

  updateContact = function (contact) {
    this.http.post('/api/contacts/update', {
      'contactId': this.contactId,
      'givenName': contact.givenName,
      'familyName': contact.familyName,
      'email': contact.email,
    })
      .subscribe((result) => {
        if (result.message === 'Contact updated' ) {
          this.isEditMode = false;
          this.loadContacts();
        }
      });
  };



  removeContactFav = function (contact) {
    this.http.post('/api/contacts/add-remove-fav', {
      'contactId': contact.contactId,
      'action': 'remove',
    })
      .subscribe((result) => {
        if (result.message === 'Contact modified' ) {
           for ( let i = 0 ; i <= this.allContacts.length - 1; i++) {
            if ( this.allContacts[i].contactId === contact.contactId) {
                  this.allContacts[i].isFavorite = false;
              }
            }
          }
        });
  };

  addContactFav = function (contact) {
    this.http.post('/api/contacts/add-remove-fav', {
      'contactId': contact.contactId,
      'action': 'add',
    })
      .subscribe((result) => {
        if (result.message === 'Contact modified' ) {
           for ( let i = 0 ; i <= this.allContacts.length - 1; i++) {
            if ( this.allContacts[i].contactId === contact.contactId) {
                  this.allContacts[i].isFavorite = true;
              }
            }
          }
        });
  };


  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }


}
