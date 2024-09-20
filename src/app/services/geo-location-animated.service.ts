import { Injectable } from '@angular/core';
import { Geolocation, Position, PermissionStatus as Perm } from '@capacitor/geolocation';
import { MapService } from './map.service'; // Importa tu MapService
import { OsrmService } from './osrm.service';
import { TripService } from './trip.service';
import { TrafficAlertService } from './traffic-alert-service';
import { environment } from 'src/environments/environment';
import { GeoLocationService } from './geo-location.service';
import { SensorService } from './sensor.service';
import { MarkerAnimationService } from './marker-animation.service';
import { SpeedService } from './speed.service';
import { point } from '@turf/helpers';
import distance from '@turf/distance';
import bearing from '@turf/bearing';
import { MapboxGeoJSONFeature } from 'mapbox-gl';
import { Capacitor } from '@capacitor/core';
import { GeoLocationMockService } from '../mocks/geo-location-mock.service';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class GeoLocationAnimatedService {

  private watchId: string | null = null;
  private timeIdSimulation:any|null =null;
  preLastPosition!:Position|null;
  lastPosition!:Position|null;
  private lastHeading:number=0;
  private lastCurrentStreet!: MapboxGeoJSONFeature|null;
  private geoLocPermIsOk:boolean=false;
  private isBusy:boolean=false;


  constructor(
    private osrmService: OsrmService,
    private mapService: MapService,
    private tripService: TripService,
    private trafficAlertService: TrafficAlertService, 
    private markerAnimationService:MarkerAnimationService, 
    private geoLocationService:GeoLocationService, 
    private sensorService:SensorService, 
    private speedService:SpeedService,
    private geoLocationMockService:GeoLocationMockService,
    private alertService:AlertService
  ) {
  }

  public getLastPosition():Position{
    return this.lastPosition!;
  }

  async getLocationPerm():Promise<boolean>{
    const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        let perm = await Geolocation.requestPermissions();
        if (perm.location !== 'granted') {
          await this.alertService.presentAlert("Error: falta habilitar permiso para acceder a tu ubicación.", "Ubicación desactivada o permiso deshabilitado.", "Para poder utilizar esta app, permite que Iron Street acceda a tu ubicación. Dependiendo de tu dispositivo, es posible que debas abrir nuevamente la app después de habiliar el permiso.", ["OK (habilitarlo a continuación)"]);
          let permAgain = await Geolocation.requestPermissions();
          if (permAgain.location !== 'granted') {
            return false;
          }else{
            return true;
          }
        }else{
          return true;
        }
      }else{
        return true;
      }
  }

  async getLocationPermWeb():Promise<boolean>{
    const permissions = await navigator.permissions.query({ name: "geolocation" });
      if (permissions.state !== 'granted') {
        let perm = await navigator.permissions.query({ name: "geolocation" });
        if (perm.state !== 'granted') {
          await this.alertService.presentAlert("Error: falta habilitar permiso para acceder a tu ubicación.", "Ubicación desactivada o permiso deshabilitado.", "Para poder utilizar esta app, permite que Iron Street acceda a tu ubicación. Dependiendo de tu dispositivo, es posible que debas abrir nuevamente la app después de habiliar el permiso.", ["OK (habilitarlo a continuación)"]);
          let permAgain = await navigator.permissions.query({ name: "geolocation" });
          if (permAgain.state !== 'granted') {
            return false;
          }else{
            return true;
          }
        }else{
          return true;
        }
      }else{
        return true;
      }
  }


  async requestPermissionsV2():Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      const perm = await this.getLocationPerm();
      return perm;
    } else {
      const perm = await this.getLocationPermWeb();
      return perm;
    }
  }


  async requestPermissions() :Promise<boolean>{
    if (Capacitor.isNativePlatform()) {
      try {
        const permissions = await Geolocation.requestPermissions();
        if (permissions.location === 'granted') {
          return true;
        } else {
          throw new Error('Location permission not granted');
        }
      } catch (error) {
        console.error('Error requesting location permissions', error);
        throw error;
      }
    } else {
      // Web does not need explicit permissions
      return true;
    }
  }
    
  // Inicia la observación de la posición del usuario
  public async  startWatchingPosition():Promise<void> {
    const self:GeoLocationAnimatedService = this;
    if(!self.geoLocPermIsOk){
      self.geoLocPermIsOk  = await self.requestPermissions();
    }

    if(self.geoLocPermIsOk){
      // Inicia el watchPosition
      const options = {
                        enableHighAccuracy: true,
                        timeout: environment.gpsSettings.timeOut,
                        maximumAge: environment.gpsSettings.positionMaxAge,
                      }
      if (Capacitor.isNativePlatform()) {

        self.watchId = await Geolocation.watchPosition(
          options,
          async (position, err) => {
            if (err) {
              console.log('Error obteniendo la posición:', err);
              return;
            }

            if (position) {
              // Llama al método para manejar la nueva posición
              await self.handlePositionUpdate(position);
            }
          }
        );
         //return coordinates;
      } else {
          if (navigator.geolocation) {
            let id = navigator.geolocation.watchPosition(
              async (position: GeolocationPosition) => {
                if (position) {
                  const pos:Position = position as Position;
                  // Llama al método para manejar la nueva posición
                  await self.handlePositionUpdate(pos);
                }
              }, 
            (err) => {
              console.log('Error obteniendo la posición:', err);
              return;
            },
           options);
           if(id!=null) {
            self.watchId=id.toString();
           }
          }else {
            return;
          }
        }
    }

  }

  isLastPositionOlderThanTwoSeconds(lastPosition: Position, newPosition: Position): boolean {
    // Obtén la diferencia en milisegundos entre las dos posiciones
    const timeDifference = newPosition.timestamp - lastPosition.timestamp;
  
    // Verifica si la diferencia es mayor o igual a 2000 milisegundos (2 segundos)
    return timeDifference >= environment.gpsSettings.locationIntervalTimeInMs;
  }

  // Maneja la actualización de la posición
  async handlePositionUpdate(position: Position):Promise<void> {
    const self = this;
    if(self.isBusy){
      return;
    }
    if(self.lastPosition){
      console.log("LASTPOSITION",self.lastPosition,position.timestamp,self.lastPosition!.timestamp)

      const timeDifference = position.timestamp - self.lastPosition.timestamp;
      console.log(timeDifference);
      if(timeDifference<environment.gpsSettings.locationIntervalTimeInMs){
        return;
      }
    }
    self.isBusy=true;
    try{
    // Llama al servicio de snap para ajustar la posición
    const matchedPosition = await self.osrmService.getMatchedPosition(position);
    const currentFeature = matchedPosition.currentFeature;
    const heading: number= matchedPosition.heading as number;
    let snapedPos=
    {
      coords:
      {
        longitude:matchedPosition.lon as number,
        latitude:matchedPosition.lat as number,
        heading:heading,
        speed:matchedPosition.speed,
        altitude: matchedPosition.altitude,
        altitudeAccuracy: matchedPosition.altitudeAccuracy,
        accuracy: matchedPosition.accuracy
      },
      timestamp: matchedPosition.timestamp
    }
    this.osrmService.lastestUserLocationsSnaped.push(snapedPos);
    if(this.osrmService.lastestUserLocationsSnaped.length>10){
      this.osrmService.lastestUserLocationsSnaped.shift();
    }
    self.isBusy=false;


    const max = Number.parseInt(matchedPosition.maxspeed)
    self.speedService.setCurrentSpeed(matchedPosition.speed);
    self.speedService.setCurrentMaxSpeed(max); 
    self.speedService.setCurrentFaults(matchedPosition.totalSpeedViolations);
    self.speedService.setCurrentKm(matchedPosition.totalKm);

    

    if(matchedPosition.isOverSpeeding==true){
      self.trafficAlertService.showAlert("Exceso de velocidad detectado. Comienza de nuevo", "speedExceeded", "", true);
    }
   

    let userMoved,useStreetHeading:boolean=false;
    if(
      !self.lastPosition 
      || !self.lastCurrentStreet 
      || (self.lastPosition && self.lastCurrentStreet && self.lastCurrentStreet.id!=currentFeature.id)){
        //First match or enter new street
      userMoved=true;
    }else{
      //EVALUATE IF MOVED OR GPS MARGIN
      userMoved=self.hasMoved([self.lastPosition.coords.longitude,self.lastPosition.coords.latitude],[snapedPos.coords.longitude,snapedPos.coords.latitude],snapedPos.coords.accuracy)
    }
    /*if(!self.lastHeading){
      useStreetHeading=false;
    }else{
      //DEBO EVALUAR SI CAMBIO HEADING O GPS ERROR.

      const diffHeadingsInDeg:number=this.calculateHeadingDifference(this.lastHeading,heading);
      let speed = matchedPosition.speed;
      if(!speed)speed = 0;
      //let shouldUseNewHeading=true;
      const shouldUseNewHeading = this.shouldUseCalculatedHeading(userMoved,diffHeadingsInDeg,speed)
      if(shouldUseNewHeading){
        useStreetHeading=false;
      }else{
        useStreetHeading=true;
      }
    }*/

    

    self.lastHeading=heading;
    self.lastCurrentStreet=currentFeature;
    if(self.lastPosition){
      self.preLastPosition = self.lastPosition;
    } 
    self.lastPosition=snapedPos;

     let positionIsFromUserMovement:0|1=0;
     if(userMoved){
      positionIsFromUserMovement=1;
     }
     snapedPos.coords.altitudeAccuracy=positionIsFromUserMovement; //USE ALTITUDE ACCURACY AS USER MOVED (it was useless for this app)
     self.geoLocationService.setLastCurrentPosition(snapedPos);
     self.sensorService.setMatchedPosition(snapedPos,currentFeature,[snapedPos.coords.longitude,snapedPos.coords.latitude]);
     self.sensorService.setOriginalPosition(position.coords.latitude, position.coords.longitude, position.coords.heading!);
     self.mapService.setStreetFeature(currentFeature);
     self.mapService.setUserCurrentStreet(currentFeature);
     
     if (self.mapService.isRotating) {
     console.log(snapedPos)
      const streetHeading = self.mapService.userCurrentStreetHeading;
      self.markerAnimationService.currentMarkerPosition=snapedPos;
      self.markerAnimationService.currentHeading=streetHeading;
      self.mapService.updateMarkerState(snapedPos,streetHeading,currentFeature);
      //self.isBusy=false;
      return;
     }
     console.log(matchedPosition);
     // Ejecuta las tareas en paralelo después de obtener la posición ajustada
     if(useStreetHeading||heading===0){
      snapedPos.coords.heading=self.mapService.userCurrentStreetHeading;
     }
     const promises=[];
     promises.push(self.markerAnimationService.updateUserMarker(snapedPos));
     if(self.mapService.isTripStarted){
      promises.push(self.tripService.locationUpdate(false,snapedPos));
     }
     if(matchedPosition.roadName && matchedPosition.cameras && matchedPosition.cameras.length>0){
      promises.push(self.trafficAlertService.checkAlertableObjectsOnNewUserPositionFromArray(snapedPos,matchedPosition.roadName,matchedPosition.cameras));
     }
     await Promise.all(promises);
     return;
    }catch(err){
      self.isBusy=false;
      return;
    }
  }

  // Detiene la observación de la posición
  async stopWatchingPosition() {
    const self=this;
    // Asegúrate de detener cualquier observación previa
    if (self.watchId) {
      if(Capacitor.isNativePlatform()){
        await Geolocation.clearWatch({ id: self.watchId });
      }else{
        navigator.geolocation.clearWatch(Number.parseInt(self.watchId));
      }
      self.watchId = null;
    }
  }

  shouldUseCalculatedHeading(userMoved:boolean, diffHeadingsInDeg:number, speed:number) {
    let threshold = speed > environment.snapServiceConf.speedThreeholdForHeadingTop ? environment.snapServiceConf.maxValidHeadingChangeInDegForTopSpeedThreehold : speed < environment.snapServiceConf.speedThreeholdForHeadingBottom ? environment.snapServiceConf.maxValidHeadingChangeInDegForBottomSpeedThreehold : environment.snapServiceConf.maxValidHeadingChangeDefault;

    if (userMoved && diffHeadingsInDeg <= threshold && speed > environment.snapServiceConf.minValidSpeedForMovement) {
        return true;  // Usar heading calculado por GPS
    } else {
        return false; // Usar heading de la calle
    }
}

 calculateHeading(previousPosition:{lon:number,lat:number}, snapedPos:{lon:number,lat:number}) {
    const from = point([previousPosition.lon, previousPosition.lat]);
    const to = point([snapedPos.lon, snapedPos.lat]);
    const heading = bearing(from, to);

    return heading;
  }

  hasMoved(previousPosition: [number,number], currentPosition: [number,number], accuracy:number) {
    if (!previousPosition || !currentPosition) {
        return false; // No previous position to compare
    }

    // Calculate distance between previous and current positions
    const from = point(previousPosition);
    const to = point(currentPosition);
    const distanceInMeters = distance(from, to, { units: 'meters' });

    // Check if the distance exceeds the movement threshold
    return distanceInMeters > environment.snapServiceConf.distanceToConsiderMovementInMeters && accuracy < environment.snapServiceConf.maxValidAccuracy; // Assuming 50 meters as acceptable GPS accuracy
  }

  calculateHeadingDifference(heading1:number, heading2:number) {
      // Normalize the headings to be between 0 and 360 degrees
      heading1 = (heading1 + 360) % 360;
      heading2 = (heading2 + 360) % 360;

      // Calculate the absolute difference
      let difference = Math.abs(heading1 - heading2);

      // Adjust to make sure the difference is between 0 and 180 degrees
      if (difference > 180) {
          difference = 360 - difference;
      }

      return difference;
  }


  async startSimulatingPosition():Promise<void>{
    await this.stopWatchingPosition();
    if(this.timeIdSimulation){
      clearInterval(this.timeIdSimulation);
    }
    this.timeIdSimulation = setInterval(async () => {
      const position = await this.geoLocationMockService.getNextPosition();
      if (position) {
        // Llama al método para manejar la nueva posición
        await this.handlePositionUpdate(position);
      }
    },environment.gpsSettings.simulationIntervalTimeInMs)};

  async stopSimulatingPosition():Promise<void>{
    if(this.timeIdSimulation){
      clearInterval(this.timeIdSimulation);
      this.lastCurrentStreet=null,
      this.lastHeading=0;
      this.lastPosition=null;
      this.osrmService.clear();
    }
  }
}