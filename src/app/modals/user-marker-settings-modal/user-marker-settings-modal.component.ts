
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { MapService } from '../../services/map.service'; // Asumiendo que tienes este servicio
import { ModalService } from '../../services/modal.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-user-marker-settings-modal',
  templateUrl: './user-marker-settings-modal.component.html',
  styleUrls: ['./user-marker-settings-modal.component.scss'],
})
export class UserMarkerSettingsModalComponent {
  modalVars = { title: "" };
  locators:any[] = [];
  isLoading: boolean = false;

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
    private mapService: MapService, // Servicio dedicado para operaciones del mapa
  ) { 
    this.locators=environment.locators;
  }

  dismiss() {
    this.modalController.dismiss();
  }

  setLocator(locator:any){
    this.mapService.setLocator(locator);
    this.dismiss();
  } 

}
