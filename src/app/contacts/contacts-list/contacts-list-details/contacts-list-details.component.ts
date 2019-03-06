import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatSnackBar,} from '@angular/material';
import { Router } from '@angular/router';



@Component({
  selector: 'app-contacts-list-details',
  templateUrl: './contacts-list-details.component.html',
  styleUrls: ['./contacts-list-details.component.scss']
})
export class ContactsListDetailsComponent implements OnInit {
  receiverUserId: string;
  link: string;
  listContact: { contactId: string, givenName: string, familyName: string, email: string }[] = [];
  modalReference = null;
  contactId: string;
  listIdURL: string;
  constructor(private http: HttpClient,
    private route: ActivatedRoute,
    private dialogService: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar, ) { }

  ngOnInit() {
    this.listIdURL = this.route.snapshot.paramMap.get('listId');
    this.loadListContact();

  }

  loadListContact = function () {
    this.http.post('/api/contacts/get-contacts-with-contactlists', {
      'listId': this.listIdURL,
    })
      .subscribe((result) => {
        this.listContact = result;
      });
  };

  openDeleteContact = function (contact) {
    this.contactId = contact._id;
    this.deleteContactName = contact.givenName + ' ' + contact.familyName;

  };

  deleteContact = function () {
    this.http.post('/api/contacts/delete', {
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


  editContact = function (contact) {
    this.router.navigate(['/contacts/edit/' + contact._id]);
  };

  resetForm = function() {
    this.modalReference.close();
    this.snackBar.open('Contact deleted successfully', 'Dismiss', {
      duration: 2000,
    });
  };


}
