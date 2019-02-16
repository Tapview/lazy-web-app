// Use card
// Position:fixed, to the right below the menu bar
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.scss']
})
export class ConnectionComponent implements OnInit {
  pendingConnectionsCounter: string;
  confirmedConnectionsCounter: string;
  ConfirmedConnectionsCounter: string;
  navLinks = [];
  constructor(
    private http: HttpClient,
  ) { }

  ngOnInit() {
    this.navLinks.push('./view');
    this.navLinks.push('./request');
    this.navLinks.push('./sent');
    this.navLinks.push('./add');
    this.loadPageCounters();
  }

  loadPageCounters = function () {
    this.http.post('/api/connection/get-pending-request-count', {})
        .subscribe((returnedResult: any) => {
          if (returnedResult.message === 0) {
            this.pendingConnectionsCounter = '';
          } else {
            this.pendingConnectionsCounter = returnedResult.message;
            }
        });

    this.http.post('/api/connection/get-connection-count', {})
        .subscribe((returnedResult: any) => {
          if (returnedResult.message === 0) {
            this.confirmedConnectionsCounter = '';
          } else {
            this.confirmedConnectionsCounter = returnedResult.message;
          }
        });
  };

}
