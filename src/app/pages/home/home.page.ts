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
import { MarkerAnimationService } from 'src/app/services/marker-animation.service';
import { Trip } from 'src/app/models/route.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements AfterViewInit, OnDestroy, OnInit {
  speechRecogEnabled: boolean = false;
  userLoggedIn: boolean = false;
  audioOn: boolean = true;
  currentTrip:Trip|null=null;
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
  isShowingSpeedWayOnMap:boolean=false;
  lastTimeStampFromUserPosition = 0;
  positionIndex:number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private translateService: TranslateService,
    public mapService: MapService,
    private geoLocationService: GeoLocationService,
    private geoLocationMockService: GeoLocationMockService,
    private speedService: SpeedService,
    private modalService: ModalService,
    private osmService: OsmService,
    private voiceService: VoiceService,
    private cameraService: CameraService,
    private menuController: MenuController,
    private tripService: TripService,
    private actionSheetService: ActionSheetService,
    private themeService: ThemeService,
    private sensorService: SensorService,
    private tripSimulatorService: TripSimulatorService,
    private ToastService: ToastService,
    private speechRecognitionService: SpeechRecognitionService,
    private bookmarkService: BookmarksService,
    private windowService: WindowService,
    private alertService: AlertService,
    private trafficAlertService:TrafficAlertService,
    private snapService:SnapService,
    private mapboxService:MapboxService,
    private osrmService:OsrmService, 
    private markerAnimationService:MarkerAnimationService,
    private geoLocationAnimatedService: GeoLocationAnimatedService
  ) {
    // Existing constructor code...
    this.isNative = Capacitor.isNativePlatform();
    this.audioOn = this.voiceService.isSpeakerOn();
  }

  toggleSpeechRecognition() {
    this.speechRecognitionService.toggleSpeechRecognition();
  }

  waitAndRenderPage() {
    const timeOut = setTimeout(() => {
      this.mapService.initMap();
      this.startWatchingPosition();
    }, environment.gpsSettings.timeBeforeStartInMs);
    this.windowService.attachedTimeOut("home", "waitAndRender", timeOut);
  }


  async startSimulatingPosition(){
    const self = this;
  }

  async startWatchingPosition() {
    const self = this;
    if(self.geoLocationAnimatedService){
      if(self.simulation){
        const stop=await self.tripSimulatorService.cancelSimulation();        
        self.simulation=false;
      }

      let waitTime=setTimeout(async()=>{
        await self.geoLocationAnimatedService!.startWatchingPosition();
        clearTimeout(waitTime);
      },environment.gpsSettings.timeBetweenRealAndSimulation);
        
    }
  }

  ngOnInit() {
  }

  private initSubscriptions() {
      this.speedService.speedChanged
        .pipe(takeUntil(this.destroy$))
        .subscribe(speed => {
          this.currentSpeed = speed;
        });
  
      this.speedService.maxSpeedChanged
        .pipe(takeUntil(this.destroy$))
        .subscribe(maxSpeed => {
          this.currentMaxSpeed = maxSpeed;
        });
  
      this.tripService.tripProgressChanged
        .pipe(takeUntil(this.destroy$))
        .subscribe(tripProgress => {
          this.tripProgressIndex = tripProgress;
        });
  
      this.tripService.tripEnded
        .pipe(takeUntil(this.destroy$))
        .subscribe(trip => {
          this.tripFinished(trip);
        });
  
      this.tripService.tripStarted
        .pipe(takeUntil(this.destroy$))
        .subscribe(trip => {
          this.currentTrip = trip;
          this.showTripProgress(trip);
        });
  
      this.tripService.tripCanceled
        .pipe(takeUntil(this.destroy$))
        .subscribe(trip => {
          this.tripCanceled(trip);
        });
  
      this.tripService.tripError
        .pipe(takeUntil(this.destroy$))
        .subscribe(error => {
          //this.showTripError(error);
        });
  
      this.trafficAlertService.newSpeedCamaraAlert
        .pipe(takeUntil(this.destroy$))
        .subscribe(alert => {
          this.showSpeedCamera(alert);
        });
  
      this.trafficAlertService.newManeuverAlert
        .pipe(takeUntil(this.destroy$))
        .subscribe(alert => {
          this.showNewManeuver(alert);
        });

      this.voiceService.audioStatusChanged
        .pipe(takeUntil(this.destroy$))
        .subscribe(audio => {
          this.audioOn=audio;
        });
    }


  
  ngAfterViewInit() {
    (window as any).mapService = this.mapService;
    (window as any).geoLocationService = this.geoLocationService;
    (window as any).speedService = this.speedService;
     (window as any).osmService = this.osmService;
    (window as any).tripService = this.tripService;
    (window as any).cameraService = this.cameraService;
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
    (window as any).GeoLocationAnimatedService = this.geoLocationAnimatedService;
    (window as any).markerAnimationService = this.markerAnimationService;
    (window as any).osrmService = this.osrmService;
    this.initSubscriptions();
    this.waitAndRenderPage();
  }

  toggleDarkLightMode() {
    this.themeService.toggleTheme();
  }

  toggleAudio(){
    this.voiceService.toggleAudio();
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
  }

  ngOnDestroy() {
    if(this.geoLocationAnimatedService)this.geoLocationAnimatedService.stopWatchingPosition();
    
       // Emitir un valor para cerrar todas las suscripciones
    this.destroy$.next();
    this.destroy$.complete();
    this.windowService.unattachComponent("home");
    this.mapService.leaveMapPage();
    this.modalService.avoidMultipleInstancesOfModal()
    if(this.currentTrip){
      this.cancelTrip();
    }
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
    if(this.geoLocationAnimatedService){
      let snapedPosition: Position = this.geoLocationAnimatedService.getLastPosition();
      if(snapedPosition){
        if (cameraMode === 'POV'){
          this.mapService.setCameraPOVPosition(snapedPosition);
        }else if (cameraMode === 'SKY'){
          this.mapService.setCameraSKYPosition(snapedPosition)
        }
        
      }
   }
   
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

    //this.startSimulatingPosition();
    this.mapService.startNewSimulationTrip();
  }

  showTripProgress(trip:Trip){
    const tripProgressContainer = document.getElementById("tripProgress");
    if (tripProgressContainer) {
      tripProgressContainer.style.display = "block";
    }
    const tripDetailsContainer = document.getElementById("tripDetailsContainer");
    if (tripDetailsContainer) {
      tripDetailsContainer.style.display = "none";
    }
    this.tripProgressIndex=trip.tripProgress;
  }

  public startTrip() {
    this.mapService.startTrip(false);
  }

  public tripCanceled(trip:Trip) {
    let stopSimulatingPosition = false;
    if (trip.tripIsSimulation) {
       this.resetTripAndPositionsProperties();
       stopSimulatingPosition=true;
     }
     this.cancelTripDOMelements();
     this.mapService.cancelTrip();
     if(stopSimulatingPosition){
      this.startWatchingPosition();
     }
     
   }

  public cancelTrip() {
   /*if (this.simulation||this.tripService.trip?.tripIsSimulation) {
   }*/
   this.tripService.cancelTrip();

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
    const tripProgress = document.getElementById("tripProgress");

    if (tripProgress) tripProgress.style.display = "none";
  }
  
  showTrip(trip:Trip): void {
    this.mapService.setCameraPOVPosition(trip.userStartedTripFrom!);
    const tripDetailsContainer = document.getElementById("tripDetailsContainer");
    if (tripDetailsContainer) {
      tripDetailsContainer.style.display = "block";
      this.tripDistance = parseFloat(Math.round(trip.tripDistance / 1000).toFixed(2));
      this.tripDuration = parseFloat(Math.round(trip.tripDuration / 60).toFixed(2));
      this.tripDestination = trip.tripDestination;
      this.tripDestinationAddress = trip.tripDestinationAddress!;
      this.eta = trip.tripDuration;
      this.dta = trip.tripDistance;
      /*const tripControls = document.getElementById("tripControls");
      if (tripControls) {
        tripControls.style.display = "block";
      }*/
    }
  }

  addAnotherStopToTrip() {
    this.openModal("Search", true);
  }

  tripFinished(trip:Trip) {
    //if (this.geoLocationService.mocking) {
    if(this.currentTrip?.tripIsSimulation){  
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

  simulationFinished() {
    //this.geolock();
    //this.startWatchingPosition();
    this.simulation=false;
    environment.mocking=false;

    //this.startWatchingPosition();
    //this.voiceService.speak("Simulación de viaje completada. Accediendo a ubicación real nuevamente.")
    this.alertService.presentAlert("Simulación completada", "", "A partir de ahora se accederá nuevamente a su ubicación real", ["OK"]);
  }

  stopTrip() {
    //if (this.geoLocationService.mocking) {
    if(this.currentTrip?.tripIsSimulation){  
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

  showNewManeuver(alert:{
    alertText:string, 
    alertType:string, 
    alertIconUrl:string,
    recommendedDuration:number 
}){
    const tripStepDetails = document.getElementById("tripStepDetails");
    if (tripStepDetails) {
      tripStepDetails.style.display = "block";
      /*const instructions = document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLElement;
      if (instructions) instructions.style.display = "block";*/
      const progress = document.getElementById("tripProgress");
      if (progress) { progress.style.display = "block"; }
      ((window as any).homePage as HomePage).currentManeuver = alert.alertText;
      ((window as any).homePage as HomePage).currentManeuvreIcon = alert.alertIconUrl;
      const time: any = setTimeout(() => {
        if (tripStepDetails) tripStepDetails.style.display = "none";
      }, alert.recommendedDuration); // Adjust delay as needed
      this.windowService.attachedTimeOut("home", "tripservice", time);
    }
  }

  showSpeedCamera(alert:{
    alertText:string, 
    alertType:string, 
    alertIconUrl:string,
    recommendedDuration:number 
}){
    const tripStepDetails = document.getElementById("tripStepDetails");
    if (tripStepDetails) {
      tripStepDetails.style.display = "block";
      /*const instructions = document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLElement;
      if (instructions) instructions.style.display = "block";*/
      const progress = document.getElementById("tripProgress");
      if (progress) { progress.style.display = "block"; }
      ((window as any).homePage as HomePage).currentManeuver = alert.alertText;
      ((window as any).homePage as HomePage).currentManeuvreIcon = alert.alertIconUrl;
      const time: any = setTimeout(() => {
        if (tripStepDetails) tripStepDetails.style.display = "none";
      }, alert.recommendedDuration); // Adjust delay as needed
      this.windowService.attachedTimeOut("home", "tripservice", time);
    }
  }

  openCalibrationModal(){
    this.openModal("CalibrateApp");
  }
}
