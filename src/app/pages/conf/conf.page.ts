import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-conf',
  templateUrl: './conf.page.html',
  styleUrls: ['./conf.page.scss'],
})
export class ConfPage implements OnInit {

  isLoading: boolean = false;

  constructor(private router: Router) { }

  ngOnInit() {

  }

}
