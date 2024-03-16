import { Component } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-trip-progress-modal',
  templateUrl: './trip-progress-modal.component.html',
})
export class TripProgressModalComponent {

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
  ) {
  }

  dismiss() {
    this.modalController.dismiss();
  }

  updateTripProgress() {
    // TODO: Implement updateTripProgress function
  }

  cancelTrip() {
    // TODO: Implement cancelTrip function
  }

  destinationArrived() {
    // TODO: Implement destinationArrived function
  }
}
