import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import * as turf from '@turf/turf';
import * as Navigation from 'navigation.js';
import { CurrentStep } from 'navigation.js';
import { HomePage } from '../pages/home/home.page';
import { GeoLocationService } from './geo-location.service';
import { MapService } from './map.service'; // Your MapService with updateUserMarker method
import { VoiceService } from './voice.service'; // Assuming you have a VoiceService for speaking instructions
import { WindowService } from './window.service';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private userCurrentStep: number = 0; // Track the current step of the user
  private route: any; // Store the route information
  private lastDisplayedStep: number = -1; // Store the last displayed step

  private lastUserPosition!: Position; // Store the last known user position
  // Import the navigation.js module
  constructor(
    private voiceService: VoiceService,
    private mapService: MapService,
    private windowService: WindowService) { }



  locationUpdate(tripIsStarting: boolean): void {

    const Navigation: any = require('navigation.js')({
      units: 'kilometres',
      maxReRouteDistance: 1,
      maxSnapToLocation: 0.4,
      warnUserTime: 12
    });
    // Periodically check user's location and update current step
    const userPosition: Position = ((window as any).geoLocationService as GeoLocationService).getLastCurrentLocation(); // Get user's current location
    if (!tripIsStarting && userPosition == this.lastUserPosition) {
      //console.log("No hay cambio de posición");
      return;
    }
    this.lastUserPosition = userPosition;
    const userLocation: Navigation.UserLocation = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [userPosition.coords.longitude, userPosition.coords.latitude]
      }
    };
    let totalTripDistance: number = this.route.distance;
    let currentDistance: number = 0;
    if (this.mapService.destinationPlace.geometry) {
      currentDistance = turf.distance([userPosition.coords.longitude, userPosition.coords.latitude], this.mapService.destinationPlace.geometry.point, { units: "meters" });

    }
    ((window as any).homePage as HomePage).tripProgressIndex = 1 - currentDistance / totalTripDistance;
    const currentStep: CurrentStep = Navigation.getCurrentStep(userLocation, this.route, this.userCurrentStep);
    if (currentStep.step === this.userCurrentStep && this.userCurrentStep === 0 && this.lastDisplayedStep === -1) {
      this.displayInstructions(currentStep);
      this.userCurrentStep = currentStep.step;
      //this.mapService.lockCameraAtUserPosition(userLocation, currentStep.step);
      this.mapService.setCameraPOVPosition(userPosition);
    }
    if (currentStep.step > this.userCurrentStep) {
      this.displayInstructions(currentStep);
      this.userCurrentStep = currentStep.step;
      //this.mapService.lockCameraAtUserPosition(userLocation, currentStep.step);
      this.mapService.setCameraPOVPosition(userPosition);
    }
    const shouldReRoute: boolean = currentStep.distance > 1; // Adjust threshold as needed

    // Display instructions for current step if needed
    if (shouldReRoute) this.reroute(); // Reroute if user is far away from the route

    const stepCompleted = currentStep.distance <= 0.15; // Adjust threshold as needed
    if (stepCompleted && currentStep.step >= this.route.steps.length - 1) {
      this.finishTrip();
    }
  }

  startTrip(route: any): void {
    ((window as any).homePage as HomePage).tripProgressIndex = 0;

    this.route = route; // Store the route information
    this.lastDisplayedStep = -1; // Initialize last displayed step
    this.userCurrentStep = 0; // Initialize user's current step
    //this.monitorLocation(); // Start monitoring user's location
    this.locationUpdate(true);
  }


  async displayInstructions(currentStep: CurrentStep): Promise<void> {
    // Display instructions based on current step
    const step: any = this.route.steps[currentStep.step];

    const tripStepDetails = document.getElementById("tripStepDetails");
    if (tripStepDetails) {
      this.lastDisplayedStep = currentStep.step;
      const icon: string = this.maneurveIcon(step);
      /*const poste = document.getElementById("poste");
      if (poste) { poste.style.display = "block"; }*/
      tripStepDetails.style.display = "block";
      /*const instructions = document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLElement;
      if (instructions) instructions.style.display = "block";*/
      const progress = document.getElementById("tripProgress");
      if (progress) { progress.style.display = "block"; }
      ((window as any).homePage as HomePage).currentManeuver = this.route.steps[currentStep.step].maneuver.instruction;
      ((window as any).homePage as HomePage).currentManeuvreIcon = icon;
      const voiceInstructions = this.route.steps[currentStep.step].maneuver.instruction;
      await this.voiceService.speak(voiceInstructions);
    }


    let nextStep: any = null;
    let stepNext: any = null;
    let iconNext: string;
    let tripStepDetailsNext: HTMLElement | null = document.getElementById("tripStepDetails");
    if (this.route && this.route.steps && this.route.steps.length > currentStep.step) {
      const nextStepIndex = currentStep.step + 1;
      nextStep = this.route.steps[nextStepIndex];
      stepNext = this.route.steps[nextStep.step];
      if (stepNext && stepNext.maneuver) {
        iconNext = this.maneurveIcon(stepNext);
        ((window as any).homePage as HomePage).nextManeuver = this.route.steps[nextStep.step].maneuver.instruction;
        ((window as any).homePage as HomePage).nextManeuvreIcon = iconNext;

        if (tripStepDetails) setTimeout(() => {
          tripStepDetails.style.display = "none";
        }, 2500); // Adjust delay as needed

        if (tripStepDetailsNext) {
          const time1: any = setTimeout(async () => {
            tripStepDetailsNext.style.display = "block";
            const voiceInstructionsNext = this.route.steps[nextStep.step].maneuver.instruction;
            await this.voiceService.speak(voiceInstructionsNext);
            tripStepDetailsNext.style.display = "none";
          }, 1500); // Adjust delay as needed}
          this.windowService.attachedTimeOut("home", "tripservice_1", time1);
        }

      } else {
        const time3: any = setTimeout(() => {
          if (tripStepDetails) tripStepDetails.style.display = "none";
        }, 1500); // Adjust delay as needed
        this.windowService.attachedTimeOut("home", "tripservice_2", time3);
      }


    } else {
      await this.finishTrip();
      const time2: any = setTimeout(() => {

        if (tripStepDetails) tripStepDetails.style.display = "none";
      }, 1500); // Adjust delay as needed
      this.windowService.attachedTimeOut("home", "tripservice_2", time2);

    }
  }

  maneurveIcon(step: any): string {
    //console.log(step);
    let icon: string = step.maneuver.modifier ? step.maneuver.modifier.replace(/\s+/g, '-').toLowerCase() : step.maneuver.type.replace(/\s+/g, '-').toLowerCase();

    if (['arrive', 'depart', 'waypoint'].includes(step.maneuver.type)) {
      icon = step.maneuver.type;
    }

    if (step.maneuver.type === 'roundabout' || step.maneuver.type === 'rotary') {
      icon = 'roundabout';
    }
    return icon;
  }

  async reroute(): Promise<void> {
    // Reroute user if they are far away from the route
    //this.voiceService.speak("Ajustando ruta...");
    // Call your rerouting logic here

  }

  async finishTrip(): Promise<void> {
    // Cancel the trip and stop monitoring user's location
    this.voiceService.speak("Ha llegado a su destino.");
    ((window as any).homePage as HomePage).cancelTrip(); // Your MapService with cancelTrip method
    this.lastDisplayedStep = -1; // Reset last displayed step
    this.userCurrentStep = 0; // Reset user's current step
    const instructions = document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLElement;
    if (instructions) instructions.style.display = "none";
  }

  async cancelTrip(): Promise<void> {
    // Cancel the trip and stop monitoring user's location
    this.lastDisplayedStep = -1; // Reset last displayed step
    this.userCurrentStep = 0; // Reset user's current step
    this.route = null; // Reset route information
    const instructions = document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLElement;
    if (instructions) instructions.style.display = "none";
  }

}
