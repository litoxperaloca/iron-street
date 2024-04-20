import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { CameraService } from '../../services/camera.service';
import { DeviceOrientationService } from '../../services/device-orientation.service';
import { GeoLocationService } from '../../services/geo-location.service';
import { IntersectionService } from '../../services/intersection.service';
import { MapService } from '../../services/map.service';
import { ModalService } from '../../services/modal.service';
import { OsmService } from '../../services/osm.service';
import { SpeedService } from '../../services/speed.service';
import { TripService } from '../../services/trip.service';
import { VoiceService } from '../../services/voice.service';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  public folder!: string;
  private activatedRoute = inject(ActivatedRoute);
  currentMaxSpeed: number = 0;
  currentSpeed: number = 0;
  currentSpeedometerNeedleRotation: number = 60;
  tripDistance: number = 0;
  tripDuration: number = 0;
  tripDestination: string = '';
  tripDestinationAddress: string = '';
  currentManeuver: string = '';
  currentManeuvreIcon: string = '';
  eta: number | undefined;
  dta: number | undefined;

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
    private tripService: TripService,
    private intersectionService: IntersectionService,
  ) {

  }

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;
    const self = this;

    (window as any).mapService = this.mapService;
    (window as any).geoLocationService = this.geoLocationService;
    (window as any).speedService = this.speedService;
    (window as any).osmService = this.osmService;
    (window as any).tripService = this.tripService;
    (window as any).intersectionService = this.intersectionService;
    (window as any).cameraService = this.cameraService;
    (window as any).deviceOrientationService = this.deviceOrientationService;
    (window as any).homePage = this;
    this.mapService.initMap();

    this.deviceOrientationService.listenAcceleration();
    this.speedService.startWatchingSpeedLimit();

    this.geoLocationService.watchPosition((position, error) => {
      if (error) {
        console.error('Error watching position:', error);
        return;
      }
      if (!position) return;
      ((window as any).geoLocationService as GeoLocationService).setLastCurrentPosition(position);
      ((window as any).mapService as MapService).updateUserMarkerPosition([position.coords.longitude, position.coords.latitude]);

      //((window as any).mapService as MapService).userStreet(position);
      /*if ((window as any).mapService.userCurrentStreet && (window as any).mapService.userCurrentStreet.properties) {
        self.currentMaxSpeed = Number.parseInt((window as any).mapService.userCurrentStreet.properties["maxspeed"]);
      } */
      if (position.coords.speed) {
        self.currentSpeed = Math.round(position.coords.speed * 60 * 60 / 1000);
        //self.currentSpeedometerNeedleRotation = self.needleRotation();
      }
    });
  }



  alreadyGeoLocated() {
    const geoLocating = document.getElementById("geolocating");
    if (geoLocating) {
      geoLocating.style.display = "none";
    }
    const mapFabIcons = document.getElementById("mapFabIcons");
    if (mapFabIcons) {
      mapFabIcons.style.display = "block";
    }
    const card_left = document.getElementById("card_left");
    if (card_left) {
      card_left.style.display = "block";
    }
    /*const card_right = document.getElementById("card_right");
    if (card_right) {
      card_right.style.display = "block";
    }*/

  }

  ngOnDestroy() {
    // Perform clean-up tasks here
    this.geoLocationService.stopLocationObserver();
    this.deviceOrientationService.stopOrientation();
    this.speedService.stopWatchingSpeedLimit();
    this.mapService.leaveMapPage();
    this.cancelTrip();
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
    const iconElement = document.getElementById("volumeIcon") as any;
    if (iconElement) {
      iconElement.name = iconName;
    }
  }


  public startTrip() {
    const tripDetailsContainer = document.getElementById("tripDetailsContainer");
    if (tripDetailsContainer) {
      tripDetailsContainer.style.display = "none";
    }
    /*const tripControls = document.getElementById("tripControls");
    if (tripControls) {
      tripControls.style.display = "none";
    }*/
    this.mapService.startTrip();
  }

  public cancelTrip() {
    const tripDetailsContainer = document.getElementById("tripDetailsContainer");
    if (tripDetailsContainer) {
      tripDetailsContainer.style.display = "none";
      this.tripDistance = 0;
      this.tripDuration = 0;
      this.tripDestination = "";
    }
    const tripStepDetails = document.getElementById("tripStepDetails");
    if (tripStepDetails) {
      tripStepDetails.style.display = "none";
      this.currentManeuver = "";
      this.currentManeuvreIcon = "";
    }

    /* const tripControls = document.getElementById("tripControls");
     if (tripControls) {
       tripControls.style.display = "none";
     }*/

    this.mapService.cancelTrip();
    this.setCameraMode('SKY');
  }

  needleRotation(): number {
    // Assuming max rotation angle is 180 degrees
    return 60 + ((this.currentSpeed / 240) * 300);
  }

  showTrip(): void {
    const tripDetailsContainer = document.getElementById("tripDetailsContainer");
    if (tripDetailsContainer) {
      tripDetailsContainer.style.display = "block";
      this.tripDistance = Math.round(this.mapService.actualRoute.route[0].distance) / 1000;
      this.tripDuration = Math.round(this.mapService.actualRoute.route[0].duration / 60);
      this.tripDestination = this.mapService.destination;
      this.tripDestinationAddress = this.mapService.destinationAddress;
    }
    /*const tripControls = document.getElementById("tripControls");
    if (tripControls) {
      tripControls.style.display = "block";
    }*/
  }

  updateMarkerOrientation(event: DeviceOrientationEvent) {
    ((window as any).deviceOrientationService as DeviceOrientationService).setLastResult(event);

    if (event.alpha !== null) {
      ((window as any).mapService as MapService).updateMarkerRotation(event.alpha * -1);
    }
  };

  updateMarkerAccel(event: DeviceMotionEventAcceleration) {

  };
}
