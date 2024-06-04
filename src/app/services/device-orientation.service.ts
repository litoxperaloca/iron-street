import { Injectable } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { Observable } from 'rxjs';
import { SensorService } from './sensor.service';

@Injectable({
  providedIn: 'root',
})
export class DeviceOrientationService {
  accelHandler!: PluginListenerHandle;
  orientationHandler!: PluginListenerHandle;
  lastResult: DeviceOrientationEvent | null = null;


  private headingHandler: (event: DeviceOrientationEvent) => void;
  private lastHeadingData: DeviceOrientationEvent | null = null;
  private updateHeadingIntervalId: any;


  constructor(
    private sensorService: SensorService
  ) {
    this.headingHandler = (event: DeviceOrientationEvent) => {
      this.lastHeadingData = event; // Store the latest event data
    };
  }



  private processOrientationData(data: DeviceOrientationEvent): void {
    //console.log(`Processed Data at interval - Alpha: ${data.alpha}, Beta: ${data.beta}, Gamma: ${data.gamma}`);
    let compassHeading;
    if (data) {
      if ((data as any).webkitCompassHeading) {
        compassHeading = (data as any).webkitCompassHeading;
      } else if (data.alpha !== null) {
        compassHeading = data.alpha;
      }
      //console.log("Compass Heading:", compassHeading);
      this.sensorService.updateHeadingAbs(compassHeading);
    }
  }

  setLastResult(result: DeviceOrientationEvent): void {
    this.lastResult = result;
  }




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
