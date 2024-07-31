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
      warnUserTime: 50
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
/*
Descripción de Requisitos y Funciones de TripService
El TripService es un servicio fundamental en la aplicación Iron Street, responsable de gestionar la navegación del usuario durante un viaje. Este servicio se encarga de monitorear la posición del usuario, proporcionar indicaciones de navegación en tiempo real y manejar situaciones como desviaciones de la ruta planificada. A continuación se detallan los requisitos y funciones del servicio, basados en la implementación discutida:

Requisitos del Servicio
Inicialización y Control de Viaje:

Iniciar un viaje: Comenzar el monitoreo de la ruta una vez que el usuario ha seleccionado un destino y ha comenzado el viaje.
Finalizar un viaje: Limpiar todos los recursos y estados al finalizar el viaje.
Monitoreo y Actualización de Posición:

Monitorear la posición del usuario: Usar la API de geolocalización para obtener actualizaciones en tiempo real de la ubicación del usuario.
Actualizar la posición del usuario: Determinar la distancia del usuario al próximo paso y si el usuario ha realizado la maniobra correcta.
Gestión de Maniobras y Alertas:

Pre-anunciar maniobras: Anunciar maniobras futuras con antelación, basándose en una distancia configurable (por defecto, 200 metros).
Anunciar maniobra actual: Anunciar cuando el usuario debe realizar una maniobra.
Anunciar próximas maniobras: Inmediatamente después de completar una maniobra, informar al usuario sobre la próxima acción usando "A continuación...".
Anunciar llegada al destino: Informar al usuario cuando haya llegado al destino.
Gestión de Desviaciones y Recalculo de Ruta:

Detección de desviaciones: Verificar si el usuario está fuera de la ruta establecida y si está más cerca de un paso futuro que del paso actual.
Recalculo de ruta: Generar una nueva ruta desde la posición actual del usuario si se detecta un desvío significativo.
Progreso del Viaje:

Calcular progreso del viaje: Monitorear y actualizar el progreso del viaje en base a la distancia recorrida y la distancia restante.
Funciones del Servicio
startTrip(route: any): void

Inicia el viaje con la ruta especificada, establece los estados iniciales y comienza el monitoreo de la posición.
monitorPosition(): void

Configura un observador para la geolocalización que actualiza la posición del usuario en tiempo real.
updateUserPosition(coords: any): void

Actualiza la posición del usuario y gestiona la lógica de navegación, incluidas las alertas de maniobras, el recalculo de ruta y la finalización del viaje.
calculateTotalDistance(): number

Calcula la distancia total de la ruta planificada.
preAnnounceNextManeuver(distance: number, step: any): void

Anuncia la próxima maniobra con una distancia de anticipación configurable.
preAnnounceArrival(distance: number): void

Pre-anuncia la llegada al destino cuando se está en el último paso.
announceManeuver(step: any): void

Anuncia la maniobra actual.
announceNextManeuver(): void

Anuncia la siguiente maniobra inmediatamente después de completar la actual.
updateTripProgress(coords: any): void

Calcula y actualiza el progreso del viaje en función de la distancia recorrida.
announceArrival(): void

Notifica al usuario que ha llegado al destino.
endTrip(): void

Finaliza el viaje y limpia los recursos utilizados.
findClosestStepIndex(coords: any): number

Encuentra y devuelve el índice del paso más cercano al usuario en la ruta.
recalculateRoute(coords: any): void

Recalcula la ruta desde la ubicación actual del usuario.
isLastStep(): boolean

Verifica si el paso actual es el último de la ruta.
getAlerts(): Observable<string>

Proporciona un observable para suscribirse a las alertas de navegación generadas por el servicio.
Consideraciones Adicionales
Configurabilidad: Los umbrales de desviación y las distancias para pre-anunciar maniobras deben ser configurables para ajustarse a diferentes escenarios y preferencias del usuario.
Manejo de Errores: Es importante manejar posibles errores, como la falta de señal GPS o problemas con la API de Mapbox, de manera adecuada para mejorar la experiencia del usuario.
Extensibilidad: El servicio debe ser fácilmente extensible para añadir nuevas funcionalidades, como soporte para diferentes modos de transporte o integración con otros servicios de geolocalización.
Con esta descripción completa, TripService cubre todos los aspectos necesarios para una navegación guiada eficiente y precisa, brindando una experiencia de usuario fluida y confiable en la aplicación Iron Street.
*/



/*
import { Injectable } from '@angular/core';
import { MapboxService } from './mapbox.service';
import { Geolocation } from '@capacitor/geolocation';
import { Subject } from 'rxjs';

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
  private preAnnouncementDistance: number = 200; // Distancia en metros para pre-anunciar la maniobra
  private deviationThreshold: number = 50; // Umbral de desviación en metros

  constructor(private mapboxService: MapboxService) {}

  // Iniciar un nuevo viaje con una ruta específica
  startTrip(route: any) {
    this.route = route;
    this.currentStepIndex = 0;
    this.tripDistance = this.calculateTotalDistance();
    this.announcedManeuvers.clear();
    this.monitorPosition();
  }

  // Monitorear la posición del usuario
  private async monitorPosition() {
    Geolocation.watchPosition({ enableHighAccuracy: true }, (position, err) => {
      if (position) {
        this.updateUserPosition(position.coords);
      }
    });
  }

  // Actualizar la posición del usuario
  private updateUserPosition(coords: any) {
    // Verificar si el usuario está desviado de la ruta
    const closestStepIndex = this.findClosestStepIndex(coords);
    const distanceToClosestStep = this.mapboxService.calculateDistance(
      coords,
      this.route.legs[0].steps[closestStepIndex].maneuver.location
    );

    if (closestStepIndex > this.currentStepIndex && distanceToClosestStep < this.deviationThreshold) {
      // Usuario está más cerca de un paso futuro
      this.currentStepIndex = closestStepIndex;
    } else {
      // Recalcular la ruta si el usuario se ha desviado
      const distanceToCurrentStep = this.mapboxService.calculateDistance(
        coords,
        this.route.legs[0].steps[this.currentStepIndex].maneuver.location
      );

      if (distanceToCurrentStep > this.deviationThreshold) {
        this.recalculateRoute(coords);
        return;
      }
    }

    const currentStep = this.route.legs[0].steps[this.currentStepIndex];
    const distanceToNextStep = this.mapboxService.calculateDistance(
      coords,
      currentStep.maneuver.location
    );

    // Verificar si es el último paso
    if (this.isLastStep()) {
      this.preAnnounceArrival(distanceToNextStep);
    } else {
      this.preAnnounceNextManeuver(distanceToNextStep, currentStep);
    }

    if (distanceToNextStep < 10) {
      if (this.isLastStep()) {
        this.announceArrival();
        this.endTrip();
      } else {
        this.announceManeuver(currentStep);
        this.currentStepIndex++;
        this.announceNextManeuver();
      }
    }

    this.updateTripProgress(coords);
  }

  // Calcular la distancia total de la ruta
  private calculateTotalDistance(): number {
    return this.route.distance;
  }

  // Pre-anunciar la próxima maniobra
  private preAnnounceNextManeuver(distance: number, step: any) {
    if (distance < this.preAnnouncementDistance && distance > 50 && !this.announcedManeuvers.has(this.currentStepIndex)) {
      this.alerts$.next(
        `En ${Math.round(distance)} metros, gire ${step.maneuver.modifier} con dirección a ${step.name}`
      );
      this.announcedManeuvers.add(this.currentStepIndex);
    }
  }

  // Pre-anunciar llegada al destino
  private preAnnounceArrival(distance: number) {
    if (distance < this.preAnnouncementDistance && distance > 50 && !this.announcedManeuvers.has(this.currentStepIndex)) {
      this.alerts$.next(`En ${Math.round(distance)} metros, llegará a su destino.`);
      this.announcedManeuvers.add(this.currentStepIndex);
    }
  }

  // Anunciar la maniobra actual
  private announceManeuver(step: any) {
    this.alerts$.next(`Ahora, gire ${step.maneuver.modifier} con dirección a ${step.name}`);
  }

  // Anunciar la próxima maniobra después de completar la actual
  private announceNextManeuver() {
    if (this.currentStepIndex < this.route.legs[0].steps.length - 1) {
      const nextStep = this.route.legs[0].steps[this.currentStepIndex];
      this.alerts$.next(
        `A continuación, conduzca por ${Math.round(nextStep.distance)} metros por ${nextStep.name}`
      );
    }
  }

  // Actualizar el progreso del viaje
  private updateTripProgress(coords: any) {
    const totalDistance = this.calculateTotalDistance();
    const distanceCovered = this.mapboxService.calculateDistance(
      this.route.legs[0].steps[0].maneuver.location,
      coords
    );
    this.tripProgress = (distanceCovered / totalDistance) * 100;
  }

  // Anunciar llegada al destino
  private announceArrival() {
    this.alerts$.next('Ha llegado a su destino.');
  }

  // Finalizar el viaje y limpiar recursos
  private endTrip() {
    Geolocation.clearWatch();
    this.route = null;
    this.currentStepIndex = 0;
    this.tripProgress = 0;
    this.alerts$.next('El viaje ha finalizado.');
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
  private recalculateRoute(coords: any) {
    this.mapboxService.getNewRoute(coords, this.route.waypoints).then((newRoute) => {
      this.route = newRoute;
      this.currentStepIndex = this.findClosestStepIndex(coords);
      this.alerts$.next('Se ha recalculado la ruta debido a un desvío.');
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
  */


/*

Descripción del Código
Atributos:

route: Almacena la ruta seleccionada para el viaje.
currentStepIndex: Índice del paso actual de la ruta.
tripProgress: Progreso del viaje en porcentaje.
tripDistance: Distancia total de la ruta.
alerts$: Sujeto para manejar las alertas de navegación.
announcedManeuvers: Set para almacenar los índices de las maniobras ya anunciadas.
preAnnouncementDistance: Distancia en metros para pre-anunciar maniobras.
deviationThreshold: Umbral de desviación en metros para determinar si el usuario está fuera de la ruta.
Funciones Principales:

startTrip(route: any): Inicia el viaje, establece los estados iniciales y comienza el monitoreo de la posición.
monitorPosition(): Configura un observador para la geolocalización que actualiza la posición del usuario.
updateUserPosition(coords: any): Actualiza la posición del usuario, gestiona la lógica de navegación, incluidos los anuncios de maniobras y la detección de desviaciones.
calculateTotalDistance(): Calcula la distancia total de la ruta.
preAnnounceNextManeuver(distance: number, step: any): Pre-anuncia la próxima maniobra con una distancia de anticipación configurable.
preAnnounceArrival(distance: number): Pre-anuncia la llegada al destino cuando se está en el último paso.
announceManeuver(step: any): Anuncia la maniobra actual.
announceNextManeuver(): Anuncia la próxima maniobra inmediatamente después de completar la actual.
updateTripProgress(coords: any): Actualiza el progreso del viaje.
announceArrival(): Notifica al usuario que ha llegado al destino.
endTrip(): Finaliza el viaje y limpia los recursos utilizados.
findClosestStepIndex(coords: any): Encuentra el índice del paso más cercano al usuario.
recalculateRoute(coords: any): Recalcula la ruta desde la ubicación actual del usuario.
isLastStep(): Verifica si el paso actual es el último de la ruta.
getAlerts(): Proporciona un observable para suscribirse a las alertas de navegación generadas por el servicio.
Este código proporciona una implementación completa y detallada del servicio TripService para manejar la lógica de navegación en la aplicación Iron Street, asegurando una experiencia de usuario óptima durante el viaje.

*/