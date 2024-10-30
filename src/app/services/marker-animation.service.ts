import { Injectable } from '@angular/core';
import { MapService } from './map.service';
import { environment } from 'src/environments/environment';
import { Position } from '@capacitor/geolocation';
import { CameraService } from './camera.service';

@Injectable({
  providedIn: 'root'
})
export class MarkerAnimationService {

  constructor(private mapService:MapService, private cameraService:CameraService) { }

    //private isAnimating = false; // Flag para controlar si hay una animación en curso
    private animationQueue: (() => Promise<void>)[] = []; // Cola de animaciones
    currentMarkerPosition!:Position;
    currentHeading!:number;
    isAnimating:boolean= false;
    // Método para actualizar el marcador del usuario con animación
    async updateUserMarker(snappedPosition:  Position ): Promise<void> {
     // console.log(snappedPosition);
      // Añadir la animación a la cola
      this.enqueueAnimation(() => this.animateMarkerToPosition(snappedPosition));
    }
  
    // Añade una animación a la cola y la procesa si no hay animaciones en curso
    private enqueueAnimation(animation: () => Promise<void>) {
      this.animationQueue.push(animation);
      if (!this.isAnimating) {
        this.processNextAnimation();
      }
    }
  
    // Procesa la siguiente animación en la cola
     // Método para animar el marcador a la nueva posición y dirección
    private async animateMarkerToPosition(snappedPosition:  Position  ): Promise<void> {
      return new Promise<void>((resolve) => {
        // Configuración de la animación usando requestAnimationFrame
        const duration = environment.gpsSettings.userMarkerAnimationDurationInMs; // Duración de la animación en milisegundos
        const start = performance.now();
        const initialPosition:Position = this.currentMarkerPosition;
        const initialHeading:number = this.currentHeading;
  
        const animation = (timestamp: number) => {
          const progress = (timestamp - start) / duration;
  
          if (progress < 1) {
            // Interpolación de la posición y dirección

            const interpolatedLatitude = initialPosition.coords.latitude + (snappedPosition.coords.latitude - initialPosition.coords.latitude) * progress;
            const interpolatedLongitude = initialPosition.coords.longitude + (snappedPosition.coords.longitude - initialPosition.coords.longitude) * progress;
        
            // Interpolación del heading (corrección para la rotación en 360 grados)
            let deltaHeading = snappedPosition.coords.heading! - initialHeading!;
            
            // Asegurar que la interpolación ocurra en el camino más corto
            if (deltaHeading > 180) {
              deltaHeading -= 360;
            } else if (deltaHeading < -180) {
              deltaHeading += 360;
            }
        
            // Calcular el heading interpolado
            let interpolatedHeading = initialHeading! + deltaHeading * progress;
        
            // Normalizar el heading para que esté en el rango [0, 360)
            interpolatedHeading = (interpolatedHeading + 360) % 360;
        
            // Crear la posición interpolada
            const interpolatedPosition: Position = {
              coords: {
                latitude: interpolatedLatitude,
                longitude: interpolatedLongitude,
                speed: snappedPosition.coords.speed,
                heading: interpolatedHeading,
                accuracy: snappedPosition.coords.accuracy,
                altitude: snappedPosition.coords.altitude,
                altitudeAccuracy: snappedPosition.coords.altitudeAccuracy
              },
              timestamp: snappedPosition.timestamp
            };
            // Actualiza el marcador con la posición y dirección interpoladas
            this.updateMarkerOnMap(interpolatedPosition, interpolatedHeading);
            requestAnimationFrame(animation);
          } else {
            // Finaliza la animación y resuelve la promesa
            this.updateMarkerOnMap(snappedPosition, snappedPosition.coords.heading!);
            if (this.mapService.trackingUser&&snappedPosition.coords.altitudeAccuracy==1) {
              this.mapService.mapEventIsFromTracking = true;
              this.cameraService.updateCameraForUserMarkerGeoEvent([snappedPosition.coords.longitude, snappedPosition.coords.latitude], snappedPosition.coords.heading!);
              this.mapService.resetMapEventTrackingFlag();
            }
            resolve();
          }
        };
  
        requestAnimationFrame(animation);
      });
    }
  
    // Actualiza la posición y el heading del marcador en el mapa
    private updateMarkerOnMap(position: Position, heading: number) {
      // Aquí va la lógica para actualizar el marcador en el mapa
      this.currentMarkerPosition = position;
      this.currentHeading = heading;
      this.mapService.updateMarkerAnd3dModel(position,heading);
      // Ejemplo de actualización en Mapbox:
      // this.map.getSource('user-marker').setData(newPosition);
      // this.map.setLayoutProperty('user-marker', 'icon-rotate', heading);
    }
  
    // Ajuste mínimo en el manejo secuencial
  private async processNextAnimation() {
    if (this.animationQueue.length === 0) return; 
  
    this.isAnimating = true;
    const nextAnimation = this.animationQueue.shift();
  
    if (nextAnimation) {
      try {
        await nextAnimation(); // Correcto: se espera la finalización de la animación
      } catch (error) {
        console.error('Error en la animación:', error);
      } finally {
        this.isAnimating = false;
        this.processNextAnimation(); // Continua con la siguiente animación en la cola
      }
    }
  }
}
