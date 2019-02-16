import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Organization } from '../organization.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-organization',
  templateUrl: './organization.component.html',
  styleUrls: ['./organization.component.scss']
})
export class OrganizationComponent implements OnInit {

  organization: Organization;
  userRoles: Array<string> =  [];
  username: Array<string> =  [];

  constructor(private http: HttpClient,
              private router: Router) {}

  ngOnInit() {
    this.http.post<Organization>('/api/organization/user-org-summary', {})
        .subscribe((response: any)  =>  {
          this.organization = response['orgDetails'];
          this.username = response.usernames;
          this.userRoles = response.userRoles;
        });
  }

  updateOrg(orgUsername) {
    this.router.navigate(['/organization/' + orgUsername + '/update']);
  }

  addUserToOrg(orgUsername) {
    this.router.navigate(['/organization/' + orgUsername + '/add-user']);
  }
}

