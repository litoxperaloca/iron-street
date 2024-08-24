import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import distance from '@turf/distance';
import { Feature, LineString, lineString, point } from '@turf/helpers';
import nearestPointOnLine, { NearestPointOnLine } from '@turf/nearest-point-on-line';
import { MapboxGeoJSONFeature } from 'mapbox-gl';
import { GeoLocationService } from './geo-location.service';
import { MapService } from './map.service';
import { OsmService } from './osm.service';
import { SensorService } from './sensor.service';
import { retry } from 'rxjs';
import { MapboxService } from './mapbox.service';
import { TrafficAlertServiceService } from './traffic-alert-service.service';
import { HomePage } from '../pages/home/home.page';
import {bearing} from "@turf/turf";
import { SpeedService } from './speed.service';
import { environment } from 'src/environments/environment';
import { trace } from 'node:console';
//import distance from '@turf/distance';
interface Way {
  id: number,
  geometry: [{ lat: number, lon: number }],
  tags: {
    '@id': string,
    maxspeed: number,
    name: string,
    highway: string,
    'source:maxspeed': string
  },
  type: 'way',
  bounds: {
    minlat: number,
    minlon: number,
    maxlat: number,
    maxlon: number
  },
  nodes: Array<number>
}

@Injectable({
  providedIn: 'root',
})
export class SnapService {
  lastPosition: {lon:number,lat:number}|null = null;
  lastCurrentMaxSpeed!: number;
  lastCurrentSpeed!: number;
  lastCurrentMaxSpeedOsmObj!: any;
  dataLoaded: boolean = false;
  data: any = [];
  lastCurrentStreet!: MapboxGeoJSONFeature | null;
  private positionChangeThreshold: number = 3; // metros.
  lastUserStreets:any[]=[];
  lastestUserLocations:Position[]=[];
  lastestHints:string[]=[];
  lastOSRMmatchesLocations:any[]=[];
  lastHeading:number=0;

  constructor(
    private mapService: MapService,
    private geoLocationService: GeoLocationService,
    private sensorService: SensorService,
    private osmService: OsmService,
    private mapboxService: MapboxService,
    private trafficAlertService: TrafficAlertServiceService
  ) { }

  
  convertSpeedToKmh(speed: number): number {
    return speed * 3.6; // Convert speed from meters per second to kilometers per hour
  }

  calculateBbox(latitude: number, longitude: number, radius: number): [[number, number], [number, number]] {
    const earthRadius = 6371; // Earth's radius in kilometers
    const latOffset = (radius / earthRadius) * (180 / Math.PI);
    const lonOffset = (radius / (earthRadius * Math.cos(Math.PI * latitude / 180))) * (180 / Math.PI);
    return [
      [longitude - lonOffset, latitude - latOffset],
      [longitude + lonOffset, latitude + latOffset],
    ];
  }

  async locationUpdate(userPosition:Position){
    if(userPosition){
      this.snapToRoadUsingMiddleServer(userPosition);
    }
  }

  shouldUseCalculatedHeading(userMoved:boolean, diffHeadingsInDeg:number, speed:number) {
    let threshold = speed > environment.snapServiceConf.speedThreeholdForHeadingTop ? environment.snapServiceConf.maxValidHeadingChangeInDegForTopSpeedThreehold : speed < environment.snapServiceConf.speedThreeholdForHeadingBottom ? environment.snapServiceConf.maxValidHeadingChangeInDegForBottomSpeedThreehold : environment.snapServiceConf.maxValidHeadingChangeDefault;

    if (userMoved && diffHeadingsInDeg <= threshold && speed > environment.snapServiceConf.minValidSpeedForMovement) {
        return true;  // Usar heading calculado por GPS
    } else {
        return false; // Usar heading de la calle
    }
}

 calculateHeading(previousPosition:{lon:number,lat:number}, snapedPos:{lon:number,lat:number}) {
    const from = point([previousPosition.lon, previousPosition.lat]);
    const to = point([snapedPos.lon, snapedPos.lat]);
    const heading = bearing(from, to);

    return heading;
  }

  hasMoved(previousPosition: [number,number], currentPosition: [number,number], accuracy:number) {
    if (!previousPosition || !currentPosition) {
        return false; // No previous position to compare
    }

    // Calculate distance between previous and current positions
    const from = point(previousPosition);
    const to = point(currentPosition);
    const distanceInMeters = distance(from, to, { units: 'meters' });

    // Check if the distance exceeds the movement threshold
    return distanceInMeters > environment.snapServiceConf.distanceToConsiderMovementInMeters && accuracy < environment.snapServiceConf.maxValidAccuracy; // Assuming 50 meters as acceptable GPS accuracy
  }

  calculateHeadingDifference(heading1:number, heading2:number) {
      // Normalize the headings to be between 0 and 360 degrees
      heading1 = (heading1 + 360) % 360;
      heading2 = (heading2 + 360) % 360;

      // Calculate the absolute difference
      let difference = Math.abs(heading1 - heading2);

      // Adjust to make sure the difference is between 0 and 180 degrees
      if (difference > 180) {
          difference = 360 - difference;
      }

      return difference;
  }

  async snapToRoadUsingMiddleServer(userPosition:Position):Promise<void>{
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
      const data = await this.osmService.doGet(url,parms);
        //console.log(data);
        if(data.data){
          const lastMatch:any=data.data.lastTracePoint;
          this.lastOSRMmatchesLocations.push(lastMatch);
          if(this.lastOSRMmatchesLocations.length>10){
            this.lastOSRMmatchesLocations.shift();
          }
            const tracepoint= lastMatch;
      const snapedPos = {
          lat: tracepoint.location[1],
          lon: tracepoint.location[0],
      };
      
      const roadName = tracepoint.name;
      const lon = tracepoint.location[0];
      const lat = tracepoint.location[1];
      const maxspeed = tracepoint.maxSpeed;
      const cameras = tracepoint.cameras;
      const heading = tracepoint.bearing;
      const currentFeature = tracepoint.feature;
      const newHeading = heading;
      const streetId = tracepoint.firstId;
      const sensorService = ((window as any).sensorService as SensorService);
      let useStreetHeading=true;
      let instantUpdate=false;
      let userMoved:boolean=false;
      

      if(currentFeature){
        const mapService = ((window as any).mapService as MapService);
        mapService.setStreetFeature(currentFeature);
        mapService.setUserCurrentStreet(currentFeature);
        const speedService = ((window as any).speedService as SpeedService);
     
   
        if(this.lastPosition){
          userMoved=this.hasMoved([this.lastPosition.lon,this.lastPosition.lat],[snapedPos.lon,snapedPos.lat],userPosition.coords.accuracy)
          if(newHeading){
            //const diffHeadingsInDeg:number=this.calculateHeadingDifference(this.lastHeading,newHeading);
            let speed = userPosition.coords.speed;
            if(!speed)speed = 0;
            const shouldUseNewHeading=true;
            //const shouldUseNewHeading = this.shouldUseCalculatedHeading(userMoved,diffHeadingsInDeg,speed)
            if(shouldUseNewHeading){
              useStreetHeading=false;
            }else{
              useStreetHeading=true;
            }
            this.lastHeading=newHeading;
            
          }
        }
        if(!speedService.lastCurrentStreet){
          if(!userMoved){
            userMoved=true; //Es la primera vez que ubicare al usuario en una calle, entonces actualizo camara
          }
        }
        speedService.lastCurrentStreet=currentFeature;
        const smoothedPosition:Position = {
          coords: {
              latitude: snapedPos.lat,
              longitude: snapedPos.lon,
              altitude: userPosition.coords.altitude, // Set to null unless you have this data
              accuracy: userPosition.coords.accuracy, // Set to null or provide an accuracy value if known
              altitudeAccuracy: userPosition.coords.altitudeAccuracy,
              heading: newHeading, // Set to null or provide heading if known
              speed: userPosition.coords.speed // Set to null or provide speed if known
          },
          timestamp: userPosition.timestamp // Use current timestamp or a specific one
      };
      const geoLocationService:GeoLocationService = ((window as any).geoLocationService as GeoLocationService);
      geoLocationService.setLastCurrentPosition(smoothedPosition);
      if (((window as any).mapService as MapService).isRotating) {
        /*((window as any).mapService as MapService).setFirstGeo([lon,lat],heading);
        userMoved=true;
        isFirstGeo=true;*/
        ((window as any).mapService as MapService).updateMarkerState([lon,lat],mapService.userCurrentStreetHeading);
        return;
      }
      const trafficAlertService = ((window as any).trafficAlertService as TrafficAlertServiceService);
      trafficAlertService.checkAlertableObjectsOnNewUserPositionFromArray(smoothedPosition,roadName,cameras);
        }
        const homePage:HomePage = ((window as any).homePage as HomePage);
          homePage.currentMaxSpeed = Number.parseInt(maxspeed);
        
          if(homePage && homePage.shouldEndSimulation){
            instantUpdate=true;
            useStreetHeading=true;
            homePage.shouldEndSimulation=false;
  
          }
          
          this.lastPosition=snapedPos;
        // Return the result object
         
            if(newHeading){
              sensorService.updateSnapToRoadPositionOSRM([snapedPos.lon,snapedPos.lat], currentFeature, snapedPos,useStreetHeading,userMoved,instantUpdate,newHeading);
            }else{
              sensorService.updateSnapToRoadPositionOSRM([snapedPos.lon,snapedPos.lat], currentFeature, snapedPos,true,userMoved,instantUpdate,0);
              
            }

    
      
      
    }
    
  }
}
