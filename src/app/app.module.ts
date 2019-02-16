import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule} from '@angular/common/http'; // Deprecation https://angular.io/api/http/HttpModule
import { RouterModule } from '@angular/router';
import { NgxWebstorageModule } from 'ngx-webstorage';
import { AppComponent } from './app.component';
import { UserService } from './user.service';
import { SettingsService } from './settings.service';
import { StatsService } from './stats.service';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from './auth.guard';
import { AdminGuard } from './admin.guard';
import { OrganizationService } from './organization.service';
import { UserUsernameService } from './user-username.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularFontAwesomeModule } from 'angular-font-awesome';

// Material modules
import {
  MatBadgeModule,
  MatAutocompleteModule,
  MatButtonModule,
  MatButtonToggleModule,
  MatCardModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDatepickerModule,
  MatDialogModule,
  MatDividerModule,
  MatExpansionModule,
  MatGridListModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatNativeDateModule,
  MatPaginatorModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatRadioModule,
  MatRippleModule,
  MatSelectModule,
  MatSidenavModule,
  MatSliderModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatSortModule,
  MatStepperModule,
  MatTableModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
} from '@angular/material';

// Below is for Progressive Web App (PWA) functionality
import { environment } from '../environments/environment';
import { ServiceWorkerModule } from '@angular/service-worker';

// Routes
import { HomeComponent } from './home/home.component';
import { HelpComponent } from './help/help.component';
import { SettingsComponent } from './settings/settings.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { FeedComponent } from './feed/feed.component';
import { AboutComponent } from './about/about.component';
import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { ForgotUsernameComponent } from './forgot-username/forgot-username.component';
import { RegisterComponent } from './register/register.component';
import { MailingListComponent } from './mailing-list/mailing-list.component';
import { ProfileComponent } from './profile/profile.component';
import { UserDropdownComponent } from './user-dropdown/user-dropdown.component';
import { AdminComponent } from './admin/admin.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { MailingListChartComponent } from './mailing-list-chart/mailing-list-chart.component';
import { UserRegisterChartComponent } from './user-register-chart/user-register-chart.component';
import { TermsComponent } from './terms/terms.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { FooterComponent } from './footer/footer.component';
import { ImageUploadModule } from './image-upload/image-upload.module';
import { ChangeThemeComponent } from './change-theme/change-theme.component';
import { OrganizationComponent } from './organization/organization.component';
import { CreateOrganizationComponent } from './create-organization/create-organization.component';
import { UpdateOrganizationComponent } from './update-organization/update-organization.component';
import { AddUserComponent } from './add-user/add-user.component';
import { ContactsComponent } from './contacts/contacts.component';
import { ContactsAddComponent } from './contacts/contacts-add/contacts-add.component';
import { ContactsViewComponent } from './contacts/contacts-view/contacts-view.component';
import { ContactsFavComponent } from './contacts/contacts-fav/contacts-fav.component';
import { ConnectionComponent } from './connections/connections.component';
import { ConnectionsAddComponent } from './connections/connections-add/connections-add.component';
import { ConnectionsSentComponent } from './connections/connections-sent/connections-sent.component';
import { ConnectionsRequestComponent } from './connections/connections-request/connections-request.component';
import { ConnectionsViewComponent } from './connections/connections-view/connections-view.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HelpComponent,
    SettingsComponent,
    PageNotFoundComponent,
    FeedComponent,
    AboutComponent,
    LoginComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    ChangePasswordComponent,
    ForgotUsernameComponent,
    RegisterComponent,
    MailingListComponent,
    ProfileComponent,
    UserDropdownComponent,
    AdminComponent,
    UnauthorizedComponent,
    MailingListChartComponent,
    UserRegisterChartComponent,
    TermsComponent,
    PrivacyComponent,
    FooterComponent,
    ChangeThemeComponent,
    ContactsComponent,
    ContactsAddComponent,
    ContactsFavComponent,
    ContactsViewComponent,
    ConnectionComponent,
    ConnectionsAddComponent,
    ConnectionsSentComponent,
    ConnectionsRequestComponent,
    ConnectionsViewComponent,
    OrganizationComponent,
    CreateOrganizationComponent,
    UpdateOrganizationComponent,
    AddUserComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ImageUploadModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgxWebstorageModule.forRoot({
      prefix: 'app',
      separator: '.',
      caseSensitive: true
    }),

    RouterModule.forRoot([
      {
        path: 'home',
        component: HomeComponent,
        data: { title: 'Home' },
      },
      {
        path: 'feed',
        component: FeedComponent,
        data: { title: 'Feed' },
      },
      {
        path: 'help',
        component: HelpComponent,
        data: { title: 'Help' },
      },
      {
        path: 'profile',
        component: ProfileComponent,
        data: { title: 'Profile' },
        canActivate: [AuthGuard],
      },
      {
        path: 'mailing-list',
        component: MailingListComponent,
        data: { title: 'Mailing list' },
      },
      {
        path: 'organization',
        component: OrganizationComponent,
        data: { title: 'Organization' },
        canActivate: [AuthGuard],
      },
      {
        path: 'create-organization',
        component: CreateOrganizationComponent,
        data: { title: 'Create Organization' },
        canActivate: [AuthGuard],
      },
      {
        path: 'organization/:orgUsername/update',
        component: UpdateOrganizationComponent,
        data: { title: 'Update Organization' },
        canActivate: [AuthGuard],
      },
      {
        path: 'organization/:orgUsername/add-user',
        component: AddUserComponent,
        data: { title: 'Add User' },
        canActivate: [AuthGuard],
      },
      {
        path: 'settings',
        component: SettingsComponent,
        data: { title: 'Settings' },
        canActivate: [AuthGuard],
      },
      {
        path: 'about',
        component: AboutComponent,
        data: { title: 'About' },
      },
      {
        path: 'login',
        component: LoginComponent,
        data: { title: 'Login' },
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
        data: { title: 'Forgot Password' },
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
        data: { title: 'Reset Password' },
      },
      {
        path: 'forgot-username',
        component: ForgotUsernameComponent,
        data: { title: 'Forgot Username' },
      },
      {
        path: 'register',
        component: RegisterComponent,
        data: { title: 'Register' },
      },
      {
        path: 'admin',
        component: AdminComponent,
        data: { title: 'Admin' },
        canActivate: [AdminGuard],
      },
      {
        path: 'terms',
        component: TermsComponent,
        data: { title: 'Terms' },
      },
      {
        path: 'privacy',
        component: PrivacyComponent,
        data: { title: 'Privacy' },
      },
      {
        path: 'contacts',
        component: ContactsComponent,
        data: { title: 'Contacts' },
        canActivate: [AuthGuard],
        children:
        [
          {
            path: '',
            redirectTo: 'view',
            pathMatch: 'full',
          },
          {
            path: 'view',
            component: ContactsViewComponent,
          },
          {
            path: 'fav',
            component: ContactsFavComponent,
          },
          {
            path: 'add',
            component: ContactsAddComponent,
          }
        ]
      },
      {
        path: 'connections',
        component: ConnectionComponent,
        data: { title: 'Connections' },
        canActivate: [AuthGuard],
        children:
        [
          {
            path: '',
            redirectTo: 'view',
            pathMatch: 'full',
          },
          {
            path: 'view',
            component: ConnectionsViewComponent,
          },
          {
            path: 'add',
            component: ConnectionsAddComponent,
          },
          {
            path: 'sent',
            component: ConnectionsSentComponent,
          },
          {
            path: 'request',
            component: ConnectionsRequestComponent
          }
         ]
      },
      {
        path: 'unauthorized',
        component: UnauthorizedComponent,
        data: { title: 'Unauthorized' },
      },
      { // Default route
        path: '',
        component: HomeComponent,
        data: { title: 'Home' },
        // redirectTo: '/home',
        pathMatch: 'full',
      },
      {
        path: '**',
        component: PageNotFoundComponent,
        data: { title: 'Page Not Found' },
      },
    ]),

    BrowserAnimationsModule,
    // NgbModule,
    AngularFontAwesomeModule,

    // Material modules
    MatBadgeModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatRippleModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatStepperModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,

    // Below is for Progressive Web App (PWA) functionality
    ServiceWorkerModule.register('/ngsw-worker.js',
        {enabled: environment.production})
  ],
  providers: [UserService, SettingsService, StatsService, AnalyticsService, OrganizationService, UserUsernameService],
  bootstrap: [AppComponent]
})
export class AppModule { }
