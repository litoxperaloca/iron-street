import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import distance from '@turf/distance';
import { Feature, LineString, lineString, point } from '@turf/helpers';
import nearestPointOnLine, { NearestPointOnLine } from '@turf/nearest-point-on-line';
import { MapboxGeoJSONFeature } from 'mapbox-gl';
import {bearing} from "@turf/turf";
import { environment } from 'src/environments/environment';
import axios from 'axios'; // Importa axios o cualquier otra librería HTTP que estés utilizando.
import { timeStamp } from 'console';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class OsrmService {
  lastPosition: {lon:number,lat:number}|null = null;
  lastCurrentStreet!: MapboxGeoJSONFeature | null;
  private positionChangeThreshold: number = 3; // metros.
  lastUserStreets:any[]=[];
  lastestUserLocations:Position[]=[];
  lastestHints:string[]=[];
  lastHeading:number=0;
  positionIndex=0;

  constructor(
  ) { }

  public async getOsrmGeoLocation(userPosition: Position): Promise<any> {
    try {
      this.lastestUserLocations.push(userPosition);
      if(this.lastestUserLocations.length>10){
        this.lastestUserLocations.shift();
      }
        let coordinates:string =  this.lastestUserLocations.map(position => `${position.coords.longitude},${position.coords.latitude}`).join(';');
        let timestamps = this.lastestUserLocations.map(position=> `${Number(String(position.timestamp).slice(0, 10))}`).join(";");
        //let radiuses = this.lastestUserLocations.map(position=> `${position.coords.accuracy}`).join(";");
        //let hints = this.lastestHints.map(hint=> `${hint}`).join(";");
       // let url = `https://api.ironstreet.com.uy/match/v1/driving/${coordinates}?tidy=true&timestamps=${timestamps}&radiuses=${radiuses}&steps=false&geometries=geojson&overview=full&annotations=true`;
        let url = `https://geo.ironstreet.com.uy/match`;
  
        //let url = `https://api.ironstreet.com.uy/nearest/v1/driving/${userPosition.coords.longitude},${userPosition.coords.latitude}.json`;
        const parms = {
          coordinates: coordinates,
          timestamps: timestamps
        }
        const data = await this.doGet(url,parms);
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
        // Verifica si la respuesta contiene coincidencias y ajusta la posición.
          const response:any = {
            lat: lat,
            lng: lon,
            roadName: roadName,
            maxspeed:maxspeed,
            cameras:cameras,
            heading: heading,
            currentFeature: currentFeature,
            streetId: streetId,
            speed: userPosition.coords.speed,
            accuracy: userPosition.coords.accuracy,
            altitude: userPosition.coords.altitude,
            timeStamp: userPosition.timestamp 
          }
          return response;
        }
      
    } catch (error) {
      console.error('Error al ajustar la posición con OSRM:', error);
      // En caso de error, devuelve la posición original.
      const response:any =     {
        lat: userPosition.coords.latitude,
        lng: userPosition.coords.longitude,
        roadName: null,
        maxspeed:null,
        cameras:[],
        heading: userPosition.coords.heading,
        currentFeature: null,
        streetId: null,
        speed: userPosition.coords.speed,
        accuracy: userPosition.coords.accuracy,
        altitude: userPosition.coords.altitude,
        timeStamp: userPosition.timestamp 
       }
       return response;
    }
  }


  public async getMatchedPosition(userPosition: Position): Promise<any> {
    try {
      this.lastestUserLocations.push(userPosition);
      if(this.lastestUserLocations.length>10){
        this.lastestUserLocations.shift();
      }
        let coordinates:string =  this.lastestUserLocations.map(position => `${position.coords.longitude},${position.coords.latitude}`).join(';');
        let timestamps = this.lastestUserLocations.map(position=> `${Number(String(position.timestamp).slice(0, 10))}`).join(";");
        //let radiuses = this.lastestUserLocations.map(position=> `${position.coords.accuracy}`).join(";");
        //let hints = this.lastestHints.map(hint=> `${hint}`).join(";");
       // let url = `https://api.ironstreet.com.uy/match/v1/driving/${coordinates}?tidy=true&timestamps=${timestamps}&radiuses=${radiuses}&steps=false&geometries=geojson&overview=full&annotations=true`;
        let url = `https://geo.ironstreet.com.uy/match`;
  
        //let url = `https://api.ironstreet.com.uy/nearest/v1/driving/${userPosition.coords.longitude},${userPosition.coords.latitude}.json`;
        const parms = {
          coordinates: coordinates,
          timestamps: timestamps
        }
        const data = await this.doGet(url,parms);
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
        // Verifica si la respuesta contiene coincidencias y ajusta la posición.
          const response:any = {
            lat: lat,
            lng: lon,
            roadName: roadName,
            maxspeed:maxspeed,
            cameras:cameras,
            heading: heading,
            currentFeature: currentFeature,
            streetId: streetId,
            speed: userPosition.coords.speed,
            accuracy: userPosition.coords.accuracy,
            altitude: userPosition.coords.altitude,
            timeStamp: userPosition.timestamp 
          }
          return response;
        }
      
    } catch (error) {
      console.error('Error al ajustar la posición con OSRM:', error);
      // En caso de error, devuelve la posición original.
      const response:any =     {
        lat: userPosition.coords.latitude,
        lng: userPosition.coords.longitude,
        roadName: null,
        maxspeed:null,
        cameras:[],
        heading: userPosition.coords.heading,
        currentFeature: null,
        streetId: null,
        speed: userPosition.coords.speed,
        accuracy: userPosition.coords.accuracy,
        altitude: userPosition.coords.altitude,
        timeStamp: userPosition.timestamp 
       }
       return response;
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
}