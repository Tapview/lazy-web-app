import { MatDialog, MatSnackBar} from '@angular/material';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ConnectionComponent } from '../connections.component';
import { UserService, User } from '../../user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-connections-request',
  templateUrl: './connections-request.component.html',
  styleUrls: ['./connections-request.component.scss']
})
export class ConnectionsRequestComponent implements OnInit {
  user: User;
  pendingConnections: { userId: string, givenName: string, familyName: string }[] = [];
  pendingRequest: { userId: string, givenName: string, familyName: string };
  modalReference = null;

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private connectionRoute: ConnectionComponent,
    private dialogService: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
  ) { }

  ngOnInit() {
    this.userService.userObservable
      .subscribe(user => {
        this.user = user;
      });
    this.loadPendingRequests();
  }

  loadPendingRequests = function () {
    this.http.post('/api/connection/get-pending-requests')
      .subscribe((data) => {
        this.pendingConnections = data;
      });
  };


  ignoreSentConfirmation = function (connectionRequest, modal) {
    this.pendingRequest = connectionRequest;
    this.modalReference = this.dialogService.open(modal);
  };


  ignoreConnection = function () {
    this.http.post('/api/connection/action-request', {
      'userId': this.user.id,
      'action': 'reject',
      'senderUserId': this.pendingRequest.userId,
    })
    .subscribe((returnedResult) => {
      if (returnedResult.message === 'Request rejected') {
        this.pendingConnections.splice(this.pendingConnections.indexOf(this.pendingRequest), 1);
        this.connectionRoute.loadPageCounters();
        this.snackBar.open('Request rejected.', 'Dismiss', {
          duration: 2000,
        });
        this.resetForm();
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

  onSelect(connection) {
    this.router.navigate(['/connections/request/' + connection.userId]);
  }

  approveUserConnection = function (connectionRequest) {
    this.pendingRequest = connectionRequest;
    this.http.post('/api/connection/action-request', {
      'userId': this.user.id,
      'action': 'accept',
      'senderUserId': connectionRequest.userId,
    })
    .subscribe(returnedResult => {
      if (returnedResult.message === 'Request accepted') {
        this.pendingConnections.splice(this.pendingConnections.indexOf(this.pendingRequest), 1);
        this.connectionRoute.loadPageCounters();
        this.snackBar.open('Request accepted.', 'Dismiss', {
          duration: 2000,
        });
      }
    },
    errorResponse => {
      // 422 or 500
      this.snackBar.open('Request cannot be approved, try later.', 'Dismiss', {
        duration: 2000,
      });
    });
  };
}
