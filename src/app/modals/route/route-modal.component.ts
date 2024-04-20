import { Component } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-route-modal',
  templateUrl: './route-modal.component.html',
})
export class RouteModalComponent {

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
  ) {
  }

  dismiss() {
    this.modalController.dismiss();
  }

  addRouteToFavs() {
    // TODO: Implement addRouteToFavs function
  }

  showSimulation() {
    // TODO: Implement showSimulation function
  }

  alternateRoutes() {
    // TODO: Implement alternateRoutes function
  }

  setRouteViewToSky() {
    // TODO: Implement setRouteViewToSky function
  }

  setRouteViewToPOV() {
    // TODO: Implement setRouteViewToPOV function
  }
}
