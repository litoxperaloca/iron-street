import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeviceOrientationService {
  constructor() { }

  getOrientation(): Observable<DeviceOrientationEvent> {
    return new Observable((observer) => {
      // Definir eventListener fuera de la condición para permitir su uso en unsubscribe
      let eventListener: (this: Window, ev: DeviceOrientationEvent) => any;

      if ('DeviceOrientationEvent' in window) {
        // Inicialización de eventListener
        eventListener = (event: DeviceOrientationEvent) => {
          observer.next(event);
        };

        window.addEventListener('deviceorientation', eventListener, true);
      } else {
        observer.error('DeviceOrientationEvent is not supported in your browser.');
      }

      // Retorna siempre un objeto con un método unsubscribe
      // Esto asegura que todas las rutas retornen un valor.
      return {
        unsubscribe() {
          // Verifica si eventListener está definido antes de intentar removerlo
          // Esto es necesario ya que eventListener podría no estar definido si el navegador no soporta DeviceOrientationEvent
          if (eventListener) {
            window.removeEventListener('deviceorientation', eventListener);
          }
        }
      };
    });
  }
}
