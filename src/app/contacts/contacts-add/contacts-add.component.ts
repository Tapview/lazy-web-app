import { Component, OnInit, ElementRef, ViewChild} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {MatSnackBar, MatAutocompleteSelectedEvent, MatChipInputEvent, MatAutocomplete} from '@angular/material';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {COMMA, ENTER} from '@angular/cdk/keycodes';

@Component({
  selector: 'app-contacts-add',
  templateUrl: './contacts-add.component.html',
  styleUrls: ['./contacts-add.component.scss']
})
export class ContactsAddComponent implements OnInit {
  form: FormGroup;
  formErrorMessage: string;
  isEditMode: boolean;
  waiting: boolean;
  groups: { groupId: string, groupName: string }[] = [];
  _groups = [];
  groupsSelection = [];

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  groupCtrl = new FormControl();
  filteredGroups: Observable<string[]>;
  selectedGroups: string[];
  groupsIds = [];



  @ViewChild('groupInput') groupInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar, ) { }

  ngOnInit() {
    this.formErrorMessage = undefined;
    this.isEditMode = true;
    this.form = new FormGroup({
      givenName: new FormControl(''),
      familyName: new FormControl(''),
      email: new FormControl('', [Validators.required, Validators.email]),
      contactGroup: new FormControl(''),
    });
    this.loadContactsGroups();
  }

  loadContactsGroups = function () {
    this.http.post('/api/contacts/group/get-groups', {})
        .subscribe((data: any) => {
          this.groups = data;
          for ( const g of data) {
            this._groups.push(g.groupName);
          }
          this.filteredGroups = this.groupCtrl.valueChanges.pipe(
            startWith(null),
            map((grp: string | null) => grp ? this._filter(grp) : this._groups.slice()));
            // the default selected group.
            this.selectedGroups = [];
        });
  };

  addContact = function (newContact) {
    this.groupsIds = [];
    for (const i of this.selectedGroups) {
      this.groupsIds.push(this.groups[this.groups.findIndex(g => g.groupName === i)]._id);
    }

    if ( newContact.givenName.length === 0 ||
        newContact.familyName.length === 0 ||
        newContact.email.length === 0 ) {
      this.formErrorMessage = 'Please type a valid inputs.';
      return;
    }

    this.waiting = true;
    this.http.post('/api/contacts/add', {
      'givenName': newContact.givenName,
      'familyName': newContact.familyName,
      'email': newContact.email,
      'contactGroupIds': this.groupsIds,
    })
    .subscribe((result) => {
      this.waiting = false;
      this.isEditMode = false;
      switch (result.message) {
        case 'Success.':
          this.snackBar.open('Contact created successfully', 'Dismiss', {
            duration: 2000,
          });
          this.router.navigate(['/contacts/i/' + result.contactId]);
          break;
        case 'Problem finding a group.':
        case 'Problem creating a group.':
          this.formErrorMessage = 'Contact cannot be created.';
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

  submit = function () {
  };


  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this._groups.filter(grp => grp.toLowerCase().indexOf(filterValue) === 0);
  }

  add(event: MatChipInputEvent): void {
    // Validate the typed group
    let groupExists = false;
    for (const comparedName of this.groups) {
      if ( comparedName.groupName === event.value) {
          groupExists = true;
          break;
      }
    }
    if (!groupExists) {
      return;
    }

    // Add group only when MatAutocomplete is not open
    // To make sure this does not conflict with OptionSelected Event
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value = event.value;

      // Add your group
      if ((value || '').trim()) {
        this.selectedGroups.push(value.trim());
      }

      // Reset the input value
      if (input) {
        input.value = '';
      }
      this.groupCtrl.setValue(null);
    }
  }

  remove(grp: string): void {
    const index = this.selectedGroups.indexOf(grp);
    if (index >= 0) {
      this.selectedGroups.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    // Selected if only unique
    if (this.selectedGroups.indexOf(event.option.viewValue) === -1) {
      this.selectedGroups.push(event.option.viewValue);
      this.groupInput.nativeElement.value = '';
      this.groupCtrl.setValue(null);
    }
  }


}
