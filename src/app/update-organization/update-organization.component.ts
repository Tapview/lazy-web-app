import { Component, OnInit, OnDestroy } from '@angular/core';
import { OrganizationService, Organization } from '../organization.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { MatDialog } from '@angular/material';
import { UserService } from '../user.service';

@Component({
  selector: 'app-update-organization',
  templateUrl: './update-organization.component.html',
  styleUrls: ['./update-organization.component.scss']
})
export class UpdateOrganizationComponent implements OnInit, OnDestroy {
  form: FormGroup;
  organization: Organization;
  formErrorMessage: string;
  submitSuccess = false;
  imageUploadRoute = '/api/organization/image-upload';
  logo: string;
  sub: any;
  ready = false;
  modalReference = null;
  users: Array<string> = [];
  userToBeDeleted: any;
  usernameErrorMessage: string;
  selectedRatio = 4 / 3;
  options: any = {
    size: 'dialog-centered',
    panelClass: 'custom-modalbox'
  };

  constructor(private snackBar: MatSnackBar, private http: HttpClient,
              private router: Router, private route: ActivatedRoute,
              private organizationService: OrganizationService,
              private dialogService: MatDialog, private userService: UserService) { }

  ngOnInit() {
    this.organizationService.orgObservable
        .subscribe((organization) => {
          this.logo = organization.logo;
        });
    this.sub = this.route.params.subscribe(params => {
      this.http.post<Organization>('/api/organization/get-details', {
          'username': params.orgUsername
      })
      .subscribe(organization => {
          this.organization = organization;
          this.form = new FormGroup ({
            name: new FormControl(organization.name, Validators.required),
            website: new FormControl(organization.website),
            phoneNumber: new FormControl(organization.phoneNumber),
            username: new FormControl(organization.username, Validators.required),
        });
        this.ready = true;
        this.form.valueChanges.subscribe(changes => this.checkUsername(changes));
      });
      this.http.post<any>('/api/organization/get-users', {
        'username': params.orgUsername
      })
      .subscribe(users => {
        this.users = users;
      });
    });
  }

  checkUsername = function (formData)  {
    this.form.controls['username'].setErrors(null);
    const displayUsernameRegex =
        new RegExp(this.userService.displayUsernameRegexString);

    // this.currentUsername - designed to prevent the form from reporting an
    // error if the username has been updated
    const initialUsername = this.organization.username;
    this.currentUsername = this.normalizeUsername(formData.username);
    this.currentDisplayName = formData.username;
    if (initialUsername.length === 0) {
      this.form.controls['username'].setErrors({'incorrect': true});
      this.usernameErrorMessage = 'Required.';
      return;
    }
    if (initialUsername !== this.currentUsername) {
      this.http.post('/api/user/username-available', {
            username: this.currentUsername,
          })
          .subscribe(data => {
            if (initialUsername !== this.currentUsername) {
              if (!data.available) {
                this.form.controls['username'].setErrors({'incorrect': true});
                this.usernameErrorMessage =
                    'Username is not available. Please choose another.';
              } else {
                this.form.controls['username'].setErrors(null);
              }
            }
          },
          errorResponse => {
            this.formErrorMessage = 'There may be a connection issue.';
          });
    }
  };

  normalizeUsername(username) {
    return username
        .split('.').join('')
        .split('_').join('')
        .split('-').join('')
        .toLowerCase();
  }

  handleImageUpload(imageUrl: string) {
    this.organizationService.updateOrgDetails(this.organization);
    this.snackBar.open('Image Uploaded Successfully', 'Dismiss', {
      duration: 5000,
      verticalPosition: 'top',
      horizontalPosition: 'right',
    });
  }

  handleImageError() {
    this.organization.logo = '';
  }

  deleteOrgDialog(modal) {
    this.modalReference = this.dialogService.open(modal);
  }

  deleteOrg() {
    this.modalReference.close();
    this.http.post('api/organization/delete', {
      'id': this.organization._id,
    })
    .subscribe(() => {
      this.router.navigateByUrl('/organization');
      this.snackBar.open('Organization deleted Successfully', 'Dismiss', {
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'right',
      });
    },
    (errorResponse) => {
      this.formErrorMessage = errorResponse.error.message;
    });
  }

  cancel() {
    this.modalReference.close();
  }

  userDialog(user, modal) {
    this.userToBeDeleted = user;
    this.modalReference = this.dialogService.open(modal, this.options);
  }

  delUser() {
    this.http.post('/api/organization/remove-user', {
      'userId': this.userToBeDeleted,
      'orgId': this.organization._id,
    })
    .subscribe(() => {
      const userIndex = this.users.findIndex((user) => user['_id'] === this.userToBeDeleted);
      this.users.splice(userIndex, 1);
    });
    this.modalReference.close();
  }

  submit = function(formData) {
    if (this.form.invalid) {
      return;
    }
    this.formErrorMessage = undefined;
    this.http.post('/api/organization/update-details', {
        'id': this.organization._id,
        'name': formData.name,
        'website': formData.website,
        'phoneNumber': formData.phoneNumber,
        'username': formData.username,
    })
    .subscribe(() => {
      this.submitSuccess = true;
      this.router.navigateByUrl('/organization');
    },
    (errorResponse) => {
      this.submitSuccess = false;
      this.formErrorMessage = errorResponse.error.message;
    });
  };

    ngOnDestroy() {
      console.log('Test');
    }
}
