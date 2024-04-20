import { Injectable } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { Motion } from '@capacitor/motion';
import { Observable } from 'rxjs';
import { HomePage } from '../pages/home/home.page';

@Injectable({
  providedIn: 'root',
})
export class DeviceOrientationService {
  accelHandler!: PluginListenerHandle;
  orientationHandler!: PluginListenerHandle;
  lastResult: DeviceOrientationEvent | null = null;

  constructor() { }

  setLastResult(result: DeviceOrientationEvent): void {
    this.lastResult = result;
  }

  async listenOrientation(): Promise<void> {
    this.orientationHandler = await Motion.addListener('orientation', event => {
      console.log('orientation', event);
      ((window as any).homePage as HomePage).updateMarkerOrientation(event as any);
    });
  };

  async listenAcceleration(): Promise<void> {
    this.accelHandler = await Motion.addListener('accel', event => {
      console.log('accel', event);
      ((window as any).homePage as HomePage).updateMarkerAccel(event as any);

    });
  };

  stopAcceleration(): void {
    if (this.accelHandler) {
      this.accelHandler.remove();
    }
  };

  stopOrientation(): void {
    if (this.orientationHandler) {
      this.orientationHandler.remove();
    }
  };

  async requestPermission() {
    try {
      const result = await (DeviceOrientationEvent as any).requestPermission();
      if (result === 'granted') {
        //setShowPermButton(false);
      } else {
        alert(`don't have permissions to listen`);
      }
    } catch (e) {
      alert('error requesting permssion');
    }
  };

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
