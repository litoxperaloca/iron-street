import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-subscribe',
  templateUrl: './subscribe.page.html',
  styleUrls: ['./subscribe.page.scss'],
})
export class SubscribePage implements OnInit {

  constructor() { }
  
  onSubscribeClick() {
    //console.log('Suscripción no disponible en la versión demo');
    // Navegar a otra página o mostrar mensaje de no disponible
  }

  ngOnInit() {
  }

}
