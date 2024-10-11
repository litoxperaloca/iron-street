import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import { MapboxGeoJSONFeature } from 'mapbox-gl';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import {DeviceDataService} from './device-data.service';

@Injectable({
  providedIn: 'root',
})
export class OsrmService {
  lastPosition: {lon:number,lat:number}|null = null;
  lastCurrentStreet!: MapboxGeoJSONFeature | null;
  private positionChangeThreshold: number = 3; // metros.
  lastUserStreets:any[]=[];
  lastestUserLocations:Position[]=[];
  lastestUserLocationsSnaped:Position[]=[];
  lastestHints:string[]=[];
  lastHeading:number=0;
  positionIndex=0;

  constructor(private deviceDataService:DeviceDataService
  ) { }

  public clear(){
    this.lastPosition = null;
    this.lastCurrentStreet= null;
    this.lastUserStreets=[];
    this.lastestUserLocations=[];
    this.lastestUserLocationsSnaped=[];
    this.lastestHints=[];
    this.lastHeading=0;
    this.positionIndex=0;
  }

  public async getMatchedPosition(userPosition: Position): Promise<any> {
    try {
      let uuid= this.deviceDataService.uuid;
      if(!uuid){
        uuid=await this.deviceDataService.deviceId();
      }
      console.log(uuid);
      this.lastestUserLocations.push(userPosition);
      if(this.lastestUserLocations.length>20){
        this.lastestUserLocations.shift();
      }
        //let coordinates:string =  coordinatesToSend.map(position => `${position.coords.longitude},${position.coords.latitude}`).join(';');
        //let timestamps = coordinatesToSend.map(position=> `${Number(String(position.timestamp).slice(0, 10))}`).join(";");

        let coordinates:string =  this.lastestUserLocations.map(position => `${position.coords.longitude},${position.coords.latitude}`).join(';');

        let timestamps = this.lastestUserLocations.map(position=> `${Number(String(position.timestamp).slice(0, 10))}`).join(";");
        //let radiuses = this.lastestUserLocations.map(position=> `${position.coords.accuracy}`).join(";");
        //let hints = this.lastestHints.map(hint=> `${hint}`).join(";");
       // let url = `https://api.ironstreet.com.uy/match/v1/driving/${coordinates}?tidy=true&timestamps=${timestamps}&radiuses=${radiuses}&steps=false&geometries=geojson&overview=full&annotations=true`;
        let url = `https://geo.ironstreet.com.uy/snapValhalla`;
        let aux = userPosition.coords.speed;
        if(aux==null){
          aux=0;
        }
        let current = Math.round(aux * 60 * 60 / 1000);
        //let url = `https://api.ironstreet.com.uy/nearest/v1/driving/${userPosition.coords.longitude},${userPosition.coords.latitude}.json`;
        const parms = {
          coordinates: coordinates,
          timestamps: timestamps,
          n:uuid.identifier,
          speed:''+current
        }
        const data = await this.doGet(url,parms);
        console.log(data);
          //console.log(data);
        if(data.data){
          const tracepoint= data.data.lastTracePoint;
          const roadName = tracepoint.name;
          const lon = tracepoint.location[0];
          const lat = tracepoint.location[1];
          const maxspeed = tracepoint.maxSpeed;
          const cameras = tracepoint.cameras;
          const heading = tracepoint.bearing;
          const currentFeature = tracepoint.feature;
          const streetId = tracepoint.firstId;
          const segments = tracepoint.segments;

        // Verifica si la respuesta contiene coincidencias y ajusta la posición.
          const response:any = {
            lat: lat,
            lon: lon,
            roadName: roadName,
            maxspeed:maxspeed,
            cameras:cameras,
            heading: heading,
            currentFeature: currentFeature,
            segments:segments,
            streetId: streetId,
            speed: userPosition.coords.speed,
            accuracy: userPosition.coords.accuracy,
            altitude: userPosition.coords.altitude,
            timestamp: userPosition.timestamp,
            totalKm: data.data.totalKm,
            totalSpeedViolations: data.data.totalSpeedViolations,
            isOverSpeeding:data.data.isOverSpeeding
          }
          return response;
        }
      
    } catch (error) {
      console.error('Error al ajustar la posición con OSRM:', error);
      this.clear();
      throw error;
    }
  }

  async doGet(url: string, params: Record<string, string>): Promise<HttpResponse> {
    const options = {
      url: url,
      headers: { },
      params: params,
    };

    return await CapacitorHttp.get(options);
  };

  public async getRouteForWaypoints(waypoints:[]): Promise<any> {
    try {
      let uuid= this.deviceDataService.uuid;
      if(!uuid){
        uuid=await this.deviceDataService.deviceId();
      }
        //let coordinates:string =  coordinatesToSend.map(position => `${position.coords.longitude},${position.coords.latitude}`).join(';');
        //let timestamps = coordinatesToSend.map(position=> `${Number(String(position.timestamp).slice(0, 10))}`).join(";");

        let locations:string =  waypoints.map(position => `${position[0]},${position[1]}`).join(';');

        //let radiuses = this.lastestUserLocations.map(position=> `${position.coords.accuracy}`).join(";");
        //let hints = this.lastestHints.map(hint=> `${hint}`).join(";");
       // let url = `https://api.ironstreet.com.uy/match/v1/driving/${coordinates}?tidy=true&timestamps=${timestamps}&radiuses=${radiuses}&steps=false&geometries=geojson&overview=full&annotations=true`;
        let url = `https://geo.ironstreet.com.uy/traceRouteValhalla`;
        const parms = {
          locations: locations,
          n:uuid.identifier,
        }
        const data = await this.doGet(url,parms);
        console.log(data);
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