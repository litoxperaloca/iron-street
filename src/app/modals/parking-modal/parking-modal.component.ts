
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
  horarioInicioSeleccionado: string = 'ahora'; // Valor por defecto
  horarioInicio: string=''; // Formato HH:mm
  
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
    const horario:string = this.horarioInicioSeleccionado === 'especificar' && this.horarioInicio ? this.horarioInicio : '';
    let horarioNormalized:string='';
    if(horario){
      if(horario.length>5){
        horarioNormalized = ' ' + horario.slice(-8, -3);
      }
    }
    const mensaje = `E ${this.matricula.toUpperCase()} ${minutosEnviar}${horarioNormalized}`;

    // Abrir el gestor de SMS con el mensaje y el número de destino
    window.open(`sms:${this.SMSnumber}?&body=${mensaje}`, '_system');
  }

  // Convertir la matrícula a mayúsculas y permitir solo letras y dígitos en tiempo real
  convertirMayusculas(event: any) {
    // Eliminar caracteres que no sean letras ni dígitos
    let valor = event ? event.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
    // Limitar el valor a 7 caracteres como máximo
    valor = valor.substring(0, 7);

    // Separar las letras y los dígitos
    const letras = valor.substring(0, 3); // Primeras 3 letras
    const digitos = valor.substring(3, 7); // Siguientes 4 dígitos

    // Limitar a 3 letras y 4 dígitos como máximo
    this.matricula = `${letras}${digitos}`;

    // Validar longitud de la matrícula
    //this.errores.matriculaFormato = !/^[A-Z]{3}[0-9]{4}$/.test(this.matricula);
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
