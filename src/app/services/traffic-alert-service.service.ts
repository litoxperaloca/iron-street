import { Injectable } from '@angular/core';
import { HomePage } from '../pages/home/home.page';
import { MapService } from './map.service'; // Your MapService with updateUserMarker method
import { VoiceService } from './voice.service'; // Assuming you have a VoiceService for speaking instructions
import { WindowService } from './window.service';
import { Subject } from 'rxjs';
import { Position } from '@capacitor/geolocation';
import distance from '@turf/distance';
import { Feature, LineString, lineString, point } from '@turf/helpers';
import nearestPointOnLine, { NearestPointOnLine } from '@turf/nearest-point-on-line';
import { MapboxGeoJSONFeature } from 'mapbox-gl';
import { SpeedService } from './speed.service';
import { MapboxService } from './mapbox.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrafficAlertServiceService {
  alerts: any[] = [];
  streetsObjects: any[]=[];
  streetsCamerasConfigured:boolean=false;
  lastUserCurrentStreet:MapboxGeoJSONFeature|null=null;
  preannouncedObjects = new Set<number>(); // Set de objetos ya preanunciados
  announcedObjects = new Set<number>(); // Set de objetos ya anunciados

  constructor(
    private voiceService: VoiceService,
    private mapService: MapService,
    private mapboxService: MapboxService,
    private windowService: WindowService,
    private speedService:SpeedService) { 

  }

  async showAlert(alertText:string, alertType:string, alertIconUrl:string, speakAlert:boolean){
    if(alertType === "maneuver"){
      const tripStepDetails = document.getElementById("tripStepDetails");
      if (tripStepDetails) {
        tripStepDetails.style.display = "block";
        /*const instructions = document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLElement;
        if (instructions) instructions.style.display = "block";*/
        const progress = document.getElementById("tripProgress");
        if (progress) { progress.style.display = "block"; }
        ((window as any).homePage as HomePage).currentManeuver = alertText;
        ((window as any).homePage as HomePage).currentManeuvreIcon = alertIconUrl;
        const time: any = setTimeout(() => {
          if (tripStepDetails) tripStepDetails.style.display = "none";
        }, 2500); // Adjust delay as needed
        this.windowService.attachedTimeOut("home", "tripservice", time);
      }
    }
    if(alertType === "camera"){
      const tripStepDetails = document.getElementById("tripStepDetails");
      if (tripStepDetails) {
        tripStepDetails.style.display = "block";
        /*const instructions = document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLElement;
        if (instructions) instructions.style.display = "block";*/
        const progress = document.getElementById("tripProgress");
        if (progress) { progress.style.display = "block"; }
        ((window as any).homePage as HomePage).currentManeuver = alertText;
        ((window as any).homePage as HomePage).currentManeuvreIcon = alertIconUrl;
        const time: any = setTimeout(() => {
          if (tripStepDetails) tripStepDetails.style.display = "none";
        }, 3500); // Adjust delay as needed
        this.windowService.attachedTimeOut("home", "tripservice", time);
      }
    }
    if(speakAlert){
      const voiceInstructions = alertText;
      await this.voiceService.speak(voiceInstructions);
    }
   
  }


  checkAlertableObjectsOnNewUserPosition(userPosition: Position){
    console.log("buscando camaras...");
    const mapService = ((window as any).mapService as MapService);
    const street = mapService.userCurrentStreet;
    console.log("Street:",street);
    let streetName;
    if(street && street.properties){
      streetName=street.properties['name']
    }else{
      console.log("Salgo!");

      return;
    };
    console.log("StreetName:",streetName);
    console.log("Objs:",this.streetsObjects[streetName]);

    if(this.streetsObjects[streetName]){
      const streetObjs:any[]=this.streetsObjects[streetName];
      console.log("streetObjs:",streetObjs);
      console.log("lastStreet:",this.lastUserCurrentStreet);

      if(this.lastUserCurrentStreet){
        if(this.lastUserCurrentStreet.properties 
          && this.lastUserCurrentStreet.properties['name']===streetName){
            //sigo en la misma calle
                  console.log("SIGO EN LA MISMA");

          }else{
            //cambie de calle
            console.log("cambio de calle");

            this.preannouncedObjects.clear();
            this.announcedObjects.clear();
            this.lastUserCurrentStreet=street;
          }
      }else{
        //Primera calle
        console.log("primera calle");

        this.preannouncedObjects.clear();
        this.announcedObjects.clear();
        this.lastUserCurrentStreet=street;
      }
      streetObjs.forEach(objAlertable=>{
        console.log("objAlertable",objAlertable);

        const distanceToObj = this.mapboxService.calculateDistance(
          [userPosition.coords.longitude,userPosition.coords.latitude],
          objAlertable.feature.geometry.coordinates
        );
        console.log("distanceToObj",distanceToObj);
        console.log(distanceToObj,objAlertable,streetName);

    
        this.preAnnounceAlertableObj(distanceToObj, objAlertable,streetName);
        this.announceAlertableObj(distanceToObj, objAlertable,streetName);

      })
    }
  }

  private getAlertableConfig(type: string) {
    console.log("type",type);

    return environment.trafficAlertServiceConf.alertables.find(a => a.type === type);
  }

  preAnnounceAlertableObj(distance: number, objAlertable: any, streetName:string) {
    const alertableConfig = this.getAlertableConfig(objAlertable.type);
    console.log("alertableConfig",alertableConfig);
    console.log(alertableConfig,alertableConfig!.preAnnounce, distance,alertableConfig!.preAnnouncementDistance,this.preannouncedObjects,objAlertable.feature.id);

    if (alertableConfig && 
      alertableConfig.preAnnounce && 
      distance < alertableConfig.preAnnouncementDistance &&       
      !this.preannouncedObjects.has(objAlertable.feature.id)
    ) {
      let preAnnouncement = alertableConfig.preAnnouncement
        .replace('{distance}', Math.round(distance).toString())
        .replace('{modifier}', objAlertable.feature.properties["maxspeed"])
        .replace('{streetName}', streetName);
      
      this.preannouncedObjects.add(objAlertable.feature.id);
      this.showAlert(preAnnouncement,objAlertable.type,alertableConfig.icon,true);

    }
  }

  announceAlertableObj(distance: number, objAlertable: any, streetName:string) {
    const alertableConfig = this.getAlertableConfig(objAlertable.type);
    console.log("alertableConfig",alertableConfig);
    console.log(alertableConfig,alertableConfig!.announce, distance,alertableConfig!.announcementDistance,this.announcedObjects,objAlertable.feature.id);

    if (alertableConfig && 
      alertableConfig.announce && 
      distance < alertableConfig.announcementDistance &&       
      !this.announcedObjects.has(objAlertable.feature.id)
    ) {
      let announcement = alertableConfig.announcement
        .replace('{distance}', Math.round(distance).toString())
        .replace('{modifier}', objAlertable.feature.properties["maxspeed"])
        .replace('{streetName}', streetName);
      
      this.announcedObjects.add(objAlertable.feature.id);
      this.showAlert(announcement,objAlertable.type,alertableConfig.icon,true);

    }
  }

  async setCamerasStreetName(){
    if(this.streetsCamerasConfigured)return;
    const mapService = ((window as any).mapService as MapService);
    const map = mapService.getMap();
    const speedCamerasArround:MapboxGeoJSONFeature[] = map.querySourceFeatures('speedCamerasDataSource', { sourceLayer: 'camerasaUY' }) as MapboxGeoJSONFeature[];

    if (speedCamerasArround.length > 0) {
      speedCamerasArround.forEach(camera => {
        if(camera.geometry.type=="Point"){
          this.snapCameraToRoad([camera.geometry.coordinates[0],camera.geometry.coordinates[1]]).then((street)=>{
            if(street && street.properties){
              const streetName = street.properties["name"];
              if(!this.streetsObjects[streetName]){
                this.streetsObjects[streetName]=[];
              }
              this.streetsObjects[streetName].push({type:"camera",feature:camera});
            }
          });
        }
      });
      this.streetsCamerasConfigured=true;
      console.log(this.streetsObjects);
    }
  }

  async snapCameraToRoad(position:[number,number]): Promise<MapboxGeoJSONFeature | undefined> {
    const mapService = ((window as any).mapService as MapService);
    const map = mapService.getMap();

    if (!map.getLayer("maxspeedDataLayer")) {
      return;
    }

    const cameraPoint = point([position[0], position[1]]);
    const features:MapboxGeoJSONFeature[] = map.querySourceFeatures('maxspeedDataSource', { sourceLayer: 'export_1-12rpm8' }) as MapboxGeoJSONFeature[];

    if (features.length > 0) {
      const closestFeature = await this.findClosestRoad(features, cameraPoint);
      if (closestFeature) return closestFeature;
    }
    return;
  }

  private async findClosestRoad(features: MapboxGeoJSONFeature[], cameraPoint: any): Promise<MapboxGeoJSONFeature | null> {
    let closestFeature: MapboxGeoJSONFeature | null = null;
    let minDistance = Number.MAX_VALUE;
    features.forEach(feature => {
      if (feature.geometry!.type === 'LineString') {
        const line = lineString(feature.geometry!.coordinates);
        const pointInLine = nearestPointOnLine(line, cameraPoint);
        const distancePoints = distance(pointInLine, cameraPoint, { units: 'kilometers' });
        if (distancePoints < minDistance && distancePoints < 0.05) {
            minDistance = distancePoints;
            closestFeature = feature;
          }
                 
      }
    });
    if (closestFeature == null) {
      const speedService = ((window as any).speedService) as SpeedService;
      closestFeature = await speedService.getSpeedDataFromArroundAvailable(cameraPoint.geometry.coordinates);
      if (closestFeature) {
        closestFeature = speedService.wayToGeoJsonFeature(closestFeature) as MapboxGeoJSONFeature;
      }
    }
    return closestFeature;
  }
}
