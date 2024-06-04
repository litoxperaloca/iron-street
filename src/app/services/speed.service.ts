import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import { NearestPointOnLine } from '@turf/nearest-point-on-line';
import * as turf from '@turf/turf';
import { MapboxGeoJSONFeature } from 'mapbox-gl';
import { HomePage } from '../pages/home/home.page';
import { GeoLocationService } from './geo-location.service';
import { MapService } from './map.service';
import { OsmService } from './osm.service';
import { SensorService } from './sensor.service';
import { WindowService } from './window.service';


@Injectable({
  providedIn: 'root',
})
export class SpeedService {
  lastPosition!: Position;
  lastCurrentMaxSpeed!: number;
  lastCurrentSpeed!: number;
  lastCurrentMaxSpeedOsmObj!: any;
  dataLoaded: boolean = false;

  constructor(private osmService: OsmService,
    private mapService: MapService,
    private geoLocationService: GeoLocationService,
    private windowService: WindowService,
    private sensorService: SensorService) {

  }

  convertSpeedToKmh(speed: number): number {
    return speed * 3.6; // Convert speed from meters per second to kilometers per hour
  }



  calculateBbox(latitude: number, longitude: number, radius: number): number[][] {
    // Calculate bounding box (bbox) for a given radius around the user's location
    const earthRadius = 6371; // Earth's radius in kilometers
    const latOffset = (radius / earthRadius) * (180 / Math.PI);
    const lonOffset = (radius / (earthRadius * Math.cos(Math.PI * latitude / 180))) * (180 / Math.PI);
    const bbox: number[][] = [
      [longitude - lonOffset, latitude - latOffset],
      [longitude + lonOffset, latitude + latOffset],
    ];
    return bbox;
  }

  private locationInterval: any; // Store the interval ID for location monitoring

  locationUpdate(): void {
    // Periodically check user's location and update current step
    const self = this;
    const userPosition: Position = ((window as any).geoLocationService as GeoLocationService).getLastCurrentLocation(); // Get user's current location
    if (userPosition == self.lastPosition) {
      //console.log("No hay cambio de posición");
      return;
    }
    self.lastPosition = userPosition;
    self.userStreet(userPosition);
    if ((window as any).mapService.userCurrentStreet && (window as any).mapService.userCurrentStreet.properties) {
      ((window as any).homePage as HomePage).currentMaxSpeed = Number.parseInt((window as any).mapService.userCurrentStreet.properties["maxspeed"]);
    }

  }



  userStreet(position: Position) {
    const self = this;
    const map = ((window as any).mapService as MapService).getMap();

    if (!position || !map.getLayer("maxspeedDataLayer")) {
      ((window as any).mapService as MapService).userCurrentStreet = null;
    } else {
      let longitude = position.coords.longitude;
      let latitude = position.coords.latitude;
      // Convert the user's coordinates to a point
      const coordinates = [longitude, latitude];
      const userPoint = turf.point(coordinates);
      const bbox = ((window as any).geoLocationService as GeoLocationService).createUserBoundingBox(position);
      // Query the rendered line features at the user's location
      const features = map.queryRenderedFeatures(undefined, { layers: ["maxspeedDataLayer"] })
      if (features.length > 0) {
        var closestFeature: MapboxGeoJSONFeature | null = null;
        var minDistance = Number.MAX_VALUE;
        // Iterate through all line features to find the closest one
        features.forEach(feature => {
          if (feature.layer.id === 'maxspeedDataLayer' && feature.geometry.type === 'LineString') {
            //console.log("Feature:", feature);
            const line = turf.lineString(feature.geometry.coordinates);
            const distance = turf.pointToLineDistance(userPoint, line);
            const pointInLine = turf.nearestPointOnLine(line, userPoint);
            const distancePoints: number = turf.distance(pointInLine, userPoint, { units: 'kilometers' });

            if (distancePoints < minDistance && distancePoints < 1) {
              minDistance = distancePoints;
              closestFeature = feature;
            }
          }
        });

        ((window as any).mapService as MapService).userCurrentStreet = closestFeature;
        const cF: MapboxGeoJSONFeature | null = ((window as any).mapService as MapService).userCurrentStreet;
        if (cF != null && cF.geometry && cF.geometry.type == 'LineString' && cF.geometry.coordinates && cF.geometry.coordinates.length > 0) {
          const nearestPoint: NearestPointOnLine = turf.nearestPointOnLine(turf.lineString(cF.geometry.coordinates), userPoint);
          ((window as any).sensorService as SensorService).updateSnapToRoadPosition(nearestPoint.geometry.coordinates, cF, nearestPoint)
        }
      }
    }
  }

}
