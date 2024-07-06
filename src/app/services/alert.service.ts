import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor(private alertController: AlertController) { }

  async presentAlert(header: string, subHeader: string, message: string, buttons: string[]) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: buttons,
      subHeader: subHeader
    });

    await alert.present();
  }
}
