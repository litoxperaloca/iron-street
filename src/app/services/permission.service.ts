import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  constructor() { }

  async checkPermission(permission: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (permission === 'geolocation') {
        if ('geolocation' in navigator) {
          navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
            if (permissionStatus.state === 'granted') {
              resolve(true);
            } else {
              resolve(false);
            }
          });
        } else {
          resolve(false);
        }
      } else if (permission === 'camera') {
        navigator.permissions.query({ name: 'video' as PermissionName }).then(permissionStatus => {
          if (permissionStatus.state === 'granted') {
            resolve(true);
          } else {
            resolve(false);
          }
        });
      }
    });
  }
}
