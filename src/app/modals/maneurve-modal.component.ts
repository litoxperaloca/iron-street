import { Component } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { ModalService } from '../services/modal.service';

@Component({
  selector: 'app-maneurve-modal',
  templateUrl: './maneurve-modal.component.html',
})
export class ManeurveModalComponent {

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
  ) {
  }

  setBreakPoint(num: number): void {
    this.modalService.setBreakPoint(num)
  }

  dismiss() {
    this.modalController.dismiss();
  }

  setManeurves() {
    // TODO: Implement setManeurves function
  }

  setCurrentManeurve() {
    // TODO: Implement setCurrentManeurve function
  }

  showOnlyCurrentManeurve() {
    // TODO: Implement showOnlyCurrentManeurve function
  }

  showCurrenAndFutureManeurves() {
    // TODO: Implement showCurrenAndFutureManeurves function
  }

  hideManeurves() {
    // TODO: Implement hideManeurves function
  }
}
