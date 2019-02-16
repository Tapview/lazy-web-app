import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {
  form: FormGroup;
  organization: string;
  orgId: string;
  sub: any;
  authorized = false;
  errorMessage: string;

  constructor(private router: Router, private http: HttpClient,
              private activatedRoute: ActivatedRoute, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.sub = this.activatedRoute.params.subscribe(params => {
      this.http.post<any>('/api/organization/get-details', {
          'username': params.orgUsername
      })
      .subscribe(organization => {
        this.authorized = true;
        this.organization = organization['orgDetail'];
        this.orgId = this.organization['_id'];
      },
      (errorResponse) => {
        this.authorized = false;
      });
    });
    this.form = new FormGroup({
      username: new FormControl('', Validators.required),
    });
  }

  submit = function (formData) {
    if (this.form.invalid) {
      return;
    }

    this.http.post('/api/organization/add-user', {
      'orgId': this.orgId,
      'username': formData.username,
    })
    .subscribe(() => {
      this.router.navigate(['/organization']);
      this.snackBar.open('User added successfully', 'Dismiss', {
        duration: 5000,
        verticalPosition: 'top',
        horizontalPosition: 'right',
      });
    },
    (errorResponse) => {
      this.errorMessage = errorResponse.error.message;
    });
  };
}
