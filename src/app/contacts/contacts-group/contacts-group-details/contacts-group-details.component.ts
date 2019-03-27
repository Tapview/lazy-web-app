import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatSnackBar, } from '@angular/material';
import { Router } from '@angular/router';



@Component({
  selector: 'app-contacts-group-details',
  templateUrl: './contacts-group-details.component.html',
  styleUrls: ['./contacts-group-details.component.scss']
})
export class ContactsGroupDetailsComponent implements OnInit {
  receiverUserId: string;
  link: string;
  groupContact: { contactId: string, givenName: string, familyName: string, email: string }[] = [];
  modalReference = null;
  contactId: string;
  groupIdURL: string;
  constructor(private http: HttpClient,
    private route: ActivatedRoute,
    private dialogService: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar, ) { }

  ngOnInit() {
    this.groupIdURL = this.route.snapshot.paramMap.get('groupId');
    this.loadGroupContact();
  }

  loadGroupContact = function () {
    this.http.post('/api/contacts/group/get-contacts', {
          'groupId': this.groupIdURL,
        })
        .subscribe(result => {
          this.groupContact = result;
        });
  };

  openRemoveContact = function (contact, modal) {
    this.modalReference = this.dialogService.open(modal);
    this.contactId = contact._id;
    this.removeContactName = contact.givenName + ' ' + contact.familyName;
  };

  removeContact = function () {
    this.http.post('/api/contacts/group/remove-contact', {
          'contactId': this.contactId,
        })
        .subscribe(result => {
          if (result.message === 'Contact removed.' ) {
            this.loadGroupContact();
            this.resetForm();
          } else {
            this.snackBar.open( result.message, 'Dismiss', {
              duration: 2000,
            });
        }
        });
  };

  onSelect(contact) {
    this.router.navigate(['/contacts/i/' + contact._id]);

  }
  resetForm = function() {
    this.modalReference.close();
    this.snackBar.open('Contact removed successfully', 'Dismiss', {
      duration: 2000,
    });
  };

  cancelDelete = function() {
    this.modalReference.close();
  };


}
