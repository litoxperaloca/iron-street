import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import * as Navigation from 'navigation.js';
import { GeoLocationService } from './geo-location.service';
import { MapService } from './map.service'; // Your MapService with updateUserMarker method
import { VoiceService } from './voice.service'; // Assuming you have a VoiceService for speaking instructions

@Injectable({
  providedIn: 'root'
})
export class IntersectionService {
  private userCurrentGometryIndex: number = 0; // Track the current step of the user
  private route: any; // Store the route information
  private lastDisplayedGometryIndex: number = -1; // Store the last displayed step
  private locationInterval: any; // Store the interval ID for location monitoring
  intersections: any[] = [];

  constructor(
    private voiceService: VoiceService,
    private mapService: MapService,
    private geoLocationService: GeoLocationService) { }

  startTrip(route: any): void {
    this.route = route; // Store the route information
    this.lastDisplayedGometryIndex = 0; // Initialize last displayed step
    this.userCurrentGometryIndex = 0; // Initialize user's current step
    (this.route.steps as any[]).forEach(step => {
      (step.intersections as any[]).forEach(intersection => {
        this.intersections.push(intersection);
      });
    });
    //this.monitorLocation(); // Start monitoring user's location
  }

  async monitorLocation(): Promise<void> {
    // Periodically check user's location and update current step
    this.locationInterval = setInterval(() => {
      const Navigation: any = require('navigation.js')({
        units: 'kilometres',
        maxReRouteDistance: 0.5,
        maxSnapToLocation: 0.01,
        warnUserTime: 7
      }); // Import the navigation.js module

      const userPosition: Position = ((window as any).geoLocationService as GeoLocationService).getLastCurrentLocation(); // Get user's current location
      const userLocation: Navigation.UserLocation = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [userPosition.coords.longitude, userPosition.coords.latitude]
        }
      };

    }, 2000); // Check every 5 seconds (adjust interval as needed)
  }
}
