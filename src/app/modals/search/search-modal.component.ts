import { Component } from '@angular/core';
import {Place} from 'src/app/models/route.interface'
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { InfiniteScrollCustomEvent, ModalController, NavParams } from '@ionic/angular';
import { Feature } from 'geojson';
import { environment } from 'src/environments/environment';
import { IronLocationServiceService } from '../../services/iron-location-service.service';

import { BookmarksService } from '../../services/bookmarks.service';
import { GeoLocationService } from '../../services/geo-location.service';
import { MapService } from '../../services/map.service'; // Asumiendo que tienes este servicio
import { ModalService } from '../../services/modal.service';
import { OsmService } from '../../services/osm.service';
import { point } from '@turf/helpers';
import distance from '@turf/distance';
@Component({
  selector: 'app-search-modal',
  templateUrl: './search-modal.component.html',
  styleUrls: ['./search-modal.component.scss']
})
export class SearchModalComponent {
  currentSegment: string = 'buscar'; // Default to the first tab
  searchTerm: string = '';
  suggestions: any[] = [];
  places: Place[] = [];
  isLoading: boolean = false;
  groupedPlaces: { [country: string]: { [municipality: string]: any[] } } = {};
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
    private osmService: OsmService,
    private geoLocationService: GeoLocationService,
    private bookmarksService: BookmarksService, 
    private ironLocationServiceService: IronLocationServiceService
  ) {
    if (this.navParams.get('isFinalDestination')) {
      this.extraParam = this.navParams.get('extraParam'); // Accessing the passed parameter

    }
    this.segmentIsLoading['buscar'] = false;
    this.segmentIsLoading['favoritos'] = false;
    this.segmentIsLoading['lugares'] = false;
    this.segmentIsLoading['historial'] = false;
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
    })
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
      this.isLoading = true;
      this.segmentIsLoading[this.currentSegment] = true;

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
        this.groupedPlaces = {};
        await this.ironLocationServiceService.suggestPlace(this.searchTerm).then((response) => {
          console.log(response);
          if (response) this.suggestions = response.data.results;
          this.suggestions.forEach(place => {
            const countryCode: string = place.country;
            place.country = this.ironLocationServiceService.getCountryName(countryCode);
            if (!this.groupedPlaces[place.country]) {
              this.groupedPlaces[place.country] = {};
            }
            if (!this.groupedPlaces[place.country][place.municipality]) {
              this.groupedPlaces[place.country][place.municipality] = [];
            }
            this.groupedPlaces[place.country][place.municipality].push(place)
          });


        });
        await this.osmService.searchByText(this.searchTerm).then((response: any) => {
          //console.log(response);
          const osmData = this.formatOSMResponse(response.data.features);//this.suggestions.join = response;
          osmData.forEach(place => {
            if (place) {
              place = place as Place;
              if (place.country && place.municipality) {
                if (!this.groupedPlaces[place.country]) {
                  this.groupedPlaces[place.country] = {};
                }
                if (!this.groupedPlaces[place.country][place.municipality]) {
                  this.groupedPlaces[place.country][place.municipality] = [];
                }
                this.groupedPlaces[place.country][place.municipality].push(place)
              }
            }
          });
        });
        const position = this.geoLocationService.getLastCurrentLocation();
        this.groupedPlaces = this.sortLocationsByDistance({lon: position.coords.longitude,lat: position.coords.latitude},this.groupedPlaces)
        this.segmentIsLoading[this.currentSegment] = false;
        //console.log(this.groupedPlaces);

      }
    } else {
      this.suggestions = [];
    }

  }

  sortLocationsByDistance(userLocation: { lat: number, lon: number }, data: any) {
    const userPoint = point([userLocation.lon, userLocation.lat]);

    // Sort each municipality's locations
    Object.keys(data).forEach(country => {
      Object.keys(data[country]).forEach(municipality => {
        data[country][municipality] = data[country][municipality].sort((a: any, b: any) => {
          const distanceA = distance(userPoint, point(a.geometry.point));
          const distanceB = distance(userPoint, point(b.geometry.point));
          return distanceA - distanceB;
        });
      });
    });

    // Sort municipalities within each country by their closest location
    Object.keys(data).forEach(country => {
      const sortedMunicipalities = Object.keys(data[country]).sort((a, b) => {
        const closestA = data[country][a][0];
        const closestB = data[country][b][0];
        const distanceA = distance(userPoint, point(closestA.geometry.point));
        const distanceB = distance(userPoint, point(closestB.geometry.point));
        return distanceA - distanceB;
      });

      // Reorder municipalities in the data object
      const sortedMunicipalitiesData:any= {};
      sortedMunicipalities.forEach(municipality => {
        sortedMunicipalitiesData[municipality] = data[country][municipality];
      });
      data[country] = sortedMunicipalitiesData;
    });

    // Sort countries by their closest municipality's location
    const sortedCountries = Object.keys(data).sort((a, b) => {
      const closestMunicipalityA = (Object.values(data[a]) as any)[0][0];
      const closestMunicipalityB = (Object.values(data[b]) as any)[0][0];
      const distanceA = distance(userPoint, point(closestMunicipalityA.geometry.point));
      const distanceB = distance(userPoint, point(closestMunicipalityB.geometry.point));
      return distanceA - distanceB;
    });

    // Reorder countries in the data object
    const sortedData :any= {};
    sortedCountries.forEach(country => {
      sortedData[country] = data[country];
    });

    return sortedData;
  }
  

  formatOSMResponse(osmResponse: Feature[]) {
    return osmResponse.map(item => {
      if (item.properties && item.geometry.type == 'Point') {
        //const addressComponents = (item.properties['display_name'] as string).split(',').map(s => s.trim());

        const place: Place = {
          addressNumber: item.properties['address']['house_number'] || '',
          country: item.properties['address']['country'] || '',
          geometry: {
            point: [item.geometry.coordinates[0], item.geometry.coordinates[1]]
          },
          label: item.properties['display_name'],
          municipality: item.properties['address']['state'] || '',
          neighborhood: item.properties['address']['neighbourhood'] || item.properties['address']['suburb'] || item.properties['address']['town'] || '',
          postalCode: item.properties['address']['postcode'] || '',
          street: item.properties['address']['road'] || '',

        };
        return place;
      }
      return null;
    });
  }

  getCountryKeys() {
    return Object.keys(this.groupedPlaces);
  }

  getMunicipalityKeys(country: string) {
    return Object.keys(this.groupedPlaces[country]);
  }
  iconUrl(icon: string): string {
    return `assets/img/map-icons/${icon}.png`;
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
      await this.osmService.getNearPlacesData(bbox, category.type).then((response: HttpResponse) => {
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

  async setDestinationFromPlace(destination: Place) {
    if (this.extraParam) {
      if (destination) await this.mapService.addWaypoint(destination);
    } else {
      if (destination) await this.mapService.setDestination(destination);

    }
    this.dismiss();

  }

  /*setDestinationFromSuggestion(destination: SearchForSuggestionsResult) {
    if (destination.placeId) {
      this.amazonLocationServiceService.searchByPlaceId(destination.placeId).then((place) => {
        if (place) this.mapService.setDestination(place);
        this.dismiss();
      });
    }
  }*/

  homeMarker: Place | null = null;
  workMarker: Place | null = null;
  favoriteMarkers: Place[] = [];

  markerName = '';
  markerLat: number | null = null;
  markerLng: number | null = null;

  ngOnInit(): void {
    this.loadMarkers();
  }

  async loadMarkers(): Promise<void> {
    this.homeMarker = await this.bookmarksService.getHomeMarker();
    this.workMarker = await this.bookmarksService.getWorkMarker();
    this.favoriteMarkers = await this.bookmarksService.getFavoriteMarkers();
  }

  async setHomeMarker(): Promise<void> {
    if (this.markerLat !== null && this.markerLng !== null) {
      const marker: Place = { label: 'Casa', geometry: { point: [this.markerLng, this.markerLat] } };
      await this.bookmarksService.setHomeMarker(marker);
      await this.loadMarkers();
    }
  }

  async setWorkMarker(): Promise<void> {
    if (this.markerLat !== null && this.markerLng !== null) {
      const marker: Place = { label: 'Trabajo', geometry: { point: [this.markerLng, this.markerLat] } };
      await this.bookmarksService.setWorkMarker(marker);
      await this.loadMarkers();
    }
  }

  async addFavoriteMarker(): Promise<void> {
    if (this.markerName && this.markerLat !== null && this.markerLng !== null) {
      const marker: Place = { label: this.markerName, geometry: { point: [this.markerLng, this.markerLat] } };
      await this.bookmarksService.addFavoriteMarker(marker);
      await this.loadMarkers();
    }
  }

  async addWorkPlace(place: Place): Promise<void> {
    await this.bookmarksService.setWorkMarker(place);
    await this.loadMarkers();
  }

  async addHomePlace(place: Place): Promise<void> {
    await this.bookmarksService.setHomeMarker(place);
    await this.loadMarkers();
  }

  async addFavoritePlace(place: Place): Promise<void> {
    await this.bookmarksService.addFavoriteMarker(place);
    await this.loadMarkers();
  }

  async removeHomeMarker(): Promise<void> {
    await this.bookmarksService.removeHomeMarker();
    await this.loadMarkers();
  }

  async removeWorkMarker(): Promise<void> {
    await this.bookmarksService.removeWorkMarker();
    await this.loadMarkers();
  }

  async removeFavoriteMarker(marker: Place): Promise<void> {
    await this.bookmarksService.removeFavoriteMarker(marker);
    await this.loadMarkers();
  }
}
