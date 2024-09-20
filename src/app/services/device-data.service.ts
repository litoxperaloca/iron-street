import { Injectable } from '@angular/core';
import { Device, DeviceId } from '@capacitor/device';

@Injectable({
  providedIn: 'root'
})
export class DeviceDataService {
  public uuid:DeviceId|null=null;
  constructor() {
   }

  async deviceId():Promise<DeviceId>{
    if(this.uuid){
      return this.uuid;
    }else{
      const id = await Device.getId();
      this.uuid=id;
      return id;
    }
    
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
