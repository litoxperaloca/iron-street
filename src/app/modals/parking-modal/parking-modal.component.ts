
import { Component } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { ModalService } from '../../services/modal.service';
import { environment } from 'src/environments/environment';
//import { Plugins } from '@capacitor/core';
//import { SMS } from '@capacitor-community/sms';

//const { SMS: CapacitorSMS } = Plugins;

@Component({
  selector: 'app-parking-modal',
  templateUrl: './parking-modal.component.html',
  styleUrls: ['./parking-modal.component.scss'],
})
export class ParkingModalComponent {
  modalVars = { title: "" };
  matricula: string = '';
  minutos: number = 30;
  minutosSeleccionados: string='';
  total: number = 0;
  costoHora:number=environment.parking.costPerHour;
  SMSnumber:number=environment.parking.SMSnumber;
  opcionesMinutos: any[] = [30, 45, 60, 'Especificar'];
  errores:any = {
    matricula: false,
    matriculaFormato: false,
    minutos: false,
    minutosEspecificos: false,
  };

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
  ) { }

 // Calcular el total basado en la selección de minutos y costo por minuto
 calcularTotal() {
    const minutosEnviar:number = this.minutosSeleccionados !== 'Especificar' ? Number.parseFloat(this.minutosSeleccionados) : this.minutos;
    this.total = minutosEnviar ? minutosEnviar * (this.costoHora/60) : 0;
  }


  customActionSheetOptions = {
    header: 'Minutos',
    subHeader: 'Seleccione el tiempo de estacionamiento tarifado a contratar',
  };

  dismiss() {
    this.modalController.dismiss();
  }

 
  enviarSMS() {
    this.resetearErrores();

    // Validación de entrada de datos
    const matriculaRegEx = /^[A-Z]{3}[0-9]{4}$/;

    if (!this.matricula || this.matricula.trim().length === 0) {
      this.errores.matricula = true;
    } else if (!matriculaRegEx.test(this.matricula)) {
      // Validar formato de la matrícula usando RegEx
      this.errores.matriculaFormato = true;
    }

    if (!this.minutosSeleccionados) {
      this.errores.minutos = true;
    }

    if (this.minutosSeleccionados === 'Especificar' && (!this.minutos || this.minutos <= 0)) {
      this.errores.minutosEspecificos = true;
    }

    // Si hay errores, no se envía el SMS
    if (this.errores.matricula || this.errores.matriculaFormato || this.errores.minutos || this.errores.minutosEspecificos) {
      return;
    }

    // Construir el mensaje SMS
    const minutosEnviar = this.minutosSeleccionados !== 'Especificar' ? this.minutosSeleccionados : this.minutos;
    const mensaje = `E ${this.matricula.toUpperCase()} ${minutosEnviar}`;

    // Abrir el gestor de SMS con el mensaje y el número de destino
    window.open(`sms:${this.SMSnumber}?&body=${mensaje}`, '_system');
  }

  resetearErrores() {
    this.errores = {
      matricula: false,
      matriculaFormato: false,
      minutos: false,
      minutosEspecificos: false,
    };
  }
}
