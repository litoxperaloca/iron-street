import { EventEmitter, Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import { GeoLocationService } from './geo-location.service';
import { MapService } from './map.service'; // Your MapService with updateUserMarker method
import { MapboxService } from './mapbox.service';
import { Subject } from 'rxjs';
import { TrafficAlertService } from './traffic-alert-service';
import { environment } from 'src/environments/environment';
import { Route,Trip } from 'src/app/models/route.interface';
import { Feature, LineString, lineString, point } from '@turf/helpers';
import { nearestPointOnLine, pointToLineDistance } from '@turf/turf';
import polyline from '@mapbox/polyline';

@Injectable({
  providedIn: 'root',
})
export class TripService {
   userStartedTripFrom: Position|null=null;
   userIsOnGuidedTrip:boolean=false;
   route: Route|null = null; // La ruta seleccionada para el viaje
   currentStepIndex: number = 0; // Índice del paso actual
   tripProgress: number = 0; // Progreso del viaje en porcentaje
   tripDuration: number = 0; // Distancia total de la ruta
   tripDistance: number = 0; // Distancia total de la ruta
   tripDestination:string='';
   tripDestinationAddress:string|null = null;
   tripIsSimulation:boolean = false;
   preannouncedManeuvers = new Set<number>(); // Set de maniobras ya anunciadas
   announcedManeuvers = new Set<number>(); // Set de maniobras ya anunciadas
   lastUserPositionMonitored:Position|null = null;
   lastPositionWasSimulated:boolean=false; 
   tripProgressChanged = new EventEmitter<number>();
   tripStarted = new EventEmitter<Trip>();
   tripReRouted = new EventEmitter<Trip>();
   tripSimulationStarted = new EventEmitter<Trip>();

   tripEnded = new EventEmitter<Trip>();
   tripCanceled = new EventEmitter<Trip>();
   tripError = new EventEmitter<Trip>();
   trip:Trip|null=null;
   offRouteCounter: number = 0;  // Contador para persistencia de desviación
   lastRerouteTime: number = 0;  // Tiempo en el que se realizó el último recalculado
   
  constructor(
    private mapboxService: MapboxService, 
    private mapService:MapService,
    private geoLocationService:GeoLocationService,
    private trafficAlertService: TrafficAlertService
  
  ) {}

  // Iniciar un nuevo viaje con una ruta específica
  startTrip(route: Route,initialLocation:Position, simulation:boolean) {
    this.userStartedTripFrom=initialLocation;
    this.preannouncedManeuvers.clear();
    this.announcedManeuvers.clear();
    this.userIsOnGuidedTrip=true;
    this.route = route;
    this.currentStepIndex = 0;
    this.tripProgress=0.00;
    this.tripDuration= this.calculateDuration();
    this.tripDistance = this.calculateTotalDistance();
    this.tripDestination = this.route.legs[0].steps[this.route.legs[0].steps.length-1].name;
    this.tripDestinationAddress = this.mapService.destinationAddress;
    this.tripIsSimulation = simulation;
    const trip:Trip = {
      tripProgress: this.tripProgress,
      tripDistance: this.tripDistance,
      tripDuration:  this.tripDuration,
      tripDestination: this.tripDestination,
      tripDestinationAddress: this.tripDestinationAddress,
      tripIsSimulation:  this.tripIsSimulation,
      userStartedTripFrom: this.userStartedTripFrom,
      route:this.route
    }
    this.trip=trip;
    this.lastUserPositionMonitored=initialLocation;

    this.tripStarted.emit(trip);
    this.announceManeuver(this.route.legs[0].steps[0]);
    this.currentStepIndex=1;
    this.offRouteCounter = 0;   // Reiniciar contador de desviación
    this.lastRerouteTime = 0;  // Actualizar tiempo del último recalculado  
  }

    // Iniciar un nuevo viaje con una ruta específica
    reRouteTrip(newRoute: Route) {
      this.preannouncedManeuvers.clear();
      this.announcedManeuvers.clear();
      this.userIsOnGuidedTrip=true;
      this.route = newRoute;
      this.currentStepIndex = 1;
      this.tripProgress=0.00;
      this.tripDuration= this.calculateDuration();
      this.tripDistance = this.calculateTotalDistance();
      this.tripDestination = this.route.legs[0].steps[this.route.legs[0].steps.length-1].name;
      this.tripDestinationAddress = this.mapService.destinationAddress;
      this.tripIsSimulation = false;
      const trip:Trip = {
        tripProgress: this.tripProgress,
        tripDistance: this.tripDistance,
        tripDuration:  this.tripDuration,
        tripDestination: this.tripDestination,
        tripDestinationAddress: this.tripDestinationAddress,
        tripIsSimulation:  this.tripIsSimulation,
        userStartedTripFrom: this.userStartedTripFrom,
        route:this.route
      }
      this.trip=trip;
      this.tripReRouted.emit(trip);
    }

  startTripSimulation(route: Route,initialLocation:[number,number]) {
    this.preannouncedManeuvers.clear();
    this.announcedManeuvers.clear();
    this.userIsOnGuidedTrip=false;
    this.route = route;
    this.currentStepIndex = 0;
    this.tripProgress=0.00;
    this.tripDuration= this.calculateDuration();
    this.tripDistance = this.calculateTotalDistance();
    this.tripDestination = this.route.legs[0].steps[this.route.legs[0].steps.length-1].name;
    this.tripDestinationAddress = this.mapService.destinationAddress;
    this.tripIsSimulation = true;
    const trip:Trip = {
      tripProgress: this.tripProgress,
      tripDistance: this.tripDistance,
      tripDuration:  this.tripDuration,
      tripDestination: this.tripDestination,
      tripDestinationAddress: this.tripDestinationAddress,
      tripIsSimulation:  this.tripIsSimulation,
      userStartedTripFrom: ((window as any).geoLocationService as GeoLocationService).getLastCurrentLocation(),
      route:this.route
    }
    this.trip=trip;
  

    this.lastUserPositionMonitored=((window as any).geoLocationService as GeoLocationService).getLastCurrentLocation();
    this.tripSimulationStarted.emit(trip);
    this.announceManeuver(this.route.legs[0].steps[0]);
    this.currentStepIndex=1;  
  }

  async locationUpdate(tripIsSimulation: boolean,userPosition:Position): Promise<void> {



    if (userPosition && this.lastUserPositionMonitored
      && userPosition.coords.latitude == this.lastUserPositionMonitored.coords.latitude 
        && userPosition.coords.longitude == this.lastUserPositionMonitored.coords.longitude) {
      //console.log("No hay cambio de posición");
      return;
    }
    this.lastUserPositionMonitored=userPosition;
    const stepCount=this.route!.legs[0].steps.length;
    if(this.currentStepIndex>=0 && this.currentStepIndex<stepCount-1){
      await this.updateUserPosition([userPosition.coords.longitude,userPosition.coords.latitude]);
      return;
    }
    if(this.currentStepIndex>=0 && this.currentStepIndex>=stepCount-1){
      if(this.announcedManeuvers.has(this.currentStepIndex)){
        this.endTrip();
        return;  
      }else{
        await this.updateUserPosition([userPosition.coords.longitude,userPosition.coords.latitude]);
      }
    }
  }



  async locationUpdateSimulation(userPosition:[number,number]): Promise<void> {
    const stepCount=this.route!.legs[0].steps.length;
    if(this.currentStepIndex>=0 && this.currentStepIndex<stepCount-1){
      this.updateUserPositionSimulation(userPosition);
      return;
    }
    if(this.currentStepIndex==stepCount-1){
      if(this.announcedManeuvers.has(this.currentStepIndex)){
        this.endTrip();
        return;  
      }
    }
    if(this.currentStepIndex>=stepCount){
        this.endTrip();
        return;
    }
  }


  
// Suponiendo que `map` es la instancia de Mapbox y `userPosition` contiene la última posición del usuario
updateRouteRemainigLineString(userPosition:[number,number], originalRoute:any) {
  // 1. Encuentra el punto más cercano al usuario en la ruta
  const nearestPoint = nearestPointOnLine(originalRoute, point(userPosition));

  // 2. Encuentra el índice del punto más cercano en la geometría de la línea
  const nearestIndex = nearestPoint.properties.index;

  // 3. Recorta la ruta desde el punto más cercano hasta el final
  const remainingCoordinates = originalRoute.geometry.coordinates.slice(nearestIndex);

  // 4. Crea una nueva geometría GeoJSON con la parte restante de la ruta

  // 5. Actualiza la source en Mapbox para reflejar la nueva ruta recortada
 const directionsSource = ((window as any).mapService as MapService).getMap().getSource('directions'); 
  if(directionsSource && directionsSource.type==="geojson")
    
    directionsSource.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: remainingCoordinates
          },
          properties: originalRoute.properties
    }]
  });
}



  // Verificar si el usuario está desviado de la ruta utilizando la geometría decodificada de `route` con `turf`
private isUserOffRoute(userCoords: [number, number], lineString: Feature<LineString>): boolean {
  // Crear un punto con la posición actual del usuario
  const userPoint = point(userCoords);

  // Calcular la distancia del usuario a la línea de la ruta
  const distanceToRoute = pointToLineDistance(userPoint, lineString, { units: 'meters' });
  const maxAllowedDeviation = environment.tripserviceConf.rerouteConf.maxAllowedDeviationDistanceInMeters; // Por ejemplo, 50 metros
  //console.log('isUseOffRoute:',distanceToRoute,maxAllowedDeviation,userCoords,userPoint,lineString);
  // Determinar si el usuario está fuera del rango permitido
  return distanceToRoute > maxAllowedDeviation;
}


async updateUserPosition(coords: any) {
   // console.log(coords);
     // Decodificar la geometría de la ruta completa (nivel de `route` en la respuesta)
  const routeGeometry = this.route!.geometry;
  const lineCoords = polyline.decode(routeGeometry).map((coord) => [coord[1], coord[0]]) as Array<[number, number]>;

  // Crear un LineString de turf con la geometría decodificada
  const lineStringRoute = lineString(lineCoords);

  // Verificar si el usuario está desviado de la ruta
  const isUserOffRoute = this.isUserOffRoute(coords, lineStringRoute);
  //console.log('UpdateUserPostion',routeGeometry,lineCoords,lineStringRoute,isUserOffRoute)

  if (isUserOffRoute) {
    this.offRouteCounter++;
    //console.log(`Usuario fuera de la ruta - Contador de desviación: ${this.offRouteCounter}`);
    // Verificar si el contador de desviación supera el umbral y el tiempo desde el último recalculado
    if (this.offRouteCounter >=  environment.tripserviceConf.rerouteConf.maxAllowedOffRoutePositions && (Date.now() - this.lastRerouteTime) > environment.tripserviceConf.rerouteConf.maxAllowedtimeOffRouteInSeconds) { // 3 lecturas consecutivas y al menos 5 segundos
      //console.log("Usuario desviado durante un tiempo considerable, recalculando ruta...");
      this.trafficAlertService.showAlert("Reajustando ruta...","speakOnly",'none',true);
      await this.mapService.reRoute(coords);
      // Reiniciar el estado del viaje después del recalculado
      this.currentStepIndex = 1;  // Comenzar desde step 1 (evitando 'depart')
      this.offRouteCounter = 0;   // Reiniciar contador de desviación
      this.lastRerouteTime = Date.now();  // Actualizar tiempo del último recalculado
      this.announcedManeuvers.clear;
      this.preannouncedManeuvers.clear;
    }
  } else {
    this.offRouteCounter = 0;  // Reiniciar contador si el usuario vuelve a la ruta
   //this.updateRouteRemainigLineString(coords,lineStringRoute);
  }

    // Verificar si el usuario está desviado de la ruta
    const closestStepIndex = this.findClosestStepIndex(coords);
    const distanceToClosestStep = this.mapboxService.calculateDistance(
      coords,
      this.route!.legs[0].steps[closestStepIndex].maneuver.location as [number,number]
    );
    let distanceToCurrentStep:number|null=null;
    if (closestStepIndex > this.currentStepIndex && distanceToClosestStep <= environment.tripserviceConf.stepIntroMinDistance) {
      this.currentStepIndex = closestStepIndex;
    } else {
      distanceToCurrentStep = this.mapboxService.calculateDistance(
        coords,
        this.route!.legs[0].steps[this.currentStepIndex].maneuver.location as [number,number]
      );
    }

    const currentStep = this.route!.legs[0].steps[this.currentStepIndex];
    if(!distanceToCurrentStep){
      distanceToCurrentStep = this.mapboxService.calculateDistance(
                                coords,
                                currentStep.maneuver.location as [number,number]
                              );
    }
    this.updateTripProgress(coords,distanceToCurrentStep,this.currentStepIndex);
    this.preAnnounceManeuver(distanceToCurrentStep, currentStep);
    if (distanceToCurrentStep < this.getAnnouncementDistance(currentStep.maneuver.type)) {
      this.announceManeuver(currentStep);
      this.currentStepIndex++; 
    }
  }

  // Actualizar la posición del usuario
  async updateUserPositionSimulation(coords: any) {
    //console.log(coords);
    // Verificar si el usuario está desviado de la ruta
    const closestStepIndex = this.findClosestStepIndex(coords);
    const distanceToClosestStep = this.mapboxService.calculateDistance(
      coords,
      this.route!.legs[0].steps[closestStepIndex].maneuver.location as [number,number]
    );
    let distanceToCurrentStep:number|null=null;
    if (closestStepIndex > this.currentStepIndex && distanceToClosestStep <= environment.tripserviceConf.stepIntroMinDistance) {
      this.currentStepIndex = closestStepIndex;
    } else {
      distanceToCurrentStep = this.mapboxService.calculateDistance(
        coords,
        this.route!.legs[0].steps[this.currentStepIndex].maneuver.location as [number,number]
      );

    }

    const currentStep = this.route!.legs[0].steps[this.currentStepIndex];
    if(!distanceToCurrentStep){
      distanceToCurrentStep = this.mapboxService.calculateDistance(
                                coords,
                                currentStep.maneuver.location as [number,number]
                              );
    }
    this.updateTripProgress(coords,distanceToCurrentStep,this.currentStepIndex);
    await this.preAnnounceManeuverSimulation(distanceToCurrentStep, currentStep);
    if (distanceToCurrentStep < this.getAnnouncementDistance(currentStep.maneuver.type)) {
      await this.announceManeuverSimulation(currentStep);
      this.currentStepIndex++; 
    }
  }

  // Calcular la distancia total de la ruta
  private calculateTotalDistance(): number {
    return this.route!.distance;
  }

  
  // Calcular la distancia total de la ruta
  private calculateDuration(): number {
    return this.route!.duration;
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
        this.announcedManeuvers.add(this.currentStepIndex);
        this.trafficAlertService.showAlert(announcement,"maneuver",this.maneurveIcon(step),true);
        /*if(step.maneuver.type==="arrive"){
          this.currentStepIndex = this.route.legs[0].steps.length
        }*/
    }
  }

  async preAnnounceManeuverSimulation(distance: number, step: any) {
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
      
      this.preannouncedManeuvers.add(this.currentStepIndex);
      await this.trafficAlertService.showAlert(preAnnouncement,"maneuver",this.maneurveIcon(step),false);

    }
  }

  async announceManeuverSimulation(step: any) {
    const maneuverConfig = this.getManeuverConfig(step.maneuver.type);
    if (maneuverConfig && 
      maneuverConfig.announce &&
      !this.announcedManeuvers.has(this.currentStepIndex)) {
        let announcement = maneuverConfig.announcement
          .replace('{modifier}', step.maneuver.modifier)
          .replace('{instruction}', step.maneuver.instruction);
        this.announcedManeuvers.add(this.currentStepIndex);
        await this.trafficAlertService.showAlert(announcement,"maneuver",this.maneurveIcon(step),false);
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
    /*if(stepIndex<this.route!.legs[0].steps.length-2){

    }*/
    for (let i = stepIndex+1; i < this.route!.legs[0].steps.length; i++) {
      /*remainingDistance += this.mapboxService.calculateDistance(
        coords,
        this.route.legs[0].steps[i].maneuver.location
      );*/
      remainingDistance+=this.route!.legs[0].steps[i].distance;
    }
    return remainingDistance;
  }

  // Actualizar el progreso del viaje
  private updateTripProgress(coords: any, distanceToCurrentStep:number, stepIndex:number) {
    const lastTripProgress:number = this.tripProgress;
    const totalDistance = this.calculateTotalDistance();
    const remainingDistance  = this.calculateRemainingDistance(coords,distanceToCurrentStep,stepIndex)
    const distanceCovered = totalDistance-remainingDistance;
   //this.tripProgress = (distanceCovered / totalDistance)*100;

    this.tripProgress = (distanceCovered / totalDistance);
    //if(lastTripProgress!=this.tripProgress){
      this.tripProgressChanged.emit(this.tripProgress);
    //}
  }

  // Finalizar el viaje y limpiar recursos
  endTrip() {
    this.route = null;
    this.currentStepIndex = 0;
    this.tripProgress = 0;
    this.lastUserPositionMonitored=null;
    this.tripDistance = 0;
    this.preannouncedManeuvers.clear();
    this.announcedManeuvers.clear();
    this.userIsOnGuidedTrip=false;
    this.tripEnded.emit(this.trip!);
    //((window as any).homePage as HomePage).cancelTrip(); // Your MapService with cancelTrip method
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
    this.userIsOnGuidedTrip=false;
    this.tripCanceled.emit(
      this.trip!
    );
    /*const instructions = document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLElement;
    if (instructions) instructions.style.display = "none";*/
  }

  // Encuentra el índice del paso más cercano al usuario
  private findClosestStepIndex(coords: any): number {
    let closestIndex = this.currentStepIndex;
    let minDistance = Infinity;

    this.route!.legs[0].steps.forEach((step: any, index: number) => {
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
   //await this.mapboxService.getNewRoute(coords, this.route!.waypoints).then((newRoute) => {
     // this.route = newRoute;
    //  this.currentStepIndex = this.findClosestStepIndex(coords);
    //  const alert = this.trafficAlertService.showAlert('Recalculando ruta.',"voiceAlertOnly",'',true);
   //   this.mapService.changeRoute(newRoute);
   // });
  }

}