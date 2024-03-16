import { Component } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-speed-modal',
  templateUrl: './speed-modal.component.html',
})
export class SpeedModalComponent {

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
  ) {
  }


  dismiss() {
    this.modalController.dismiss();
  }

  getCurrentSpeed() {
    // TODO: Implement getCurrentSpeed function
  }

  getMaxSpeedForCurrentLocation() {
    // TODO: Implement getMaxSpeedForCurrentLocation function
  }
}
