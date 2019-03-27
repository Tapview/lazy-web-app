import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatSnackBar, } from '@angular/material';
import { Router } from '@angular/router';

export interface ContactElement {
  id: string;
  userId: string;
  givenName: string;
  familyName: string;
  email: string;
  contactImage: string;
}

@Component({
  selector: 'app-contacts-details',
  templateUrl: './contacts-details.component.html',
  styleUrls: ['./contacts-details.component.scss']
})
export class ContactDetailsComponent implements OnInit {
  receiverUserId: string;
  contactDetails: ContactElement;
  contactIdURL: string;
  modalReference = null;
  contactId: string;
  constructor(private http: HttpClient,
    private route: ActivatedRoute,
    private dialogService: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar, ) { }


  ngOnInit() {
    this.contactDetails = {
      id: '',
      userId: '',
      givenName : '',
      familyName : '',
      email: '',
      contactImage: '',
    };
    this.contactIdURL = this.route.snapshot.paramMap.get('contactId');
    this.loadContactDetails();
  }

  loadContactDetails = function () {
    this.http.post('/api/contacts/details', {
      'contactId': this.contactIdURL,
    })
      .subscribe((result) => {
        this.contactDetails = result;
      });
  };


  contactDeleteDialog(modal) {
    this.modalReference = this.dialogService.open(modal);
  }



  openDeleteContact = function () {
    this.contactId = this.contactDetails.contactId;
    this.deleteContactName = this.contactDetails.givenName + ' ' + this.contactDetails.familyName;
  };

  deleteContact = function () {
    this.http.post('/api/contacts/delete', {
      'contactId': this.contactDetails._id,
    })
    .subscribe((result) => {
      if (result.message === 'Contact deleted.' ) {
        this.snackBar.open( 'Contact deleted successfully', 'Dismiss', {
          duration: 2000,
        });
        this.modalReference.close();
        this.router.navigate(['/contacts/view']);
      } else {
        this.snackBar.open( result.message, 'Dismiss', {
          duration: 2000,
        });
      }
    });
  };


  editContact = function () {
    this.contactId = this.contactDetails.contactId;
    this.router.navigate(['/contacts/i/' + this.contactIdURL + '/edit']);

  };

  resetForm = function() {
    this.modalReference.close();
  };


}
