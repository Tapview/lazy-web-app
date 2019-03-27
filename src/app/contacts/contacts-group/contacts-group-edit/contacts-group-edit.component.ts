import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, } from '@angular/material';
@Component({
  selector: 'app-contacts-group-edit',
  templateUrl: './contacts-group-edit.component.html',
  styleUrls: ['./contacts-group-edit.component.scss']
})
export class ContactsGroupEditComponent implements OnInit {
  form: FormGroup;
  formErrorMessage: string;
  groupAddMessage: string;
  isEditMode: boolean;
  groupName: string;
  groupIdURL: string;
  waiting: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar, ) { }

  ngOnInit() {
    this.groupAddMessage = undefined;
    this.loadGroup();
    this.groupIdURL = this.route.snapshot.paramMap.get('groupId');
  }

  loadGroup = function () {
    this.dataSource = [];
    this.groups = [];
    this.http.post('/api/contacts/group/view', { })
        .subscribe ((data: any) => {
          this.groups = data;
          for ( const group of this.groups) {
            if ( group._id === this.groupIdURL) {
              this.groupName = group.groupName;
              this.isEditMode = true;
              this.form = new FormGroup({
                groupName: new FormControl(this.groupName),
              });
            }
          }
        });
  };


  updateGroup = function (form) {
    if ( form.groupName.length === 0 ) {
      this.formErrorMessage = 'Please type a valid group name.';
       return;
    }
    this.waiting = true;
    this.http.post('/api/contacts/group/edit', {
      'groupId': this.groupIdURL,
      'updatedGroupName': form.groupName,
    })
      .subscribe((result) => {
        this.waiting = false;
        this.isEditMode = false;
        switch (result.message) {
          case 'Group updated.':
            this.snackBar.open('Group updated successfully', 'Dismiss', {
              duration: 2000,
            });
            this.router.navigate(['/contacts/groups']);
            break;
          case 'Group already exist.':
            this.groupAddMessage = 'Group already exist, choose another name';
            break;
          case 'Problem finding a group.':
          case 'Problem creating a group.':
            this.groupAddMessage = 'Group cannot be created created.';
            break;
          default:
            this.groupAddMessage = 'Something went wrong, please try again later.';
        }
      },
      errorResponse => {
        this.waiting = false;
        // 422 or 500
        this.formErrorMessage = 'Something went wrong, please try again later.';
      });
  };

  submit = function () {
  };
}
