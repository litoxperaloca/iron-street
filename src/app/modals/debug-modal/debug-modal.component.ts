import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { HomePage } from 'src/app/pages/home/home.page';
import { BookmarksService } from 'src/app/services/bookmarks.service';
import { CameraService } from 'src/app/services/camera.service';
import { GeoLocationService } from 'src/app/services/geo-location.service';
import { SensorService } from 'src/app/services/sensor.service';
import { environment } from 'src/environments/environment';
import { MapService } from '../../services/map.service'; // Asumiendo que tienes este servicio
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-debug-modal',
  templateUrl: './debug-modal.component.html',
  styleUrls: ['./debug-modal.component.scss'],
})
export class DebugModalComponent implements OnInit {


  currentStreet: mapboxgl.MapboxGeoJSONFeature | null = null;
  infoMgr: boolean = false;
  isShowingSpeedWayOnMap: boolean = false;

  getEnvironmentMocking() {
    return environment.mocking;
  }

  getGeolocationMocking() {
    return ((window as any).geoLocationService as GeoLocationService).mocking;
  }

  getLatitude() {
    return ((window as any).sensorService as SensorService).latitudeOriginal;
  }

  getLongitude() {
    return ((window as any).sensorService as SensorService).longitudeOriginal;
  }

  getHeading() {
    return ((window as any).sensorService as SensorService).headingOriginal;
  }

  getSnapedLatitude() {
    return ((window as any).sensorService as SensorService).getSensorSnapLatitude();
  }

  getSnapedLongitude() {
    return ((window as any).sensorService as SensorService).getSensorSnapLongitude();
  }

  getSnapedHeading() {
    return ((window as any).sensorService as SensorService).getSensorHeading();
  }

  getCameraLocked() {
    return ((window as any).cameraService as CameraService).locked;

  }

  getCameraFlying() {
    return ((window as any).cameraService as CameraService).isFlying;

  }


  getTrackingUser() {
    return ((window as any).mapService as MapService).trackingUser;
  }

  getMapEventTrackingUser() {
    return ((window as any).mapService as MapService).mapEventIsFromTracking;
  }

  getSimulating() {
    return ((window as any).homePage as HomePage).simulation;

  }

  getCurrentSpeed() {
    return ((window as any).homePage as HomePage).currentSpeed;

  }


  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
    private mapService: MapService,
    private bookmarksService: BookmarksService// Servicio dedicado para operaciones del mapa
  ) {

  }

  toggleInfo(): void {
    this.infoMgr = !this.infoMgr;
    if (this.infoMgr) {
      this.modalService.setBreakPoint(0.45);
    } else {
      this.modalService.setBreakPoint(0.17);
    }
  }


  ngOnInit() {
    if (this.mapService.userCurrentStreet) {
      this.currentStreet = this.mapService.userCurrentStreet;
      this.mapService.currentStreetChanged.subscribe(street => {
        this.currentStreet = street;
      })
      if (this.mapService.showingMaxSpeedWay) {
        this.isShowingSpeedWayOnMap = true;
      } else {
        this.isShowingSpeedWayOnMap = false;

      }
    }

  }

  async showMaxSpeedStreetWayOnMap() {
    await this.mapService.showUserCurrentStreetMaxSpeedWay();
    this.isShowingSpeedWayOnMap = true;

  }


  async hideMaxSpeedStreetWayOnMap() {
    await this.mapService.hideUserCurrentStreetMaxSpeedWay();
    this.isShowingSpeedWayOnMap = false;

  }

  openOutsideLink(link: string) {
    window.open(link, '_blank');
  }

  dismiss() {
    this.modalController.dismiss();
  }

}
