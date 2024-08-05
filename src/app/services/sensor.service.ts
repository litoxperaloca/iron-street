import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import { RotationRate } from '@capacitor/motion';
//import * as turf from '@turf/turf';
import KalmanFilter from 'kalmanjs';
//import { MapboxGeoJSONFeature } from 'mapbox-gl';
import bearing from '@turf/bearing';
import { point } from '@turf/helpers';
import { MapboxGeoJSONFeature } from 'mapbox-gl';
import { MapService } from './map.service';


interface SensorData {
  latitude: number;
  longitude: number;
  oldLatitude: number;
  oldLongitude: number;
  heading: number; // from compass
  compassHeading: number; // from compass
  compassHeadingCalc: number; // calculated from old and new position
  speed?: number; // could be derived from accelerometer or geolocation.coords.speed
  acceleration?: {
    x: number;
    y: number;
    z: number;
  };
  rotation?: {
    alpha: number; // rotation around z-axis (compass)
    beta: number;  // rotation around x-axis (pitch)
    gamma: number; // rotation around y-axis (roll)
  };
  headingAbs: number; // calculated from old and new position
  snapLatitude: number;
  snapLongitude: number;
  closestPoint: any;
  closestStreetFeatureLine: MapboxGeoJSONFeature;
}


@Injectable({
  providedIn: 'root'
})
export class SensorService {

  constructor(private mapService: MapService) { }

  private sensorData: SensorData = {
    latitude: 0,
    longitude: 0,
    oldLatitude: 0,
    oldLongitude: 0,
    heading: 0,
    compassHeading: 0,
    compassHeadingCalc: 0,
    acceleration: { x: 0, y: 0, z: 0 },
    rotation: { alpha: 0, beta: 0, gamma: 0 },
    headingAbs: 0,
    snapLatitude: 0,
    snapLongitude: 0,
    closestPoint: { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { dist: 0, index: 0, location: 0 } },
    closestStreetFeatureLine: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [[0, 0], [0, 0]]
      },
      id: '',
      layer: { id: '', type: 'line', source: '', layout: {}, paint: {} },
      source: '',
      sourceLayer: '',
      state: { selected: false },
      //_vectorTileFeature: undefined,
      //_x: 0,
      //_y: 0,
      //_z: 0,
      //toJSON: function ():any {
      //  throw new Error('Function not implemented.');
      //}
    }


  };

  private kalmanFilter = new KalmanFilter({ R: 0.01, Q: 3 });
  getSensorSnapLatitude(): number { return this.sensorData.snapLatitude; }
  getSensorSnapLongitude(): number { return this.sensorData.snapLongitude; }
  getSensorLatitude() { return this.sensorData.latitude; }
  getSensorLongitude() { return this.sensorData.longitude; }
  getSensorHeading() { return this.sensorData.heading; }
  getSensorSpeed(): number | undefined { return this.sensorData.speed; }
  getSensorAcceleration() { return this.sensorData.acceleration; }
  getSensorRotation() { return this.sensorData.rotation; }
  getSensorRotationHead() { return this.sensorData.compassHeadingCalc; }
  getSensorHeadingAbs() { return this.sensorData.headingAbs; }
  getSensorClosestPoint() { return this.sensorData.closestPoint; }
  getSensorClosestStreetFeatureLine() { return this.sensorData.closestStreetFeatureLine; }

  getCalculatedBearing() {
    if (this.sensorData.oldLatitude !== 0) {
      const upstreamPoint = point([this.sensorData.oldLongitude, this.sensorData.oldLatitude]);
      const downstreamPoint = point([this.sensorData.longitude, this.sensorData.latitude]);
      const bearings = bearing(upstreamPoint, downstreamPoint)
      return bearings;
    }
    return 0;
  }



  updateHeadingAbs(heading: number) {
    //this.sensorData.headingAbs = this.convertCWtoCCW(heading);
    this.sensorData.headingAbs = (heading * -1) + 360;
    ((window as any).mapService as MapService).updateMarkerRotation(this.sensorData.headingAbs);
  }


  updateGeolocation(position: Position) {
    // const smoothedLat = this.kalmanFilter.filter(position.coords.latitude);
    //const smoothedLng = this.kalmanFilter.filter(position.coords.longitude);
    const smoothedLat = (position.coords.latitude);
    const smoothedLng = (position.coords.longitude);
    this.sensorData.oldLatitude = this.sensorData.latitude;
    this.sensorData.oldLongitude = this.sensorData.longitude;
    const smoothedPosition: Position = {
      coords: {
        latitude: smoothedLat,
        longitude: smoothedLng,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed
      },
      timestamp: position.timestamp
    };
    this.sensorData.latitude = smoothedPosition.coords.latitude;
    this.sensorData.longitude = smoothedPosition.coords.longitude;
    if (smoothedPosition.coords.heading) this.sensorData.heading = smoothedPosition.coords.heading;
    /*if (smoothedPosition.coords.speed) this.sensorData.speed = smoothedPosition.coords.speed;
    this.updateMapMarker();*/
  }

  updateCompass(heading: number) {
    const filteredHeading = this.kalmanFilter.filter(heading);
    this.sensorData.compassHeading = filteredHeading;
  }

  updateRotation(rotation: RotationRate) {
    this.sensorData.rotation = rotation;
  }

  updateAcceleration(acceleration: DeviceMotionEventAcceleration) {
    if (acceleration) {
      if (acceleration.x && this.sensorData.acceleration) this.sensorData.acceleration.x = acceleration.x;
      if (acceleration.y && this.sensorData.acceleration) this.sensorData.acceleration.y = acceleration.y;
      if (acceleration.z && this.sensorData.acceleration) this.sensorData.acceleration.z = acceleration.z;
    }
    /*this.updateMapMarker();*/ // Optionally update the marker based on acceleration
  }

  updateSpeedFromAcceleration() {
    if (this.sensorData.acceleration && this.sensorData.speed !== undefined) {
      // Assuming the last update was 1 second ago, simple physics formula: v = u + at
      const deltaT = 1; // time in seconds since last update
      const accelerationMagnitude = Math.sqrt(
        this.sensorData.acceleration.x ** 2 +
        this.sensorData.acceleration.y ** 2 +
        this.sensorData.acceleration.z ** 2
      );
      this.sensorData.speed += accelerationMagnitude * deltaT;
    }
  }

  updateSnapToRoadPosition(coordinates: number[], feature: MapboxGeoJSONFeature, nearestPoint: any, useStreetHeading:boolean,userMoved:boolean) {
    this.sensorData.snapLatitude = coordinates[1];
    this.sensorData.snapLongitude = coordinates[0];
    this.sensorData.closestStreetFeatureLine = feature;
    this.sensorData.closestPoint = nearestPoint;
    ((window as any).mapService as MapService).updateUserMarkerSnapedPosition(useStreetHeading,userMoved);
  }

  getLastCurrentLocationPredicted(): [number, number] {
    if (this.sensorData.snapLatitude != 0 && this.sensorData.snapLongitude != 0) return [this.sensorData.snapLongitude, this.sensorData.snapLatitude];
    if (this.sensorData.snapLatitude != 0 && this.sensorData.snapLongitude != 0) return [this.sensorData.longitude, this.sensorData.latitude];
    return [this.getSensorLongitude(), this.getSensorLatitude()];
  }



}
