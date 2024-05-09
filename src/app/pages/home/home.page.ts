import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Position } from '@capacitor/geolocation';
import { MenuController, ToastController } from '@ionic/angular'; // Add this line
import { GeoLocationMockService } from 'src/app/mocks/geo-location-mock.service';
import { ThemeService } from 'src/app/services/theme-service.service';
import { TripSimulatorService } from 'src/app/services/trip-simulator.service';
import { ActionSheetService } from '../../services/action-sheet.service';
import { CameraService } from '../../services/camera.service';
import { DeviceOrientationService } from '../../services/device-orientation.service';
import { GeoLocationService } from '../../services/geo-location.service';
import { IntersectionService } from '../../services/intersection.service';
import { MapService } from '../../services/map.service';
import { ModalService } from '../../services/modal.service';
import { OsmService } from '../../services/osm.service';
import { SensorService } from '../../services/sensor.service';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';
import { SpeedService } from '../../services/speed.service';
import { ToastService } from '../../services/toast.service';
import { TripService } from '../../services/trip.service';
import { VoiceService } from '../../services/voice.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements AfterViewInit, OnDestroy {
  speechRecogEnabled: boolean = false;
  private watchId: any;
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
  simulation: boolean = false;
  shouldEndSimulation: boolean = false;
  private locationInterval: any; // Store the interval ID for location monitoring
  getMock: boolean = true;
  isNative: boolean = false;

  constructor(
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
    private intersectionService: IntersectionService,
    private actionSheetService: ActionSheetService,
    private themeService: ThemeService,
    private sensorService: SensorService,
    private tripSimulatorService: TripSimulatorService,
    private toastController: ToastController, // Fix the typo here
    private ToastService: ToastService,
    private speechRecognitionService: SpeechRecognitionService
  ) {
    // Existing constructor code...
    this.isNative = Capacitor.isNativePlatform()
    this.audioOn = this.voiceService.isSpeakerOn();
  }



  // Existing code...

  toggleSpeechRecognition() {
    this.speechRecognitionService.toggleSpeechRecognition();
  }

  waitAndRenderPage() {
    setTimeout(() => {
      this.mapService.initMap();
      this.geolock();
      //this.deviceOrientationService.startListeningHeading();
      //this.deviceOrientationService.listenAcceleration();
      //this.speedService.startWatchingSpeedLimit();


    }, 500);
  }


  geolockMock() {
    const self = this;
    this.geoLocationService.stopWatchingPosition();
    this.locationInterval = setInterval(() => {

      if (self.shouldEndSimulation) {
        self.cancelTripSimulation();
        self.shouldEndSimulation = false;
      }
      if (this.mapService.isAnimating) {
        return;
      }

      //this.geoLocationService.watchPosition((position, error) => {
      this.geoLocationMockService.getNextPosition().then
        (position => {
          if (!position) return;

          this.sensorService.updateGeolocation(position);
          const smoothedLat = this.sensorService.getSensorLatitude();
          const smoothedLng = this.sensorService.getSensorLongitude();
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
            if (this.mapService.isTripStarted) { this.tripService.locationUpdate(false); }
            this.speedService.locationUpdate();
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
          } else {
            self.currentSpeed = 0;
          }

        });


      //});
    }, 1000); // Check every 5 seconds (adjust interval as needed)

  }

  geolock() {
    const self = this;

    this.geoLocationService.watchPosition((position, error) => {
      //console.log("ENTERED WATCH POSITION:", position);
      if (error) {
        console.error('Error watching position:', error);
        return;
      }
      if (!position) return;

      this.sensorService.updateGeolocation(position);
      const smoothedLat = this.sensorService.getSensorLatitude();
      const smoothedLng = this.sensorService.getSensorLongitude();
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
        if (this.mapService.isTripStarted) { this.tripService.locationUpdate(false); }
        this.speedService.locationUpdate();
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
      } else {
        self.currentSpeed = 0;
      }
      if (self.shouldEndSimulation) {
        self.cancelTripSimulation();
        self.shouldEndSimulation = false;
      }
    });
  }

  ngAfterViewInit() {
    const self = this;

    (window as any).mapService = this.mapService;
    (window as any).geoLocationService = this.geoLocationService;
    (window as any).speedService = this.speedService;
    (window as any).osmService = this.osmService;
    (window as any).tripService = this.tripService;
    (window as any).intersectionService = this.intersectionService;
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
    this.geoLocationService.stopLocationObserver();
    //this.deviceOrientationService.stopListeningHeading();
    //this.speedService.stopWatchingSpeedLimit();
    this.mapService.leaveMapPage();
    this.cancelTrip();
  }

  public openModal(type: String, extraParam?: any) {
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
    this.simulation = true;
    this.geolockMock();
    this.tripSimulatorService.simulateGuidedTrip();
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


    if (this.geoLocationService.mocking) {
      this.geoLocationService.mocking = false;
    }
    this.mapService.cancelTrip();
    this.setCameraMode('SKY');
  }

  public cancelTripSimulation() {
    if (this.locationInterval) clearInterval(this.locationInterval);
    this.geolock();
    this.simulation = false;
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


    if (this.geoLocationService.mocking) {
      this.geoLocationService.mocking = false;
    }
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

  stopTrip() {
    if (this.geoLocationService.mocking) {
      this.actionSheetService.askQuestionAorB("¿Desea finalizar la simulación?", "Cerrando el viaje simulado...", "Si, cancelar viaje simulado", "No, continuar viaje simulado y guías").then((result) => {
        if (result) {
          this.shouldEndSimulation = true;
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
}
