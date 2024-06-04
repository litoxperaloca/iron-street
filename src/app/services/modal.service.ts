import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ComponentRef } from '../models/component-ref.model'; // Asumiendo que tienes este archivo
import { ModalComponents } from '../models/modal-components.enum'; // Asumiendo que tienes este enum

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modal: HTMLIonModalElement | undefined;
  isBottomSheetOpen: boolean = false;
  private dataReturned: any;

  constructor(private modalController: ModalController) { }

  async openModal(componentName: String, extraParam?: any) {

    let modalComponent: ModalComponents = ModalComponents[componentName as keyof typeof ModalComponents];
    const componentRef = ComponentRef[modalComponent];
    if (!componentRef) {
      console.error(`No component found for ${modalComponent}`);
      return;
    }

    this.isBottomSheetOpen = true;
    const modal = await this.modalController.create({
      component: componentRef.component,
      componentProps: {
        ...componentRef.props,
        extraParam: extraParam  // Passing the string parameter to the modal
      } || { extraParam: extraParam },
      cssClass: componentRef.cssClass,
      breakpoints: componentRef.breakpoints || [0, 0.5, 0.75, 1],
      initialBreakpoint: componentRef.initialBreakpoint || 1,
      backdropBreakpoint: componentRef.backdropBreakpoint || 1,
    });

    this.setModal(modal);
    if (this.modal) {

      await this.modal.present();
      const { data } = await modal.onDidDismiss();
      this.dataReturned = data;
      this.isBottomSheetOpen = false;
    }
  }

  private setModal(newModal: any) {
    this.avoidMultipleInstancesOfModal();
    this.modal = newModal;
  }

  avoidMultipleInstancesOfModal() {
    if (this.modal) {
      this.modal.dismiss();
      this.modal = undefined;
    }
  }

  getModal() {
    return this.modal;
  }

  setBreakPoint(num: number) {
    this.getModal()?.setCurrentBreakpoint(num);
  }
}
