
import {filter} from 'rxjs/operators';
import { Component, ViewChild } from '@angular/core';
// Imports needed for router import for title
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UserService } from './user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('sideNavDrawer') sideNavDrawer;
  screenWidth: number;
  mobileWidth = false; // boolean
  title: string;
  user: User;
  isLoggedIn: boolean;
  userIsAdmin: boolean;


  // Edit the area below to create main nav links

  // Primary nav links are shown in both the side and the bottom navs
  primaryNavLinks: NavLink[] = [
    {
      routerLink: '/home',
      icon: 'home',
      title: 'Home',
    },
    {
      routerLink: '/feed',
      icon: 'chat',
      title: 'Feed',
    },
    {
      routerLink: '/contacts',
      icon: 'person',
      title: 'Contacts',
    },
    {
      routerLink: '/about',
      icon: 'view_carousel',
      title: 'About',
    },
  ];

  // Secondary nav links are only shown in the side bar
  secondaryNavLinks: NavLink[] = [
    {
      routerLink: '/profile',
      icon: 'person',
      title: 'Profile',
      isLoggedInRoute: true,
    },
    {
      routerLink: '/help',
      icon: 'help',
      title: 'Help',
    },
    {
      routerLink: '/settings',
      icon: 'settings',
      title: 'Settings',
    },
    {
      routerLink: '/admin',
      icon: 'verified_user',
      title: 'Admin',
      isAdminRoute: true,
    },
  ];


  toggleSideNavDrawer() {
    this.sideNavDrawer.toggle();
  }

  hideSideNavAfterClick () {
    if (this.mobileWidth) {
      this.toggleSideNavDrawer();
    }
  }

  setSideBar() {
    if (this.screenWidth < 768) {
      this.sideNavDrawer.mode = 'push'; // push or over
      this.sideNavDrawer.opened = false;
      this.mobileWidth = true;
    } else {
      this.sideNavDrawer.mode = 'side';
      this.sideNavDrawer.opened = true;
      this.mobileWidth = false;
    }
  }

  constructor(
      router: Router,
      route: ActivatedRoute,
      userService: UserService
    ) {
    // Set side bar mode
    this.screenWidth = window.innerWidth;
    window.onresize = () => {
      this.screenWidth = window.innerWidth;
      this.setSideBar();
    };


    router.events.pipe(
      filter(e => e instanceof NavigationEnd))
      .forEach(e => {
        this.title = route.root.firstChild.snapshot.data['title'];
      });

    userService.userObservable
      .subscribe(user => {
        this.user = user;
        this.isLoggedIn = !!user;
        this.userIsAdmin = user ? this.user.isAdmin : false;
      });
  }

  ngAfterViewInit() {
    this.setSideBar();
  }
}

interface NavLink {
  routerLink: string;
  icon: string;
  title: string;
  isAdminRoute?: boolean;
  isLoggedInRoute?: boolean;
}

interface User {
  id: string;
  username: string;
  givenName: string;
  familyName: string;
  email: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
}
