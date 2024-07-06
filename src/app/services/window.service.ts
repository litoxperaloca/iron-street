import { Injectable } from '@angular/core';
import { CameraService } from './camera.service';
import { GeoLocationService } from './geo-location.service';
import { MapService } from './map.service';

@Injectable({
  providedIn: 'root'
})
export class WindowService {

  timeOuts: any[] = [];
  intervals: any[] = [];
  watches: any[] = [];
  animationFramesRequests: any[] = [];

  window: Window = window;

  constructor() { }

  getValueFromProperty(key: string): any {
    return (window as any)[key];
  }

  setValueIntoProperty(key: string, value: any): void {
    (window as any)[key] = value;
  }

  attachedWatch(componentName: any, watchKey: any, watchId: any) {
    this.unAttachWatch(componentName, watchKey);
    if (!this.watches[componentName]) this.watches[componentName] = [];
    this.watches[componentName][watchKey] = watchId;
  }

  unAttachWatch(componentName: any, watchKey: any) {
    if (this.watches[componentName] && this.watches[componentName][watchKey]) {
      if (watchKey == "gps") {
        ((window as any).geoLocationService as GeoLocationService).clearWatch(this.watches[componentName][watchKey]);
      }
      this.watches[componentName][watchKey] = undefined;
    }
  }

  attachedTimeOut(componentName: any, timeOutKey: any, timeOut: any) {
    this.unAttachTimeOut(componentName, timeOutKey);
    if (!this.timeOuts[componentName]) this.timeOuts[componentName] = [];
    this.timeOuts[componentName][timeOutKey] = timeOut;
  }

  unAttachTimeOut(componentName: any, timeOutKey: any) {
    if (this.timeOuts[componentName] && this.timeOuts[componentName][timeOutKey]) {
      clearTimeout(this.timeOuts[componentName][timeOutKey]);
      this.timeOuts[componentName][timeOutKey] = undefined;
    }
  }

  attachedInterval(componentName: any, intervalKey: any, interval: any) {
    this.unAttachInterval(componentName, intervalKey);
    if (!this.intervals[componentName]) this.intervals[componentName] = [];
    this.intervals[componentName][intervalKey] = interval;
  }

  unAttachInterval(componentName: any, intervalKey: any) {
    if (this.intervals[componentName] && this.intervals[componentName][intervalKey]) {
      clearInterval(this.intervals[componentName][intervalKey]);
      this.intervals[componentName][intervalKey] = undefined;
    }
  }

  attachedAnimationFrameRequest(componentName: any, requestAnimationFrameKey: any, requestAnimationFrameId: any) {
    this.unAttachAnimationFrameRequest(componentName, requestAnimationFrameKey);
    if (!this.animationFramesRequests[componentName]) this.animationFramesRequests[componentName] = [];
    this.animationFramesRequests[componentName][requestAnimationFrameKey] = requestAnimationFrameId;
  }

  unAttachAnimationFrameRequest(componentName: any, requestAnimationFrameKey: any) {
    if (this.animationFramesRequests[componentName] && this.animationFramesRequests[componentName][requestAnimationFrameKey]) {
      cancelAnimationFrame(this.animationFramesRequests[componentName][requestAnimationFrameKey]);
      this.animationFramesRequests[componentName][requestAnimationFrameKey] = undefined;
    }
  }

  unattachComponent(componentName: any) {
    if (this.timeOuts[componentName]) {
      for (let key in this.timeOuts[componentName]) {
        this.unAttachTimeOut(componentName, key);
      }
    }
    if (this.intervals[componentName]) {
      for (let key in this.intervals[componentName]) {
        this.unAttachInterval(componentName, key);
      }
    }
    if (this.watches[componentName]) {
      for (let key in this.watches[componentName]) {
        this.unAttachWatch(componentName, key);
      }
    }
    if (this.animationFramesRequests[componentName]) {
      for (let key in this.animationFramesRequests[componentName]) {
        this.unAttachAnimationFrameRequest(componentName, key);
      }
    }
    if (componentName === "home") {
      ((window as any).mapService as MapService).leaveMapPage();
      ((window as any).cameraService as CameraService).locked = false;
      ((window as any).cameraService as CameraService).isFlying = false;
    }
  }
}

