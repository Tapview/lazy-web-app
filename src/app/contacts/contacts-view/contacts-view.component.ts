import { Component, OnInit } from '@angular/core';
import { FormGroup, FormGroupName } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';


@Component({
  selector: 'app-contacts-view',
  templateUrl: './contacts-view.component.html',
  styleUrls: ['./contacts-view.component.scss']
})
export class ContactsViewComponent implements OnInit {
  form: FormGroup;
  contactId: string;
  contactsArr = [];
  contacts: { id: string, familyName: string, givenName: string, groupId: string, groupName: string, contactImage: string }[] = [];

  isViewAll: boolean;
  deleteContactName: string;
  modalReference = null;

  constructor(
    private http: HttpClient,
    private dialogService: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar, ) { }

  ngOnInit() {

    this.isViewAll = true;
    this.loadContacts();
  }


  loadContacts = function () {
    this.dataSource = [];
    this.contactsArr = [];
    this.http.post('/api/contacts/view', { })
        .subscribe ((data: any) => {
            this.contacts = data;
            this.loadContactsGroups();
        });
  };


  getGroupName = function (groupId) {
    let groupName: string;
    for ( const s of this.groups) {
      if ( groupId === s._id ) {
        groupName = s.groupName;
        break;
      }
    }
    return groupName;
  };

  loadContactsGroups = function () {
    this.http.post('/api/contacts/group/get-groups', {})
        .subscribe((data: any) => {
          this.groups = data;
          for (const contact of this.contacts) {
            if ( contact.groupId != null) {
              const ContactGroupsArr = [];
              for ( const i of contact.groupId ) {
                ContactGroupsArr.push(this.getGroupName(i));
              }
              contact.groupName = ContactGroupsArr;
              }
            }
        });
  };


  openDeleteContact = function (contact) {
    this.contactId = contact._id;
    this.deleteContactName = contact.givenName + ' ' + contact.familyName;
  };

  deleteContact = function (contact) {
    this.http.post('/api/contacts/delete', {
      'contactId': this.contactId,
    })
    .subscribe((result) => {
      if (result.message === 'Contact deleted.') {
        this.loadContacts();
        this.resetForm();
      }
      this.snackBar.open( result.message, 'Dismiss', {
        duration: 2000,
      });
    });
  };

  editContact = function (contact) {
    this.isViewAll = false;
    this.contactId = contact.contactId;
    this.router.navigate(['/contacts/i/' + contact._id + '/edit']);
  };

  resetForm = function() {
    this.groupAddMessage = undefined;
    this.isViewAll = true;
    this.modalReference.close();
  };

  contactDeleteDialog(modal) {
    this.modalReference = this.dialogService.open(modal);
  }

  onSelect(contact) {
    this.router.navigate(['/contacts/i/' + contact._id]);

  }
}
