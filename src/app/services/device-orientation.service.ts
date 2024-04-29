import { Injectable } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { Motion, RotationRate } from '@capacitor/motion';
import { Observable } from 'rxjs';
import { HomePage } from '../pages/home/home.page';
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


  startListeningHeading() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.headingHandler);
      this.startRegularUpdates();
    } else {
      //console.log("Device Orientation not supported");
    }
  }

  stopListeningHeading(): void {
    // Remove the event listener to clean up
    window.removeEventListener('deviceorientation', this.headingHandler);
    //console.log("Event listener removed");
  }

  private startRegularUpdates(): void {
    this.updateHeadingIntervalId = setInterval(() => {
      if (this.lastHeadingData) {
        this.processOrientationData(this.lastHeadingData);
      }
    }, 1500); // Refresh rate of 1.5 seconds
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





  watchCompass(callback: (heading: number) => void) {
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', (event: DeviceOrientationEvent) => {
        const heading = event.alpha; // This represents the direction the device is facing in degrees
        if (heading !== null) callback(heading);
      }, true);
    } else if ('ondeviceorientation' in window) {
      (window as any).addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
        const heading = event.alpha; // alpha is for both iOS and Android
        if (heading !== null) callback(heading);
      }, true);
    } else {
      console.error('Compass not supported');
    }
  }

  watchMotion(callback: (acceleration: DeviceMotionEventAcceleration, rotation: RotationRate) => void) {
    Motion.addListener('accel', (event) => {
      callback(event.acceleration, event.rotationRate);
    });
  }

  setLastResult(result: DeviceOrientationEvent): void {
    this.lastResult = result;
  }

  async listenOrientation(): Promise<void> {
    this.orientationHandler = await Motion.addListener('orientation', event => {
      //('orientation', event);
      ((window as any).homePage as HomePage).updateMarkerOrientation(event as any);
    });
  };

  async listenAcceleration(): Promise<void> {
    this.accelHandler = await Motion.addListener('accel', event => {
      //console.log('accel', event);
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
