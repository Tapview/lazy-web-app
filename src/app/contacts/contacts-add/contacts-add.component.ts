import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-contacts-add',
  templateUrl: './contacts-add.component.html',
  styleUrls: ['./contacts-add.component.scss']
})
export class ContactsAddComponent implements OnInit {
  form: FormGroup;
  waiting = false;
  formErrorMessage: string;
  submitSuccess: boolean;

  constructor(
    private http: HttpClient,
  ) { }

  ngOnInit() {
    this.form = new FormGroup ({
      givenName: new FormControl(''),
      familyName: new FormControl(''),
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  submit = function (formData) {
    if (this.form.invalid) {
      return;
    }
    // Clear state from previous submissions
    this.formErrorMessage = undefined;
    this.submitSuccess = false;
    this.waiting = true;
    this.http.post('/api/contacts/add', {
      'givenName': formData.givenName,
      'familyName': formData.familyName,
      'email': formData.email
    })
      .subscribe(data => {
          this.waiting = false;
          this.submitSuccess = true;
        },
        errorResponse => {
            this.waiting = false;
            this.formErrorMessage = 'There was a problem submitting the form.';
        });
  };
}
