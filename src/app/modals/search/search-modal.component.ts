import { Component } from '@angular/core';
import { Place, SearchForSuggestionsResult, SearchForSuggestionsResults } from '@aws-amplify/geo';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { InfiniteScrollCustomEvent, ModalController, NavParams } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { AmazonLocationServiceService } from '../../services/amazon-location-service.service';
import { MapService } from '../../services/map.service'; // Asumiendo que tienes este servicio
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-search-modal',
  templateUrl: './search-modal.component.html',
  styleUrls: ['./search-modal.component.scss']
})
export class SearchModalComponent {
  currentSegment: string = 'buscar'; // Default to the first tab
  searchTerm: string = '';
  suggestions: any[] = [];
  isLoading: boolean = false;
  showTooltip: boolean = false;
  /*
    @ViewChild('dawn', { static: false }) dawnElement!: ElementRef;
    @ViewChild('day', { static: false }) dayElement!: ElementRef;
    @ViewChild('dusk', { static: false }) duskElement!: ElementRef;
    @ViewChild('night', { static: false }) nightElement!: ElementRef;
  */
  // Repite para 'day', 'dusk', 'night' si es necesario

  toggleTooltip() {
    this.showTooltip = !this.showTooltip;
  }


  constructor(
    private modalController: ModalController,
    private navParams: NavParams,
    private modalService: ModalService,
    private mapService: MapService,
    private amazonLocationServiceService: AmazonLocationServiceService
  ) { }



  segmentChanged(event: any) {
    this.currentSegment = event.detail.value;
    // Implement specific logic for each segment if necessary
    // For example, load data related to the selected segment
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


  async searchAWS(searchMpde: string) {
    if (this.searchTerm.length >= 4) {
      /*const url = `https://search-places-2kzj2k5lq4v5x7y7qz7z4v7j7m.us-east-1.es.amazonaws.com/places/_search`;
      const params = {
        q: this.searchTerm,
        size: '10',
      };

      this.doGet(url, params).then((response: HttpResponse) => {
        const data = JSON.parse(response.data);
        this.suggestions = data.hits.hits;
      }
      )*/
      if (searchMpde == "strContains") {
        await this.amazonLocationServiceService.searchByText(this.searchTerm).then((response: Place[] | undefined) => {
          console.log(response);
          if (response) this.suggestions = response;
        });

      } else {
        await this.amazonLocationServiceService.suggestPlace(this.searchTerm).then((response: SearchForSuggestionsResults) => {
          console.log(response);
          this.suggestions = response;
        });
      }
    } else {
      this.suggestions = [];
    }

  }

  getSuggestionIcon(suggestion: any): string {
    // Example logic - adjust according to your actual data structure
    if (suggestion.categorias && suggestion.categorias[0] === '"IntersectionType"') {
      return 'git-merge-outline';
    } else if (suggestion.categorias && suggestion.categorias[0] === 'intersection') {
      return 'map - outline'; // Ionic icon for intersections
    } else {
      return 'pin-outline'; // Default Ionic icon for POIs
    }
  }

  async search() {
    if (this.searchTerm.length >= 4) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${this.searchTerm}.json?`;
      const params = {
        //country: 'ar,uy,br',
        country: 'uy',
        limit: '10',
        proximity: '-56.147969,-34.88154',
        types: 'address,place,poi',
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

  setDestinationFromPlace(destination: Place) {
    if (destination) this.mapService.setDestination(destination);
    this.dismiss();

  }

  setDestinationFromSuggestion(destination: SearchForSuggestionsResult) {
    if (destination.placeId) {
      this.amazonLocationServiceService.searchByPlaceId(destination.placeId).then((place) => {
        if (place) this.mapService.setDestination(place);
        this.dismiss();
      });
    }
  }
}
