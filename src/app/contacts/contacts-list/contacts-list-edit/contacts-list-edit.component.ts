import { Component, OnInit, Output, Input } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-contacts-list-edit',
  templateUrl: './contacts-list-edit.component.html',
  styleUrls: ['./contacts-list-edit.component.scss']
})
export class ContactsListEditComponent implements OnInit {
  form: FormGroup;
  formErrorMessage: string;
  listAddMessage: string;
  isEditMode: boolean;
  listName: string;
  listIdURL: string;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute ) { }

  ngOnInit() {
    this.listAddMessage = undefined;
    this.loadList();
    this.listIdURL = this.route.snapshot.paramMap.get('listId');
  }

  loadList = function () {
    this.dataSource = [];
    this.lists = [];
    this.http.post('/api/contacts-list/view', { })
        .subscribe ((data: any) => {
          this.lists = data;
          for ( const list of this.lists) {
            if ( list.id === this.listIdURL) {
              this.listName = list.listName;
              this.isEditMode = true;

              this.form = new FormGroup({
                listName: new FormControl(this.listName),
              });
            }
          }
        });
  };


  updateList = function (form) {
    if ( form.listName.length === 0 ) {
      this.formErrorMessage = 'Please type a valid list name.';
       return;
    }
    this.http.post('/api/contacts-list/edit', {
      'listId': this.listIdURL,
      'updatedListName': form.listName,
    })
      .subscribe((result) => {
        this.isEditMode = false;
        switch (result.message) {
              case 'List updated.':
              this.router.navigate(['/contacts/lists']);
              break;
              case 'List already exist.':
                this.listAddMessage = 'List already exist, choose another name';
              break;
              case 'Problem finding a list.':
              case 'Problem creating a list.':
                this.listAddMessage = 'List cannot be created created.';
              break;
              default:
                this.listAddMessage = 'Something went wrong, please try again later.';
            }
        });
  };

  submit = function () {
  };
}
