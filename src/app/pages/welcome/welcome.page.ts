import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WindowService } from 'src/app/services/window.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements OnInit, OnDestroy {

  constructor(private router: Router, private windowService: WindowService) {
  }

  ngOnInit() {
    let logo: HTMLElement | null = document.getElementById('logo');
    if (logo) {
      logo.classList.add('aos-animate');
      const timeOut = setTimeout(() => {
        //logo.classList.remove('aos-animate');
        logo.classList.add('aos-animated');


      }, 1000);
      this.windowService.attachedTimeOut('welcome', 'logoAnimation', timeOut);
    }
  }

  ngOnDestroy(): void {
    this.windowService.unattachComponent('welcome');
  }


  next() {

    this.router.navigateByUrl('/tips', { replaceUrl: true });

  }

  // function([string1, string2],target id,[color1,color2])



}
