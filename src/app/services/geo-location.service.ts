import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position } from '@capacitor/geolocation';
//import * as turf from '@turf/turf';
import distance from '@turf/distance';
import { point } from '@turf/helpers';
import { Point } from 'geojson';
import { environment } from 'src/environments/environment';
import { GeoLocationMockService } from '../mocks/geo-location-mock.service';
import { HomePage } from '../pages/home/home.page';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root',
})
export class GeoLocationService {
  private currentPosition: any = null;
  private lastCurrentLocation: any;
  private lastBboxCalculatedForDataIncome: any = null;
  public mocking: boolean = false;

  async requestPermissions() {
    if (Capacitor.isNativePlatform()) {
      try {
        const permissions = await Geolocation.requestPermissions();
        if (permissions.location === 'granted') {
          return true;
        } else {
          throw new Error('Location permission not granted');
        }
      } catch (error) {
        console.error('Error requesting location permissions', error);
        throw error;
      }
    } else {
      // Web does not need explicit permissions
      return true;
    }
  }

  async getCurrentPos() {
    const options = {
      maximumAge: 1500,
      timeout: 3000,
      enableHighAccuracy: true,
    };
    if (Capacitor.isNativePlatform()) {
      try {
        const coordinates = await Geolocation.getCurrentPosition(options);
        return coordinates;
      } catch (e) {
        console.error('Error getting location', e);
        throw e;
      }
    } else {
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(resolve, reject, options);
        } else {
          reject(new Error('Geolocation not supported'));
        }
      });
    }
  }

  watchPosition(callback: (position: any) => void) {
    const options = {
      maximumAge: 1500,
      timeout: 3000,
      enableHighAccuracy: true,
    };
    if (Capacitor.isNativePlatform()) {
      const wait = Geolocation.watchPosition(options, (position, err) => {
        if (err) {
          console.error('Error watching position', err);
          return;
        }
        callback(position);
      });
      return wait;
    } else {
      if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(callback, console.error, options);
        return watchId;
      } else {
        console.error('Geolocation not supported');
        return;
      }
    }
  }

  clearWatch(watchId: string | number) {
    if (Capacitor.isNativePlatform()) {
      Geolocation.clearWatch({ id: watchId as string });
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId as number);
      }
    }
  }

  getLastCurrentLocation(): Position {
    return this.lastCurrentLocation;
  }

  setLastCurrentPosition(position: Position) {
    this.currentPosition = position;
    this.lastCurrentLocation = position;
  }

  constructor(
    private geoLocationMockService: GeoLocationMockService,
    private alertService: AlertService
  ) { }

  getLastValidCurrentPosition(): Position {
    return this.currentPosition;
  }

  async getCurrentPosition() {
    try {
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        let perm = await Geolocation.requestPermissions();
        if (perm.location !== 'granted') {
          await this.alertService.presentAlert("Error: falta habilitar permiso para acceder a tu ubicación.", "Ubicación desactivada o permiso deshabilitado.", "Para poder utilizar esta app, permite que Iron Street acceda a tu ubicación. Dependiendo de tu dispositivo, es posible que debas abrir nuevamente la app después de habiliar el permiso.", ["OK (habilitarlo a continuación)"]);
          perm = await Geolocation.requestPermissions();
          if (perm.location !== 'granted') {
            return null;
          }
        }
      }
      const options = {
        maximumAge: 1500,
        timeout: 3000,
        enableHighAccuracy: true,
      };
      if (environment.mocking && this.mocking) {
        const coords: Position = await this.geoLocationMockService.getNextPosition();
        if (coords.coords.latitude === 0 && coords.coords.longitude === 0) {
          //console.log('Termino la simulacion');
          ((window as any).homePage as HomePage).cancelTripSimulation();
          const coordinates = await Geolocation.getCurrentPosition(options);
          return coordinates;
        } else {
          return coords;
        }
      } else {
        const coordinates = await Geolocation.getCurrentPosition(options);

        return coordinates;
      }

    } catch (e) {
      console.error('Error getting location', e);
      return null;
    }
  }

  calculateDistanceToNearestBboxEdge(userLocation: Point, bbox: [[number, number], [number, number]]) {
    const [[minLongitude, minLatitude], [maxLongitude, maxLatitude]] = bbox;

    // Create points for bbox corners
    const bottomLeft = point([minLongitude, minLatitude]);
    const bottomRight = point([maxLongitude, minLatitude]);
    const topLeft = point([minLongitude, maxLatitude]);
    const topRight = point([maxLongitude, maxLatitude]);

    // Calculate distances from the userLocation to each bbox corner
    // For simplicity, using corners, but you can also create lines for bbox edges and calculate accordingly
    const distances = [
      distance(userLocation, bottomLeft, { units: 'kilometers' }),
      distance(userLocation, bottomRight, { units: 'kilometers' }),
      distance(userLocation, topLeft, { units: 'kilometers' }),
      distance(userLocation, topRight, { units: 'kilometers' })
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
