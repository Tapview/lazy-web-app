import {MatTableDataSource} from '@angular/material';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';


export interface ConnectionRequestElements {
  givenName: string;
  familyName: number;
}

@Component({
  selector: 'app-connections-view',
  templateUrl: './connections-view.component.html',
  styleUrls: ['./connections-view.component.scss']
})
export class ConnectionsViewComponent implements OnInit {
  receiverUserId: string;
  link: string;
  confirmedConnections: { userId: string, givenName: string, familyName: string }[] = [];
  displayedColumns: string[] = [ 'Given Name', 'Family Name', 'Action'];
  dataSource = new MatTableDataSource<ConnectionRequestElements>();

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.loadConfirmedRequests();
  }

  loadConfirmedRequests = function () {
    this.confirmedConnections = [];
    this.http.post('/api/connection/get-connections')
      .subscribe((data) => {
        let num = 0;
        for (num = 0; num < data.length; num++) {
          this.confirmedConnections.push(
            {
              'userId': data[num].userId,
              'givenName': data[num].givenName,
              'familyName': data[num].familyName
            });
        }
        this.dataSource = new MatTableDataSource<ConnectionRequestElements>(this.confirmedConnections);
      });
  };

  deleteConnection = function (connection) {
    this.http.post('/api/connection/remove-connection', {
      'senderUserId': connection.userId,
    })
      .subscribe(() => {
        this.loadConfirmedRequests();
      });
  };
}
