import { Component, ElementRef, ViewChild } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { MapService } from '../../services/map.service'; // Asumiendo que tienes este servicio
import { ModalService } from '../../services/modal.service';
@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal-component.scss'],
})
export class SettingsModalComponent {
  modalVars = { title: "" };
  selectedSegment: string = 'general'; // Default to the first tab

  @ViewChild('dawn', { static: false }) dawnElement!: ElementRef;
  @ViewChild('day', { static: false }) dayElement!: ElementRef;
  @ViewChild('dusk', { static: false }) duskElement!: ElementRef;
  @ViewChild('night', { static: false }) nightElement!: ElementRef;

  // Repite para 'day', 'dusk', 'night' si es necesario

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
    private mapService: MapService, // Servicio dedicado para operaciones del mapa
  ) { }

  setMapLight(id: string) {
    this.mapService.setLightPreset(id);
    // La lógica de selección CSS se mueve al método correspondiente en el servicio
  }

  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  dismiss() {
    this.modalController.dismiss();
  }

  // Otros métodos...
}
