import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { UserService, User } from '../../user.service';
import { FormGroup, FormControl } from '@angular/forms';
import {MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';

@Component({
  selector: 'app-connections-add',
  templateUrl: './connections-add.component.html',
  styleUrls: ['./connections-add.component.scss']
})
export class ConnectionsAddComponent implements OnInit {
  form: FormGroup;
  user: User;
  receiverUserId: string;
  requestFromMessage: string;
  constructor(
    private http: HttpClient,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    this.userService.userObservable
    .subscribe(user => {
      this.user = user;
    });
    this.form = new FormGroup({
      username: new FormControl(''),
    });

    this.userService.userObservable
      .subscribe(user => {
        this.user = user;
      });

  }

  resetForm = function() {
    this.requestFromMessage = undefined;
    this.form = new FormGroup({
      username: new FormControl(''),
    });


  };
  // Add new connection
  requestUserConnection = function (formData) {
    this.IsAddUserRequest = true;
    this.http.post('/api/connection/add-request', {
      'username': formData.username,
    })
      .subscribe(returnedResult => {
        if ( returnedResult.message === 'Success') {
          this.requestFromMessage = 'Request sent successfully';
        } else {
          this.requestFromMessage = 'Cannot process add users now';
        }
        this.snackBar.open(this.requestFromMessage, 'Dismiss', {
          duration: 2000,
        });
        this.requestFromMessage = undefined;
        this.resetForm();
      },
      errorResponse => {
          this.waiting = false;
          // 422 or 500
          switch (errorResponse.error.message) {
            case 'Cannot add same user':
              this.requestFromMessage = 'Cannot add yourself as a connection';
              break;
            case 'Already connected':
              this.requestFromMessage = 'You are already connected';
              break;
            case 'Could not save connection request':
              this.requestFromMessage = 'Connection request cannot be processed';
              break;
            case 'Problem finding connection requests':
              this.requestFromMessage = 'Problem finding connection requests';
              break;
            case 'Problem finding connections':
              this.requestFromMessage = 'Problem finding connections';
              break;
            default:
              this.requestFromMessage = 'Cannot process add users now!';
              break;
          }
          this.snackBar.open(errorResponse.error.message, 'Dismiss', {
            duration: 2000,
          });
          this.resetForm();
        });

  };
}
