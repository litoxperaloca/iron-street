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
  lastUserCurrentStreetName:string|null=null;
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
    if(alertType === "speedCamera"){
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

  checkAlertableObjectsOnNewUserPositionFromArray(userPosition: Position, streetName:string,alertables:any[]){
    console.log("buscando camaras...");
    if(!alertables || alertables.length<=0){

      console.log("Salgo!");

      return;
    };

    if(streetName){


      if(this.lastUserCurrentStreetName){
        if(this.lastUserCurrentStreetName
          && this.lastUserCurrentStreetName===streetName){
            //sigo en la misma calle
                  console.log("SIGO EN LA MISMA");

          }else{
            //cambie de calle
            console.log("cambio de calle");

            this.preannouncedObjects.clear();
            this.announcedObjects.clear();
            this.lastUserCurrentStreetName=streetName;
          }
      }else{
        //Primera calle
        console.log("primera calle");

        this.preannouncedObjects.clear();
        this.announcedObjects.clear();
        this.lastUserCurrentStreetName=streetName;
      }
      alertables.forEach(objAlertable=>{
        console.log("objAlertable",objAlertable);

        const distanceToObj = objAlertable.distanceInMeters;
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
    let idlabel:string = objAlertable.tags["osmid"];
    const objId:number = Number(idlabel.replace("node/",""));
    console.log(alertableConfig,alertableConfig!.preAnnounce, distance,alertableConfig!.preAnnouncementDistance,this.preannouncedObjects,objId);
    
    if (alertableConfig && 
      alertableConfig.preAnnounce && 
      distance < alertableConfig.preAnnouncementDistance &&       
      !this.preannouncedObjects.has(objId)
    ) {
      let preAnnouncement:string='';
      if(objAlertable.tags["maxspeed"])
      preAnnouncement = alertableConfig.preAnnouncement
        .replace('{distance}', Math.round(distance).toString())
        .replace('{modifier}', objAlertable.tags["maxspeed"])
        .replace('{streetName}', streetName);
      if(!objAlertable.tags["maxspeed"])
        preAnnouncement = alertableConfig.preAnnouncement
          .replace('{distance}', Math.round(distance).toString())
          .replace('{streetName}', streetName);
      
      this.preannouncedObjects.add(objId);
      this.showAlert(preAnnouncement,objAlertable.type,alertableConfig.icon,true);

    }
  }

  announceAlertableObj(distance: number, objAlertable: any, streetName:string) {
    const alertableConfig = this.getAlertableConfig(objAlertable.type);
    console.log("alertableConfig",alertableConfig);
    let idlabel:string = objAlertable.tags["osmid"];
    const objId:number = Number(idlabel.replace("node/",""));
    console.log(alertableConfig,alertableConfig!.announce, distance,alertableConfig!.announcementDistance,this.announcedObjects,objId);

    if (alertableConfig && 
      alertableConfig.announce && 
      distance < alertableConfig.announcementDistance &&       
      !this.announcedObjects.has(objId)
    ) {
      let announcement='';
      if(objAlertable.tags["maxspeed"])
       announcement = alertableConfig.announcement
        .replace('{distance}', Math.round(distance).toString())
        .replace('{modifier}', objAlertable.tags["maxspeed"])
        .replace('{streetName}', streetName);
      if(!objAlertable.tags["maxspeed"])
        announcement = alertableConfig.announcement
          .replace('{distance}', Math.round(distance).toString())
          .replace('{streetName}', streetName);
      
      this.announcedObjects.add(objId);
      this.showAlert(announcement,objAlertable.type,alertableConfig.icon,true);

    }
  }

  async setCamerasStreetName(){
    if(this.streetsCamerasConfigured)return;
    const mapService = ((window as any).mapService as MapService);
    const map = mapService.getMap();
    const speedCamerasArround:MapboxGeoJSONFeature[] = map.querySourceFeatures('speedCamerasDataSource', { sourceLayer: 'camerasaUY' }) as MapboxGeoJSONFeature[];

    if (speedCamerasArround.length > 0) {
      const speedService = ((window as any).speedService) as SpeedService;
      const speedCamerasArroundObjOne=speedCamerasArround[0];
      if(speedCamerasArroundObjOne.geometry.type==="Point"){
        speedService.getSpeedDataFromArroundOnce([speedCamerasArroundObjOne.geometry.coordinates[0],speedCamerasArroundObjOne.geometry.coordinates[1]]).then(data=>{
          speedCamerasArround.forEach(camera => {
            if(camera.geometry.type=="Point"){
              this.snapCameraToRoad([camera.geometry.coordinates[0],camera.geometry.coordinates[1]],data).then((street)=>{
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
        });

      }


    }
  }

  async snapCameraToRoad(position:[number,number],data:any): Promise<MapboxGeoJSONFeature | undefined> {
    const mapService = ((window as any).mapService as MapService);
    const map = mapService.getMap();

    if (!map.getLayer("maxspeedDataLayer")) {
      return;
    }

    const cameraPoint = point([position[0], position[1]]);
    
    const features:MapboxGeoJSONFeature[] = map.querySourceFeatures('maxspeedDataSource', { sourceLayer: 'export_1-12rpm8' }) as MapboxGeoJSONFeature[];

    if (features.length > 0) {
      const closestFeature = await this.findClosestRoad(features, cameraPoint,data);
      if (closestFeature) return closestFeature;
    }
    return;
  }

  private async findClosestRoad(features: MapboxGeoJSONFeature[], cameraPoint: any, data:any): Promise<MapboxGeoJSONFeature | null> {
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
      closestFeature = await speedService.getSpeedDataFromArroundAvailable(cameraPoint.geometry.coordinates,data);
      if (closestFeature) {
        closestFeature = speedService.wayToGeoJsonFeature(closestFeature) as MapboxGeoJSONFeature;
      }
    }
    return closestFeature;
  }
}
