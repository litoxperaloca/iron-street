import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import { HomePage } from '../pages/home/home.page';
import { GeoLocationService } from './geo-location.service';
import { MapService } from './map.service'; // Your MapService with updateUserMarker method
import { WindowService } from './window.service';
import { MapboxService } from './mapbox.service';
import { Subject } from 'rxjs';
import { TrafficAlertService } from './traffic-alert-service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TripService {
   route: any = null; // La ruta seleccionada para el viaje
   currentStepIndex: number = 0; // Índice del paso actual
   tripProgress: number = 0; // Progreso del viaje en porcentaje
   tripDistance: number = 0; // Distancia total de la ruta
   alerts$: Subject<string> = new Subject<string>(); // Canal para enviar alertas de navegación
   preannouncedManeuvers = new Set<number>(); // Set de maniobras ya anunciadas
   announcedManeuvers = new Set<number>(); // Set de maniobras ya anunciadas
   lastUserPositionMonitored:Position|null = null;
  
  constructor(
    private mapboxService: MapboxService, 
    private mapService:MapService,
    private geoLocationService:GeoLocationService,
    private trafficAlertService: TrafficAlertService
  
  ) {}

  // Iniciar un nuevo viaje con una ruta específica
  startTrip(route: any) {
    this.route = route;
    this.currentStepIndex = 0;
    this.tripProgress=0;
    this.tripDistance = this.calculateTotalDistance();
    this.preannouncedManeuvers.clear();
    this.announcedManeuvers.clear();
    const userPosition: Position = ((window as any).geoLocationService as GeoLocationService).getLastCurrentLocation(); // Get user's current location
    this.currentStepIndex=0;  

    this.announceManeuver(this.route.legs[0].steps[0]);
    this.currentStepIndex=1;  

    this.lastUserPositionMonitored=userPosition;
    this.mapService.setCameraPOVPosition(userPosition);

  }

  async locationUpdate(tripIsSimulation: boolean,userPosition:Position): Promise<void> {
    if (userPosition == this.lastUserPositionMonitored) {
      //console.log("No hay cambio de posición");
      return;
    }
    this.lastUserPositionMonitored=userPosition;
    const stepCount=this.route.legs[0].steps.length;
    if(this.currentStepIndex>0 && this.currentStepIndex<stepCount-1){
      this.updateUserPosition([userPosition.coords.longitude,userPosition.coords.latitude]);
      return;
    }
    if(this.currentStepIndex>0 && this.currentStepIndex==stepCount-1){
      if(this.announcedManeuvers.has(this.currentStepIndex)){
        this.endTrip();
        return;  
      }else{
        this.updateUserPosition([userPosition.coords.longitude,userPosition.coords.latitude]);
      }
    }
  }

  // Actualizar la posición del usuario
  private updateUserPosition(coords: any) {
    // Verificar si el usuario está desviado de la ruta
    const closestStepIndex = this.findClosestStepIndex(coords);
    const distanceToClosestStep = this.mapboxService.calculateDistance(
      coords,
      this.route.legs[0].steps[closestStepIndex].maneuver.location
    );
    let distanceToCurrentStep:number|null=null;
    if (closestStepIndex > this.currentStepIndex && distanceToClosestStep <= environment.tripserviceConf.stepIntroMinDistance) {
      this.currentStepIndex = closestStepIndex;
    } else {
      distanceToCurrentStep = this.mapboxService.calculateDistance(
        coords,
        this.route.legs[0].steps[this.currentStepIndex].maneuver.location
      );

      if (distanceToCurrentStep > environment.tripserviceConf.deviationThreshold) {
        //this.recalculateRoute(coords);
       // return;
      }
    }

    const currentStep = this.route.legs[0].steps[this.currentStepIndex];
    if(!distanceToCurrentStep){
      distanceToCurrentStep = this.mapboxService.calculateDistance(
                                coords,
                                currentStep.maneuver.location
                              );
    }
    this.updateTripProgress(coords,distanceToCurrentStep,this.currentStepIndex);
    this.preAnnounceManeuver(distanceToCurrentStep, currentStep);
    if (distanceToCurrentStep < this.getAnnouncementDistance(currentStep.maneuver.type)) {
      this.announceManeuver(currentStep);
      this.currentStepIndex++; 
    }
  }

  // Calcular la distancia total de la ruta
  private calculateTotalDistance(): number {
    return this.route.distance;
  }

  async preAnnounceManeuver(distance: number, step: any) {
    const maneuverConfig = this.getManeuverConfig(step.maneuver.type);
    if (maneuverConfig && 
      maneuverConfig.preAnnounce && 
      distance < maneuverConfig.preAnnouncementDistance &&       
      !this.preannouncedManeuvers.has(this.currentStepIndex)
    ) {
      let preAnnouncement = maneuverConfig.preAnnouncement
        .replace('{distance}', Math.round(distance).toString())
        .replace('{modifier}', step.maneuver.modifier)
        .replace('{instruction}', step.maneuver.instruction);
      
      this.alerts$.next(preAnnouncement);
      this.preannouncedManeuvers.add(this.currentStepIndex);
      this.trafficAlertService.showAlert(preAnnouncement,"maneuver",this.maneurveIcon(step),true);

    }
  }

  async announceManeuver(step: any) {
    const maneuverConfig = this.getManeuverConfig(step.maneuver.type);
    if (maneuverConfig && 
      maneuverConfig.announce &&
      !this.announcedManeuvers.has(this.currentStepIndex)) {
        let announcement = maneuverConfig.announcement
          .replace('{modifier}', step.maneuver.modifier)
          .replace('{instruction}', step.maneuver.instruction);
        /*if (step.maneuver.type === 'continue') {
          const nextStep = this.route.legs[0].steps[this.currentStepIndex + 1];
          const distanceToNextStep = this.mapboxService.calculateDistance(
            step.maneuver.location,
            nextStep.maneuver.location
          );
          announcement = announcement.replace('{distanceToNextStep}', Math.round(distanceToNextStep).toString());
        }*/

        this.alerts$.next(announcement);
        this.announcedManeuvers.add(this.currentStepIndex);
        this.trafficAlertService.showAlert(announcement,"maneuver",this.maneurveIcon(step),true);
        /*if(step.maneuver.type==="arrive"){
          this.currentStepIndex = this.route.legs[0].steps.length
        }*/
    }
  }

  private getAnnouncementDistance(type: string): number {
    const maneuverConfig = this.getManeuverConfig(type);
    return maneuverConfig ? maneuverConfig.announcementDistance : 50;
  }

  private getManeuverConfig(type: string) {
    return environment.tripserviceConf.maneuvers.find(m => m.maneuverType === type);
  }


  // Calcular la distancia restante sumando las distancias de los steps restantes
  private calculateRemainingDistance(coords: [number,number],offset:number,stepIndex:number): number {
    let remainingDistance = offset;
    if(stepIndex<this.route.legs[0].steps.length-2){

    }
    for (let i = stepIndex+1; i < this.route.legs[0].steps.length; i++) {
      /*remainingDistance += this.mapboxService.calculateDistance(
        coords,
        this.route.legs[0].steps[i].maneuver.location
      );*/
      remainingDistance+=this.route.legs[0].steps[i].distance;
    }
    return remainingDistance;
  }

  // Actualizar el progreso del viaje
  private updateTripProgress(coords: any, distanceToCurrentStep:number, stepIndex:number) {
    const totalDistance = this.calculateTotalDistance();
    /*const distanceCovered = this.mapboxService.calculateDistance(
      this.route.legs[0].steps[0].maneuver.location,
      coords
    );*/
    const remainingDistance  = this.calculateRemainingDistance(coords,distanceToCurrentStep,stepIndex)
    //this.tripProgress = (distanceCovered / totalDistance) * 100;
    const distanceCovered = totalDistance-remainingDistance;
    this.tripProgress = (distanceCovered / totalDistance) * 100;
    //console.log(this.tripProgress);
    //console.log(distanceCovered);
    //console.log(totalDistance);
    ((window as any).homePage as HomePage).tripProgressIndex = 1 * this.tripProgress/100;

  }

  // Anunciar llegada al destino
  private announceArrival() {
    this.alerts$.next('Ha llegado a su destino.');
    this.trafficAlertService.showAlert('Ha llegado a su destino.',"maneuver",'',true);

  }

  // Finalizar el viaje y limpiar recursos
  endTrip() {
    ((window as any).homePage as HomePage).cancelTrip(); // Your MapService with cancelTrip method
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

   cancelTrip(): void {
    //Geolocation.clearWatch();
    this.route = null;
    this.currentStepIndex = 0;
    this.tripProgress = 0;
    this.lastUserPositionMonitored=null;
    this.tripDistance = 0;
    this.preannouncedManeuvers.clear();
    this.announcedManeuvers.clear();
    /*const instructions = document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLElement;
    if (instructions) instructions.style.display = "none";*/
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
    return this.currentStepIndex == this.route.legs[0].steps.length - 1;
  }

  private lastStepFinished(): boolean {
    return this.currentStepIndex >= this.route.legs[0].steps.length;
  }

  // Obtener el observable de alertas
  getAlerts() {
    return this.alerts$.asObservable();
  }
}