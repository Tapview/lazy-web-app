import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { UserService, User } from '../../user.service';
import { MatDialog, MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-connections-view',
  templateUrl: './connections-view.component.html',
  styleUrls: ['./connections-view.component.scss']
})
export class ConnectionsViewComponent implements OnInit {
  user: User;
  confirmedConnections: { userId: string, givenName: string, familyName: string }[] = [];
  deleteConfirmedConnection: { userId: string, givenName: string, familyName: string };
  modalReference = null;

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private dialogService: MatDialog,
    private snackBar: MatSnackBar, ) { }

  ngOnInit() {
    this.userService.userObservable
    .subscribe(user => {
      this.user = user;
    });
    this.loadConfirmedRequests();
  }

  loadConfirmedRequests = function () {
    this.http.post('/api/connection/get-connections')
      .subscribe((data) => {
        this.confirmedConnections = data;
      });
  };

  deleteConnectionConfirmation = function (connection, modal) {
    this.deleteConfirmedConnection = connection;
    this.modalReference = this.dialogService.open(modal);
  };


  deleteConnection = function () {
    this.http.post('/api/connection/remove-connection', {
      'userId': this.user.id,
      'senderUserId': this.deleteConfirmedConnection.userId,
    })
    .subscribe((result) => {
      if (result.message === 'Connection removed') {
        this.confirmedConnections.splice(this.confirmedConnections.indexOf(this.deleteConfirmedConnection), 1);
        this.resetForm();
        this.snackBar.open('Connection removed.', 'Dismiss', {
          duration: 2000,
        });
      }
    },
    errorResponse => {
      // 422 or 500
      this.snackBar.open('Connection cannot be removed, Please try later.', 'Dismiss', {
        duration: 2000,
      });
    });
  };

  resetForm = function() {
    this.modalReference.close();
  };
}
