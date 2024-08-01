import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import { HomePage } from '../pages/home/home.page';
import { GeoLocationService } from './geo-location.service';
import { MapService } from './map.service'; // Your MapService with updateUserMarker method
import { WindowService } from './window.service';
import { MapboxService } from './mapbox.service';
import { Subject } from 'rxjs';
import { TrafficAlertServiceService } from './traffic-alert-service.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TripService {
  private route: any = null; // La ruta seleccionada para el viaje
  private currentStepIndex: number = 0; // Índice del paso actual
  private tripProgress: number = 0; // Progreso del viaje en porcentaje
  private tripDistance: number = 0; // Distancia total de la ruta
  private alerts$: Subject<string> = new Subject<string>(); // Canal para enviar alertas de navegación
  private announcedManeuvers = new Set<number>(); // Set de maniobras ya anunciadas
  private lastUserPositionMonitored:Position|null = null;
  
  constructor(
    private mapboxService: MapboxService, 
    private mapService:MapService,
    private geoLocationService:GeoLocationService,
    private trafficAlertService: TrafficAlertServiceService
  
  ) {}

  // Iniciar un nuevo viaje con una ruta específica
  startTrip(route: any) {
    this.route = route;
    this.currentStepIndex = 0;
    this.tripDistance = this.calculateTotalDistance();
    this.announcedManeuvers.clear();
    this.locationUpdate(true);
  }

  locationUpdate(tripIsStarting: boolean): void {
    const userPosition: Position = ((window as any).geoLocationService as GeoLocationService).getLastCurrentLocation(); // Get user's current location
    if (!tripIsStarting && userPosition == this.lastUserPositionMonitored) {
      //console.log("No hay cambio de posición");
      return;
    }
    if(tripIsStarting && userPosition){
      this.mapService.setCameraPOVPosition(userPosition);
      this.announceManeuver(this.route.legs[0].steps[0]);
    }
    this.updateUserPosition([userPosition.coords.longitude,userPosition.coords.latitude]);
    this.lastUserPositionMonitored=userPosition;
  }

  // Actualizar la posición del usuario
  private updateUserPosition(coords: any) {
    // Verificar si el usuario está desviado de la ruta
    const closestStepIndex = this.findClosestStepIndex(coords);
    const distanceToClosestStep = this.mapboxService.calculateDistance(
      coords,
      this.route.legs[0].steps[closestStepIndex].maneuver.location
    );

    if (closestStepIndex > this.currentStepIndex && distanceToClosestStep < environment.tripserviceConf.deviationThreshold) {
      this.currentStepIndex = closestStepIndex;
    } else {
      const distanceToCurrentStep = this.mapboxService.calculateDistance(
        coords,
        this.route.legs[0].steps[this.currentStepIndex].maneuver.location
      );

      if (distanceToCurrentStep > environment.tripserviceConf.deviationThreshold) {
        this.recalculateRoute(coords);
        return;
      }
    }

    const currentStep = this.route.legs[0].steps[this.currentStepIndex];
    const distanceToNextStep = this.mapboxService.calculateDistance(
      coords,
      currentStep.maneuver.location
    );

    this.preAnnounceManeuver(distanceToNextStep, currentStep);

    if (distanceToNextStep < this.getAnnouncementDistance(currentStep.maneuver.type)) {
      this.announceManeuver(currentStep);
      if (currentStep.maneuver.type === 'arrive') {
        this.endTrip();
      } else {
        this.currentStepIndex++;
      }
    }

    this.updateTripProgress(coords);
  }

  // Calcular la distancia total de la ruta
  private calculateTotalDistance(): number {
    return this.route.distance;
  }

  private preAnnounceManeuver(distance: number, step: any) {
    const maneuverConfig = this.getManeuverConfig(step.maneuver.type);
    if (maneuverConfig && maneuverConfig.preAnnounce && distance < maneuverConfig.preAnnouncementDistance) {
      let preAnnouncement = maneuverConfig.preAnnouncement
        .replace('{distance}', Math.round(distance).toString())
        .replace('{modifier}', step.maneuver.modifier)
        .replace('{instruction}', step.maneuver.instruction);
      
      this.alerts$.next(preAnnouncement);
      this.announcedManeuvers.add(this.currentStepIndex);
      this.trafficAlertService.showAlert(preAnnouncement,"maneuver",this.maneurveIcon(step),true);

    }
  }

  private announceManeuver(step: any) {
    const maneuverConfig = this.getManeuverConfig(step.maneuver.type);
    if (maneuverConfig && maneuverConfig.announce) {
      let announcement = maneuverConfig.announcement
        .replace('{modifier}', step.maneuver.modifier)
        .replace('{instruction}', step.maneuver.instruction);
      
      if (step.maneuver.type === 'continue') {
        const nextStep = this.route.legs[0].steps[this.currentStepIndex + 1];
        const distanceToNextStep = this.mapboxService.calculateDistance(
          step.maneuver.location,
          nextStep.maneuver.location
        );
        announcement = announcement.replace('{distanceToNextStep}', Math.round(distanceToNextStep).toString());
      }

      this.alerts$.next(announcement);
      this.trafficAlertService.showAlert(announcement,"maneuver",this.maneurveIcon(step),true);

    }
  }

  private getAnnouncementDistance(type: string): number {
    const maneuverConfig = this.getManeuverConfig(type);
    return maneuverConfig ? maneuverConfig.announcementDistance : 50;
  }

  private getManeuverConfig(type: string) {
    return environment.tripserviceConf.maneuvers.find(m => m.maneuverType === type);
  }


  // Anunciar la próxima maniobra después de completar la actual
  private announceNextManeuver() {
    if (this.currentStepIndex < this.route.legs[0].steps.length - 1) {
      const nextStep = this.route.legs[0].steps[this.currentStepIndex];
      const maneuver:string=`A continuación, ${nextStep.maneuver.instruction}`;
    this.alerts$.next(maneuver);
    this.trafficAlertService.showAlert(maneuver,"maneuver",this.maneurveIcon(nextStep),true);
    }
  }

  // Actualizar el progreso del viaje
  private updateTripProgress(coords: any) {
    const totalDistance = this.calculateTotalDistance();
    const distanceCovered = this.mapboxService.calculateDistance(
      this.route.legs[0].steps[0].maneuver.location,
      coords
    );
    //this.tripProgress = (distanceCovered / totalDistance) * 100;
    this.tripProgress = (distanceCovered / totalDistance);
    ((window as any).homePage as HomePage).tripProgressIndex = 1 - this.tripProgress;

  }

  // Anunciar llegada al destino
  private announceArrival() {
    this.alerts$.next('Ha llegado a su destino.');
    this.trafficAlertService.showAlert('Ha llegado a su destino.',"maneuver",'',true);

  }

  // Finalizar el viaje y limpiar recursos
  private endTrip() {
    //Geolocation.clearWatch();
    this.route = null;
    this.currentStepIndex = 0;
    this.tripProgress = 0;
    this.alerts$.next('El viaje ha finalizado.');
    this.trafficAlertService.showAlert('El viaje ha finalizado.',"voiceAlertOnly",'',true);
    ((window as any).homePage as HomePage).cancelTrip(); // Your MapService with cancelTrip method
    const instructions = document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLElement;
    if (instructions) instructions.style.display = "none";
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

  async cancelTrip(): Promise<void> {
    // Cancel the trip and stop monitoring user's location
    this.announcedManeuvers = new Set<number>();
    this.currentStepIndex = 0; // Reset user's current step
    this.tripProgress = 0;
    this.tripDistance = 0;
    this.route = null; // Reset route information
    const instructions = document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLElement;
    if (instructions) instructions.style.display = "none";
  }

  // Encuentra el índice del paso más cercano al usuario
  private findClosestStepIndex(coords: any): number {
    let closestIndex = this.currentStepIndex;
    let minDistance = Infinity;

    this.route.legs[0].steps.forEach((step: any, index: number) => {
      const distance = this.mapboxService.calculateDistance(
        coords,
        step.maneuver.location
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  // Recalcular la ruta desde la ubicación actual
  async recalculateRoute(coords: any) {
   await this.mapboxService.getNewRoute(coords, this.route.waypoints).then((newRoute) => {
      this.route = newRoute;
      this.currentStepIndex = this.findClosestStepIndex(coords);
      this.alerts$.next('Recalculando ruta.');
      const alert = this.trafficAlertService.showAlert('Recalculando ruta.',"voiceAlertOnly",'',true);
      this.mapService.changeRoute(newRoute);
    });
  }

  // Verificar si es el último paso
  private isLastStep(): boolean {
    return this.currentStepIndex === this.route.legs[0].steps.length - 1;
  }

  // Obtener el observable de alertas
  getAlerts() {
    return this.alerts$.asObservable();
  }
}