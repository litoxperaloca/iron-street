import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { BookmarksService } from 'src/app/services/bookmarks.service';
import { MapService } from '../../services/map.service'; // Asumiendo que tienes este servicio
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-max-speed-details-modal',
  templateUrl: './max-speed-details-modal.component.html',
  styleUrls: ['./max-speed-details-modal.component.scss'],
})
export class MaxSpeedDetailsModalComponent implements OnInit {
  currentStreet: mapboxgl.MapboxGeoJSONFeature | null = null;
  infoMgr: boolean = false;
  isShowingSpeedWayOnMap: boolean = false;

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
