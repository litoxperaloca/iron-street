import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { HomePage } from 'src/app/pages/home/home.page';
import { ModalService } from '../../services/modal.service';
import { SpeedService } from 'src/app/services/speed.service';

@Component({
  selector: 'app-your-speed-modal',
  templateUrl: './your-speed-modal.component.html',
  styleUrls: ['./your-speed-modal.component.scss'],
})
export class YourSpeedModalComponent implements OnInit {
  infoMgr: boolean = false;
  currentSpeed: number = 0;

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
    private speedService: SpeedService
  ) {

  }

  toggleInfo(): void {
    this.infoMgr = !this.infoMgr;
    if (this.infoMgr) {
      this.modalService.setBreakPoint(0.45);
    } else {
      this.modalService.setBreakPoint(0.20);
    }
  }

  ngOnInit() {
   this.speedService.speedChanged.subscribe(speed => {
      this.currentSpeed = speed;
    })
  }

  needleRotation(): number {
    // Assuming max rotation angle is 180 degrees
    return 75 + (this.currentSpeed * 1.05);
  }
  dismiss() {
    this.modalController.dismiss();
  }

}
