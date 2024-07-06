import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WindowService } from 'src/app/services/window.service';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
})
export class AboutPage implements OnInit, OnDestroy {
  classList: any;

  constructor(private router: Router, private windowService: WindowService) {
  }

  ngOnDestroy(): void {
    this.windowService.unattachComponent("about");
  }

  ngOnInit() {
    let $cont = document.querySelector('.cont');
    let $elsArr = document.getElementsByClassName('el');
    let $closeBtnsArr = document.querySelectorAll('el__close-btn');
    if (!$cont) return;
    const timeOut: any = setTimeout(function () {
      if ($cont) $cont.classList.remove('s--inactive');
    }, 300);
    this.windowService.attachedTimeOut("about", "mosaicLoaded", timeOut);
    for (let index = 0; index < $elsArr.length; index++) {
      let $el = ($elsArr as HTMLCollectionOf<HTMLDivElement>)[index];
      if ($el && $el.className === "el") {
        $el.addEventListener("click", function (event) {
          // check which link was clicked using the event.target.id property
          if (event) {
            event.stopPropagation();
            if ((event as MouseEvent).type == "click") {
              //console.log("Clicked");
              //console.log(event);
              let el = (event.target as HTMLElement);
              //console.log(el.id);
              //console.log(el.className);
              if (el.className === "el__close-btn") {
                $cont.classList.remove('s--el-active');
                const act = document.querySelector('.el.s--active')
                if (act) act.classList.remove('s--active');
              };
              if (el.dataset["index"]) {
                const element = document.getElementById(el.dataset["index"]);
                if (!element || element.classList.contains('s--active')) return;
                $cont.classList.add('s--el-active');
                element.classList.add('s--active');
              }

            }

          }
        });
      }
    }


    $closeBtnsArr.forEach(function ($btn) {
      $btn.addEventListener('click', function (e) {
        //console.log("Close");
        //console.log(e);
        e.stopPropagation();
        $cont.classList.remove('s--el-active');
        const act = document.querySelector('.el.s--active')
        if (act) act.classList.remove('s--active');
      });
    });
  }


  openMap() {

    this.router.navigateByUrl('/home', { replaceUrl: true });


  }


  feedback() {
    window.open('https://ironplatform.com.uy/ironplatform/ironstreet/feedback/');
  }

}
