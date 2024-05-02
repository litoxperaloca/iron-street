import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import * as turf from '@turf/turf';
import { Point } from 'geojson';
import { environment } from 'src/environments/environment';
import { GeoLocationMockService } from '../mocks/geo-location-mock.service';
import { MapService } from './map.service';
import { SpeedService } from './speed.service';
@Injectable({
  providedIn: 'root',
})
export class GeoLocationService {
  private watchID!: string | null;
  private currentPosition: any = null;
  private lastCurrentLocation: any;
  private lastBboxCalculatedForDataIncome: any = null;
  public mocking: boolean = false;

  getLastCurrentLocation(): Position {
    return this.lastCurrentLocation;
  }

  setLastCurrentPosition(position: Position) {
    this.currentPosition = position;
    this.lastCurrentLocation = position;
  }

  constructor(private geoLocationMockService: GeoLocationMockService, private mapService: MapService, private speedService: SpeedService) { }

  getLastValidCurrentPosition(): Position {
    return this.currentPosition;
  }

  async getCurrentPosition() {
    try {
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        await Geolocation.requestPermissions();
      }
      const options = {
        maximumAge: 1100,
        timeout: 10000,
        enableHighAccuracy: true,
      };
      const coordinates = await Geolocation.getCurrentPosition(options);
      if (environment.mocking && this.mocking) {
        const coords: Position = await this.geoLocationMockService.getNextPosition();
        if (coords.coords.latitude === 0 && coords.coords.longitude === 0) {
          //console.log('Termino la simulacion');
          return coordinates;
        } else {
          return coords;
        }
      } else {
        return coordinates;
      }

    } catch (e) {
      console.error('Error getting location', e);
      return null;
    }
  }

  async startLocationObserver() {
    let self = this;
    const options = {
      maximumAge: 1100,
      timeout: 10000,
      enableHighAccuracy: true,
    };
    this.watchID = await Geolocation.watchPosition(options, (position, err) => {
      if (err) {
        console.error('Error watching position:', err);
        return;
      }
      //console.log('Location observer started');
    });
  }

  stopLocationObserver() {
    if (this.watchID != null) Geolocation.clearWatch({ id: this.watchID });

  }

  // Nuevo método para observar cambios en la posición
  async watchPosition(callback: (position: Position | null, error?: any) => void) {
    const options = {
      maximumAge: 3000,
      timeout: 6000,
      enableHighAccuracy: true,
    };
    this.watchID = await Geolocation.watchPosition(options, async (position, error) => {
      if (error) {
        callback(null, error);
        return;
      }
      if (environment.mocking && this.mocking) {
        let coords: Position = await this.geoLocationMockService.getNextPosition();
        if (coords.coords.latitude === 0 && coords.coords.longitude === 0) {
          callback(position);
          //console.log("Termino la simulacion")
        } else {
          callback(coords);

        }

      } else {
        callback(position);

      }
    });

    return this.watchID;
  }

  // Método para detener la observación
  stopWatchingPosition() {
    if (this.watchID != null) Geolocation.clearWatch({ id: this.watchID });
  }




  calculateDistanceToNearestBboxEdge(userLocation: Point, bbox: [[number, number], [number, number]]) {
    const [[minLongitude, minLatitude], [maxLongitude, maxLatitude]] = bbox;

    // Create points for bbox corners
    const bottomLeft = turf.point([minLongitude, minLatitude]);
    const bottomRight = turf.point([maxLongitude, minLatitude]);
    const topLeft = turf.point([minLongitude, maxLatitude]);
    const topRight = turf.point([maxLongitude, maxLatitude]);

    // Calculate distances from the userLocation to each bbox corner
    // For simplicity, using corners, but you can also create lines for bbox edges and calculate accordingly
    const distances = [
      turf.distance(userLocation, bottomLeft, { units: 'kilometers' }),
      turf.distance(userLocation, bottomRight, { units: 'kilometers' }),
      turf.distance(userLocation, topLeft, { units: 'kilometers' }),
      turf.distance(userLocation, topRight, { units: 'kilometers' })
    ];

    // Return the minimum distance
    return Math.min(distances[0], distances[1], distances[2], distances[3]);
  }


  createUserBoundingBox(position: Position): [[number, number], [number, number]] {
    //console.log(position)
    let center: { latitude: number, longitude: number } = { latitude: 0, longitude: 0 };
    if (!position) {
      //console.log("No hay posición")
      if (this.getLastCurrentLocation().coords) {
        center = this.getLastCurrentLocation().coords;
      }
    } else if (position.coords) {
      //console.log("Hay posición")
      center = position.coords;
    }
    if (center.latitude !== undefined || center.longitude !== undefined) {
      //console.log("Creando bbox", center)
      this.lastBboxCalculatedForDataIncome = this.createBoundingBox(center, environment.osmApiConfig.radioDistanceForInitialData);
      //console.log("Bbox creado", this.lastBboxCalculatedForDataIncome);
      return this.lastBboxCalculatedForDataIncome;
    } else {
      return [[0, 0], [0, 0]];
    }
  }


  createBoundingBox(center: { latitude: number, longitude: number }, distance: number): [[number, number], [number, number]] {
    const earthRadius = 6371; // radius of the earth in kilometers

    const lat = center.latitude;
    const lng = center.longitude;

    const maxLat = lat + this.rad2deg(distance / earthRadius);
    const minLat = lat - this.rad2deg(distance / earthRadius);

    // Compensate for degrees longitude getting smaller with increasing latitude
    const maxLng = lng + this.rad2deg(distance / earthRadius / Math.cos(this.deg2rad(lat)));
    const minLng = lng - this.rad2deg(distance / earthRadius / Math.cos(this.deg2rad(lat)));

    return [[minLng, minLat], [maxLng, maxLat]];
  }

  rad2deg(angle: number) {
    return angle * 57.29577951308232; // angle / Math.PI * 180
  }

  deg2rad(angle: number) {
    return angle * 0.017453292519943295; // angle * Math.PI / 180
  }


  getCurrentPositionScreenBox(): [[number, number], [number, number]] {
    const userPos: Position = this.getLastCurrentLocation();
    return this.createBoundingBox(userPos.coords, 2);
  }
}
