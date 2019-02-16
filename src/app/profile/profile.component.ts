import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UserService, User } from '../user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  form: FormGroup;

  imageUploadRoute = '/api/user/profile-image-upload';

  waiting = false;
  disableButton = true;
  submitSuccess = false;
  formErrorMessage: string;
  user: User;
  profileImage: string;
  usernameErrorMessage: string;
  ratios = [{value: 1 / 1, view: '1 / 1'}, {value: 4 / 3, view: ' 4 / 3'}];
  selectedRatio = 1 / 1;

  constructor(
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private userService: UserService,
  ) { }

  ngOnInit() {
    this.userService.userObservable
        .subscribe(user => {
          this.profileImage = user.profileImage;
          this.form = new FormGroup ({
            givenName: new FormControl(user.givenName, [Validators.required]),
            familyName: new FormControl(user.familyName, [Validators.required]),
            email: new FormControl(user.email, [Validators.required, Validators.email]),
            username: new FormControl(user.displayUsername, [Validators.required,
              Validators.pattern(this.userService.displayUsernameRegexString)]),
          });
          this.user = user;
        });
    this.form.valueChanges.subscribe(changes => this.wasFormChanged(changes));
    this.form.valueChanges.subscribe(changes => this.checkUsername(changes));
  }

  // If any changes done below, please do the same in "checkUsername"
  // function in register.component.ts
  checkUsername = function (formData)  {
    this.form.controls['username'].setErrors(null);
    const displayUsernameRegex =
        new RegExp(this.userService.displayUsernameRegexString);

    // this.currentUsername - designed to prevent the form from reporting an
    // error if the username has been updated
    const initialUsername = this.userService.normalizeUsername(this.user.displayUsername);
    const displayUsername = this.user.displayUsername;
    this.currentUsername = this.userService.normalizeUsername(formData.username);
    this.currentDisplayName = formData.username;
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
    if (initialUsername !== this.currentUsername) {
      this.http.post('/api/username-available', {
            username: this.currentUsername,
            storedUsername: this.user.displayUsername,
            id: this.user.id,
          })
          .subscribe(data => {
            if (initialUsername !== this.currentUsername || this.currentDisplayName !== displayUsername) {
              if (!data.available) {
                this.disableButton = true;
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
    this.userService.updateUserDetails();
    this.snackBar.open('Image Uploaded Successfully', 'Dismiss', {
      duration: 5000,
      verticalPosition: 'top',
      horizontalPosition: 'right',
    });
    // Resubscribe to form changes after success
    setTimeout(() => {
      this.form.valueChanges.subscribe(changes => this.wasFormChanged(changes));
      this.form.valueChanges.subscribe(changes => this.checkUsername(changes));
    }, 100);
  }

  handleImageError() {
    this.user.profileImage = '';
  }

  private wasFormChanged(currentValue) {
    const fields = ['givenName', 'familyName', 'email'];
    this.disableButton = true;
    this.submitSuccess = false;
    this.formErrorMessage = undefined;
    const tempUsername = this.userService.normalizeUsername(currentValue.username);
    const tempDisplayUsername = this.user.displayUsername;
    fields.forEach(element => {
      if (this.user[element] !== currentValue[element]
          || tempUsername !== this.userService.normalizeUsername(this.user.displayUsername)
          || tempDisplayUsername !== currentValue.username) {
        this.disableButton = false;
        return;
      }
    });
  }

  submit = function (formData) {
    if (this.form.invalid) {
      return;
    }
    // Clear state from previous submissions
    this.disableButton = false;
    this.submitSuccess = false;
    this.formErrorMessage = undefined;
    this.waiting = true;
    this.http.post('/api/user/save-details', {
          'email': formData.email,
          'givenName': formData.givenName,
          'familyName': formData.familyName,
          'username': formData.username,
        })
        .subscribe(() => { // data
          this.waiting = false;
          this.submitSuccess = true;
          this.disableButton = true;
          this.userService.updateUserDetails();
          // Resubscribe to form changes after success
          setTimeout(() => {
            this.form.valueChanges.subscribe(changes => this.wasFormChanged(changes));
            this.form.valueChanges.subscribe(changes => this.checkUsername(changes));
          }, 100);
        },
        () => { // err
          this.waiting = false;
          this.disableButton = true;
          this.formErrorMessage = 'There was a problem submitting the form.';
        });
  };
}
