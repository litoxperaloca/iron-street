import { Component } from '@angular/core';
import { Coordinates, Place } from 'src/app/models/route.interface';
import { ModalController, NavParams } from '@ionic/angular';
import { HomePage } from 'src/app/pages/home/home.page';
import { BookmarksService } from 'src/app/services/bookmarks.service';
import { MapService } from '../../services/map.service'; // Asumiendo que tienes este servicio
import { ModalService } from '../../services/modal.service';
import { IronLocationServiceService } from 'src/app/services/iron-location-service.service';

@Component({
  selector: 'app-location-modal',
  templateUrl: './location-modal.component.html',
  styleUrls: ['./location-modal.component.scss'],
})
export class LocationModalComponent {
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
  coordinatesPressed: [number, number] | undefined;
  extraParam: boolean = false;
  infoLoaded: boolean = false;
  loading: boolean = true;
  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
    private mapService: MapService,
    private ironLocationServiceService: IronLocationServiceService,
    private bookmarksService: BookmarksService// Servicio dedicado para operaciones del mapa
  ) {
    if (this.navParams.get('isFinalDestination')) {
      this.extraParam = this.navParams.get('extraParam'); // Accessing the passed parameter

    }
    const self = this;
    this.coordinatesPressed = ((window as any).homePage as HomePage).coordinatesPressed;
    if (this.coordinatesPressed) {
      this.place = {
        label: "(" + this.coordinatesPressed[0].toFixed(4) + "," + this.coordinatesPressed[1].toFixed(4) + ")",
        geometry: {
          point: this.coordinatesPressed
        }
      }
    }
  }

  async searchAWS() {
    if (this.coordinatesPressed && this.coordinatesPressed[0] != 0 && this.coordinatesPressed[1] != 0) {
      this.loading = true;

      const response = await this.ironLocationServiceService.searchByCoordinates(this.coordinatesPressed);
        //console.log(response);
        if (response) {
          const place = {
            addressNumber: response.data.address.house_number,
            country: response.data.address.country,
            geometry: {
              point: [response.data.lon as number,response.data.lat as number] as Coordinates
            },
            label: response.data.display_name,
            municipality: response.data.address.state,
            neighborhood: response.data.address.neighbourhood,
            postalCode: response.data.address.postcode,
            region: response.data.address.city,
            street: response.data.address.road,
            subRegion: response.data.address.suburb
          }
          this.place=place;
         
        }
        this.loading = false;
        this.infoLoaded = true;
      
    } else {
    }

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

  async toggleInfo(): Promise<void> {
    this.bookmarkMgr = false;
    this.infoMgr = !this.infoMgr;
    if (this.infoMgr) {
      this.modalService.setBreakPoint(0.45);
      if (!this.infoLoaded) {
        await this.searchAWS();

      }
    } else {
      this.modalService.setBreakPoint(0.24);
    }
  }

  locatePlace(): void {
    if (this.place && this.place.geometry && this.place.geometry.point)
      this.mapService.getMap().flyTo({ center: this.place.geometry.point });
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
    this.deteleMarker();
    this.modalController.dismiss();
  }

  deteleMarker(){
    ((window as any).mapService as MapService).removeClassicMarker();
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

  setDestinationFromPlace() {
    if (this.extraParam) {
      if (this.place) this.mapService.addWaypoint(this.place);
    } else {
      if (this.place) this.mapService.setDestination(this.place);

    }
    this.dismiss();

  }

  async addWorkPlace(): Promise<void> {
    if (this.place) {
      await this.bookmarksService.setWorkMarker(this.place);
      this.dismiss();
    }


  }

  async addHomePlace(): Promise<void> {
    if (this.place) {
      await this.bookmarksService.setHomeMarker(this.place);
      this.dismiss();
    }
  }

  async addFavoritePlace(): Promise<void> {
    if (this.place) {
      await this.bookmarksService.addFavoriteMarker(this.place);
      this.dismiss();
    }
  }

}
