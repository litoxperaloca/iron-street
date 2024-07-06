import { Injectable } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { Motion } from '@capacitor/motion';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MotionService {
  private accelHandler!: PluginListenerHandle;

  constructor() { }

  // Observa los cambios de aceleración
  watchAcceleration(): Observable<any> {
    return new Observable(observer => {
      Motion.addListener('accel', event => {
        observer.next(event);
      });
    });
  }

  // Observa los cambios de orientación
  watchOrientation(): Observable<any> {
    return new Observable(observer => {
      Motion.addListener('orientation', event => {
        observer.next(event);
      });
    });
  }

}
