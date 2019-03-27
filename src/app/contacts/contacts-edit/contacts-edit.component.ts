import { Component, OnInit, ElementRef, ViewChild} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import {MatSnackBar, MatAutocompleteSelectedEvent, MatChipInputEvent, MatAutocomplete} from '@angular/material';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {COMMA, ENTER} from '@angular/cdk/keycodes';


@Component({
  selector: 'app-contacts-edit',
  templateUrl: './contacts-edit.component.html',
  styleUrls: ['./contacts-edit.component.scss']
})
export class ContactsEditComponent implements OnInit {
  form: FormGroup;
  isEditMode: boolean;
  waiting: boolean;
  groups: { groupId: string, groupName: string, numberOfContacts: number }[] = [];
  contactIdURL: string;
  ContactGroupsArr = [];
  groupsSelection = [];
  _groups = [];

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  groupCtrl = new FormControl();
  filteredGroups: Observable<string[]>;
  selectedGroups: string[];
  groupsIds = [];

  imageUploadRoute = '/api/contacts/image-upload';
  contactImage: string;
  sub: any;
  selectedRatio = 4 / 3;
  options: any = {
    size: 'dialog-centered',
    panelClass: 'custom-modalbox'
  };


  @ViewChild('groupInput') groupInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocomplete;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.isEditMode = false;
    this.contactIdURL = this.route.snapshot.paramMap.get('contactId');
    this.loadContactsGroups();
  }

  loadContactsGroups = function () {
    this.http.post('/api/contacts/group/view', {})
        .subscribe((data: any) => {
            this.groups = data;
            this.loadContactDetails();
        });
  };

  loadContactDetails = function () {
    this.http.post('/api/contacts/details', {
      'contactId': this.contactIdURL,
    })
    .subscribe((data: any) => {
      if (this.groups != null) {
        for (const i of data.groups) {
          this.ContactGroupsArr.push(this.getGroupName(i.groupId));
          this._groups.push(this.getGroupName(i.groupId));

        }
      }

      this.filteredGroups = this.groupCtrl.valueChanges.pipe(
        startWith(null),
        map((grp: string | null) => grp ? this._filter(grp) : this._groups.slice()));

        // the default selected group.
        this.selectedGroups = this.ContactGroupsArr;

      this.isEditMode = true;
      this.form = new FormGroup({
        givenName: new FormControl(data.givenName),
        familyName: new FormControl(data.familyName),
        email: new FormControl(data.email, [Validators.required, Validators.email]),
        contactGroup: new FormControl(this.ContactGroupsArr),
      });
      this.contactImage = data.contactImage;
    });
  };

  updateContact = function (newContact) {
    this.waiting = true;

    this.groupsIds = [];
    for (const i of this.selectedGroups) {
      this.groupsIds.push(this.groups[this.groups.findIndex(g => g.groupName === i)]._id);
    }

    this.http.post('/api/contacts/edit', {
      'givenName': newContact.givenName,
      'familyName': newContact.familyName,
      'email': newContact.email,
      'contactId': this.contactIdURL,
      'contactGroupIds': this.groupsIds,
    })
      .subscribe((result) => {
        this.isEditMode = false;
        this.waiting = false;
          if ( result.message === 'Contact updated.') {
            this.snackBar.open('Contact updated successfully', 'Dismiss', {
              duration: 2000,
            });
            this.router.navigate(['/contacts/i/' + this.contactIdURL]);
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


  getGroupName = function (groupId) {
    let groupName: string;
    for ( const s of this.groups) {
      if ( groupId === s._id ) {
        groupName = s.groupName;
        break;
      }
    }
    return groupName;
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




handleImageUpload(imageUrl: string) {
  this.snackBar.open('Image Uploaded Successfully', 'Dismiss', {
    duration: 5000,
    verticalPosition: 'top',
    horizontalPosition: 'right',
  });
}

handleImageError() {
}

}
