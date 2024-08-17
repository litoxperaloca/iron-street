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

  async locationUpdate() {
     const userPosition:Position = ((window as any).geoLocationService as GeoLocationService).getLastCurrentLocation();
    if(userPosition){
      this.snapToRoadUsingMiddleServer(userPosition);
    }
  }

  async getMapboxStreetFeature(lastTracepoint:any,osrmStreetName:string){
    const map = ((window as any).mapService as MapService).getMap();
    if (lastTracepoint && lastTracepoint.location) {
      const snappedPosition:[number,number] = lastTracepoint.location; // This is the snapped coordinate [lon, lat]
  
      // Extract the street name from OSRM response
      const roadName = osrmStreetName; // Adjust as needed to get the road name
  
      // Assuming you have a Mapbox layer with features
      const features:MapboxGeoJSONFeature[] = map.querySourceFeatures('maxspeedDataSource', { sourceLayer: 'export_1-12rpm8' ,filter: ['==', 'name', osrmStreetName]}) as MapboxGeoJSONFeature[];
  
      // Filter features by road name
      const matchingFeatures = features.filter(feature => {
          return feature.properties && feature.geometry.type === 'LineString' && feature.properties["name"] === roadName;
      });
      let nearestFeature = null;
      let minDistance = Infinity;
      if (matchingFeatures.length === 0) {
          console.log('No matching street name found.');
         
      } else {

  
          matchingFeatures.forEach(feature => {
              if(feature.geometry.type==="LineString"){
                const line = lineString(feature.geometry.coordinates);
                const snappedPoint = point(snappedPosition);
    
                // Find the nearest point on the line
                const nearestPoint = nearestPointOnLine(line, snappedPoint);
                if(nearestPoint.geometry.type==="Point"){
                  const distanceInMeters = distance(snappedPoint, nearestPoint, { units: 'meters' });
                  // Track the closest feature
                  if (distanceInMeters < minDistance) {
                    minDistance = distanceInMeters;
                    nearestFeature = feature;
                  }
                }
              }
          });
  
          if (!nearestFeature) {
            const speedService = ((window as any).speedService as SpeedService);
            nearestFeature = await speedService.getSpeedDataFromArroundIncludesName(osrmStreetName,snappedPosition);
              if (nearestFeature) {
                nearestFeature = speedService.wayToGeoJsonFeature(nearestFeature) as MapboxGeoJSONFeature;
              }
          }
            let homePage = ((window as any).homePage as HomePage);
            if(nearestFeature && !homePage.shouldEndSimulation){
              //nearestFeature = this.chooseBestClosestFeatureForSnap(closestFeature,minDistance,alternativesWithSameName,osrmLastMatch);
              return nearestFeature;
  
            }
            return nearestFeature;          }
      
  } else {
      console.log('No valid last tracepoint found.');
  }

  }

  async snapNewPositionOSRMmatch(userPosition:Position):Promise<void>{
    this.lastestUserLocations.push(userPosition);
    if(this.lastestUserLocations.length<2){
      return;
    }
    if(this.lastestUserLocations.length>5){
      this.lastestUserLocations.shift();
    }
      let coordinates:string =  this.lastestUserLocations.map(position => `${position.coords.longitude},${position.coords.latitude}`).join(';');
      let timestamps = this.lastestUserLocations.map(position=> `${Number(String(position.timestamp).slice(0, 10))}`).join(";");
      //let radiuses = this.lastestUserLocations.map(position=> `${position.coords.accuracy}`).join(";");
      //let hints = this.lastestHints.map(hint=> `${hint}`).join(";");
     // let url = `https://api.ironstreet.com.uy/match/v1/driving/${coordinates}?tidy=true&timestamps=${timestamps}&radiuses=${radiuses}&steps=false&geometries=geojson&overview=full&annotations=true`;
      let url = `https://api.ironstreet.com.uy/match/v1/driving/${coordinates}?timestamps=${timestamps}&steps=true&geometries=geojson`;

      //let url = `https://api.ironstreet.com.uy/nearest/v1/driving/${userPosition.coords.longitude},${userPosition.coords.latitude}.json`;
      
      const data = await this.osmService.doGet(url,{});
        //console.log(data);
        if(data.data){
          const locationsCount:number=data.data.tracepoints.length;
          const lastMatch:any=data.data.tracepoints[locationsCount-1];
          this.lastOSRMmatchesLocations.push(lastMatch);
          if(this.lastOSRMmatchesLocations.length>5){
            this.lastOSRMmatchesLocations.slice();
          }
          /*this.lastestHints.push(data.data.waypoints[0].hint);
          if(this.lastestHints.length>5){
            this.lastestHints.shift();
          }*/
            const tracepoint= lastMatch;
            // Set snapedPos
        const snapedPos = {
          lat: tracepoint.location[1],
          lon: tracepoint.location[0],
      };
      
      const roadName = tracepoint.name;
      const currentFeature:MapboxGeoJSONFeature = await this.getMapboxStreetFeature(tracepoint,roadName)
      let maxspeed = null;
      let newHeading = null;
      let useStreetHeading=true;
      let instantUpdate=false;
      let userMoved:boolean=false;
      if(currentFeature && currentFeature.properties){
        maxspeed = currentFeature.properties['maxspeed'];
        const mapService = ((window as any).mapService as MapService);
        mapService.setUserCurrentStreet(currentFeature);
        const speedService = ((window as any).speedService as SpeedService);
     
   
        if(this.lastPosition){
          userMoved=this.hasMoved([this.lastPosition.lon,this.lastPosition.lat],[snapedPos.lon,snapedPos.lat],userPosition.coords.accuracy)
          newHeading = this.calculateHeading(this.lastPosition, snapedPos);
          if(newHeading){
            const diffHeadingsInDeg:number=this.calculateHeadingDifference(this.lastHeading,newHeading);
            let speed = userPosition.coords.speed;
            if(!speed)speed = 0;
            const shouldUseNewHeading = this.shouldUseCalculatedHeading(userMoved,diffHeadingsInDeg,speed)
            if(shouldUseNewHeading){
              useStreetHeading=false;
            }else{
              useStreetHeading=true;
            }
            this.lastHeading=newHeading;
            
          }
        }
        let setInitialStreetsConfData=false;
        if(!speedService.lastCurrentStreet){
          setInitialStreetsConfData=true;
          if(!userMoved){
            userMoved=true; //Es la primera vez que ubicare al usuario en una calle, entonces actualizo camara
          }
        }
        speedService.lastCurrentStreet=currentFeature;
        const smothedPosition:Position = {
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
      geoLocationService.setLastCurrentPosition(smothedPosition);
          const trafficAlertService = ((window as any).trafficAlertService as TrafficAlertServiceService);
          if(setInitialStreetsConfData){
            await trafficAlertService.setCamerasStreetName();
          }
          trafficAlertService.checkAlertableObjectsOnNewUserPosition(smothedPosition);
        }
        const homePage:HomePage = ((window as any).homePage as HomePage);
        if(currentFeature && currentFeature.properties){
          homePage.currentMaxSpeed = Number.parseInt(currentFeature.properties["maxspeed"]);

        }

        if(homePage && homePage.shouldEndSimulation){
          instantUpdate=true;
          useStreetHeading=true;
          homePage.shouldEndSimulation=false;

        }
        
        this.lastPosition=snapedPos;
      // Return the result object
  
        const sensorService = ((window as any).sensorService as SensorService);
        if(newHeading){
          sensorService.updateSnapToRoadPositionOSRM([snapedPos.lon,snapedPos.lat], currentFeature, snapedPos,useStreetHeading,userMoved,instantUpdate,newHeading);
        }else{
          sensorService.updateSnapToRoadPositionOSRM([snapedPos.lon,snapedPos.lat], currentFeature, snapedPos,true,userMoved,instantUpdate,0);

        
      }
      
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
    if(this.lastestUserLocations.length<2){
      return;
    }
    if(this.lastestUserLocations.length>5){
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
          const locationsCount:number=data.data.tracepoints.length;
          const lastMatch:any=data.data.lastTracePoint;
          this.lastOSRMmatchesLocations.push(lastMatch);
          if(this.lastOSRMmatchesLocations.length>5){
            this.lastOSRMmatchesLocations.slice();
          }
          /*this.lastestHints.push(data.data.waypoints[0].hint);
          if(this.lastestHints.length>5){
            this.lastestHints.shift();
          }*/
            const tracepoint= lastMatch;
            // Set snapedPos
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
      const currentFeature:MapboxGeoJSONFeature = await this.getMapboxStreetFeature(tracepoint,roadName)
      const newHeading = heading;
      let useStreetHeading=true;
      let instantUpdate=false;
      let userMoved:boolean=false;
      if(currentFeature){
        const mapService = ((window as any).mapService as MapService);
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
        const setInitialStreetsConfData=false;
        if(!speedService.lastCurrentStreet){
          if(!userMoved){
            userMoved=true; //Es la primera vez que ubicare al usuario en una calle, entonces actualizo camara
          }
        }
        speedService.lastCurrentStreet=currentFeature;
        const smothedPosition:Position = {
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
      geoLocationService.setLastCurrentPosition(smothedPosition);
          const trafficAlertService = ((window as any).trafficAlertService as TrafficAlertServiceService);
          //trafficAlertService.checkAlertableObjectsOnNewUserPosition(smothedPosition);
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
    
          const sensorService = ((window as any).sensorService as SensorService);
          if(newHeading){
            sensorService.updateSnapToRoadPositionOSRM([snapedPos.lon,snapedPos.lat], currentFeature, snapedPos,useStreetHeading,userMoved,instantUpdate,newHeading);
          }else{
            sensorService.updateSnapToRoadPositionOSRM([snapedPos.lon,snapedPos.lat], currentFeature, snapedPos,true,userMoved,instantUpdate,0);
  
          
        }
    
      
      
    }
    
  }
}
