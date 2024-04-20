import { Component } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-permission-modal',
  templateUrl: './permission-modal.component.html',
})
export class PermissionModalComponent {

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
  ) {
  }

  dismiss() {
    this.modalController.dismiss();
  }

  cancelPermDialog() {
    // TODO: Implement cancelPermDialog function
  }

  openPermDialog() {
    // TODO: Implement openPermDialog function
  }

  showMessage() {
    // TODO: Implement showMessage function
  }
}
