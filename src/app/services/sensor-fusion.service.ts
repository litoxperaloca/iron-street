// src/app/services/sensor-manager.service.ts
import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import * as Motion from '@capacitor/motion/dist/esm/index';
import KalmanFilter from 'kalmanjs';

@Injectable({
  providedIn: 'root'
})
export class SensorFusionService {
  private kfLat = new KalmanFilter();
  private kfLon = new KalmanFilter();
  private kfHeading = new KalmanFilter();
  private locationUpdateInterval: any;
  private orientationUpdateInterval: any;

  constructor() { }

  async startLocationTracking(callback: (position: Position) => void): Promise<void> {
    Geolocation.watchPosition({ maximumAge: 0, enableHighAccuracy: true }, (position, err) => {
      this.locationUpdateInterval = setInterval(async () => {

        if (!err && position) {
          const filteredLat = this.kfLat.filter(position.coords.latitude);
          const filteredLon = this.kfLon.filter(position.coords.longitude);
          const filterpos: Position = {
            coords: {
              latitude: filteredLat,
              longitude: filteredLon,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
            },
            timestamp: position.timestamp
          };

          callback(filterpos);
        } else {
          console.error('GPS Error:', err);
        }
      }, 3000); // Update every 3000 milliseconds
    });
  }

  async startOrientationTracking(callback: (heading: number) => void): Promise<void> {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      const permission = await (DeviceMotionEvent as any).requestPermission();
      if (permission === 'granted') {
        this.orientationUpdateInterval = setInterval(() => {

          Motion.Motion.addListener('orientation', (event) => {
            //const filteredHeading = this.kfHeading.filter(event.alpha);
            const filteredHeading = this.calculateEffectiveAlpha(event.alpha, event.beta, event.gamma);

            callback(filteredHeading);
          });
        }, 3000); // Update every 3000 milliseconds
      } else {
        console.error('Orientation permission not granted');
      }
    } else {
      this.orientationUpdateInterval = setInterval(() => {

        Motion.Motion.addListener('orientation', (event) => {
          //const filteredHeading = this.kfHeading.filter(event.alpha);
          event.alpha.toFixed(3);
          const filteredHeading = this.calculateEffectiveAlpha(event.alpha, event.beta, event.gamma);

          callback(filteredHeading);
        });
      }, 3000); // Update every 3000 milliseconds

    }

  }

  correctAlphaForTilt(alpha: number, beta: number, gamma: number): number {
    // Convert degrees to radians
    const alphaRad = alpha * Math.PI / 180;
    const betaRad = beta * Math.PI / 180;
    const gammaRad = gamma * Math.PI / 180;

    // Calculate the corrected alpha using trigonometric corrections
    const correctedAlpha = Math.atan2(
      Math.sin(alphaRad) * Math.cos(betaRad) * Math.cos(gammaRad) +
      Math.sin(betaRad) * Math.sin(gammaRad),
      Math.cos(alphaRad) * Math.cos(betaRad)
    );

    // Convert radians back to degrees
    return (correctedAlpha * 180 / Math.PI + 360) % 360;

  }


  calculateEffectiveAlpha(alpha: number, beta: number, gamma: number) {
    // Convert degrees to radians for computation
    const alphaRad = alpha * (Math.PI / 180);
    const betaRad = beta * (Math.PI / 180);
    const gammaRad = gamma * (Math.PI / 180);

    // Calculate rotation matrix components
    const ca = Math.cos(alphaRad);
    const sa = Math.sin(alphaRad);
    const cb = Math.cos(betaRad);
    const sb = Math.sin(betaRad);
    const cg = Math.cos(gammaRad);
    const sg = Math.sin(gammaRad);

    // Construct the rotation matrix using the ZYX order
    const matrix = [
      [ca * cb, ca * sb * sg - sa * cg, ca * sb * cg + sa * sg],
      [sa * cb, sa * sb * sg + ca * cg, sa * sb * cg - ca * sg],
      [-sb, cb * sg, cb * cg]
    ];

    // Assuming North is along the first column of a fixed Earth reference
    // Calculate the angle between the projection on the ground plane (x1, y1)
    const x1 = matrix[0][0];
    const y1 = matrix[1][0];

    let effectiveAlpha = Math.atan2(y1, x1); // Returns angle in radians
    effectiveAlpha = effectiveAlpha * (180 / Math.PI); // Convert to degrees
    effectiveAlpha = (effectiveAlpha + 360) % 360; // Normalize to [0, 360]

    return effectiveAlpha;
  }

  setHeadingWatch() {
    if (window.DeviceOrientationEvent) {
      // Listen for the deviceorientation event and handle the raw data
      window.addEventListener('deviceorientation', function (eventData) {
        var compassdir;

        if (eventData && (eventData as any).webkitCompassHeading) {
          // Apple works only with this, alpha doesn't work
          (window as any)['heading'] = (eventData as any).webkitCompassHeading;
        }
        else (window as any)['heading'] = eventData && eventData.alpha;
      });
    }
  }

}
