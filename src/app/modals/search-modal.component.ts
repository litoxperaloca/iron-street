import { Component } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { InfiniteScrollCustomEvent, ModalController, NavParams } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { MapService } from '../services/map.service'; // Asumiendo que tienes este servicio
import { ModalService } from '../services/modal.service';
@Component({
  selector: 'app-search-modal',
  templateUrl: './search-modal.component.html',
})
export class SearchModalComponent {
  selectedSegment: string = 'general'; // Default to the first tab
  searchTerm: string = '';
  suggestions: any[] = [];
  /*
    @ViewChild('dawn', { static: false }) dawnElement!: ElementRef;
    @ViewChild('day', { static: false }) dayElement!: ElementRef;
    @ViewChild('dusk', { static: false }) duskElement!: ElementRef;
    @ViewChild('night', { static: false }) nightElement!: ElementRef;
  */
  // Repite para 'day', 'dusk', 'night' si es necesario

  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
    private mapService: MapService,
  ) { }



  segmentChanged(event: any) {
    this.selectedSegment = event.detail.value;
  }

  dismiss() {
    this.modalController.dismiss();
  }

  onIonInfinite(ev: InfiniteScrollCustomEvent) {
    this.search().then(() => {
      (ev as InfiniteScrollCustomEvent).target.complete();
    }
    )
  }

  async doGet(url: string, params: Record<string, string>): Promise<HttpResponse> {
    const options = {
      url: url,
      headers: { 'X-Fake-Header': 'Fake-Value' },
      params: params,
    };

    return await CapacitorHttp.get(options);
  };


  async search() {
    if (this.searchTerm.length >= 4) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${this.searchTerm}.json?`;
      const params = {
        //country: 'ar,uy,br',
        country: 'uy',
        limit: '10',
        proximity: '-56.147969,-34.88154',
        types: 'address,place',
        language: 'es',
        autocomplete: 'true',
        access_token: environment.mapboxControlSearchConfig.accessToken,
      };

      this.doGet(url, params).then((response: HttpResponse) => {
        const data = JSON.parse(response.data);
        this.suggestions = data.features;
      }
      )
    } else {
      this.suggestions = [];
    }
  }

  setDestination(destination: any) {
    // Función para establecer el destino seleccionado
    this.mapService.setDestination(destination);
    this.dismiss();
  }
}
