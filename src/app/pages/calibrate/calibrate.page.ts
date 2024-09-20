import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-calibrate',
  templateUrl: './calibrate.page.html',
  styleUrls: ['./calibrate.page.scss'],
})
export class CalibratePage implements OnInit {

  constructor(private router:Router) { }

  ngOnInit() {
    setTimeout(()=>{ 
         this.router.navigateByUrl('/home', { replaceUrl: true });
    },5000)
  }

}
