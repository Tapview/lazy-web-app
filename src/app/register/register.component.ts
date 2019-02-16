import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, Validators, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserService } from '../user.service';
import { AnalyticsService } from '../analytics.service';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  form: FormGroup;
  submitSuccess = false;
  waiting = false;
  formErrorMessage: string;
  loginRegisterSwitchQueryParams: Params;
  redirectUrl: string;
  currentUsername: string;
  usernameErrorMessage: string;
  // Password related interface features
  currentPassword: string;
  passwordErrorMessage: string;
  passwordGuessesLog10 = 0;
  passwordProgressBarValue = 0;
  passwordSettings = { // note that these values may be overridden by the server response
    minLength: 10,
    minGuessesLog10: 8,
    goodGuessesLog10: 10,
  };

  constructor( private http: HttpClient,
      private userService: UserService,
      private activatedRoute: ActivatedRoute,
      private analytics: AnalyticsService,
      ) {

        // The following is to ensure that when a user is redirected for the
        // purposes of logging in that they are still redirected to the correct
        // on register success.
        this.activatedRoute.queryParams.subscribe((params: Params) => {
          console.log(params);
          this.loginRegisterSwitchQueryParams = params;
          this.redirectUrl = params.redirect;
        });
      }

  ngOnInit() {
    this.form = new FormGroup ({
      givenName: new FormControl('', [Validators.required]),
      familyName: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      username: new FormControl(''),
      password: new FormControl(''),
    });
    this.form.valueChanges.subscribe(formData => this.checkUsername(formData));
    this.form.valueChanges.subscribe(formData => this.checkPassword(formData));
  }

  // If any changes done below, please do the same in "checkUsername"
  // function in profile.component.ts
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


  checkPassword = function (formData)  {
    this.form.controls['password'].setErrors(null);

    // this.currentPassword - designed to prevent the form from reporting an
    // error if the password has been updated
    const initialPassword = formData.password;
    this.currentPassword = formData.password;
    if (initialPassword.length === 0) {
      this.form.controls['password'].setErrors({'incorrect': true});
      this.passwordErrorMessage = 'Required.';
      return;
    }

    setTimeout(() => { // Wait half second before checking password
      if (initialPassword === this.currentPassword) {
        this.http.post('/api/user/check-password', {
              password: initialPassword,
            })
            .subscribe(data => {
              if (initialPassword === this.currentPassword) {
                // Update the password settings
                this.passwordSettings.minLength =
                    data.passwordSettings.minLength;
                this.passwordSettings.minGuessesLog10 =
                    data.passwordSettings.minGuessesLog10;
                this.passwordSettings.goodGuessesLog10 =
                    data.passwordSettings.goodGuessesLog10;
                this.passwordProgressBarValue = data.guessesLog10 > 12 ?
                    100 : 100 / 12 * data.guessesLog10;
                this.passwordGuessesLog10 = data.guessesLog10;
                if (initialPassword.length < data.passwordSettings.minLength ||
                    data.guessesLog10 < data.passwordSettings.minGuessesLog10) {
                  this.form.controls['password'].setErrors({'incorrect': true});
                  this.passwordErrorMessage =
                      'Password must be at least ' +
                      data.passwordSettings.minLength +
                      ' characters and hard to guess.';
                } else {
                  this.form.controls['password'].setErrors(null);
                }
              }
            },
            errorResponse => {
              this.formErrorMessage = 'There may be a connection issue.';
            });
      } else {
        // console.log('Bailed');
      }
    }, 500);
  };

  updatePasswordProgressColor(progress) {
    if (this.passwordGuessesLog10 < this.passwordSettings.minGuessesLog10) {
      return 'simple-form-red-progress';
    } else if (this.passwordGuessesLog10 <
        this.passwordSettings.goodGuessesLog10) {
      return 'simple-form-yellow-progress';
    } else {
      return 'simple-form-green-progress';
    }
  }


  submit = function (formData) {
    if (this.form.invalid) {
      return;
    }
    // Clear state from previous submissions
    this.formErrorMessage = undefined;

    this.waiting = true;
    this.http.post('/api/user/register', {
          'givenName': formData.givenName,
          'familyName': formData.familyName,
          'email': formData.email,
          'username': formData.username,
          'password': formData.password,
        })
        .subscribe(data => {
          this.waiting = false;
          this.userService.authenticationResult(data);
          this.userService.successNavigate(this.redirectUrl);
          this.analytics.register();
        },
        errorResponse => {
          this.waiting = false;
          if (errorResponse.status === 409) {
            this.formErrorMessage = errorResponse.error.message;
            this.form.controls['username'].setErrors({'incorrect': true});
          } else {
            this.formErrorMessage = 'There was a problem submitting the form.';
          }
        });
  };
}
