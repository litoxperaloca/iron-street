import { EventEmitter, Injectable } from '@angular/core';



@Injectable({
  providedIn: 'root',
})

export class SpeedService {
  currentMaxSpeed!: number;
  currentSpeed!: number;
  speedChanged = new EventEmitter<number>();
  maxSpeedChanged = new EventEmitter<number>();


  constructor(
  ) { }


  setCurrentSpeed(speed:number|null){
    let lastSpeed = this.currentSpeed;
    if (speed) {
      this.currentSpeed = Math.round(speed * 60 * 60 / 1000);
      //self.currentSpeedometerNeedleRotation = self.needleRotation();
      if(this.currentSpeed<5){
        this.currentSpeed=0;
      }
    } else {
      this.currentSpeed = 0;
    }
    if(lastSpeed!=this.currentSpeed){
      this.speedChanged.emit(this.currentSpeed);
    }
  }

  setCurrentMaxSpeed(maxspeed:number|null){
    let lastMaxSpeed = this.currentMaxSpeed;
    if (maxspeed) {
      this.currentMaxSpeed = maxspeed;
    } else {
      this.currentMaxSpeed = 0;
    }
    if(lastMaxSpeed!=this.currentMaxSpeed){
      this.maxSpeedChanged.emit(this.currentMaxSpeed);
    }
  }


}
