
import {filter} from 'rxjs/operators';
import { Component, ViewChild, OnChanges, OnInit } from '@angular/core';
// Imports needed for router import for title
import { ActivatedRoute, NavigationStart, NavigationEnd, Router } from '@angular/router';
import { Location, PopStateEvent } from '@angular/common';
import { UserService, User } from './user.service';
import { SettingsService } from './settings.service';
import { AnalyticsService } from './analytics.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('sideNavDrawer') sideNavDrawer;
  @ViewChild('routerOutletParent') routerOutletEle;
  screenWidth: number;
  mobileWidth = false; // boolean
  title: string;
  user: User;
  isLoggedIn: boolean;
  userIsAdmin: boolean;
  drawerMode: string;
  drawerOpened: boolean;

  siteTheme: string;

  // Scroll position maintainer
  private lastPoppedScrollTop: number;
  private currentRouteId: number;
  private yScrollStack: number[] = [];

  theme: string;

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
    // {
    //   routerLink: '/contacts',
    //   icon: 'person',
    //   title: 'Contacts',
    // },
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
      routerLink: '/organization',
      icon: 'work',
      title: 'Organization',
      isLoggedInRoute: true,
    },
    {
      routerLink: '/mailing-list',
      icon: 'email',
      title: 'Mailing list',
    },
    // {
    //   routerLink: '/help',
    //   icon: 'help',
    //   title: 'Help',
    // },
    {
      routerLink: '/settings',
      icon: 'settings',
      title: 'Settings',
      isLoggedInRoute: true,
    },
    {
      routerLink: '/admin',
      icon: 'verified_user',
      title: 'Admin',
      isAdminRoute: true,
    },
    {
      routerLink: '/contacts',
      icon: 'import_contacts',
      title: 'Contacts',
      isLoggedInRoute: true,
    },
    {
      routerLink: '/connections',
      icon: 'group',
      title: 'Connections',
      isLoggedInRoute: true,
    }
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
      this.drawerMode = 'push'; // push or over
      this.drawerOpened = false;
      this.mobileWidth = true;
    } else {
      this.drawerMode = 'side';
      this.drawerOpened = true;
      this.mobileWidth = false;
    }
  }

  constructor(
      private router: Router,
      private route: ActivatedRoute,
      private userService: UserService,
      private settingsService: SettingsService,
      private analytics: AnalyticsService,
    ) {
    // Set side bar mode
    this.screenWidth = window.innerWidth;
    window.onresize = () => {
      this.screenWidth = window.innerWidth;
      this.setSideBar();
    };


    router.events.pipe(filter(e => e instanceof NavigationEnd))
        .forEach((e: NavigationEnd) => {
          this.title = route.root.firstChild.snapshot.data['title'];

          // Analytics
          // Test if the page has Changed

          // The below line removes the query parameters so that information is
          // not passed to the Analytics provider
          analytics.pageView(e.url.split('?')[0], this.title);
        });

    userService.userObservable
        .subscribe(user => {
          this.user = user;
          this.isLoggedIn = !!user;
          this.userIsAdmin = user ? this.user.isAdmin : false;
        });

    settingsService.themeObservable
        .subscribe(theme => {
          if (theme === 'dark') {
            this.siteTheme = 'lwa-dark-theme';
          } else {
            this.siteTheme = 'lwa-light-theme';
          }
        });
    this.setSideBar(); // set the sidebar values
  }

  ngOnInit() {
    // set sidebar after every change
    this.setSideBar();

    this.router.events.subscribe((ev: any) => {
      if (ev instanceof NavigationStart) {
        if (this.routerOutletEle.nativeElement) { // this has been placed here as a hack since this element is not ready on first load
          const el = this.routerOutletEle.nativeElement;
          this.yScrollStack[this.currentRouteId] = el.scrollTop;
          // Determine if we are going back
          if (ev.restoredState && ev.restoredState.navigationId
              && this.yScrollStack[ev.restoredState.navigationId]) {
            this.lastPoppedScrollTop =
                this.yScrollStack[ev.restoredState.navigationId];
          } else {
            this.lastPoppedScrollTop = 0;
          }
        }
      } else if (ev instanceof NavigationEnd) {
        if (this.routerOutletEle.nativeElement) { // this has been placed here as a hack since this element is not ready on first load
          this.currentRouteId = ev.id;
          const el = this.routerOutletEle.nativeElement;
          el.scrollTop = this.lastPoppedScrollTop ?
              this.lastPoppedScrollTop : 0;
        }
      }
    });
  }
}

interface NavLink {
  routerLink: string;
  icon: string;
  title: string;
  isAdminRoute?: boolean;
  isLoggedInRoute?: boolean;
}
