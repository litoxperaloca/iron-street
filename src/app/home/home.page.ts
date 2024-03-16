import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Position } from '@capacitor/geolocation';
import { MenuController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { CameraService } from '../services/camera.service';
import { DeviceOrientationService } from '../services/device-orientation.service';
import { GeoLocationService } from '../services/geo-location.service';
import { MapService } from '../services/map.service';
import { ModalService } from '../services/modal.service';
import { OsmService } from '../services/osm.service';
import { SpeedService } from '../services/speed.service';
import { VoiceService } from '../services/voice.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  public folder!: string;
  private activatedRoute = inject(ActivatedRoute);
  private orientationSub!: Subscription;
  private locationSub!: string;
  private lastPosition: Position | null = null;
  currentMaxSpeed: number = 0;
  currentSpeed: number = 0;
  currentSpeedometerNeedleRotation: number = 60;

  constructor(
    public mapService: MapService,
    private geoLocationService: GeoLocationService,
    private speedService: SpeedService,
    private modalService: ModalService,
    private osmService: OsmService,
    private deviceOrientationService: DeviceOrientationService,
    private voiceService: VoiceService,
    private cameraService: CameraService,
    private menuController: MenuController,

  ) {

  }

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;
    this.mapService.initMap();
    const self = this;
    (window as any).mapService = this.mapService;
    (window as any).geoLocationService = this.geoLocationService;
    (window as any).speedService = this.speedService;
    (window as any).osmService = this.osmService;
    this.geoLocationService.watchPosition((position, error) => {
      if (error) {
        console.error('Error watching position:', error);
        return;
      }
      if (!position) return;
      // //console.log('New position:', position);
      if (!((window as any).speedService as SpeedService).dataLoaded) {
        //Todavia no cargo data de velocidades
        // //console.log("tengo que cargar las calles");
        ((window as any).speedService as SpeedService).getNearMaxSpeedData(position).then(() => {
          ((window as any).geoLocationService as GeoLocationService).setLastCurrentPosition(position);
          ((window as any).mapService as MapService).updateUserLocationFeatureSymbol([position.coords.longitude, position.coords.latitude]);
          ((window as any).mapService as MapService).userStreet(position);
          if ((window as any).mapService.userCurrentStreet && (window as any).mapService.userCurrentStreet.properties) {
            self.currentMaxSpeed = Number.parseInt((window as any).mapService.userCurrentStreet.properties["maxSpeed"]);
          }
          if (position.coords.speed) {
            self.currentSpeed = 40;
            //self.currentSpeed = Math.round(position.coords.speed * 60 * 60 / 1000);
            self.currentSpeedometerNeedleRotation = self.needleRotation();
          }
        });
      } else {
        ((window as any).geoLocationService as GeoLocationService).setLastCurrentPosition(position);
        ((window as any).mapService as MapService).updateUserLocationFeatureSymbol([position.coords.longitude, position.coords.latitude]);
        ((window as any).mapService as MapService).userStreet(position);
        if ((window as any).mapService.userCurrentStreet && (window as any).mapService.userCurrentStreet.properties) {
          self.currentMaxSpeed = Number.parseInt((window as any).mapService.userCurrentStreet.properties["maxSpeed"]);
        }
        if (position.coords.speed) {
          self.currentSpeed = 40;

          //self.currentSpeed = Math.round(position.coords.speed * 60 * 60 / 1000);
          self.currentSpeedometerNeedleRotation = self.needleRotation();
        }
      }

    });
    this.orientationSub = this.deviceOrientationService.getOrientation().subscribe(event => {
      // //console.log(event);
      if (event.absolute && event.alpha !== null) {
        this.mapService.updateUserFeatureRotation(event.alpha);
      }
    });

  }


  ngOnDestroy() {
    // Perform clean-up tasks here
    this.orientationSub.unsubscribe();
    this.geoLocationService.stopLocationObserver();
  }

  public openModal(type: String) {
    //this.voiceService.speak(`${type} modal opening`); // Dynamic speaking based on modal type
    this.menuController.close('main-menu');
    this.modalService.openModal(type);
  }

  public setCameraMode(cameraMode: 'POV' | 'SKY') {
    //this.cameraService.setCameraMode(cameraMode);
    if (cameraMode === 'POV') this.mapService.setCameraPOVPosition(this.geoLocationService.getLastCurrentLocation());
    if (cameraMode === 'SKY') this.mapService.setCameraSKYPosition(this.geoLocationService.getLastCurrentLocation());
  }

  public toggleSpeedControl() {
    // Implementation for toggling speed control
  }

  public toggleSpeaker() {
    const isSpeakerOn = this.voiceService.toggleSpeaker();
    const iconName = isSpeakerOn ? "volume-high-outline" : "volume-mute-outline";
    const message = isSpeakerOn ? "Sonido habilitado" : "Sonido apagado. Recuerde conducir siempre con ambas manos en el volante.";
    this.voiceService.speak(message);
    this.updateVolumeIcon(iconName);
  }

  private updateVolumeIcon(iconName: string) {
    const iconElement = document.getElementById("volumeIcon") as HTMLIonIconElement;
    if (iconElement) {
      iconElement.name = iconName;
    }
  }


  public startTrip() {
    this.mapService.startTrip();
  }

  public cancelTrip() {
    this.mapService.cancelTrip();
    this.setCameraMode('POV');
  }

  needleRotation(): number {
    // Assuming max rotation angle is 180 degrees
    return 60 + ((this.currentSpeed / 240) * 300);
  }
}
