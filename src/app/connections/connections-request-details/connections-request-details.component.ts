import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService, User } from '../../user.service';
import { MatSnackBar, } from '@angular/material';
import { ConnectionComponent } from '../connections.component';


@Component({
  selector: 'app-connections-request-details',
  templateUrl: './connections-request-details.component.html',
  styleUrls: ['./connections-request-details.component.scss']
})
export class ConnectionsRequestDetailsComponent implements OnInit {
  user: User;
  isConnectionRequestLoaded: boolean;
  requestConnection: { userId: string, givenName: string, familyName: string, sendTimestamp: Date };
  userIdURL: string;
  constructor(
    private http: HttpClient,
    private userService: UserService,
    private connectionRoute: ConnectionComponent,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar, ) { }


  ngOnInit() {
    this.userService.userObservable
      .subscribe(user => {
        this.user = user;
      });
    this.userIdURL = this.route.snapshot.paramMap.get('requestUserId');
    this.loadConfirmedRequests();
  }

  loadConfirmedRequests = function () {
    this.http.post('/api/connection/get-connections-details', {
      'senderUserId': this.userIdURL,
    })
      .subscribe((data) => {
        this.requestConnection = data;
        this.requestConnection.sendTimestamp = new Date(this.requestConnection.sendTimestamp);
        this.isConnectionRequestLoaded = true;
      });
  };

  ignoreConnectionRequest = function () {
    this.http.post('/api/connection/action-request', {
      'userId': this.user.id,
      'action': 'reject',
      'senderUserId': this.requestConnection.userId,
    })
    .subscribe((returnedResult) => {
      if (returnedResult.message === 'Request rejected') {
        this.connectionRoute.loadPageCounters();
        this.router.navigate(['/connections/request/']);
      }
    },
    errorResponse => {
      // 422 or 500
      this.snackBar.open('Request cannot be deleted, try later.', 'Dismiss', {
        duration: 2000,
      });
    });
  };

  confirmConnectionRequest = function() {
    this.http.post('/api/connection/action-request', {
      'userId': this.user.id,
      'action': 'accept',
      'senderUserId': this.requestConnection.userId,
    })
    .subscribe(returnedResult => {
      if (returnedResult.message === 'Request accepted') {
        this.connectionRoute.loadPageCounters();
        this.router.navigate(['/connections/request/']);
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
