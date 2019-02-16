import {MatTableDataSource} from '@angular/material';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ConnectionComponent } from '../connections.component';


export interface ConnectionRequestElements {
  givenName: string;
  familyName: number;
}


@Component({
  selector: 'app-connections-request',
  templateUrl: './connections-request.component.html',
  styleUrls: ['./connections-request.component.scss']
})
export class ConnectionsRequestComponent implements OnInit {
  form: FormGroup;
  receiverUserId: string;
  link: string;
  formErrorMessage: string;
  userErrorId: string;
  pendingConnections: { userId: string, givenName: string, familyName: string }[] = [];
  displayedColumns: string[] = [ 'Given Name', 'Family Name', 'Action'];
  dataSource = new MatTableDataSource<ConnectionRequestElements>();

  constructor(
    private http: HttpClient,
    private connectionRoute: ConnectionComponent,
  ) { }

  ngOnInit() {
    this.formErrorMessage = undefined;
    this.userErrorId = undefined;
    this.form = new FormGroup({
      username: new FormControl(''),
      givenName: new FormControl(''),
      familyName: new FormControl(''),
      email: new FormControl(''),
    });

    this.loadPendingRequests();
  }

  ignoreUserConnection = function (connectionRequest) {
    this.formErrorMessage = undefined;
    this.userErrorId = undefined;

    this.http.post('/api/connection/action-request', {
      'action': 'reject',
      'senderUserId': connectionRequest.userId,
    })
      .subscribe((returnedResult) => {
        if (returnedResult.message === 'Request rejected') {
          // Remove the request from the pendingConnections array
          for ( let i = 0 ; i <= this.pendingConnections.length - 1; i++) {
            if ( this.pendingConnections[i].userId === connectionRequest.userId) {
              this.pendingConnections.splice(this.pendingConnections.indexOf(this.pendingConnections[i]), 1);
            }
          }
          this.dataSource = [];
          this.dataSource = new MatTableDataSource<ConnectionRequestElements>(this.pendingConnections);
          this.connectionRoute.loadPageCounters();
        }
        },
          errorResponse => {
            this.formErrorMessage = 'There was a problem ignoring this request.';
            this.userErrorId = connectionRequest.userId;
          });
  };


  loadPendingRequests = function () {
    this.formErrorMessage = undefined;
    this.userErrorId = undefined;
    this.pendingConnections = [];
    this.http.post('/api/connection/get-pending-requests')
      .subscribe((data) => {
        let num = 0;
        for (num = 0; num < data.length; num++) {
          this.pendingConnections.push(
            {
              'userId': data[num].userId,
              'givenName': data[num].givenName,
              'familyName': data[num].familyName
            });
        }
          this.dataSource = new MatTableDataSource<ConnectionRequestElements>(this.pendingConnections);
      });
  };



  approveUserConnection = function (connectionRequest) {
    this.formErrorMessage = undefined;
    this.userErrorId = undefined;
    this.http.post('/api/connection/action-request', {
      'action': 'accept',
      'senderUserId': connectionRequest.userId,
    })
      .subscribe((returnedResult) => {
        if (returnedResult.message === 'Request accepted') {
           // Remove the request from the pendingConnections array
           for ( let i = 0 ; i <= this.pendingConnections.length - 1; i++) {
            if ( this.pendingConnections[i].userId === connectionRequest.userId) {
              this.pendingConnections.splice(this.pendingConnections.indexOf(this.pendingConnections[i]), 1);
            }
          }
          this.dataSource = [];
          this.dataSource = new MatTableDataSource<ConnectionRequestElements>(this.pendingConnections);
          }
        },
        errorResponse => {
          this.formErrorMessage = 'There was a problem accepting this request.';
          this.userErrorId = connectionRequest.userId;
        });
        // Update notification counter in parent.
        this.connectionRoute.loadPageCounters();
  };
}
