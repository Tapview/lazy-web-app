import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {MatSnackBar} from '@angular/material';


@Component({
  selector: 'app-contacts-group-view',
  templateUrl: './contacts-group-add.component.html',
  styleUrls: ['./contacts-group-add.component.scss']
})
export class ContactsGroupAddComponent implements OnInit {
  form: FormGroup;
  formErrorMessage: string;
   waiting: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar, ) { }

  ngOnInit() {
    this.form = new FormGroup({
      groupName: new FormControl(''),
    });
  }

  addGroup = function (form) {
    if ( form.groupName.length === 0 ) {
      this.formErrorMessage = 'Please type a valid group name.';
       return;
    }
    this.waiting = true;
    this.http.post('/api/contacts/group/add', {
      'groupName': form.groupName,
    })
      .subscribe((result) => {
        this.waiting = false;
        switch (result.message) {
          case 'Success.':
            this.snackBar.open('Group created successfully', 'Dismiss', {
              duration: 2000,
            });
            this.router.navigate(['/contacts/groups']);
            break;
          case 'Group already exist.':
            this.formErrorMessage = 'Group already exist, choose another name';
            break;
          case 'Problem finding a group.':
          case 'Problem creating a group.':
            this.formErrorMessage = 'Group cannot be created created.';
            break;
          default:
            this.formErrorMessage = 'Something went wrong, please try again later.';
        }
      },
      errorResponse => {
        this.waiting = false;
        // 422 or 500
        this.formErrorMessage = 'Something went wrong, please try again later.';
      });
  };

  submit = function (from) {
  };
}
