import { Injectable, EventEmitter } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { MapService } from './map.service';
import { Position } from '@capacitor/geolocation';
import { TrafficAlertService } from './traffic-alert-service'; // Importamos el servicio de alertas
import polyline from '@mapbox/polyline';
import { TripService } from './trip.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TripSimulatorService{

  simulationCanceled = new EventEmitter<boolean>();   // Evento emitido cuando la simulación se cancela
  private counter = 0;
  private maxSteps = 0;
  private running = false;
  private arc: [number, number][] = [];
  private stepAlertDistance = 0.05; // Distancia (en km) para alertar antes de un step
  private alertedSteps: Set<string> = new Set(); // Lista de pasos alertados (usamos Set para evitar duplicados)

  constructor(private mapService: MapService, private trafficAlertService: TrafficAlertService) {}

  // Método para iniciar la simulación
  async startSimulation(origin: [number, number], destination: [number, number], route: any, map: mapboxgl.Map) {
    
    const coordinates = this.setRouteCoordinatesFromSelectedRoute(route);
    ((window as any).tripService as TripService).startTripSimulation(route,origin);
    // Creación de un FeatureCollection con una línea que representa la ruta
    const routeFeature = {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'geometry': {
            'type': 'LineString',
            'coordinates': coordinates
          }
        }
      ]
    };

    // Creación del punto que será animado a lo largo de la ruta
    const pointFeature = {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'Point',
            'coordinates': origin
          }
        }
      ]
    };

    // Calcular la distancia total de la ruta
    const lineDistance = turf.length(routeFeature.features[0] as any);
    this.arc = [];
    this.alertedSteps.clear(); // Limpiar los pasos alertados cuando inicia una nueva simulación

    const steps = environment.gpsSettings.simulationIntervalTimeInMs; // Número de pasos para una animación suave

    // Generar una interpolación de puntos a lo largo de la ruta para suavizar el movimiento
    for (let i = 0; i < lineDistance; i += lineDistance / steps) {
      const segment = turf.along(routeFeature.features[0] as any, i);
      this.arc.push(segment.geometry.coordinates as any);
    }

    // Actualizamos la ruta con los puntos interpolados
    routeFeature.features[0].geometry.coordinates = this.arc;

    // Inicializar el marcador 3D en la posición inicial
    await ((window as any).mapService as MapService).add3DModelMarkerSimulator(map, origin);

    // Añadimos las fuentes y capas para la ruta y el marcador (punto)
    if (!map.getSource('route')){
      map.addSource('route', {
          'type': 'geojson',
          'data': routeFeature as any
        });
    }

    if (!map.getSource('point')){
      map.addSource('point', {
        'type': 'geojson',
        'data': pointFeature as any
      });
     }
    // Añadir la línea de la ruta al mapa
    if (!map.getLayer('route')){

    map.addLayer({
      'id': 'route',
      'source': 'route',
      'type': 'line',
      'layout': {'visibility':'none'},
      'paint': {
        'line-width': 3,
        'line-color': '#007cbf'
      }
    });
  }
    // Añadir el punto al mapa, inicialmente en el origen
    if (!map.getLayer('point')){
    map.addLayer({
      'id': 'point',
      'source': 'point',
      'type': 'symbol',
      'layout': {'visibility':'none'}

    });
  }

    this.counter = 0;
    this.maxSteps = this.arc.length;
    this.running = true;

    // Iniciamos la animación
    this.animate(map, pointFeature, route, route.steps);
  }

  // Método para animar el punto a lo largo de la ruta
  private async animate(map: mapboxgl.Map, pointFeature: any, route: any, steps: any[]) {
    if (this.counter < this.maxSteps && this.running) {
      const start = this.arc[this.counter];
      const end = this.arc[this.counter + 1] || start;

      // Actualizamos la posición del punto en la ruta
      pointFeature.features[0].geometry.coordinates = start;
      
      // Calculamos el ángulo de rotación para que el marcador siga la ruta
      const bearing = turf.bearing(turf.point(start), turf.point(end));
      pointFeature.features[0].properties.bearing = bearing;

      // Actualizamos la fuente de datos del punto en el mapa
      (map.getSource('point') as mapboxgl.GeoJSONSource).setData(pointFeature);

      // Actualizamos la posición del modelo 3D
      ((window as any).mapService as MapService).update3DSimulatioModelPosition(map, start, bearing);

      // Comprobamos si estamos cerca del próximo paso y mostramos una alerta
      //this.checkForStepAlert(start, steps);

      this.counter++;
      await ((window as any).tripService as TripService).locationUpdateSimulation(start);
      requestAnimationFrame(() => this.animate(map, pointFeature, route, steps));
    } else if (this.counter >= this.maxSteps) {
      // Emitir el evento de simulación completada cuando termine
      this.finishSimulation();
    }
  }

  // Método para verificar si estamos cerca de un step y mostrar una alerta
  private async checkForStepAlert(currentPosition: [number, number], steps: any[]) {
    for (const step of steps) {
      const stepCoords = step.maneuver.location;
      const stepKey = `${stepCoords[0]}_${stepCoords[1]}`; // Crear un identificador único para cada step

      const distanceToStep = turf.distance(turf.point(currentPosition), turf.point(stepCoords));

      // Si estamos dentro del rango de alerta y no hemos alertado sobre este paso antes
      if (distanceToStep <= this.stepAlertDistance && !this.alertedSteps.has(stepKey)) {
        // Invocar la alerta usando el servicio de tráfico
        await ((window as any).trafficAlertService as TrafficAlertService).showAlert(step.maneuver.instruction, 'navigation', 'iconUrl', true);
        
        // Marcar este step como alertado
        this.alertedSteps.add(stepKey);
        break;
      }
    }
  }

  finishSimulation(){
    this.running = false;
    this.counter = 0;
    this.arc = [];
    this.alertedSteps.clear(); // Limpiar la lista de pasos alertados
    ((window as any).mapService as MapService).getMap().removeLayer('route');
    ((window as any).mapService as MapService).getMap().removeLayer('point');
    ((window as any).mapService as MapService).tb.remove(((window as any).mapService as MapService).carModelSimulator);
    ((window as any).mapService as MapService).tb.update();
    this.simulationCanceled.emit(true);  // Emitir el evento cuando la simulación es cancelada
  }
  // Método para cancelar la simulación
  cancelSimulation() {
    this.running = false;
    this.counter = 0;
    this.arc = [];
    this.alertedSteps.clear(); // Limpiar la lista de pasos alertados
    ((window as any).mapService as MapService).getMap().removeLayer('route');
    ((window as any).mapService as MapService).getMap().removeLayer('point');
    ((window as any).mapService as MapService).tb.remove(((window as any).mapService as MapService).carModelSimulator);
    ((window as any).mapService as MapService).tb.update();
    this.simulationCanceled.emit(false);  // Emitir el evento cuando la simulación es cancelada
  }

  // Método auxiliar para transformar la ruta en un array de coordenadas
  setRouteCoordinatesFromSelectedRoute(route: any): [number, number][] {
    /*return route.legs.reduce((coords: [number, number][], leg: any) => {
      return [...coords, ...leg.steps.map((step: any) => step.geometry.coordinates).flat()];
    }, []);*/
    const coords = polyline.decode(route.geometry).map(coord => [coord[1], coord[0]]);
    return (coords as any);
  }

  getDestinationPositionFromRoute(route: any): Position {
    const legs = route.legs;
    const lastLeg = legs[legs.length - 1]; // Get the last leg of the route
    const steps = lastLeg.steps;
    const lastStep = steps[steps.length - 1]; // Get the last step of the last leg
  
    // Extract the destination coordinates from the last step
    const [longitude, latitude] = lastStep.maneuver.location;
  
    // Return a Position object compatible with @capacitor/geolocation
    const destinationPosition: Position = {
      coords: {
        latitude,
        longitude,
        accuracy: 0, // You may want to set this if available
        altitude: null, // Optional, set if available
        altitudeAccuracy: null, // Optional, set if available
        heading: null, // Optional, set if available
        speed: null // Optional, set if available
      },
      timestamp: Date.now() // Current timestamp
    };
  
    return destinationPosition;
  }
}
