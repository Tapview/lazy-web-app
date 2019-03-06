import {MatTableDataSource} from '@angular/material';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog, MatSnackBar, } from '@angular/material';

export interface ListDetails {
  id: string;
  listName: string;
  numberOfContacts: number;

}


@Component({
  selector: 'app-contacts-list-view',
  templateUrl: './contacts-list-view.component.html',
  styleUrls: ['./contacts-list-view.component.scss']
})
export class ContactsListViewComponent implements OnInit {
  form: FormGroup;
  isViewAll: boolean;
  lists: { listId: string, listName: string, numberOfContacts: number }[] = [];
  listDetails: ListDetails;
  modalReference = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private dialogService: MatDialog,
    private snackBar: MatSnackBar, ) { }

  ngOnInit() {
    this.isViewAll = true;
    this.loadLists();
  }


  loadLists = function () {
    this.dataSource = [];
    this.lists = [];
    this.http.post('/api/contacts-list/view', { })
        .subscribe ((data: any) => {
          this.lists = data;
          for (const counter of this.lists) {
              counter.numberOfContacts = 0;
          }
          this.dataSource = new MatTableDataSource<string>(this.allContacts);
          this.loadContactsRelations();
        });
  };

  loadContactsRelations = function () {
    this.http.post('/api/contacts/get-contacts-with-lists', {})
    .subscribe((data: any) => {

      this.listsConnections = data;

      for ( const listItem of this.lists) {
          for (const j of this.listsConnections) {
              if ( j.listId === listItem._id) {
                  listItem.numberOfContacts ++;
              }
          }
        }
    });

  };

  deleteList = function () {
    for (let i = 0 ; i < this.lists.length ; i++) {
        if ( this.listDetails._id === this.lists[i]._id ) {
          this.lists.splice(i, 1);
        }
      }

      this.http.post('/api/contacts-list/delete', {
            'listId': this.listDetails._id,
          })
          .subscribe((result) => {
              if (result.message === 'List deleted.' ) {
                  this.resetForm();
            }
        });
  };

  openDeleteList = function (list) {
    this.listDetails = list;
    this.listId = list.contactId;
  };


  editListForm = function (list) {
    this.isViewAll = false;
    this.listDetails = list;
    this.router.navigate(['/contacts/lists/i/' + list._id + '/edit']);

  };

  resetForm = function() {
    this.isViewAll = true;
    this.modalReference.close();
    this.snackBar.open('List deleted successfully', 'Dismiss', {
      duration: 2000,
    });

  };

  onSelect(list) {
    this.router.navigate(['/contacts/lists/i/' + list._id]);

  }

  listDeleteDialog(modal) {
    this.modalReference = this.dialogService.open(modal);
  }


}
