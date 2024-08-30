import { Injectable } from '@angular/core';
// geoLocationService.ts
import { Geolocation, Position } from '@capacitor/geolocation';
import { MapService } from './map.service'; // Importa tu MapService
import { OsrmService } from './osrm.service';
import { TripService } from './trip.service';
import { TrafficAlertService } from './traffic-alert-service';
import { HomePage } from '../pages/home/home.page';

@Injectable({
  providedIn: 'root'
})
export class GeoLocationAnimatedService {

  private watchId: string | null = null;
  private osrmService: OsrmService;
  private mapService: MapService;
  private trafficAlertService:TrafficAlertService;

  constructor(osrmService: OsrmService, mapService: MapService, tripService: TripService, trafficAlertService: TrafficAlertService) {
    this.osrmService = osrmService;
    this.mapService = mapService;
    this.trafficAlertService = trafficAlertService;
  }

  // Inicia la observación de la posición del usuario
  public startWatchingPosition() {
    // Asegúrate de detener cualquier observación previa
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }

    // Inicia el watchPosition
    Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
      (position, err) => {
        if (err) {
          console.error('Error obteniendo la posición:', err);
          return;
        }

        if (position) {
          // Llama al método para manejar la nueva posición
          this.handlePositionUpdate(position);
        }
      }
    );
  }

  // Maneja la actualización de la posición
  private async handlePositionUpdate(position: Position) {

    // Llama al servicio de snap para ajustar la posición
    const matchedPosition = await this.osrmService.getMatchedPosition(position);
    const homePage:HomePage = ((window as any).homePage as HomePage);
    homePage.setCurrentSpeed(matchedPosition.speed);
    if(matchedPosition.maxspeed){
      homePage.currentMaxSpeed = Number.parseInt(matchedPosition.maxspeed); 
    } 
    const snapedPos=
    {
      coords:
      {
        longitude:matchedPosition.lon as number,
        latitude:matchedPosition.lat as number,
        heading:matchedPosition.heading as number
      }
    }  
     // Ejecuta las tareas en paralelo después de obtener la posición ajustada
     await Promise.all([
      // Actualiza el marcador en el mapa con la posición ajustada
      
      this.mapService.updateUserMarker(snapedPos),

      // Llama al tripService para gestionar maniobras
     //this.tripService.locationUpdate(matchedPosition),

      // Llama al trafficAlertService para gestionar alertas de tráfico
      //this.trafficAlertService.checkAlertableObjectsOnNewUserPositionFromArray(matchedPosition),
    ]);
  }

  // Detiene la observación de la posición
  public stopWatchingPosition() {
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }
}