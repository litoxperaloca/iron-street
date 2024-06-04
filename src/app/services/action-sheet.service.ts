
import { Injectable } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ActionSheetService {

  constructor(private actionSheetController: ActionSheetController) { }

  async askQuestionAorB(questionHeader: string, questionSubheader: string, optionA: string, optionB: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      const actionSheet = await this.actionSheetController.create({
        header: questionHeader,
        subHeader: questionSubheader,
        buttons: [{
          text: optionA,
          handler: () => resolve(true)
        }, {
          text: optionB,
          handler: () => resolve(false)
        }, {
          text: 'Cancel',
          role: 'cancel',
          handler: () => resolve(false)
        }]
      });
      await actionSheet.present();
    });
  }

  async askQuestionAorBorC(questionHeader: string, questionSubheader: string, optionA: string, optionB: string, optionC: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      const actionSheet = await this.actionSheetController.create({
        header: questionHeader,
        subHeader: questionSubheader,
        buttons: [{
          text: optionA,
          handler: () => resolve(true)
        }, {
          text: optionB,
          handler: () => resolve(false)
        },
        {
          text: optionC,
          handler: () => resolve(false)
        },
        {

          text: 'Cancel',
          role: 'cancel',
          handler: () => resolve(false)
        }]
      });
      await actionSheet.present();
    });
  }

  async showMenuOptions(options: { text: string, icon?: string, handler: () => void }[]): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select an Option',
      buttons: [...options, { text: 'Cancel', role: 'cancel' }]
    });
    await actionSheet.present();
  }

  async presentConfirmation(message: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      const actionSheet = await this.actionSheetController.create({
        header: 'Confirmation',
        subHeader: message,
        buttons: [{
          text: 'Confirm',
          handler: () => resolve(true)
        }, {
          text: 'Cancel',
          role: 'cancel',
          handler: () => resolve(false)
        }]
      });
      await actionSheet.present();
    });
  }

  async showShareOptions(shareOptions: { text: string, icon?: string, handler: () => void }[]): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Share using...',
      buttons: [...shareOptions, { text: 'Cancel', role: 'cancel' }]
    });
    await actionSheet.present();
  }

  async displayInformation(header: string, message: string, dismissText: string): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: header,
      subHeader: message,
      buttons: [{
        text: dismissText,
        role: 'cancel'
      }]
    });
    await actionSheet.present();
  }
}
