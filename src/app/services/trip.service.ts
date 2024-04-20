import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import * as Navigation from 'navigation.js';
import { CurrentStep } from 'navigation.js';
import { HomePage } from '../pages/home/home.page';
import { GeoLocationService } from './geo-location.service';
import { MapService } from './map.service'; // Your MapService with updateUserMarker method
import { VoiceService } from './voice.service'; // Assuming you have a VoiceService for speaking instructions

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private userCurrentStep: number = 0; // Track the current step of the user
  private route: any; // Store the route information
  private lastDisplayedStep: number = -1; // Store the last displayed step

  constructor(
    private voiceService: VoiceService,
    private mapService: MapService,
    private geoLocationService: GeoLocationService) { }
  private locationInterval: any; // Store the interval ID for location monitoring

  startTrip(route: any): void {
    this.route = route; // Store the route information
    this.lastDisplayedStep = -1; // Initialize last displayed step
    this.userCurrentStep = 0; // Initialize user's current step
    this.monitorLocation(); // Start monitoring user's location
  }

  async monitorLocation(): Promise<void> {
    // Periodically check user's location and update current step
    this.locationInterval = setInterval(() => {
      const Navigation: any = require('navigation.js')({
        units: 'kilometres',
        maxReRouteDistance: 1,
        maxSnapToLocation: 0.2,
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
      const currentStep: CurrentStep = Navigation.getCurrentStep(userLocation, this.route, this.userCurrentStep);
      if (currentStep.step === this.userCurrentStep && this.userCurrentStep === 0 && this.lastDisplayedStep === -1) {
        this.displayInstructions(currentStep);
        this.userCurrentStep = currentStep.step;
        this.mapService.lockCameraAtUserPosition(userLocation, currentStep.step);
      }
      if (currentStep.step > this.userCurrentStep) {
        this.displayInstructions(currentStep);
        this.userCurrentStep = currentStep.step;
        this.mapService.lockCameraAtUserPosition(userLocation, currentStep.step);
      }
      const shouldReRoute: boolean = currentStep.distance > 1; // Adjust threshold as needed

      // Display instructions for current step if needed
      if (shouldReRoute) this.reroute(); // Reroute if user is far away from the route

      const stepCompleted = currentStep.distance <= 0.01; // Adjust threshold as needed
      if (stepCompleted && currentStep.step >= this.route.steps.length - 1) {
        this.finishTrip();
      }

    }, 1000); // Check every 5 seconds (adjust interval as needed)
  }

  async displayInstructions(currentStep: CurrentStep): Promise<void> {
    // Display instructions based on current step
    const step: any = this.route.steps[currentStep.step];
    const tripStepDetails = document.getElementById("tripStepDetails");
    if (tripStepDetails) {
      this.lastDisplayedStep = currentStep.step;
      let icon: string = step.maneuver.modifier ? step.maneuver.modifier.replace(/\s+/g, '-').toLowerCase() : step.maneuver.type.replace(/\s+/g, '-').toLowerCase();

      if (['arrive', 'depart', 'waypoint'].includes(step.maneuver.type)) {
        icon = step.maneuver.type;
      }

      if (step.maneuver.type === 'roundabout' || step.maneuver.type === 'rotary') {
        icon = 'roundabout';
      }
      tripStepDetails.style.display = "block";
      ((window as any).homePage as HomePage).currentManeuver = this.route.steps[currentStep.step].maneuver.instruction;
      ((window as any).homePage as HomePage).currentManeuvreIcon = icon;
    }

    const voiceInstructions = this.route.steps[currentStep.step].maneuver.instruction;
    await this.voiceService.speak(voiceInstructions);
  }

  async reroute(): Promise<void> {
    // Reroute user if they are far away from the route
    await this.voiceService.speak("Ajustando ruta...");
    // Call your rerouting logic here

  }

  async finishTrip(): Promise<void> {
    // Cancel the trip and stop monitoring user's location
    clearInterval(this.locationInterval);
    await this.voiceService.speak("Ha llegado a su destino.");
    ((window as any).homePage as HomePage).cancelTrip(); // Your MapService with cancelTrip method
    this.lastDisplayedStep = -1; // Reset last displayed step
    this.userCurrentStep = 0; // Reset user's current step
  }

  async cancelTrip(): Promise<void> {
    // Cancel the trip and stop monitoring user's location
    if (this.locationInterval) clearInterval(this.locationInterval);
    this.lastDisplayedStep = -1; // Reset last displayed step
    this.userCurrentStep = 0; // Reset user's current step
    this.route = null; // Reset route information
  }

}
