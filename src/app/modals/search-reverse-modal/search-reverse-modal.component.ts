import { Component } from '@angular/core';
import { Place, SearchForSuggestionsResult } from '@aws-amplify/geo';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { InfiniteScrollCustomEvent, ModalController, NavParams } from '@ionic/angular';
import mapboxgl from 'mapbox-gl';
import { environment } from 'src/environments/environment';
import { AmazonLocationServiceService } from '../../services/amazon-location-service.service';
import { GeoLocationService } from '../../services/geo-location.service';
import { MapService } from '../../services/map.service'; // Asumiendo que tienes este servicio
import { ModalService } from '../../services/modal.service';
import { OsmService } from '../../services/osm.service';

@Component({
  selector: 'app-search-reverse-modal',
  templateUrl: './search-reverse-modal.component.html',
  styleUrls: ['./search-reverse-modal.component.scss'],
})
export class SearchReverseModalComponent {
  currentSegment: string = 'buscar'; // Default to the first tab
  searchTerm: string = '';
  suggestions: any[] = [];
  places: Place[] = [];
  place: Place | undefined;

  isLoading: boolean = false;
  coordinates: [number, number] = [0, 0];
  segmentIsLoading: any = [];


  showTooltip: boolean = false;
  extraParam: boolean = false;
  categories: { name: string, icon: string, type: string, marker: string, labelPropertyIndex: string }[] = environment.ironUiConfig.categories;
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
    private amazonLocationServiceService: AmazonLocationServiceService,
    private osmService: OsmService,
    private geoLocationService: GeoLocationService
  ) {
    if (this.navParams.get('isFinalDestination')) {
      this.extraParam = this.navParams.get('extraParam'); // Accessing the passed parameter

    }
    if (this.mapService.mapPressedMarkerInstance) {
      const marker: mapboxgl.Marker = this.mapService.mapPressedMarkerInstance;
      this.coordinates = [marker.getLngLat().lng, marker.getLngLat().lat];
    }
    this.searchAWS();
  }



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


  async searchAWS() {
    if (this.coordinates[0] != 0 && this.coordinates[1] != 0) {
      this.isLoading = true;

      await this.amazonLocationServiceService.searchByCoordinates(this.coordinates).then((response: Place | undefined) => {
        //console.log(response);
        if (response) this.place = response;
        this.isLoading = false;

      });
    } else {
      this.suggestions = [];
    }

  }

  iconUrl(icon: string): string {
    return `assets/img/map-icons/${icon}.svg`;
  }

  async loadPlaces(category: { name: string, icon: string, type: string, marker: string, labelPropertyIndex: string }) {
    const userLocation = ((window as any).geoLocationService as GeoLocationService).getLastCurrentLocation(); // Ensure you have a method to get the current location
    if (!userLocation) {
      console.error('User location is not available');
      return;
    }
    const bbox = this.geoLocationService.createBoundingBox(userLocation.coords, 5); // Adjust the distance as needed
    this.segmentIsLoading[this.currentSegment] = true;

    try {
      this.osmService.getNearPlacesData(bbox, category.type).then((response: HttpResponse) => {
        const data = response.data;
        this.places = data.features;
        this.mapService.addPlacesPoints(data.elements, category);
        this.segmentIsLoading[this.currentSegment] = false;

        this.dismiss();
      });
    } catch (error) {
      console.error('Failed to load places:', error);
      this.places = [];
    } finally {
      this.segmentIsLoading[this.currentSegment] = false;

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
    if (this.extraParam) {
      if (destination) this.mapService.addWaypoint(destination);
    } else {
      if (destination) this.mapService.setDestination(destination);

    }
    this.mapService.closeCustomPopup()

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
