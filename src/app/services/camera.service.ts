import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import { MapService } from './map.service';
import { WindowService } from './window.service';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  locked: boolean = false;
  isFlying: boolean = false;

  setCameraMode(cameraMode: string) {
    throw new Error('Method not implemented.');
  }

  constructor(private mapservice: MapService, private windowService: WindowService) { }

  async setCameraSKYPosition(position: Position) {
    if (!position || !position.coords) {
      return;
    }
    if (!this.locked && !this.isFlying) {
      const self = this;
      self.locked = true;
      self.isFlying = true;
      const map = ((window as any).mapService as MapService).getMap();
      if (!map) {
        return;
      }
      map.flyTo({

        center: [position.coords.longitude,
        position.coords.latitude],
        zoom: 15,
        speed: 1,
        //curve: 1,
        easing(t: number) {
          return t;
        },
        essential: true,
        pitch: 0,
        bearing: 0
      });
      map.once('moveend', () => {
        self.locked = false;
        self.isFlying = false;
      })
    }
  }

  async setCameraPOVPosition(position: Position) {
    if (!position || !position.coords) {
      return;
    }
    if (!this.locked && !this.isFlying) {
      const self = this;
      self.locked = true;
      self.isFlying = true;
      const map = ((window as any).mapService as MapService).getMap();
      if (!map) {
        return;
      }
      map.flyTo({

        center: [position.coords.longitude,
        position.coords.latitude],
        zoom: 17,
        speed: 1,
        //curve: 1,
        easing(t: number) {
          return t;
        },
        essential: true,
        pitch: 55,
        bearing: position.coords.heading as number
      });
      map.once('moveend', () => {
        self.locked = false;
        self.isFlying = false;
      })
    }
  }

  rotateCamera(timestamp: number) {
    // Calculate the camera's next longitude and latitude
    const lng = (timestamp / 25) % 360 - 180;
    const lat = 0; // Keep the latitude constant
    const map = ((window as any).mapService as MapService).getMap();
    if (!map) {
      return;
    }
    // Update the map's center to create a rotation effect
    map.setCenter([lng, lat]);

    // Request the next frame of the rotation
    const req: any = requestAnimationFrame(((window as any).mapService as MapService).rotateCamera);
    this.windowService.attachedAnimationFrameRequest("home", "cameraService_rotateCamera", req);
  }

  async updateCameraFromUserPosition(location: any) {
    if (!this.locked && !this.isFlying) {
      const self = this;
      self.locked = true;
      self.isFlying = true;
      const map = ((window as any).mapService as MapService).getMap();
      if (!map) {
        return;
      }
      map.flyTo({
        center: location,
        //zoom: 19,
        //minZoom: 19,
        speed: 1,
        //pitch: 80,
        //bearing: newRotation,
        essential: true,
        easing(t) {
          return t;
        }
      });
      map.once('moveend', () => {
        self.locked = false;
        self.isFlying = false;
      })
    }

  }
  async lockCameraAtPosition(location: any, bearing: number) {
    // Lock the camera at the user's position
    const self = this;
    self.locked = true;
    self.isFlying = true;
    const map = ((window as any).mapService as MapService).getMap();
    if (!map) {
      return;
    }
    if (map.isMoving()) {
      map.stop();
    }
    map.flyTo({
      center: location.geometry.coordinates,
      zoom: 17,
      minZoom: 17,
      speed: 1,
      pitch: 55,
      bearing: bearing,
      essential: true,
      easing(t) {
        // console.log(t);
        return t;
      }
    })
    map.once('moveend', () => {
      self.locked = false;
      self.isFlying = false;
    })

  }

  async updateCameraFirstUserPosition(location: any) {
    if (!this.locked && !this.isFlying) {
      const self = this;
      self.locked = true;
      self.isFlying = true;
      const map = ((window as any).mapService as MapService).getMap();
      if (!map) {
        return;
      }
      map.flyTo({
        center: location,
        zoom: 16,
        //minZoom: 19,
        speed: 1.5,
        pitch: 0,
        bearing: 0,
        essential: true,
        easing(t) {
          // console.log(t);

          return t;
        }
      });
      map.once('moveend', () => {
        self.locked = false;
        self.isFlying = false;
      })
    }

  }

  async updateCameraForUserMarkerFirstGeoEvent(position: [number, number], mapBearing: number) {
    if (!this.locked && !this.isFlying) {
      const self = this;
      self.locked = true;
      self.isFlying = true;
      const map = ((window as any).mapService as MapService).getMap();
      if (!map) {
        return;
      }
      map.flyTo({
        center: position,
        zoom: 17,
        animate: true,
        duration: 400,
        //minZoom: 19,
        //speed: 1.5,
        pitch: 55,
        bearing: mapBearing,
        essential: true,
        easing(t) {
          // console.log(t);

          return t;
        }
      });
      map.once('moveend', () => {
        self.locked = false;
        self.isFlying = false;
      })
    }
  }


  async updateCameraForUserMarkerGeoEvent(position: [number, number], mapBearing: number) {
    if (!this.locked && !this.isFlying) {
      const self = this;
      self.locked = true;
      self.isFlying = true;
      const map = ((window as any).mapService as MapService).getMap();
      if (!map) {
        return;
      }
      map.flyTo(
        {
          animate: true,
          duration: 400,
          //minZoom: 19,
          //speed: 1.5,
          essential: true,
          //minZoom: 19,
          center: position,
          bearing: mapBearing
        }
      );
      /*self.locked = false;
      self.isFlying = false;*/
      map.once('moveend', () => {
        self.locked = false;
        self.isFlying = false;
      })
    }

  }
}
