import { Component, OnInit } from '@angular/core';
import { Place } from '@aws-amplify/geo';
import { ModalController, NavParams } from '@ionic/angular';
import { HomePage } from 'src/app/pages/home/home.page';
import { BookmarksService } from 'src/app/services/bookmarks.service';
import { MapService } from '../../services/map.service'; // Asumiendo que tienes este servicio
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-bookmark-saved-modal',
  templateUrl: './bookmark-saved-modal.component.html',
  styleUrls: ['./bookmark-saved-modal.component.scss'],
})
export class BookmarkSavedModalComponent  implements OnInit {
  modalVars = { title: "" };

  place: Place | null = null;
  favType:string='';
  featureIcon:string='/assets/img/map-icons/';

  async ngOnInit() {
    if(this.mapService.selectedBookmarkType && this.mapService.selectedBookmarkType==="home"){
      this.place = await this.bookmarksService.getHomeMarker();
      this.favType="Casa";
      this.featureIcon= this.featureIcon+'home.png';
    }else     if(this.mapService.selectedBookmarkType==="work"){
      this.favType="Trabajo";
      this.featureIcon= this.featureIcon+'work.png';
      this.place = await this.bookmarksService.getWorkMarker();
    }else    if(this.mapService.selectedBookmarkType==="favourite"){
      const favList = await this.bookmarksService.getFavoriteMarkers();
      let favIndex:number = -1;
      if(this.mapService.selectedFavIndex){
        favIndex=this.mapService.selectedFavIndex;
      }
      if(favList && favIndex){
        this.place=favList[favIndex];
        this.featureIcon= this.featureIcon+'favourite.png';
        this.favType="Favorito";

      }
    }

  }


  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
    private mapService: MapService,
    private bookmarksService: BookmarksService// Servicio dedicado para operaciones del mapa
  ) {
    const self = this;

    }

  locatePlace(): void {
    if (this.place && this.place.geometry && this.place.geometry.point)
      this.mapService.getMap().flyTo({ center: this.place.geometry.point });
  }

 
  dismiss() {
    this.modalController.dismiss();
  }

  setDestinationBookmarkifAbortCurrent() {
    this.dismiss();
    if(this.place){
      ((window as any).homePage as HomePage).setDestinationBookmarkIfAbortCurrent(this.place);
    }
  }

  openOutsideLink(link: string) {
    window.open(link, '_blank');
  }

  callNumber(phone: string) {
    window.open(`tel:${phone}`, '_system');
  }

  async removeBookmark(){
    if(      this.favType==="Casa"    ){
      await this.removeHomeMarker();
    }

    if(      this.favType==="Trabajo"    ){
      await this.removeWorkMarker();
    }

    if(this.place &&      this.favType==="Favorito"    ){
      
      await this.removeFavoriteMarker(this.place);
    }
    this.dismiss();
  }
  async removeHomeMarker(): Promise<void> {
    await this.bookmarksService.removeHomeMarker();
  }

  async removeWorkMarker(): Promise<void> {
    await this.bookmarksService.removeWorkMarker();
  }

  async removeFavoriteMarker(marker: Place): Promise<void> {
    await this.bookmarksService.removeFavoriteMarker(marker);
  }

}
