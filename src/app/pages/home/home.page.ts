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
import { TrafficAlertService } from 'src/app/services/traffic-alert-service';
import { SnapService } from 'src/app/services/snap.service';
import { MapboxService } from 'src/app/services/mapbox.service';
import { Place } from '@aws-amplify/geo';
import { GeoLocationAnimatedService } from 'src/app/services/geo-location-animated.service';
import { OsrmService } from 'src/app/services/osrm.service';

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
  lastTimeStampFromUserPosition = 0;
  positionIndex:number = 0;
  geoLocationAnimatedService:GeoLocationAnimatedService|null=null;
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
  private trafficAlertService:TrafficAlertService,
private snapService:SnapService,
private mapboxService:MapboxService,
private osrmService:OsrmService
) {
    // Existing constructor code...
    this.isNative = Capacitor.isNativePlatform()
    this.audioOn = this.voiceService.isSpeakerOn();
    this.geoLocationAnimatedService = new GeoLocationAnimatedService(this.osrmService, this.mapService, this.tripService, this.trafficAlertService);
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


    }, environment.gpsSettings.timeBeforeStartInMs);
    this.windowService.attachedTimeOut("home", "waitAndRender", timeOut);
  }


  async geolockMock() {

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
        (position => {
          if (!position || !self.simulation) return;
          if (position.coords.latitude == 0 && position.coords.longitude == 0) {
            self.finishSimulation();
          } else {
              self.positionIndex=self.positionIndex+1;
                  //await self.speedService.locationUpdate();
               self.snapService.locationUpdate(position,self.positionIndex);
               //if (self.mapService.isTripStarted) { self.tripService.locationUpdate(false); }

            
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
    }, environment.gpsSettings.simulationIntervalTimeInMs); // Check every 5 seconds (adjust interval as needed)
    self.windowService.attachedInterval("home", "locationInterval", locationInterval);
  }

  startWatchingPositionV2() {
    if(this.geoLocationAnimatedService){
      this.geoLocationAnimatedService.startWatchingPosition();
    }
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

  startWatchingPositioGPS() {
    try {
      this.windowService.unAttachInterval("home", "locationInterval");
      this.simulation = false;
      this.geoLocationService.mocking = false;
      environment.mocking = false;
      this.windowService.unAttachInterval("home", "gpsInterval");
      this.windowService.unAttachWatch("home", "gps");
      const self = this;

      const gpsInterval: any = setInterval(() => {

        self.geoLocationService.getCurrentPosition().then(
          async (position) => {
            self.positionIndex = self.positionIndex+1;
            console.log("NEW GPS READ: ",self.positionIndex,position);
            if (self.simulation || !position || position.timestamp<=self.lastTimeStampFromUserPosition) return;
              self.lastTimeStampFromUserPosition=position.timestamp;
              self.snapService.locationUpdate(position,self.positionIndex);
              //if (self.mapService.isTripStarted) { self.tripService.locationUpdate(false); }
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
  
      }, environment.gpsSettings.locationIntervalTimeInMs); // Check every 2 seconds (adjust interval as needed)
      this.windowService.attachedInterval("home", "gpsInterval", gpsInterval);
    } catch (e) {
      console.error('Error starting position watch:', e);
      alert('Unable to watch position. Please ensure location services are enabled and permissions are granted.');
      return;
    }
  }

  async geoLockForWeb(position:Position){
      const self = ((window as any).homePage as HomePage);
      self.positionIndex = self.positionIndex+1;
      console.log("NEW GPS READ: ",self.positionIndex,position);
      if (self.simulation || !position || position.timestamp<=self.lastTimeStampFromUserPosition) return;
        self.lastTimeStampFromUserPosition=position.timestamp;
        self.snapService.locationUpdate(position,self.positionIndex);
        //if (self.mapService.isTripStarted) { self.tripService.locationUpdate(false); }
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

 async geolock(position: Position | null) {
    const self = this;
    if (!position || this.simulation) return;
    self.positionIndex=self.positionIndex+1;
    console.log("NEW GPS READ: ",self.positionIndex,position);
    const speed = position.coords.speed;
    let speedChanged = false;
    if (speed) {
      if(self.currentSpeed!=speed){
        speedChanged=true;
      }
      self.currentSpeed = Math.round(speed * 60 * 60 / 1000);
      //self.currentSpeedometerNeedleRotation = self.needleRotation();
      if(self.currentSpeed<5){
        self.currentSpeed=0;
      }
    } else {
      self.currentSpeed = 0;
    }
    if(speedChanged){
      self.speedChanged.emit(self.currentSpeed);

    }
    await self.snapService.locationUpdate(position,self.positionIndex);
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
        async (position) => {
          if (!position) return;
          self.positionIndex=self.positionIndex+1;

          await self.snapService.locationUpdate(position,self.positionIndex);
          const speed = position.coords.speed;
          let speedChanged = false;
          if (speed) {
            if(self.currentSpeed!=speed){
              speedChanged=true;
            }
            self.currentSpeed = Math.round(speed * 60 * 60 / 1000);
            //self.currentSpeedometerNeedleRotation = self.needleRotation();
            if(self.currentSpeed<5){
              self.currentSpeed=0;
            }
          } else {
            self.currentSpeed = 0;
          }
          if(speedChanged){
            self.speedChanged.emit(self.currentSpeed);

          }
        });

    }, environment.gpsSettings.locationIntervalTimeInMs); // Check every 2 seconds (adjust interval as needed)
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
    //(window as any).  = this.intersectionService;
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
    (window as any).bookmarkService=this.bookmarkService;


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
    this.windowService.unattachComponent("home");
    this.positionIndex=0;
    this.snapService.positionIndex=0;
    this.mapService.positionIndex=0;
    this.mapService.lastLocationAnimationCompleted=0;
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
   if (this.simulation) {
      this.resetTripAndPositionsProperties;
      this.cancelTripDOMelements();
      this.startWatchingPosition();
    }else{
      this.cancelTripDOMelements();
      this.mapService.cancelTrip();
    }
    //this.setCameraMode('SKY');
  }

  public resetTripAndPositionsProperties(){
    this.simulation=false;
    this.mapService.isAnimating=false;
    this.windowService.unAttachInterval("home", "locationInterval");
    this.geoLocationService.mocking = false;
    environment.mocking = false;
    this.geoLocationMockService.index = 0;
    this.geoLocationMockService.setCoordinates([]);
    this.tripService.route = null;
    this.tripService.currentStepIndex = 0;
    this.tripService.tripProgress = 0;
    this.tripService.lastUserPositionMonitored=null;
    this.tripService.tripDistance = 0;
    this.tripService.preannouncedManeuvers.clear();
    this.tripService.announcedManeuvers.clear();
    this.mapService.destination = "";
    this.mapService.isTripStarted = false;
    this.mapService.mapControls.directions.removeRoutes();
    this.mapService.mapControls.directions.actions.clearDestination();
    this.mapService.mapControls.directions.actions.clearOrigin();
    this.mapService.cleanRoutePopups();
    this.mapService.popUpDestination?.remove();
    this.mapService.actualRoute = null;
    this.mapService.currentStep = 0;
    this.mapService.alreadySpoken = false;
    this.mapService.userCurrentStreet=null;
    this.mapService.userCurrentStreetHeading=0;
    this.snapService.lastPosition = null;
    this.snapService.lastCurrentStreet=null;
    this.snapService.lastUserStreets=[];
    this.snapService.lastestUserLocations=[];
    this.snapService.lastestHints=[];
    this.snapService.lastOSRMmatchesLocations=[];
    this.snapService.lastHeading=0;
    this.snapService.positionIndex=0;
    this.lastTimeStampFromUserPosition=0;
    this.positionIndex=0;
    this.mapService.positionIndex=0;
    this.mapService.lastLocationAnimationCompleted=0;
    this.trafficAlertService.lastUserCurrentStreet=null;
    this.trafficAlertService.lastUserCurrentStreetName=null;
    this.trafficAlertService.preannouncedObjects.clear(); // Set de objetos ya preanunciados
    this.trafficAlertService.announcedObjects.clear(); // Set de objetos ya anunciados

  }

  public cancelTripDOMelements(){
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

  async finishSimulation() {
    this.cancelTrip();
    //this.geolock();
    //this.startWatchingPosition();

    //this.voiceService.speak("Simulación de viaje completada. Accediendo a ubicación real nuevamente.")
    await this.alertService.presentAlert("Simulación completada", "", "A partir de ahora se accederá nuevamente a su ubicación real", ["OK"]);

  }

  stopTrip() {
    if (this.geoLocationService.mocking) {
      this.actionSheetService.askQuestionAorB("¿Desea finalizar la simulación?", "Cerrando el viaje simulado...", "Si, cancelar viaje simulado", "No, continuar viaje simulado y guías").then((result) => {
        if (result) {
          this.cancelTrip();
          //this.geolock();
          //this.startWatchingPosition();
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

  setDestinationBookmarkIfAbortCurrent(place: Place) {
    if (this.mapService.isTripStarted) {
      this.actionSheetService.askQuestionAorB("¿Desea terminar el viaje actual y cambiar el destino?", "Cambiando destino actual...", "Si, cambiar el destino de mi viaje", "No, continuar viaje actual sin alterar el destino").then((result) => {
        if (result) {
          this.cancelTrip();
          this.mapService.setDestinationBookmark(place);
        }
      });
    } else {
      this.mapService.setDestinationBookmark(place);

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

  openBookmarkSavedModal(): void {
    this.openModal("BookmarkSaved");
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
}
