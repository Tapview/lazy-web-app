import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, ReplaySubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { isEqual } from 'lodash';
import {LocalStorageService, SessionStorageService} from 'ngx-webstorage';

// https://scotch.io/tutorials/protecting-angular-v2-routes-with-canactivatecanactivatechild-guards#toc-authentication-guard
// https://www.youtube.com/watch?v=WveRq-tlb6I
// https://www.youtube.com/watch?v=wswK6AzgvTE

const routeAfterLogout = '/';

@Injectable()
export class UserService {

  private user: User;
  private userSetTime: number; // in milliseconds
  private jwtExp: number; // in seconds
  private jwtRefreshTokenExp: number; // in seconds
  private refreshJwtTimeoutId: any;
  private refreshUserTimeoutId: any;
  private tabId: number;
  private refreshJwtAttempts: number;
  readonly usernameRegexString = '^[a-z0-9]*$';
  readonly displayUsernameRegexString = '^[a-zA-Z0-9_.-]*$';

  // Below we only only activate the subscribe after userObservable has
  // next called. The '1' refers to how many states are kept in the buffer to be
  // replay for the subscription.
  userObservable: Subject<User> = new ReplaySubject<User>(1);
  nav: NavObj;

  // Local storage variables
  // user-service.jwt-exp // <number>
  // user-service.jwt-refresh-token-exp // <number> a proxy for isLoggedIn
  // user-service.user // <User>
  // user-service.user-set-time // <number>, in milliseconds
  // user-service.is-refreshing // <boolean>

  constructor( private http: HttpClient,
      private router: Router,
      private localStorageService: LocalStorageService) {

    // Check if user is logged in. Note that because the JWT is stored in the
    // HTTP cookie, the front-end can't see the JWT.
    this.jwtRefreshTokenExp =
        this.localStorageService.retrieve('user-service.jwt-refresh-token-exp');

    this.userLocalStorageChecker();
    if (this.jwtRefreshTokenExp &&
        Date.now() / 1000 < this.jwtRefreshTokenExp) {
      this.checkThenRefreshJwt();
    } else {
      this.userObservable.next(undefined);
      this.jwtRefreshTokenExp = undefined;
      this.localStorageService.clear('user-service.jwt-refresh-token-exp');
    }
  }

  normalizeUsername(username) {
    return username
        .split('.').join('')
        .split('_').join('')
        .split('-').join('')
        .toLowerCase();
  }

  /**
  * External facing method for authentication routes to use
  */
  authenticationResult({user, jwtExp, jwtRefreshTokenExp}) {
    this.jwtExp = jwtExp;
    this.jwtRefreshTokenExp = jwtRefreshTokenExp;

    this.localStorageService.store('user-service.jwt-exp', this.jwtExp);
    this.localStorageService.store('user-service.jwt-refresh-token-exp',
        this.jwtRefreshTokenExp);

    this._setUser(user);

    // Below should start the jwt refreshers
    this.checkThenRefreshJwt();
  }

  /**
  * Internal method that checks if the user being set is different to the one
  * currently set. Sends a subscription event if the user has changed.
  */
  private _setUser(user) {
    if (!isEqual(this.user, user)) {
      this.user = user;
      this.userSetTime = Date.now();
      // Store user in local storage
      this.localStorageService.store('user-service.user', this.user);
      this.localStorageService.store('user-service.user-set-time',
          this.userSetTime);

      this.userObservable.next(this.user);
    }
  }

  /**
   *  userLocalStorageChecker constantly checks user logged in status across tabs
   *  User is stored in the localstorage
   */
  userLocalStorageChecker() {
    const self = this;
    this.compareUserLsUserThenUpdate();
    clearTimeout(this.refreshUserTimeoutId);
    this.refreshUserTimeoutId =
        setTimeout(function() { self.userLocalStorageChecker(); }, 1000);
  }


  checkThenRefreshJwt() {
    const self = this;
    const isRefreshing =
        this.localStorageService.retrieve('user-service.is-refreshing');

    // If another tab is checking, wait for a response
    if (isRefreshing) { // currently checking, come back soon, say 1 second
      clearTimeout(this.refreshJwtTimeoutId);
      this.refreshJwtTimeoutId =
          setTimeout(function() { self.checkThenRefreshJwt(); }, 1000);
      return;
    }
    // If the expiry time has changed, update expiry and wait until next time
    const lsJwtExp =
        Number(this.localStorageService.retrieve('user-service.jwt-exp'));
    if (this.jwtExp && this.jwtExp < lsJwtExp && lsJwtExp < Date.now() / 1000) {
      this.jwtExp = lsJwtExp;
      this.compareUserLsUserThenUpdate();
      this._setRefreshJwt();
      return;
    }

    this.refreshJwt();
  }

  refreshJwt() {
    // If this happens to be the lucky app that is refreshing
    this.localStorageService.store('user-service.is-refreshing', true);
    this.http.get<any>('/api/user/refresh-jwt')
        .subscribe(
        response => {
          this.jwtExp = response.jwtExp;
          this.localStorageService.store('user-service.jwt-exp', this.jwtExp);
          this.localStorageService.clear('user-service.is-refreshing');

          // If the user has not been set (e.g. this page has just been loaded)
          if (!this.user) {
            this.updateUserDetails();
          }
          this._setRefreshJwt();
        },
        errorResponse => {
          // On failure
          this.localStorageService.clear('user-service.is-refreshing');
          if (errorResponse.status === 401) {
            // Clear all data, call next on user observable
            this.clearAllUserData();
            // Reset refresh counter
            this.refreshJwtAttempts = undefined;
          } else {
            // On failure (timeout), tries again in 10 seconds
            // gives up after 1 minute
            // directs to /login page
            if (this.refreshJwtAttempts === undefined) {
              this.refreshJwtAttempts = 0;
            }
            if (this.refreshJwtAttempts < 6) {
              this.refreshJwtAttempts++;
              const self = this;
              setTimeout(function() { self.checkThenRefreshJwt(); }, 10000);
            } else {
              this.clearAllUserData();
            }
          }
        });
  }

  /**
   * Sets the timeout on the JWT
   */
  private _setRefreshJwt () {
    const self = this;
    // Call a refresh token 15 seconds before expiry
    const refreshTime = (this.jwtExp - 15) * 1000;
    const refreshDuration = refreshTime - Date.now();
    clearTimeout(this.refreshJwtTimeoutId);
    this.refreshJwtTimeoutId =
        setTimeout(function() { self.checkThenRefreshJwt(); }, refreshDuration);
  }

  /**
   * Determines if the user has changed. If the user has changed, then the user
   * is updated, and an observable is fired.
   */
  private compareUserLsUserThenUpdate() {
    const lsUserSetTime: number =
        this.localStorageService.retrieve('user-service.user-set-time');
    if (this.userSetTime !== lsUserSetTime) {
      this.userSetTime = lsUserSetTime;
      const lsUser: User = this.localStorageService.retrieve('user-service.user');
      if (!isEqual(this.user, lsUser)) {
        this.user = lsUser;
        this.userObservable.next(this.user);
      }
    }
  }

  updateUserDetails() {
    this.http.get<User>('/api/user/details')
        .subscribe((user) => {
          this._setUser(user);
        });
  }


  successNavigate(defaultNav) {
    if (this.nav) {
      this.router.navigateByUrl(this.nav.route);
    } else if (defaultNav) {
      this.router.navigateByUrl(defaultNav);
    } else {
      this.router.navigateByUrl('/');
    }
  }

  logOut() {
    // Send message to server
    this.http.post('/api/user/logout', {})
        .subscribe(() => {
          this.clearAllUserData();
        },
        (errorResponse) => {
          console.error('Error logging out.');
          console.log(errorResponse);
          this.clearAllUserData();
        });
  }

  isLoggedIn() {
    return !!this.user;
  }

  private clearAllUserData() {
    // Clean up old data
    this.user = undefined;
    this.jwtExp = undefined;
    this.jwtRefreshTokenExp = undefined;
    clearTimeout(this.refreshJwtTimeoutId);

    // Clear localstorage
    this.localStorageService.clear('user-service.jwt-exp');
    this.localStorageService.clear('user-service.jwt-refresh-token-exp');
    this.localStorageService.clear('user-service.user');
    this.localStorageService.clear('user-service.user-set-time');
    this.localStorageService.clear('user-service.is-refreshing');

    // inform the rest of the app that a log out has occurred
    this.userObservable.next(undefined);

    // go to default location
    this.router.navigateByUrl(routeAfterLogout);
  }

}

export interface User {
  id: string;
  displayUsername: string;
  givenName: string;
  familyName: string;
  email: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  profileImage: string;
}

interface NavObj {
  route: string;
  data?: any;
}
