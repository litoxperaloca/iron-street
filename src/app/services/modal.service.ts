import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ComponentRef } from '../models/component-ref.model'; // Asumiendo que tienes este archivo
import { ModalComponents } from '../models/modal-components.enum'; // Asumiendo que tienes este enum

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modal!: HTMLIonModalElement;
  isBottomSheetOpen: boolean = false;
  private dataReturned: any;

  constructor(private modalController: ModalController) { }

  async openModal(componentName: String) {

    let modalComponent: ModalComponents = ModalComponents[componentName as keyof typeof ModalComponents];
    const componentRef = ComponentRef[modalComponent];
    if (!componentRef) {
      console.error(`No component found for ${modalComponent}`);
      return;
    }

    this.isBottomSheetOpen = true;
    const modal = await this.modalController.create({
      component: componentRef.component,
      componentProps: componentRef.props || {},
      cssClass: componentRef.cssClass,
      breakpoints: componentRef.breakpoints || [0, 0.5, 0.75, 1],
      initialBreakpoint: componentRef.initialBreakpoint || 0.5,
      backdropBreakpoint: componentRef.backdropBreakpoint || 0.75,
    });

    this.setModal(modal);
    await this.modal.present();
    const { data } = await modal.onDidDismiss();
    this.dataReturned = data;
    this.isBottomSheetOpen = false;
  }

  private setModal(newModal: any) {
    this.avoidMultipleInstancesOfModal();
    this.modal = newModal;
  }

  private avoidMultipleInstancesOfModal() {
    if (this.modal) {
      this.modal.dismiss();
    }
  }

  getModal() {
    return this.modal;
  }

  setBreakPoint(num: number) {
    this.getModal()?.setCurrentBreakpoint(num);
  }
}
