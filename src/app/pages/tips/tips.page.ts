import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { WindowService } from 'src/app/services/window.service';

@Component({
  selector: 'app-tips',
  templateUrl: './tips.page.html',
  styleUrls: ['./tips.page.scss'],
})
export class TipsPage implements OnInit, OnDestroy {

  constructor(private translate: TranslateService, private router: Router, private windowService: WindowService) { }

  ngOnDestroy(): void {
    this.windowService.unattachComponent("tips");
  }

  ngOnInit() {
    const keys = [
      'OBJECTIVE',
      'HOW',
      'FIND_DETAILS',
      'APP_ASSIST',
      'PARTICIPATE_REWARDS',
      'STEP1',
      'STEP2',
      'STEP3',
      'THANK_YOU',
      'FEEDBACK_IMPORTANCE'
    ];

    forkJoin(keys.map(key => this.translate.get(key))).subscribe(translations => {
      this.consoleText(
        translations,
        'text',
        ['#50c8ff', '#50c8ff', '#50c8ff', '#50c8ff', '#2fdf75', '#2fdf75', '#2fdf75', '#2fdf75', '#ff4961', '#ff4961']
      );
    });
  }

  next() {

    this.router.navigateByUrl('/about', { replaceUrl: true });


  }

  consoleText(words: string[], id: string, colors: string[]): void {
    if (colors === undefined) colors = ['#fff'];
    var visible = true;
    var con = document.getElementById('console');
    var letterCount = 1;
    var x = 1;
    var waiting = false;
    var target = document.getElementById(id)
    if (target) target.setAttribute('style', 'color:' + colors[0])
    const self = this;
    const interval1: any = setInterval(function () {

      if (letterCount === 0 && waiting === false) {
        waiting = true;
        if (target) target.innerHTML = words[0].substring(0, letterCount)
        const timeOut1: any = setTimeout(function () {
          var usedColor = colors.shift();
          if (usedColor) colors.push(usedColor);
          var usedWord = words.shift();
          if (usedWord) words.push(usedWord);
          x = 1;
          if (target) target.setAttribute('style', 'color:' + colors[0])
          letterCount += x;
          waiting = false;
        }, 700);
        self.windowService.attachedTimeOut("tips", "timeOut1", timeOut1);

      } else if (letterCount === words[0].length + 1 && waiting === false) {
        waiting = true;
        const timeOut2: any = setTimeout(function () {
          x = -1;
          letterCount += x;
          waiting = false;
        }, 700)
        self.windowService.attachedTimeOut("tips", "timeOut2", timeOut2);

      } else if (waiting === false) {
        if (target) target.innerHTML = words[0].substring(0, letterCount)
        letterCount += x;
      }
    }, 30);
    this.windowService.attachedInterval("tips", "interval1", interval1);
    const interval2: any = setInterval(function () {
      if (visible === true) {
        if (con) con.className = 'console-underscore hidden'
        visible = false;

      } else {
        if (con) con.className = 'console-underscore'

        visible = true;
      }
    }, 10);
    this.windowService.attachedInterval("tips", "interval2", interval2);

  }

}
