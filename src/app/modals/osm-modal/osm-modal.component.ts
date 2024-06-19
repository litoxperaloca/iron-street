import { Component } from '@angular/core';
import { Place } from '@aws-amplify/geo';
import { ModalController, NavParams } from '@ionic/angular';
import { HomePage } from 'src/app/pages/home/home.page';
import { BookmarksService } from 'src/app/services/bookmarks.service';
import { MapService } from '../../services/map.service'; // Asumiendo que tienes este servicio
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-osm-modal',
  templateUrl: './osm-modal.component.html',
  styleUrls: ['./osm-modal.component.scss'],
})
export class OsmModalComponent {
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
  bookmarkMgr: boolean = false;
  infoMgr: boolean = false;
  place: Place | undefined;

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
    private mapService: MapService,
    private bookmarksService: BookmarksService// Servicio dedicado para operaciones del mapa
  ) {
    const self = this;
    const osmFeatureid: number = ((window as any).homePage as HomePage).osmClickedId;
    this.osmFeatureIdSelected = osmFeatureid;
    this.osmFeature = this.mapService.osmFeatures[osmFeatureid];
    this.osmPlace = this.mapService.osmPlaces[osmFeatureid];
    this.featurePropsIndexes = this.getPropertyKeys(this.osmFeature?.properties);
    this.featurePropsIndexes.forEach((key: string, index: number) => {
      if (this.osmFeature && this.osmFeature.properties) {
        if (key !== "name") {
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

  toggleBookmarks(): void {
    this.infoMgr = false;
    this.bookmarkMgr = !this.bookmarkMgr;
    if (this.bookmarkMgr) {
      this.modalService.setBreakPoint(0.55);
    } else {
      this.modalService.setBreakPoint(0.24);
    }
  }

  toggleInfo(): void {
    this.bookmarkMgr = false;
    this.infoMgr = !this.infoMgr;
    if (this.infoMgr) {
      this.modalService.setBreakPoint(1);
    } else {
      this.modalService.setBreakPoint(0.24);
    }
  }

  locatePlace(): void {
    if (this.osmPlace && this.osmPlace.geometry && this.osmPlace.geometry.point)
      this.mapService.getMap().flyTo({ center: this.osmPlace.geometry.point });
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

  getFullAddress() {
    if (this.osmFeature && this.osmFeature.properties && this.osmFeature.properties['addr:street']) {
      let address = this.osmFeature.properties['addr:street'];
      address += ' ' + this.osmFeature.properties['addr:housenumber'];
      /*address += ', ' + this.osmFeature.properties['addr:city'];
      address += ', ' + this.osmFeature.properties['addr:country'];
      address += '.';*/
      return address;
    }
    return "Poca información disponible";
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

  async addWorkPlace(): Promise<void> {
    if (this.osmPlace) {
      await this.bookmarksService.setWorkMarker(this.osmPlace);
      this.toggleBookmarks();
    }


  }

  async addHomePlace(): Promise<void> {
    if (this.osmPlace) {
      await this.bookmarksService.setHomeMarker(this.osmPlace);
      this.toggleBookmarks();
    }
  }

  async addFavoritePlace(): Promise<void> {
    if (this.osmPlace) {
      await this.bookmarksService.addFavoriteMarker(this.osmPlace);
      this.toggleBookmarks();
    }
  }

}
