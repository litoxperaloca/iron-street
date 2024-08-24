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
import { SnapService } from './snap.service';

import { retry } from 'rxjs';
import { MapboxService } from './mapbox.service';
import { TrafficAlertServiceService } from './traffic-alert-service.service';
import { HomePage } from '../pages/home/home.page';
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
export class SpeedService {
  lastPosition!: Position;
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

  constructor(
    private mapService: MapService,
    private geoLocationService: GeoLocationService,
    private sensorService: SensorService,
    private osmService: OsmService,
    private mapboxService: MapboxService,
    private trafficAlertService: TrafficAlertServiceService,
    private snapService:SnapService
  ) { }


  async getSpeedDataFromArround(pos: [number, number]): Promise<any> {
    const bbox = this.calculateBbox(pos[1], pos[0], 0.5);
    let closestFeature: any;
    await this.osmService.getMaxSpeedData(bbox).then((data) => {
      const maxspeedData = data.data.elements;
      closestFeature = this.findClosestOsmWayFeature(maxspeedData, pos);
      /* await this.saveMaxSpeedData(maxspeed);
       this.dataLoaded = true;
       const dataSaved = this.loadStoredMaxSpeedData();*/
    });
    return closestFeature;
  }

  async getSpeedDataFromArroundIncludesName(streetName:string,pos: [number, number]): Promise<any> {
    const bbox = this.calculateBbox(pos[1], pos[0], 0.5);
    let closestFeature: any;
    await this.osmService.getMaxSpeedData(bbox).then((data) => {
      const maxspeedData = data.data.elements;
      closestFeature = this.findClosestOsmWayFeatureIncludesName(streetName,maxspeedData, pos);
      /* await this.saveMaxSpeedData(maxspeed);
       this.dataLoaded = true;
       const dataSaved = this.loadStoredMaxSpeedData();*/
    });
    return closestFeature;
  }

  async getSpeedDataFromArroundAvailable(pos: [number, number], data:any): Promise<any> {
    const bbox = this.calculateBbox(pos[1], pos[0], 20);
    let closestFeature: any;

      const maxspeedData = data;
      closestFeature = this.findClosestOsmWayFeature(maxspeedData, pos);
      /* await this.saveMaxSpeedData(maxspeed);
       this.dataLoaded = true;
       const dataSaved = this.loadStoredMaxSpeedData();*/
    return closestFeature;
  }

  async getSpeedDataFromArroundOnce(pos: [number, number]): Promise<any> {
    const bbox = this.calculateBbox(pos[1], pos[0], 200);
    let closestFeature: any;
    const data = await  this.osmService.getMaxSpeedDataAvailable(bbox);

      const maxspeedData = data.data.elements;
     return maxspeedData;
  }

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
    const geoLocationService: GeoLocationService = (window as any).geoLocationService as GeoLocationService;
    const userPosition: Position = geoLocationService.getLastCurrentLocation(); // Get user's current location
    if (userPosition === this.lastPosition) {
      return;
    }
    const osrmLastMatch = await this.snapNewPositionOSRMmatch(userPosition);
    let useStreetHeading = true;
    let userMoved = false;
    let setInitialStreetsConfData= false;
    if(this.lastPosition){
      const filteredLat = (userPosition.coords.latitude);
      const filteredLng = (userPosition.coords.longitude);
      /*const distanceFromLastPosition = this.calculateDistance(filteredLat, filteredLng, this.lastPosition.coords.latitude, this.lastPosition.coords.longitude);
      console.log(distanceFromLastPosition);*/
      const distanceFromLastPosition = this.mapboxService.calculateDistance([filteredLng, filteredLat], [this.lastPosition.coords.longitude, this.lastPosition.coords.latitude]);
      //console.log(distanceFromLastPosition);

      if (distanceFromLastPosition > this.positionChangeThreshold) {
        useStreetHeading=false;
        userMoved=true;
      }
    }
    this.lastPosition = userPosition;
    if(!this.lastCurrentStreet){
      setInitialStreetsConfData=true;
      if(!userMoved){
        userMoved=true; //Es la primera vez que ubicare al usuario en una calle, entonces actualizo camara
      }
    }
    const userCurrentStreet = await this.updateUserStreet(userPosition,useStreetHeading,userMoved,osrmLastMatch);
    if (userCurrentStreet && userCurrentStreet.properties) {
      this.lastUserStreets.push(userCurrentStreet);
      (window as any).homePage.currentMaxSpeed = Number.parseInt(userCurrentStreet.properties["maxspeed"]);
      if(setInitialStreetsConfData){
        await this.trafficAlertService.setCamerasStreetName();
      }
      //his.trafficAlertService.checkAlertableObjectsOnNewUserPosition(userPosition);
    }
    
  }


  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distanceFromLastPosition = R * c; // en metros
    return distanceFromLastPosition;
  }

  async updateUserStreet(position: Position,useStreetHeading:boolean,userMoved:boolean,osrmLastMatch:any): Promise<MapboxGeoJSONFeature | undefined> {
    const mapService = ((window as any).mapService as MapService)
    const map = mapService.getMap();

    if (!position || !map.getLayer("maxspeedDataLayer")) {
      mapService.setUserCurrentStreet(null);
      return;
    }

    const userPoint = point([position.coords.longitude, position.coords.latitude]);
    const features:MapboxGeoJSONFeature[] = map.querySourceFeatures('maxspeedDataSource', { sourceLayer: 'export_1-12rpm8' }) as MapboxGeoJSONFeature[];

    if (features.length > 0) {
      const closestFeature = await this.findClosestFeature(features, userPoint,osrmLastMatch);
      mapService.setUserCurrentStreet(closestFeature);
      const homePage = (window as any).homePage as HomePage;
      let instantUpdate:boolean=false;
      if(homePage.shouldEndSimulation){
        instantUpdate=true;
        homePage.shouldEndSimulation=false;
      }
      this.updateSnapToRoadPosition(closestFeature, userPoint,useStreetHeading,userMoved,instantUpdate,osrmLastMatch);
      this.lastCurrentStreet=closestFeature;
      if (closestFeature) return closestFeature;
    }
    return;
  }

  findClosestOsmWayFeature(ways: any[], pointed: [number, number]): any {
    let closestFeature: any | null = null;
    let minDistance = Number.MAX_VALUE;

    ways.forEach(way => {
      if (way.type != "way") return;
      const line = lineString(this.convertCoordsToPosition(way.geometry));
      const nearestPoint = nearestPointOnLine(line, point(pointed));
      const distanced = distance(point(pointed), nearestPoint, { units: 'kilometers' });

      if (distanced < minDistance) {
        minDistance = distanced;
        closestFeature = way;
      }
    });
    //console.log(closestFeature);
    return closestFeature;
  }



  findClosestOsmWayFeatureIncludesName(streetName:string,ways: any[], pointed: [number, number]): any {
    let closestFeature: any | null = null;
    let minDistance = Number.MAX_VALUE;

    ways.forEach(way => {
      if (way.type != "way" ||way.tags['name']!==streetName) return;
      const line = lineString(this.convertCoordsToPosition(way.geometry));
      const nearestPoint = nearestPointOnLine(line, point(pointed));
      const distanced = distance(point(pointed), nearestPoint, { units: 'kilometers' });

      if (distanced < minDistance) {
        minDistance = distanced;
        closestFeature = way;
      }
    });
    //console.log(closestFeature);
    return closestFeature;
  }

  convertCoordsToPosition(coords: [any]): [[number, number]] {
    let pos: any[] = [];
    coords.forEach(coord => {
      pos.push([coord.lon, coord.lat]);
    });
    return pos as [[number, number]];
  }
  private async findClosestFeature(features: MapboxGeoJSONFeature[], userPoint: any, osrmLastMatch:any): Promise<MapboxGeoJSONFeature | null> {
    let closestFeature: MapboxGeoJSONFeature | null = null;
    let minDistance = Number.MAX_VALUE;
    let alternativesWithSameName= new Array();
    let lastUserCurrentStreetBeforeTwoGps:MapboxGeoJSONFeature|null=null;
    if(this.lastUserStreets && this.lastUserStreets.length>=3){
      lastUserCurrentStreetBeforeTwoGps=this.lastUserStreets[this.lastUserStreets.length-3];
    }
    features.forEach(feature => {
      if (feature.geometry!.type === 'LineString') {
        const line = lineString(feature.geometry!.coordinates);
        const pointInLine = nearestPointOnLine(line, userPoint);
        const distancePoints = distance(pointInLine, userPoint, { units: 'kilometers' });
        if(this.lastCurrentStreet 
          && this.lastCurrentStreet.properties
          && feature.properties 
          &&feature.properties['name']===this.lastCurrentStreet.properties['name'] && distancePoints < 0.05){
            if(distancePoints < minDistance && distancePoints < 0.05){
              minDistance = distancePoints;
            closestFeature = feature;
            }
            let alternative = [feature,distancePoints];
            alternativesWithSameName.push(alternative);
            
          }else if (distancePoints < minDistance && distancePoints < 0.05) {
            minDistance = distancePoints;
            closestFeature = feature;
          }
                 
      }
    });
    if (closestFeature == null) {
      closestFeature = await this.getSpeedDataFromArround(userPoint.geometry.coordinates);
      if (closestFeature) {
        closestFeature = this.wayToGeoJsonFeature(closestFeature) as MapboxGeoJSONFeature;
      }
    }
    let homePage = ((window as any).homePage as HomePage);
    if(closestFeature && !homePage.shouldEndSimulation){
      closestFeature = this.chooseBestClosestFeatureForSnap(closestFeature,minDistance,alternativesWithSameName,osrmLastMatch);
    }
    return closestFeature;
  }

  chooseBestClosestFeatureForSnap(closestFeature:MapboxGeoJSONFeature,minDistance:number,alternatives:any[],osrmLastMatch:any):MapboxGeoJSONFeature{
    let chosenOne:MapboxGeoJSONFeature = closestFeature;
    let chosenOneClosestDistance=Number.MAX_VALUE;
    if(osrmLastMatch 
      &&closestFeature.properties
      &&closestFeature.properties["name"]===osrmLastMatch.name
    ){
      return closestFeature;
    }
    if(alternatives.length>0){
      alternatives.forEach(alternative => {
        if(alternative.length>0){
          let street = alternative[0];
          let distance = alternative[1];
          let difference = distance-minDistance;
          if(closestFeature.properties
            &&street.properties
            &&street.properties['name']===closestFeature.properties['name']){
              if(distance<minDistance && distance<chosenOneClosestDistance){
                chosenOne = street;
                chosenOneClosestDistance=distance;
              }
            }else{
              if(difference<=0.003&&distance<chosenOneClosestDistance){
                chosenOne = street;
                chosenOneClosestDistance=distance;
              }
            }
            if(street.properties
              &&osrmLastMatch
              &&osrmLastMatch.name===street.properties["name"]){
                if(distance<=(osrmLastMatch.distance+10)/1000){
                  chosenOne = street;
                chosenOneClosestDistance=distance;
                }
            }
        }
      });
    }
    return chosenOne;
  }

  private updateSnapToRoadPosition(closestFeature: MapboxGeoJSONFeature | null, userPoint: any, useStreetHeading:boolean,userMoved:boolean, instantUpdate:boolean, osrmLastMatch:any): void {
    const sensorService = ((window as any).sensorService as SensorService);
    if (closestFeature && closestFeature.geometry!.type === 'LineString') {
      const nearestPoint: NearestPointOnLine = nearestPointOnLine(lineString(closestFeature.geometry!.coordinates), userPoint);
      if(osrmLastMatch 
        && osrmLastMatch.location){
          sensorService.updateSnapToRoadPosition(osrmLastMatch.location, closestFeature, nearestPoint,useStreetHeading,userMoved,instantUpdate);

      }else{
        sensorService.updateSnapToRoadPosition(nearestPoint.geometry.coordinates, closestFeature, nearestPoint,useStreetHeading,userMoved,instantUpdate);

      }
    }
  }

  private updateSnapToRoadPositionOSRM(userPosition:Position,coordinates:[number,number],closestFeature: MapboxGeoJSONFeature,useStreetHeading:boolean,userMoved:boolean,instantUpdate:boolean): void {
    const sensorService = ((window as any).sensorService as SensorService);
    sensorService.updateSnapToRoadPosition(coordinates, closestFeature, userPosition,useStreetHeading,userMoved,instantUpdate);
    
  }

  wayToGeoJsonFeature(way: any): Feature<LineString> {
    const coordinates = (way as Way).geometry.map(point => [point.lon, point.lat]);

    let geoJsonFeature: Feature<LineString> = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates,
      },
      properties: way.tags,
      id: way.id,
    };
    if (geoJsonFeature.properties) geoJsonFeature.properties["@id"] = way.id;
    return geoJsonFeature;
  }

  async snapNewPositionOSRMmatch(userPosition:Position):Promise<any>{
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
         return lastMatch;
        }
        return null; 
  }
}
