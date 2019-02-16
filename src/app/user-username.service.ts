import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable()
export class UserUsernameService {

  data: any;
  constructor(private http: HttpClient) {}

  public getUserUsernameByUserId(username) {
     this.http.post('/api/organization/user-by-username', {
      'username': username,
    })
    .subscribe((user) => {
      return this.data = user;
    });
  }
}
