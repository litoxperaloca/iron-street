
import { Component } from '@angular/core';
import { Place } from '@aws-amplify/geo';
import { ModalController, NavParams } from '@ionic/angular';
import { HomePage } from 'src/app/pages/home/home.page';
import { MapService } from '../../services/map.service'; // Asumiendo que tienes este servicio
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-place-info-modal',
  templateUrl: './place-info-modal.component.html',
  styleUrls: ['./place-info-modal.component.scss'],
})
export class PlaceInfoModalComponent {
  osmFeature: mapboxgl.MapboxGeoJSONFeature | undefined;
  osmPlace: Place | undefined;
  modalVars = { title: "" };
  featurePropsIndexes: string[] = [];
  featureIcon: string = "";
  featurePropsNormalized: any[] = [];
  osmFeatureIdSelected: number = 0;
  placeDataIncludeWebsite: boolean = false;
  featureWebsite: string = "";
  placeDataIncludePhone: boolean = false;
  featurePhone1: string = "";
  featurePhone2: string = "";
  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
    private mapService: MapService, // Servicio dedicado para operaciones del mapa
  ) {
    const self = this;
    const osmFeatureid: number = ((window as any).homePage as HomePage).osmClickedId;
    this.osmFeatureIdSelected = osmFeatureid;
    this.osmFeature = this.mapService.osmFeatures[osmFeatureid];
    this.osmPlace = this.mapService.osmPlaces[osmFeatureid];
    this.featurePropsIndexes = this.getPropertyKeys(this.osmFeature?.properties);
    this.featurePropsIndexes.forEach((key: string, index: number) => {
      if (this.osmFeature && this.osmFeature.properties) {
        if (key !== "category" && key !== "name" && key !== "amenity") {
          const prop = {
            key: key,
            value: this.translateToSpanish(this.osmFeature.properties[key]),
            keyTranslated: this.osmFeature.properties["category"].props[key]
          }

          if (prop.keyTranslated != "" && prop.keyTranslated != undefined) {
            this.featurePropsNormalized.push(prop);
          }

          if (key === "website" && this.osmFeature.properties[key] !== undefined && this.osmFeature.properties[key] !== null && this.osmFeature.properties[key] !== "") {
            this.placeDataIncludeWebsite = true;
            this.featureWebsite = this.osmFeature.properties[key];
          }

          if ((key === "contact:phone" || key === "phone") && this.osmFeature.properties[key] !== undefined && this.osmFeature.properties[key] !== null && this.osmFeature.properties[key] !== "") {
            this.placeDataIncludePhone = true;
            if (this.featurePhone1 === undefined || this.featurePhone1 === "") {
              this.featurePhone1 = this.osmFeature.properties[key];
            }
          }

          //console.log(prop);
        }
      }

    });
    this.featureIcon = this.getIconSRC();
  }

  translateToSpanish(value: string): string {
    if (value === "yes" || value === "Yes") return "Sí";
    if (value === "no" || value === "No") return "No";

    return value;
  }

  getIconSRC(): string {
    if (this.osmFeature && this.osmFeature.properties && this.osmFeature.properties['category']) {
      const iconName = this.osmFeature?.properties['category']?.marker + ".svg";
      return `assets/img/map-icons/${iconName}`;
    }
    return "";
  }

  getPropertyKeys(properties: any): string[] {
    return Object.keys(properties);
  }

  formatKey(key: string): string {
    if (this.osmFeature && this.osmFeature.properties) return this.osmFeature.properties["category"].props[key];
    // Replace underscores with spaces and capitalize each word
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  dismiss() {
    this.modalController.dismiss();
  }

  setDestinationOSMifAbortCurrent(destinationId: number) {
    this.dismiss();
    ((window as any).homePage as HomePage).setDestinationOSMifAbortCurrent(destinationId);
  }

  openOutsideLink(link: string) {
    window.open(link, '_blank');
  }

  callNumber(phone: string) {
    window.open(`tel:${phone}`, '_system');
  }

}
