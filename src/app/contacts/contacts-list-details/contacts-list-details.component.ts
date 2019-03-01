import {MatTableDataSource} from '@angular/material';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {SelectionModel} from '@angular/cdk/collections';
import { MatDialog } from '@angular/material';

export interface ContactElements {
  givenName: string;
  familyName: string;
  email: string;
  contactId: string;
}

@Component({
  selector: 'app-contacts-list-details',
  templateUrl: './contacts-list-details.component.html',
  styleUrls: ['./contacts-list-details.component.scss']
})
export class ContactsListDetailsComponent implements OnInit {
  receiverUserId: string;
  link: string;
  displayedColumns: string[] = ['select', 'givenName', 'familyName', 'email'];
  selection = new SelectionModel<ContactElements>(true, []);
  listContact: { contactId: string, givenName: string, familyName: string, email: string }[] = [];
  dataSource = new MatTableDataSource<ContactElements>(this.listContact);
  modalReference = null;
  contactId: string;
  listIdURL: string;
  constructor(private http: HttpClient,
    private route: ActivatedRoute,
    private dialogService: MatDialog,
    ) { }

  ngOnInit() {
    this.listIdURL = this.route.snapshot.paramMap.get('listId');
    this.loadListContact();

  }

  loadListContact = function () {
    this.http.post('/api/contacts/view-list-contacts', {
      'listId': this.listIdURL,
    })
      .subscribe((result) => {
        this.listContact = result;
      });
  };

  openDeleteContact = function (contact) {
    this.contactId = contact.contactId;
    console.log(contact);
    console.log(this.contactId);
    this.deleteContactName = contact.givenName + ' ' + contact.familyName;
  };

  deleteContact = function () {
    console.log(this.contactId);
    this.http.post('/api/contacts/delete-contact', {
      'contactId': this.contactId,
    })
      .subscribe((result) => {
        if (result.message === 'Contact deleted.' ) {
            this.loadListContact();
            this.resetForm();
        }
      });
  };

  contactDeleteDialog(modal) {
    this.modalReference = this.dialogService.open(modal);
  }

  resetForm = function() {
    this.modalReference.close();
  };


}
