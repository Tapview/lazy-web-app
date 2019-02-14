import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { UserService, User } from '../user.service';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-add-connections',
  templateUrl: './add-connections.component.html',
  styleUrls: ['./add-connections.component.scss']
})
export class AddConnectionComponent implements OnInit {
  form: FormGroup;
  user: User;
  receiverUserId: string;
  requestFromMessage: string;
  constructor(
    private http: HttpClient,
    private userService: UserService,
  ) { }

  ngOnInit() {
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
      'userId': this.user.id,
      'username': formData.username,
    })
      .subscribe(returnedResult => {
        switch (returnedResult.message) {
          case 'Success':
            this.requestFromMessage = 'Request sent successfully. \nAdd more connections?';
            break;
          case 'Pending':
            this.requestFromMessage = 'Request is on the way';
            break;
          case 'User not found':
            this.requestFromMessage = 'Sorry, this user cannot be found';
            break;
          case 'Already connected':
            this.requestFromMessage = 'You are already connected';
            break;
          default:
            this.requestFromMessage = 'Cannot process add users now';
            break;
        }

      });
  };
}
