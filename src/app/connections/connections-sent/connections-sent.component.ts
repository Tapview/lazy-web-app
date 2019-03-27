import { MatDialog, MatSnackBar} from '@angular/material';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { UserService, User } from '../../user.service';


@Component({
  selector: 'app-connections-sent',
  templateUrl: './connections-sent.component.html',
  styleUrls: ['./connections-sent.component.scss']
})
export class ConnectionsSentComponent implements OnInit {
  user: User;
  connectionSent: { userId: string, givenName: string, familyName: string }[] = [];
  deleteSentRequest: { userId: string, givenName: string, familyName: string };
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
    this.loadSentRequests();
  }

  loadSentRequests = function () {
    this.http.post('/api/connection/get-sent-request', {
      'userId': this.user.id,
    })
    .subscribe((data) => {
       this.connectionSent = data;
    });
  };

  deleteConnectionConfirmation = function (connectionRequest, modal) {
    this.deleteSentRequest = connectionRequest;
    this.modalReference = this.dialogService.open(modal);
  };

  deleteConnection = function () {
    this.http.post('/api/connection/action-request', {
      'userId': this.user.id,
      'action': 'cancel',
      'senderUserId': this.deleteSentRequest.userId,
    })
    .subscribe((result) => {
      if (result.message === 'Request cancelled') {
        this.connectionSent.splice(this.connectionSent.indexOf(this.deleteSentRequest), 1);
        this.resetForm();
        this.snackBar.open('Request canceled.', 'Dismiss', {
          duration: 2000,
        });
      }
    },
    errorResponse => {
      // 422 or 500
      this.snackBar.open('Request cannot be deleted, try later.', 'Dismiss', {
        duration: 2000,
      });
    });
  };

  resetForm = function() {
    this.modalReference.close();
  };
}
