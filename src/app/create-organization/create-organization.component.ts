import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserService } from '../user.service';

@Component({
  selector: 'app-create-organization',
  templateUrl: './create-organization.component.html',
  styleUrls: ['./create-organization.component.scss']
})
export class CreateOrganizationComponent implements OnInit {
  disableButton = false;
  waiting = false;
  form: FormGroup;
  formErrorMessage: string;
  usernameErrorMessage: string;

  constructor(private http: HttpClient,
              private router: Router,
              private userService: UserService) {
  }

  ngOnInit() {
    this.form = new FormGroup ({
      name: new FormControl('', [Validators.required]),
      website: new FormControl(''),
      phoneNumber: new FormControl(''),
      username: new FormControl('', [Validators.required])
    });
    this.form.valueChanges.subscribe(changes => this.checkUsername(changes));
  }

  checkUsername = function (formData)  {
    this.form.controls['username'].setErrors(null);
    const displayUsernameRegex =
        new RegExp(this.userService.displayUsernameRegexString);

    // this.currentUsername - designed to prevent the form from reporting an
    // error if the username has been updated
    const initialUsername = formData.username;
    this.currentUsername = formData.username;
    if (initialUsername.length === 0) {
      this.form.controls['username'].setErrors({'incorrect': true});
      this.usernameErrorMessage = 'Required.';
      return;
    }
    if (!displayUsernameRegex.test(initialUsername)) {
      this.form.controls['username'].setErrors({'incorrect': true});
      this.usernameErrorMessage = 'Not a valid username. Use only a-z, 0-9 and "_", "." or "-".';
      return;
    }
    setTimeout(() => { // Wait 1 second before checking username
      if (initialUsername === this.currentUsername) {
        this.http.post('/api/username-available', {
              username: initialUsername,
            })
            .subscribe(data => {
              if (initialUsername === this.currentUsername) {
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
      } else {
        // console.log('Bailed');
      }
    }, 1000);
  };


  submit = function(formData) {
    if (this.form.invalid) {
      return;
    }
    this.waiting = true;
    this.formErrorMessage = undefined;
    this.disableButton = false;
    this.http.post('/api/organization/create', {
          'name': formData.name,
          'website': formData.website,
          'phoneNumber': formData.phoneNumber,
          'username': formData.username,
    })
    .subscribe(() => {
      this.disableButton = false;
      this.waiting = false;
      this.router.navigateByUrl('/organization');
    },
    (errorResponse) => {
      this.waiting = false;
      this.formErrorMessage = errorResponse.error.message;
    });
  };
}


