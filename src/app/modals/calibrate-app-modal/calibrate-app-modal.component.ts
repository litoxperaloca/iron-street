import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ConnectableObservable } from 'rxjs';
import { PreferencesService } from 'src/app/services/preferences.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-calibrate-app-modal',
  templateUrl: './calibrate-app-modal.component.html',
  styleUrls: ['./calibrate-app-modal.component.scss']
})
export class CalibrateAppModalComponent implements OnInit {

  selectedSegment: string = 'gps'; // Inicializa con el primer segmento seleccionado
  gpsSettings: any;
  snapServiceConf: any;
  trafficAlertServiceConf: any;

  initialGpsSettings: any; // Para comparar los cambios
  initialSnapServiceConf: any;
  initialTrafficAlertServiceConf: any;
  isLoading: boolean = false;

  constructor(
    private preferencesService: PreferencesService,
    private modalController: ModalController
  ) {}

  async ngOnInit() {
    this.isLoading=true;
    await this.loadPreferences();
    this.isLoading=false;
  }

  // Cargar las preferencias desde el servicio
  async loadPreferences() {
    // Obtener las configuraciones usando el servicio de preferencias
    
    this.gpsSettings = await this.preferencesService.getGpsSettings();
    this.snapServiceConf = await this.preferencesService.getSnapServiceConf();
    this.trafficAlertServiceConf = await this.preferencesService.getTrafficAlertServiceConf();

    // Guardamos los valores iniciales para detectar cambios
    this.initialGpsSettings = { ...this.gpsSettings };
    this.initialSnapServiceConf = { ...this.snapServiceConf };
    this.initialTrafficAlertServiceConf = { ...this.trafficAlertServiceConf };

    //console.log(this.gpsSettings, this.snapServiceConf,this.trafficAlertServiceConf);
  }

  // Guardar los cambios de GPS Settings
  async saveGpsSettings() {
    if (JSON.stringify(this.gpsSettings) !== JSON.stringify(this.initialGpsSettings)) {
      this.isLoading=true;
      // Guardar los cambios en Preferences y en el environment
      await this.preferencesService.setGpsSettings(this.gpsSettings);
      //console.log('GPS Settings actualizados en environment:', environment.gpsSettings);
      this.isLoading=false;
    }

    this.closeModal();
  }

  // Guardar los cambios de Snap Service
  async saveSnapServiceConf() {
    if (JSON.stringify(this.snapServiceConf) !== JSON.stringify(this.initialSnapServiceConf)) {
      // Guardar los cambios en Preferences y en el environment
      this.isLoading=true;
      await this.preferencesService.setSnapServiceConf(this.snapServiceConf);
      //console.log('Snap Conf actualizada en environment:', environment.snapServiceConf);

      this.isLoading=false;
    }

    this.closeModal();
  }

  // Guardar los cambios de Traffic Alert Service
  async saveTrafficAlertServiceConf() {
    if (JSON.stringify(this.trafficAlertServiceConf) !== JSON.stringify(this.initialTrafficAlertServiceConf)) {
      // Guardar los cambios en Preferences y en el environment
      this.isLoading=true;
      await this.preferencesService.setTrafficAlertServiceConf(this.trafficAlertServiceConf);
      //console.log('Traffic Alert Config actualizados en environment:', environment.trafficAlertServiceConf);
      this.isLoading=false;
    }

    this.closeModal();
  }

  // Cerrar el modal
  closeModal() {
    this.modalController.dismiss();
  }

  dismiss() {
    this.modalController.dismiss();
  }

   increaseValue(config: string, field: string, increment: number) {
    if(config && config==='gpsSettings'){
      this.gpsSettings[field] += increment;
      return;
    }
    if(config && config==='snapServiceConf'){
      this.snapServiceConf[field] += increment;
      return;
    }    
    if(config && config==='trafficAlertServiceConf'){
      this.trafficAlertServiceConf[field]+= increment;
      return;
    }
  }

  decreaseValue(config: string, field: string, decrement: number) {

    if(config && config==='gpsSettings'){
      if (this.gpsSettings[field] - decrement >= 0) {
        this.gpsSettings[field] -= decrement;
      }      return;
    }
    if(config && config==='snapServiceConf'){
      if (this.snapServiceConf[field] - decrement >= 0) {
        this.snapServiceConf[field] -= decrement;
      }      return;
    }  
     if(config && config==='trafficAlertServiceConf'){
      if (this.trafficAlertServiceConf[field] - decrement >= 0){
        this.trafficAlertServiceConf[field] -= decrement;
      }
            return;
    }
  }
}