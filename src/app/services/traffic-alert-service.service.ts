import { Injectable } from '@angular/core';
import { HomePage } from '../pages/home/home.page';
import { MapService } from './map.service'; // Your MapService with updateUserMarker method
import { VoiceService } from './voice.service'; // Assuming you have a VoiceService for speaking instructions
import { WindowService } from './window.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrafficAlertServiceService {
  alerts: any[] = [];

  constructor(
    private voiceService: VoiceService,
    private mapService: MapService,
    private windowService: WindowService) { 

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
        }, 1500); // Adjust delay as needed
        this.windowService.attachedTimeOut("home", "tripservice", time);
      }
    }
    if(speakAlert){
      const voiceInstructions = alertText;
      await this.voiceService.speak(voiceInstructions);
    }
   
  }
}
