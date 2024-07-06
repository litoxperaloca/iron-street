import { Injectable } from '@angular/core';
import polyline from '@mapbox/polyline';
import { GeoLocationMockService } from '../mocks/geo-location-mock.service';
import { HomePage } from '../pages/home/home.page';
import { MapService } from './map.service';

@Injectable({
  providedIn: 'root'
})
export class TripSimulatorService {

  constructor() { }

  simulateGuidedTrip(): void {
    const route = ((window as any).mapService as MapService).actualRoute;
    const lineCoords = polyline.decode(route.geometry).map(coord => [coord[1], coord[0]]);
    ((window as any).geoLocationMockService as GeoLocationMockService).setCoordinates(lineCoords);// Implementa la simulación de un viaje guiado aquí
    ((window as any).homePage as HomePage).startTrip();

  }

}
