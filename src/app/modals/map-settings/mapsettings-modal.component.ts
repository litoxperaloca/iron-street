
import { Component, ElementRef, ViewChild } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { MapService } from '../../services/map.service'; // Asumiendo que tienes este servicio
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './mapsettings-modal.component.html',
  styleUrls: ['./mapsettings-modal.component.scss'],
})
export class MapSettingsModalComponent {
  modalVars = { title: "" };

  @ViewChild('dawn', { static: false }) dawnElement!: ElementRef;
  @ViewChild('day', { static: false }) dayElement!: ElementRef;
  @ViewChild('dusk', { static: false }) duskElement!: ElementRef;
  @ViewChild('night', { static: false }) nightElement!: ElementRef;


  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
    private mapService: MapService, // Servicio dedicado para operaciones del mapa
  ) { }

  isStandardMap() {
    return this.mapService.isStandardMap;
  }

  setMapLight(id: string) {
    //this.setMapStyle('standard');
    this.mapService.setLightPreset(id);
    this.dismiss();
  }

  setMapStyle(id: String) {
    this.mapService.setMapStye(id);
    this.dismiss();
  }

  dismiss() {
    this.modalController.dismiss();
  }

}
