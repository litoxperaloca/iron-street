import { AfterViewInit, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Position } from '@capacitor/geolocation';
import { MenuController, ToastController } from '@ionic/angular'; // Add this line
import { TranslateService } from '@ngx-translate/core';
import { GeoLocationMockService } from 'src/app/mocks/geo-location-mock.service';
import { AlertService } from 'src/app/services/alert.service';
import { BookmarksService } from 'src/app/services/bookmarks.service';
import { ThemeService } from 'src/app/services/theme-service.service';
import { TripSimulatorService } from 'src/app/services/trip-simulator.service';
import { WindowService } from 'src/app/services/window.service';
import { environment } from 'src/environments/environment';
import { ActionSheetService } from '../../services/action-sheet.service';
import { CameraService } from '../../services/camera.service';
import { DeviceOrientationService } from '../../services/device-orientation.service';
import { GeoLocationService } from '../../services/geo-location.service';
//import { IntersectionService } from '../../services/intersection.service';
import { MapService } from '../../services/map.service';
import { ModalService } from '../../services/modal.service';
import { OsmService } from '../../services/osm.service';
import { SensorService } from '../../services/sensor.service';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';
import { SpeedService } from '../../services/speed.service';
import { ToastService } from '../../services/toast.service';
import { TripService } from '../../services/trip.service'
import { VoiceService } from '../../services/voice.service';
import { TrafficAlertServiceService } from 'src/app/services/traffic-alert-service.service';
import { SnapService } from 'src/app/services/snap.service';
import { MapboxService } from 'src/app/services/mapbox.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements AfterViewInit, OnDestroy, OnInit {
  speechRecogEnabled: boolean = false;
  userLoggedIn: boolean = false;
  audioOn: boolean = true;

  currentMaxSpeed: number = 0;
  currentSpeed: number = 0;
  currentSpeedometerNeedleRotation: number = 60;
  tripDistance: number = 0;
  tripDuration: number = 0;
  tripDestination: string = '';
  tripDestinationAddress: string = '';
  currentManeuver: string = '';
  currentManeuvreIcon: string = '';
  nextManeuver: string = '';
  nextManeuvreIcon: string = '';
  eta: number | undefined;
  dta: number | undefined;
  tripProgressIndex: number = 0;
  public osmClickedId: number = 0;
  public coordinatesPressed: [number, number] | undefined;
  simulation: boolean = false;
  shouldEndSimulation: boolean = false;
  getMock: boolean = true;
  isNative: boolean = false;
  speedChanged = new EventEmitter<number>();
  isShowingSpeedWayOnMap:boolean=false;

  constructor(
    private translateService: TranslateService,
    public mapService: MapService,
    private geoLocationService: GeoLocationService,
    private geoLocationMockService: GeoLocationMockService,
    private speedService: SpeedService,
    private modalService: ModalService,
    private osmService: OsmService,
    private deviceOrientationService: DeviceOrientationService,
    private voiceService: VoiceService,
    private cameraService: CameraService,
    private menuController: MenuController,
    private tripService: TripService,
    //private intersectionService: IntersectionService,
    private actionSheetService: ActionSheetService,
    private themeService: ThemeService,
    private sensorService: SensorService,
    private tripSimulatorService: TripSimulatorService,
    private toastController: ToastController, // Fix the typo here
    private ToastService: ToastService,
    private speechRecognitionService: SpeechRecognitionService,
    private bookmarkService: BookmarksService,
    private windowService: WindowService,
    private alertService: AlertService,
  private trafficAlertService:TrafficAlertServiceService,
private snapService:SnapService,
private mapboxService:MapboxService) {
    // Existing constructor code...
    this.isNative = Capacitor.isNativePlatform()
    this.audioOn = this.voiceService.isSpeakerOn();
  }



  // Existing code...

  toggleSpeechRecognition() {
    this.speechRecognitionService.toggleSpeechRecognition();
  }

  waitAndRenderPage() {
    const timeOut = setTimeout(() => {
      this.mapService.initMap();
      this.startWatchingPosition();
      //this.deviceOrientationService.startListeningHeading();
      //this.deviceOrientationService.listenAcceleration();
      //this.speedService.startWatchingSpeedLimit();


    }, 500);
    this.windowService.attachedTimeOut("home", "waitAndRender", timeOut);
  }


  geolockMock() {
    const self = this;
    //this.geoLocationService.stopWatchingPosition();
    this.windowService.unAttachInterval("home", "gpsInterval");
    this.windowService.unAttachWatch("home", "gps");
    self.geoLocationService.mocking = true;
    environment.mocking = true;
    self.simulation = true;
    this.windowService.unAttachInterval("home", "locationInterval");

    const locationInterval: any = setInterval(() => {

      /*if (this.mapService.isAnimating) {
        return;
      }*/

      //this.geoLocationService.watchPosition((position, error) => {
      self.geoLocationMockService.getNextPosition().then
        (async position => {
          if (!position) return;
          if (position.coords.latitude == 0 && position.coords.longitude == 0) {
            this.finishSimulation();
          } else {
            self.sensorService.updateGeolocation(position);
            const smoothedLat = self.sensorService.getSensorLatitude();
            const smoothedLng = self.sensorService.getSensorLongitude();
            const smoothedPosition: Position = {
              coords: {
                latitude: smoothedLat,
                longitude: smoothedLng,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed
              },
              timestamp: position.timestamp
            };

            ((window as any).geoLocationService as GeoLocationService).setLastCurrentPosition(smoothedPosition);
            if (((window as any).mapService as MapService).isRotating) {
              ((window as any).mapService as MapService).updateMarkerState();
            } else {
              //await self.speedService.locationUpdate();
               self.snapService.locationUpdate();
               if (self.mapService.isTripStarted) { self.tripService.locationUpdate(false); }

            }
            //((window as any).mapService as MapService).updateUserPosition();
            //((window as any).mapService as MapService).userStreet(position);
            /*if ((window as any).mapService.userCurrentStreet && (window as any).mapService.userCurrentStreet.properties) {
              self.currentMaxSpeed = Number.parseInt((window as any).mapService.userCurrentStreet.properties["maxspeed"]);
            } */
            const speed = position.coords.speed;
            if (speed) {
              self.currentSpeed = Math.round(speed * 60 * 60 / 1000);
              //self.currentSpeedometerNeedleRotation = self.needleRotation();
              if(self.currentSpeed<5){
                self.currentSpeed=0;
              }
            } else {
              self.currentSpeed = 0;
            }
            self.speedChanged.emit(self.currentSpeed);

          }

        });


      //});
    }, 2000); // Check every 5 seconds (adjust interval as needed)
    this.windowService.attachedInterval("home", "locationInterval", locationInterval);
  }


  startWatchingPosition() {
    try {
      this.windowService.unAttachInterval("home", "locationInterval");
      this.simulation = false;
      this.geoLocationService.mocking = false;
      environment.mocking = false;
      this.windowService.unAttachInterval("home", "gpsInterval");
      this.windowService.unAttachWatch("home", "gps");
      const watchId: any = this.geoLocationService.watchPosition(async (position) => {
        //console.log('New position:', position);
        await this.geolock(position)
      });
      this.windowService.attachedWatch("home", "gps", watchId);
    } catch (e) {
      console.error('Error starting position watch:', e);
      alert('Unable to watch position. Please ensure location services are enabled and permissions are granted.');
    }
  }

  async geolock(position: Position | null) {
    const self = this;


    if (!position) return;
    self.sensorService.updateGeolocation(position);
    const smoothedLat = self.sensorService.getSensorLatitude();
    const smoothedLng = self.sensorService.getSensorLongitude();
    const smoothedPosition: Position = {
      coords: {
        latitude: smoothedLat,
        longitude: smoothedLng,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed
      },
      timestamp: position.timestamp
    };

    ((window as any).geoLocationService as GeoLocationService).setLastCurrentPosition(smoothedPosition);
    if (((window as any).mapService as MapService).isRotating) {
      ((window as any).mapService as MapService).updateMarkerState();
    } else {
      //await self.speedService.locationUpdate();
      self.snapService.locationUpdate();
      if (self.mapService.isTripStarted) { self.tripService.locationUpdate(false); }

    }
    const speed = position.coords.speed;
    if (speed) {
      self.currentSpeed = Math.round(speed * 60 * 60 / 1000);
      //self.currentSpeedometerNeedleRotation = self.needleRotation();
      if(self.currentSpeed<5){
        self.currentSpeed=0;
      }
    } else {
      self.currentSpeed = 0;
    }
    self.speedChanged.emit(self.currentSpeed);


  }

 async geolockUsingIntervals() {
    const self = this;
    this.windowService.unAttachInterval("home", "locationInterval");
    this.simulation = false;
    this.geoLocationService.mocking = false;
    environment.mocking = false;
    this.windowService.unAttachWatch("home", "gps");
    this.windowService.unAttachInterval("home", "gpsInterval");

    const gpsInterval: any = setInterval(() => {

      self.geoLocationService.getCurrentPosition().then(
        (position) => {
          if (!position) return;
          self.sensorService.updateGeolocation(position);
          const smoothedLat = self.sensorService.getSensorLatitude();
          const smoothedLng = self.sensorService.getSensorLongitude();
          const smoothedPosition: Position = {
            coords: {
              latitude: smoothedLat,
              longitude: smoothedLng,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed
            },
            timestamp: position.timestamp
          };

          ((window as any).geoLocationService as GeoLocationService).setLastCurrentPosition(smoothedPosition);
          if (((window as any).mapService as MapService).isRotating) {
            ((window as any).mapService as MapService).updateMarkerState();
          } else {
            //self.speedService.locationUpdate();
            self.snapService.locationUpdate();
            if (self.mapService.isTripStarted) { self.tripService.locationUpdate(false); }

          }
          const speed = position.coords.speed;
          if (speed) {
            self.currentSpeed = Math.round(speed * 60 * 60 / 1000);
            //self.currentSpeedometerNeedleRotation = self.needleRotation();
            if(self.currentSpeed<5){
              self.currentSpeed=0;
            }
          } else {
            self.currentSpeed = 0;
          }
          self.speedChanged.emit(self.currentSpeed);

        });

    }, 2200); // Check every 2 seconds (adjust interval as needed)
    this.windowService.attachedInterval("home", "gpsInterval", gpsInterval);
  }

  ngOnInit() {
  }
  ngAfterViewInit() {
    const self = this;

    (window as any).mapService = this.mapService;
    (window as any).geoLocationService = this.geoLocationService;
    (window as any).speedService = this.speedService;
    (window as any).osmService = this.osmService;
    (window as any).tripService = this.tripService;
    //(window as any).intersectionService = this.intersectionService;
    (window as any).cameraService = this.cameraService;
    (window as any).deviceOrientationService = this.deviceOrientationService;
    (window as any).sensorService = this.sensorService;
    (window as any).tripSimulatorService = this.tripSimulatorService;
    (window as any).geoLocationMockService = this.geoLocationMockService;
    (window as any).voiceService = this.voiceService;
    (window as any).themeService = this.themeService;
    (window as any).actionSheetService = this.actionSheetService;
    (window as any).toastService = this.ToastService;
    (window as any).speechRecognitionService = this.speechRecognitionService;
    (window as any).trafficAlertService = this.trafficAlertService;
    (window as any).snapService = this.snapService;
    (window as any).mapboxService=this.mapboxService;

    (window as any).homePage = this;
    this.waitAndRenderPage();
  }

  toggleDarkLightMode() {
    this.themeService.toggleTheme();
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
    // this.geoLocationService.stopLocationObserver();
    //this.deviceOrientationService.stopListeningHeading();
    //this.speedService.stopWatchingSpeedLimit();

    this.windowService.unattachComponent("home");
    this.mapService.leaveMapPage();
    this.modalService.avoidMultipleInstancesOfModal()
    this.cancelTrip();
    this.cancelTripSimulation();
    this.windowService.unattachComponent("home");

  }

  public openModal(type: string, extraParam?: any) {
    //this.voiceService.speak(`${type} modal opening`); // Dynamic speaking based on modal type
    this.menuController.close('main-menu');
    this.modalService.openModal(type, extraParam);
  }

  public setCameraMode(cameraMode: 'POV' | 'SKY') {
    //this.cameraService.setCameraMode(cameraMode);
    let snapedPosition: Position = {
      coords: {
        latitude: this.sensorService.getLastCurrentLocationPredicted()[1],
        longitude: this.sensorService.getLastCurrentLocationPredicted()[0],
        accuracy: 1,
        altitude: null,
        altitudeAccuracy: null,
        heading: this.mapService.getUserMarker().getRotation(),
        speed: null
      },
      timestamp: Date.now()
    };
    const speedSNAP = this.sensorService.getSensorSpeed();
    if (speedSNAP) {
      snapedPosition.coords.speed = speedSNAP;
    }
    if (cameraMode === 'POV') this.mapService.setCameraPOVPosition(snapedPosition);
    if (cameraMode === 'SKY') this.mapService.setCameraSKYPosition(snapedPosition);
  }

  public toggleSpeedControl() {
    // Implementation for toggling speed control
  }

  public toggleSpeaker() {
    this.audioOn = this.voiceService.toggleSpeaker();
    const message = this.audioOn ? "Sonido habilitado" : "Sonido apagado. Recuerde conducir siempre con ambas manos en el volante.";
    this.voiceService.speak(message);
  }

  private updateVolumeIcon(iconName: string) {
    const iconElement = document.getElementById("volumeIcon") as any;
    if (iconElement) {
      iconElement.name = iconName;
    }
  }

  public simulateTrip() {
    this.geolockMock();
    this.tripSimulatorService.simulateGuidedTrip();
  }

  public startTrip() {
    /*if (this.simulation) {
      this.cancelTripSimulation();
      this.geolock();
    }*/
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

    const tripNexStepDetails = document.getElementById("tripNexStepDetails");
    if (tripNexStepDetails) {
      tripNexStepDetails.style.display = "none";
      this.nextManeuver = "";
      this.nextManeuvreIcon = "";
    }

    const tripProgress = document.getElementById("tripProgress");

    if (tripProgress) tripProgress.style.display = "none";
    /*const poste = document.getElementById("poste");
    if (poste) { poste.style.display = "none"; }*/
    if (this.simulation) {
      this.cancelTripSimulation();
      this.startWatchingPosition();
    }else{
      this.mapService.cancelTrip();

    }
    this.setCameraMode('SKY');
  }

  public cancelTripSimulation() {
    this.windowService.unAttachInterval("home", "locationInterval");
    this.geoLocationService.mocking = false;
    environment.mocking = false;
    this.simulation = false;
    this.shouldEndSimulation=true;
    this.geoLocationMockService.index = 0;
    const tripDetailsContainer = document.getElementById("tripDetailsContainer");
    if (tripDetailsContainer) {
      tripDetailsContainer.style.display = "block";
      //this.tripDistance = 0;
      //this.tripDuration = 0;
      //this.tripDestination = "";
    }
    const tripStepDetails = document.getElementById("tripStepDetails");
    if (tripStepDetails) {
      tripStepDetails.style.display = "none";
      this.currentManeuver = "";
      this.currentManeuvreIcon = "";
    }


    const tripNexStepDetails = document.getElementById("tripNexStepDetails");
    if (tripNexStepDetails) {
      tripNexStepDetails.style.display = "none";
      this.nextManeuver = "";
      this.nextManeuvreIcon = "";
    }

    const tripProgress = document.getElementById("tripProgress");

    if (tripProgress) tripProgress.style.display = "none";
    /*const poste = document.getElementById("poste");
    if (poste) { poste.style.display = "none"; }*/



    this.mapService.cancelTripSimulation();
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
      this.tripDistance = parseFloat(Math.round(this.mapService.actualRoute.distance / 1000).toFixed(2));
      this.tripDuration = parseFloat(Math.round(this.mapService.actualRoute.duration / 60).toFixed(2));
      this.tripDestination = this.mapService.destination;
      this.tripDestinationAddress = this.mapService.destinationAddress;
      this.eta = this.tripDuration;
      this.dta = this.tripDistance;


      /*const tripControls = document.getElementById("tripControls");
      if (tripControls) {
        tripControls.style.display = "block";
      }*/
    }
  }
  updateMarkerOrientation(event: DeviceOrientationEvent) {
    ((window as any).deviceOrientationService as DeviceOrientationService).setLastResult(event);

    if (event.alpha !== null) {
      ((window as any).mapService as MapService).updateMarkerRotation(event.alpha * -1);
    }
  };

  updateMarkerAccel(event: DeviceMotionEventAcceleration) {

  };

  addAnotherStopToTrip() {
    this.openModal("Search", true);
  }

  finishSimulation() {
    this.cancelTripSimulation();
    //this.geolock();
    this.startWatchingPosition();

    //this.voiceService.speak("Simulación de viaje completada. Accediendo a ubicación real nuevamente.")
    this.alertService.presentAlert("Simulación completada", "", "A partir de ahora se accederá nuevamente a su ubicación real", ["OK"]);

  }

  stopTrip() {
    if (this.geoLocationService.mocking) {
      this.actionSheetService.askQuestionAorB("¿Desea finalizar la simulación?", "Cerrando el viaje simulado...", "Si, cancelar viaje simulado", "No, continuar viaje simulado y guías").then((result) => {
        if (result) {
          this.cancelTripSimulation();
          //this.geolock();
          this.startWatchingPosition();
        }
      });
    } else {
      this.actionSheetService.askQuestionAorB("Terminar el viaje ahora?", "Cerrar el viaje guiado...", "Si, cancelar viaje", "No, continuar viaje y guías").then((result) => {
        if (result) {
          this.cancelTrip();
        }
      });
    }

  }

  setDestinationOSMifAbortCurrent(destinationId: number) {
    if (this.mapService.isTripStarted) {
      this.actionSheetService.askQuestionAorB("¿Desea terminar el viaje actual y cambiar el destino?", "Cambiando destino actual...", "Si, cambiar el destino de mi viaje", "No, continuar viaje actual sin alterar el destino").then((result) => {
        if (result) {
          this.cancelTrip();
          this.mapService.setDestinationOSM(destinationId);
        }
      });
    } else {
      this.mapService.setDestinationOSM(destinationId);

    }
  }

  openInfoModalOSM(destinationId: number) {
    this.osmClickedId = destinationId;
    this.openModal("PlaceInfo");
  }

  searchPlaceByCoords() {
    this.openModal("SearchReverse");
    this.mapService.closeCustomPopup()

  }

  openOsmModal(destinationId: number): void {
    this.osmClickedId = destinationId;

    this.openModal("Osm");

  }

  openLocationModal(coordinates: [number, number]): void {
    this.coordinatesPressed = coordinates;

    this.openModal("Location");

  }

  openConfModal(): void {

    this.openModal("Conf");

  }

  async openMaxSpeedModal(): Promise<void> {

    //this.openModal("MaxSpeed");
    if(!this.isShowingSpeedWayOnMap){
      await this.mapService.showUserCurrentStreetMaxSpeedWay();
      this.isShowingSpeedWayOnMap = true;
    }else{
      await this.mapService.hideUserCurrentStreetMaxSpeedWay();
      this.isShowingSpeedWayOnMap = false;  
    }
  }

  openCurrentSpeedModal() {
    this.openModal("YourSpeed");
  }

  setDestinationFromCoords() {
    this.mapService.closeCustomPopup()
    this.mapService.setDestinationFromCoords();
  }

  addBookmark(destinationId: number) {
    this.osmClickedId = destinationId;
    this.openModal("BookmarkAdd");
  }
}
