import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import { MapboxGeoJSONFeature } from 'mapbox-gl';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import {DeviceDataService} from './device-data.service';
@Injectable({
  providedIn: 'root'
})
export class ValhallaDirectionsApiService {

  constructor(private deviceDataService:DeviceDataService
  ) { }

  async doGet(url: string, params: Record<string, string>): Promise<HttpResponse> {
    const options = {
      url: url,
      headers: { },
      params: params,
    };

    return await CapacitorHttp.get(options);
  };

  public async getRouteForWaypoints(waypoints:number[][]): Promise<any> {
    try {
      let uuid= this.deviceDataService.uuid;
      if(!uuid){
        uuid=await this.deviceDataService.deviceId();
      }
         let locations:string =  waypoints.map(position => `${position[0]},${position[1]}`).join(';');

         let url = `https://geo.ironstreet.com.uy/traceRouteValhalla`;
        const parms = {
          locations: locations,
          n:uuid.identifier,
        }
        const data = await this.doGet(url,parms);
        //console.log(data);
          //console.log(data);
        if(data){
          return data;
        }
      
    } catch (error) {
      console.error('Error al bUSCAR RUTAS VALHALLA:', error);
       throw error;
    }
  }

}