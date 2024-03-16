import { Component, Injectable } from '@angular/core';
import { SpeedService } from 'src/app/services/speed.service';
@Injectable({
  providedIn: 'root'
})
@Component({
  selector: 'app-speedometer',
  templateUrl: './speedometer.component.html',
  styleUrls: ['./speedometer.component.scss'],
})
export class SpeedometerComponent {

  constructor(private speedService: SpeedService) { }


}
