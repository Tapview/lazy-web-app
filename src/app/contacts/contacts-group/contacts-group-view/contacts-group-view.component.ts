import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog, MatSnackBar, } from '@angular/material';

export interface GroupDetails {
  id: string;
  groupName: string;
  numberOfContacts: number;

}


@Component({
  selector: 'app-contacts-group-view',
  templateUrl: './contacts-group-view.component.html',
  styleUrls: ['./contacts-group-view.component.scss']
})
export class ContactsGroupViewComponent implements OnInit {
  form: FormGroup;
  isViewAll: boolean;
  groups: { groupId: string, groupName: string, numberOfContacts: number }[] = [];
  groupDetails: GroupDetails;
  modalReference = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private dialogService: MatDialog,
    private snackBar: MatSnackBar, ) { }

  ngOnInit() {
    this.isViewAll = true;
    this.loadGroups();
  }

  loadGroups = function () {
    this.dataSource = [];
    this.groups = [];
    this.http.post('/api/contacts/group/view', { })
        .subscribe ((data: any) => {
          this.groups = data;
        });
  };

  deleteGroup = function () {
    for (let i = 0 ; i < this.groups.length ; i++) {
        if ( this.groupDetails._id === this.groups[i]._id ) {
          this.groups.splice(i, 1);
        }
      }

      this.http.post('/api/contacts/group/delete', {
            'groupId': this.groupDetails._id,
          })
          .subscribe((result) => {
              if (result.message === 'Group deleted.' ) {
                  this.resetForm();
              } else {
                this.snackBar.open( result.message, 'Dismiss', {
                  duration: 2000,
                });
              }

           });
  };

  openDeleteGroup = function (group) {
    this.groupDetails = group;
    this.groupId = group.contactId;
  };


  editGroupForm = function (group) {
    this.isViewAll = false;
    this.groupDetails = group;
    this.router.navigate(['/contacts/groups/i/' + group._id + '/edit']);

  };

  resetForm = function() {
    this.isViewAll = true;
    this.modalReference.close();

  };

  onSelect(group) {
    this.router.navigate(['/contacts/groups/i/' + group._id]);

  }

  groupDeleteDialog(modal) {
    this.modalReference = this.dialogService.open(modal);
  }


}
