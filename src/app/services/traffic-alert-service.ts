import { EventEmitter, Injectable } from '@angular/core';
import { MapService } from './map.service'; // Your MapService with updateUserMarker method
import { VoiceService } from './voice.service'; // Assuming you have a VoiceService for speaking instructions
import { WindowService } from './window.service';
import { Position } from '@capacitor/geolocation';
import { MapboxGeoJSONFeature } from 'mapbox-gl';
import { SpeedService } from './speed.service';
import { MapboxService } from './mapbox.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrafficAlertService {
  alerts: any[] = [];
  streetsObjects: any[]=[];
  streetsCamerasConfigured:boolean=true;
  lastUserCurrentStreet:MapboxGeoJSONFeature|null=null;
  lastUserCurrentStreetName:string|null=null;
  lastUserCurrentStreetId:string|null=null;
  preannouncedObjects = new Set<number>(); // Set de objetos ya preanunciados
  announcedObjects = new Set<number>(); // Set de objetos ya anunciados
  newManeuverAlert = new EventEmitter<{
                          alertText:string, 
                          alertType:string, 
                          alertIconUrl:string, 
                          recommendedDuration:number
                     }>();
  newSpeedCamaraAlert = new EventEmitter<{
                      alertText:string, 
                      alertType:string, 
                      alertIconUrl:string,
                      recommendedDuration:number 
                 }>();
  newSpeedExceededAlert = new EventEmitter<{
      alertText:string, 
      alertType:string, 
      alertIconUrl:string,
      recommendedDuration:number 
  }>();

  constructor(
    private voiceService: VoiceService,
    private mapService: MapService,
    private mapboxService: MapboxService,
    private windowService: WindowService,
    private speedService:SpeedService) { 

  }

  async showAlert(alertText:string, alertType:string, alertIconUrl:string, speakAlert:boolean){
    if(alertType === "maneuver"){
      const recommendedDuration:number = environment.trafficAlertServiceConf.alertsSettings.maneuver.recommendedDuration;
      this.newSpeedCamaraAlert.emit({alertText,alertType,alertIconUrl,recommendedDuration});
     
    }
    if(alertType === "speedCamera"){
      const recommendedDuration:number = environment.trafficAlertServiceConf.alertsSettings.speedCamera.recommendedDuration;
      this.newSpeedCamaraAlert.emit({alertText,alertType,alertIconUrl,recommendedDuration});
    }
    if(alertType === "speedExceeded"){
      const recommendedDuration:number = environment.trafficAlertServiceConf.alertsSettings.speedExceeded.recommendedDuration;
      this.newSpeedExceededAlert.emit({alertText,alertType,alertIconUrl,recommendedDuration});
    }
    if(alertType === "speakOnly"){
      
    }
    if(speakAlert){
      const voiceInstructions = alertText;
      await this.voiceService.speak(voiceInstructions);
    }
   
  }

  async checkAlertableObjectsOnNewUserPositionFromArrayByName(userPosition: Position, streetName:string,alertables:any[]){
    if(!alertables || alertables.length<=0){


      return;
    };

    if(streetName){


      if(this.lastUserCurrentStreetName){
        if(this.lastUserCurrentStreetName
          && this.lastUserCurrentStreetName===streetName){
            //sigo en la misma calle

          }else{
            //cambie de calle

            this.preannouncedObjects.clear();
            this.announcedObjects.clear();
            this.lastUserCurrentStreetName=streetName;
          }
      }else{
        //Primera calle

        this.preannouncedObjects.clear();
        this.announcedObjects.clear();
        this.lastUserCurrentStreetName=streetName;
      }
      alertables.forEach(objAlertable=>{

        const distanceToObj = objAlertable.distanceInMeters;

    
        this.preAnnounceAlertableObj(distanceToObj, objAlertable,streetName);
        this.announceAlertableObj(distanceToObj, objAlertable,streetName);

      })
    }
  }

  async checkAlertableObjectsOnNewUserPositionFromArray(userPosition: Position, streetName:string,alertables:any[]){
    if(!alertables || alertables.length<=0){


      return;
    };
    let streetId:any = null;
    if(alertables[0].tags['street_id']){
      streetId = alertables[0].tags['street_id'];
    }
    if(streetId){


      if(this.lastUserCurrentStreetId){
        if(this.lastUserCurrentStreetId
          && this.lastUserCurrentStreetId.toString()===streetId.toString()){
            //sigo en la misma calle

          }else{
            //cambie de calle

            this.preannouncedObjects.clear();
            this.announcedObjects.clear();
            this.lastUserCurrentStreetId=streetId;
          }
      }else{
        //Primera calle

        this.preannouncedObjects.clear();
        this.announcedObjects.clear();
        this.lastUserCurrentStreetId=streetId;
      }
      alertables.forEach(objAlertable=>{

        if(objAlertable.status==='entering'){
          const distanceToObj = objAlertable.distanceInMeters;
          this.preAnnounceAlertableObj(distanceToObj, objAlertable,streetName);
          this.announceAlertableObj(distanceToObj, objAlertable,streetName);
        }
      })
    }
  }


  private getAlertableConfig(type: string) {

    return environment.trafficAlertServiceConf.alertables.find(a => a.type === type);
  }

  preAnnounceAlertableObj(distance: number, objAlertable: any, streetName:string) {
    const alertableConfig = this.getAlertableConfig(objAlertable.type);
    let idlabel:string = objAlertable.tags["osmid"];
    const objId:number = Number(idlabel.replace("node/",""));
    
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
    let idlabel:string = objAlertable.tags["osmid"];
    const objId:number = Number(idlabel.replace("node/",""));

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
}
