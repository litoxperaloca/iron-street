import { Injectable } from '@angular/core';
import { Device, DeviceId } from '@capacitor/device';

@Injectable({
  providedIn: 'root'
})
export class DeviceDataService {

  constructor() { }

  async deviceId():Promise<DeviceId>{
    const id = await Device.getId();
    return id;
  }

  async deviceInfo(){
    const info = await Device.getInfo();
    return info;
  };

  async logBatteryInfo(){
    const info = await Device.getBatteryInfo();

    return info;
  };
}
