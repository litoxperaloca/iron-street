
import { Component } from '@angular/core';
import { Place } from 'src/app/models/route.interface';
import { ModalController, NavParams } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { HomePage } from 'src/app/pages/home/home.page';
import { MapService } from 'src/app/services/map.service';
import { BookmarksService } from '../../services/bookmarks.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-bookmark-modal',
  templateUrl: './bookmark-modal.component.html',
  styleUrls: ['./bookmark-modal.component.scss'],
})
export class BookmarkModalComponent {

  isLoading: boolean = false;
  place: Place | undefined;
  extraParam: boolean = false;
  osmFeature: mapboxgl.MapboxGeoJSONFeature | undefined;
  osmPlace: Place | undefined;
  osmFeatureIdSelected: number = 0;

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
    private bookmarksService: BookmarksService,
    private mapService: MapService,
    private translate: TranslateService
  ) {
    const osmFeatureid: number = ((window as any).homePage as HomePage).osmClickedId;
    this.osmFeatureIdSelected = osmFeatureid;
    this.osmFeature = this.mapService.osmFeatures[osmFeatureid];
    this.place = this.mapService.osmPlaces[osmFeatureid];
  }


  dismiss() {
    this.modalController.dismiss();
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
