import { EventEmitter, Injectable } from '@angular/core';
import polyline from '@mapbox/polyline';
import * as turf from '@turf/turf';
import {Feature,LineString} from '@turf/helpers';

import mapboxgl, { AnyLayer, GeoJSONFeature, LngLatBounds, MapboxGeoJSONFeature, MapEvent } from 'mapbox-gl';

//import 'mapbox-gl/dist/mapbox-gl.css';
import { Position } from '@capacitor/geolocation';
import { environment } from 'src/environments/environment';
import { GeoLocationService } from './geo-location.service';
import { WindowService } from "./window.service";
//import { GeoJSON } from 'mapbox-gl';

//import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
//import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { Place, PlaceGeometry } from 'src/app/models/route.interface';
import { HomePage } from '../pages/home/home.page';
import { CameraService } from './camera.service';
import { SensorService } from './sensor.service';
import { TripService } from './trip.service';
import { BookmarksService } from './bookmarks.service';
import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { Trip,Route } from '../models/route.interface';
import { SourceAndLayerManagerService } from './mapHelpers/source-and-layer-manager.service';
import { TripSimulatorService } from './trip-simulator.service';
import { GeoLocationAnimatedService } from './geo-location-animated.service';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  tb!: any;
  carModel: any;
  carModelSimulator: any|null=null;
  modelTransform: any;
  private mapbox!: mapboxgl.Map;
  userLocationMarkerPrerequisitesOk: boolean = false;
  isAnimating: boolean = false; // Indicador de si una animación está en curso
  animationTarget: mapboxgl.LngLat | null = null; // Stores the target for ongoing animation
  mapControls: any = { directions: null };
  destination!: string;
  destinationAddress!: string;
  destinationPlace!: Place;
  userCurrentStreet: MapboxGeoJSONFeature | null = null;
  userCurrentStreetSegment: MapboxGeoJSONFeature | null = null;
  isTripStarted: boolean = false;
  actualRoute!: any;
  currentStep: number = 0;
  alreadySpoken: boolean = false;
  sourcesAndLayers: any = { sources: { directions: null, userMarkerSource: null }, layers: [] };
  isStandardMap: boolean = true;
  isRotating = true; // Flag to control rotation
  light: string = "dusk";
  userMarkerInstance: mapboxgl.Marker | null = null;
  userVisionMarkerInstance: mapboxgl.Marker | null = null;
  introTimeWaited: boolean = false;
  trackingUser: boolean = true;
  mapEventIsFromTracking: boolean = false;
  popUpMainRoute: mapboxgl.Popup | null = null;
  popUpMaxSpeedWay: mapboxgl.Popup | null = null;
  calculatingPressEvent: boolean=false;

  popUpAltRoute: mapboxgl.Popup | null = null;
  popUpDestination: mapboxgl.Popup | null = null;
  popups: mapboxgl.Popup[] = [];
  coordinatesMainRoute: number[][] = [];
  coordinatesAltRoute: number[][] = [];
  osmFeatures: mapboxgl.MapboxGeoJSONFeature[] = [];
  osmPlaces: Place[] = [];
  lastPosition: mapboxgl.LngLat | null = null;
  mapPressedMarkerInstance: mapboxgl.Marker | null = null;
  popUpMapPressed: mapboxgl.Popup | null = null;
  private isLongPress: boolean = false;
  private longPressTimeout: any;
  firstTouchDone: boolean = false;
  showingMaxSpeedWay: boolean = false;
  showingMaxSpeedWayId: string | null = null;
  currentStreetChanged: EventEmitter<mapboxgl.MapboxGeoJSONFeature> = new EventEmitter<mapboxgl.MapboxGeoJSONFeature>();
  scene: any;
  renderer: any;
  camera: any;
  userCurrentStreetHeading: number = 0;
  userCurrentStreetHeadingNotFound:boolean=false;
  animationHeading:number|null=0;
  startTime:number|null=null;
  animationDuration:number|null = null;
  startPosition:any|null=null;
  userMoved:boolean=false;
  selectedBookmarkType:string|null=null;
  selectedFavIndex:number|null=null;
  positionIndex:number=0;
  lastLocationAnimationCompleted:number=0;
  current3dUserModel:any =environment.locatorDefaultObj;
  isRerouting:boolean=false;

  constructor(private tripSimulatorService:TripSimulatorService,
    private windowService: WindowService,
    private geoLocationService: GeoLocationService,
    private sensorService: SensorService,
    private sourceAndLayerManager: SourceAndLayerManagerService) {
  }

  initMap() {
    this.isRotating = true;
    this.introTimeWaited = false;
    //Inicializo mapa
    mapboxgl.accessToken = environment.mapboxMapConfig.accessToken;

    const map = new mapboxgl.Map({
      container: environment.mapboxMapConfig.container,
      style: environment.mapboxMapConfig.style,
      zoom: environment.mapboxMapConfig.zoom,
      minZoom: environment.mapboxMapConfig.minZoom,
      center: [environment.mapboxMapConfig.center[0], environment.mapboxMapConfig.center[1]],
      pitch: environment.mapboxMapConfig.pitch,
      bearing: environment.mapboxMapConfig.bearing,
      hash: environment.mapboxMapConfig.hash,
      attributionControl: environment.mapboxMapConfig.attributionControl,
      maxPitch: environment.mapboxMapConfig.maxPitch,
      maxZoom: environment.mapboxMapConfig.maxZoom,
      //projection: 'globe' as any,
      antialias:environment.mapboxMapConfig.antialias
    });

    /*const geoControl = new mapboxgl.GeolocateControl({
      positionOptions: {
          enableHighAccuracy: true
      },
      // When active the map will receive updates to the device's location as it changes.
      trackUserLocation: true,
      // Draw an arrow next to the location dot to indicate which direction the device is heading.
      showUserHeading: true
  });*/
 /* geoControl.on('geolocate', (event) => {
        console.log('A geolocate event has occurred.', event);
    });

    map.addControl(
      geoControl,
      'bottom-right'
    );*/


    const MapboxDirections: any = require('@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions');
    const directions: any = new MapboxDirections(environment.mapboxControlDirectionsConfig);

    map.addControl(
      directions,
      'top-left'
    );

    this.mapControls.directions = directions;

    this.mapbox = map;

    map.on('load', () => {
      //map.setTerrain(undefined);
      map.resize();

      const timeOutIntroTime = setTimeout(() => {
        self.introTimeWaited = true;
      }, environment.gpsSettings.timeRotating);
      self.windowService.attachedTimeOut("home", "mapService_introTime", timeOutIntroTime);
      self.windowService.setValueIntoProperty('map', map);
      self.setDefaults();

      self.mapControls.directions.on('route', (event: any) => {
        const mapService = ((window as any).mapService as MapService);

        if(mapService.isRerouting){
          mapService.processRerouteResult(event);
        }else{
          mapService.directionsOnNewRouteAction(event);
        }
        

      });


      this.addLongPressHandler();
      map.on('click', 'directions-destination-point', function (e: any) {
        // Ensure there's data from which to derive a popup
        if (e.features.length > 0) {
          const feature = e.features[0];
          const popup = ((window as any).mapService as MapService).createDestinationPopupFromUnknown(feature.geometry.coordinates as [number, number]);
          // Set the popup's content and location
          popup.addTo(map);
        }
      });
      this.rotateCamera(0);



    });

    const self = this;
    map.on('style.load', (event) => {
      map.setTerrain(undefined);

      self.addAdditionalSourceAndLayer(self.sourcesAndLayers);
      if (self.isStandardMap) {
        const defaultLightPreset = this.light||'dusk';
        self.mapbox.setConfigProperty('basemap', 'lightPreset', defaultLightPreset);
        self.mapbox.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
        self.mapbox.setConfigProperty('basemap', 'showTransitLabels', true);
        self.mapbox.setConfigProperty('basemap', 'showRoadLabels', true);
        self.mapbox.setConfigProperty('basemap', 'showPlaceLabels', false);
        self.mapbox.setConfigProperty('basemap', 'show3dObjects', true);
        //self.mapbox.setConfigProperty('basemap', 'theme', 'faded');

        	
      }
      self.set3D();
      self.mapbox.resize();
       // eslint-disable-next-line no-undef
      map.setTerrain(undefined);

    }); 
  }

  setLocator(locator:any){
    this.current3dUserModel=locator;
     this.sourceAndLayerManager.setLocator(locator);
  }

  set3D(){
    this.sourceAndLayerManager.set3D();
  }

  
  snap3dModel(coords: [number, number],degBasedOnMapNorth:number){
    let degInvertedOrientation:number = 360-degBasedOnMapNorth;
    let rad = this.toRad(degInvertedOrientation);
    let zAxis = new (window as any).THREE.Vector3(0, 0, 1);

   if (this.carModel) {

      this.carModel.setCoords(coords);
      this.carModel.setRotationFromAxisAngle(zAxis,rad);
      //this.mapbox.triggerRepaint();
   }
  }

  public update3DSimulatioModelPosition(map:any, coords:any, degBasedOnMapNorth: number){
    let degInvertedOrientation:number = 360-degBasedOnMapNorth;
    let rad = this.toRad(degInvertedOrientation);
    let zAxis = new (window as any).THREE.Vector3(0, 0, 1);

   if (this.carModelSimulator) {

      this.carModelSimulator.setCoords(coords);
      this.carModelSimulator.setRotationFromAxisAngle(zAxis,rad);
      //this.mapbox.triggerRepaint();
      this.mapEventIsFromTracking = true;
      ((window as any).cameraService as CameraService).updateCameraForUserMarkerGeoEventSimulation(coords, degBasedOnMapNorth);
      const timeOut: any = setTimeout(() => this.mapEventIsFromTracking = false, 1000); // Reset after a delay to ensure event is finished
      this.windowService.attachedTimeOut("home", "mapService_unflagEventIsFromTracking", timeOut);

   }
  }

  snap3dModelOld(coords: [number, number],degBasedOnMapNorth:number){
    let degInvertedOrientation:number = 360-degBasedOnMapNorth;
    let rad = this.toRad(degInvertedOrientation);
    let zAxis = new (window as any).THREE.Vector3(0, 0, 1);

    if (this.carModel) {
      /*const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
        coords,
        0
      );*/
      this.carModel.setCoords(coords);
      this.carModel.setRotationFromAxisAngle(zAxis,rad);

      //this.tb.add(this.carModel);
      //this.mapbox.triggerRepaint();
    }
  }

  updateModelRotation(degBasedOnMapNorth:number){
    let degInvertedOrientation:number = 360-degBasedOnMapNorth;
    let rad = this.toRad(degInvertedOrientation);
    let zAxis = new (window as any).THREE.Vector3(0, 0, 1);
   //this.carModel.setRotation({ x: 90, y: -90, z: rotationVision });
    if(this.carModel)
    this.carModel.setRotationFromAxisAngle(zAxis,rad);
    //this.mapbox.triggerRepaint();
  }

  toDeg(rad:number) {
    return rad / Math.PI * 180;
  }

  toRad(deg:number) {
    return deg * Math.PI / 180;
  }

  onModelChanged(e:any) {
    let model = e.detail.object; //here's the object already modified
    let action = e.detail.action; //here's the action that changed the object
    //console.log(model);
  }


  updateModelPosition(coords: [number, number]) {
    if (this.carModel) {
      /*const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
        coords,
        0
      );*/
      this.carModel.setCoords(coords);
      //this.tb.add(this.carModel);
      //this.mapbox.triggerRepaint();
    }
  }
  onTouchStart(e: TouchEvent) {
    if(this.calculatingPressEvent){
      this.calculatingPressEvent=false;
      this.isLongPress = false;
    }else{
      this.calculatingPressEvent=true;
      this.isLongPress = false;
      this.longPressTimeout = setTimeout(() => {
        if(this.calculatingPressEvent){
          this.isLongPress = true;
          this.onLongPress(e);
          this.calculatingPressEvent=false;
        }
  
      }, 1000); // 500ms threshold for long press
    }

  }

  onTouchEnd(e: TouchEvent) {
    clearTimeout(this.longPressTimeout);
  }

  onTouchMove(e: TouchEvent) {
    this.isLongPress=false;
    clearTimeout(this.longPressTimeout); // Cancel long press if touch moves
  }

  onLongPress(e: TouchEvent) {
    if (this.isLongPress) {
      const coords = this.mapbox.unproject([e.touches[0].clientX, e.touches[0].clientY]);
      console.log('Long press detected at:', coords);
      // Add your long press logic here, e.g., add a marker at the press location
      if (this.popUpMapPressed) {
        this.popUpMapPressed.remove();
      }
      this.addMarkerWithPopup(coords);
    }
  }

  addLongPressHandler() {
    const mapContainer = this.mapbox.getCanvasContainer();

    mapContainer.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
    mapContainer.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
    mapContainer.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
  }

  addMarkerWithPopup(coordinates: mapboxgl.LngLat) {
    /*if (this.popUpMapPressed) {
      this.popUpMapPressed.remove();
    }*/
    if (this.mapPressedMarkerInstance) {
      this.mapPressedMarkerInstance.remove();
    }
    let popup = this.createMapPressedPopup([coordinates.lng, coordinates.lat]);
    //popup.addClassName('destinationPopUp');
    //this.popUpMapPressed = popup;
    let marker = new mapboxgl.Marker()
      .setLngLat(coordinates)
      //.setPopup(popup) // sets a popup on this marker
      .addTo(this.mapbox);
      const self = this;
      marker.getElement().addEventListener('click', function() {
        // Call your function here
        self.createMapPressedPopup([coordinates.lng, coordinates.lat]);
      });
    //popup.addTo(this.mapbox);
    this.mapPressedMarkerInstance = marker;
  }

  calculateBounds(lines: number[][][]): mapboxgl.LngLatBounds {
    const bounds = new mapboxgl.LngLatBounds();
    lines.forEach(line => {
      line.forEach(([lng, lat]) => {
        bounds.extend([lng, lat]);
      });
    });
    return bounds;
  }

  uniqueCoordinates(line1: number[][], line2: number[][]) {
    const uniqueCoords = line1.filter(coord1 => {
      return !line2.some(coord2 => coord1[0] === coord2[0] && coord1[1] === coord2[1]);
    });
    return uniqueCoords;
  }

  calculateBearing(from: mapboxgl.LngLat, to: [number, number]): number {
    const fromLat = from.lat * Math.PI / 180;
    const fromLng = from.lng * Math.PI / 180;
    const toLat = to[1] * Math.PI / 180;
    const toLng = to[0] * Math.PI / 180;

    const y = Math.sin(toLng - fromLng) * Math.cos(toLat);
    const x = Math.cos(fromLat) * Math.sin(toLat) -
      Math.sin(fromLat) * Math.cos(toLat) * Math.cos(toLng - fromLng);
    return Math.atan2(y, x) * 180 / Math.PI;
  }

  // Function to rotate the camera around the world
  rotateCamera(timestamp: number) {
    if (((window as any).mapService as MapService).introTimeWaited && !((window as any).mapService as MapService).isRotating) {
    } else {
      if (((window as any).mapService as MapService).isRotating) {
        ((window as any).cameraService as CameraService).rotateCamera(timestamp);
      }
    };

  }

  cleanRoutePopups() {
    if (this.popUpMainRoute) this.popUpMainRoute.remove();
    if (this.popUpAltRoute) this.popUpAltRoute.remove();
    if (this.coordinatesAltRoute) this.coordinatesAltRoute = [];
    if (this.coordinatesMainRoute) this.coordinatesMainRoute = [];
    //this.popups = [];
    if (this.popUpMapPressed) this.popUpMapPressed.remove();

  }

  createMapPressedPopup(coordinates: [number, number]): mapboxgl.Popup {
    if (this.popUpMapPressed) this.popUpMapPressed.remove();

    let html = '<h6>¿Qué buscas aquí?</h6>';
    html += '<div class="flexEqualRow">';
    html += '<ion-icon onclick="window.mapService.closeCustomPopup()" name = "close-circle-outline" size="big" color="danger" > </ion-icon>';
    html += '<ion-icon onclick="window.homePage.searchPlaceByCoords()" name = "information-circle-outline" size="big" color="secondary" > </ion-icon>';
    html += '<ion-icon onclick="window.homePage.setDestinationFromCoords()" name = "navigate-circle-outline" size="big" color="success" > </ion-icon>';

    html += '</div>';
    ((window as any).homePage as HomePage).openLocationModal(coordinates);
    this.mapbox.flyTo({ center: coordinates });
    //html += '<input id="destinationViewMoreButton" type="button" value="Ver más" onclick="document.getElementById(\'destinationDetails\').style.display=\'block\'; document.getElementById(\'destinationViewMoreButton\').style.display=\'none;\'"></input>';
    const popup = new mapboxgl.Popup({
      closeOnClick: true,
      //offset: 20
    }).setLngLat(coordinates)
      .setHTML(html);
    popup.addClassName('mapPressedPopUp');
    this.popUpMapPressed = popup;
    // Crea un popup y lo añade al mapa en el punto medio
    return popup;
  }

  createDestinationPopupFromUnknown(coordinates: [number, number]): mapboxgl.Popup {
    if (this.popUpDestination) this.popUpDestination.remove();
    let html = '<h6>' + '(' + coordinates[0] + ',' + coordinates[1] + ')' + '</h6>';
    html += '<div id="destinationActions">';
    html += '<ion-icon onclick="window.homePage.cancelTrip()" name ="close-circle-outline" size="big" color="danger" > </ion-icon>';
    html += '<ion-icon onclick="window.homePage.startTrip()" name = "navigate-circle-outline" size="big" color="success" > </ion-icon>';

    //html += '<input type="button" id="cancelTripButtonPopUp" value="Cancelar" onclick="window.homePage.cancelTrip()"></input>';
    //html += '<input type="button" id="startTripButtonPopUp" value="Iniciar viaje" onclick="window.homePage.startTrip()"></input>';
    html += '</div>';
    ((window as any).homePage as HomePage).openLocationModal(coordinates);
    this.mapbox.flyTo({ center: coordinates });
    //html += '<input id="destinationViewMoreButton" type="button" value="Ver más" onclick="document.getElementById(\'destinationDetails\').style.display=\'block\'; document.getElementById(\'destinationViewMoreButton\').style.display=\'none;\'"></input>';
    const popup = new mapboxgl.Popup({
      closeOnClick: true,
      //offset: 20
    }).setLngLat(coordinates)
      .setHTML(html);
    popup.addClassName('destinationPopUp');
    this.popUpDestination = popup;
    // Crea un popup y lo añade al mapa en el punto medio
    return popup;
  }

  removeClassicMarker(){
     // Add your long press logic here, e.g., add a marker at the press location
     if (this.popUpMapPressed) {
      this.popUpMapPressed.remove();
      this.popUpMapPressed=null;
    }
  }

  createDestinationPopup(coordinates: [number, number]): mapboxgl.Popup {
    if (this.popUpDestination) this.popUpDestination.remove();
    let html = '<h6>' + this.cleanDestinationLabel(this.destinationPlace.label as string) + '</h6><div id="destinationDetails">';
    if (this.destinationPlace.street) html += '<p>Calle: ' + this.destinationPlace.street + '</p>';
    if (this.destinationPlace.addressNumber) html += '<p>Número de puerta: ' + this.destinationPlace.addressNumber + '</p>';
    if (this.destinationPlace.neighborhood) html += '<p>Barrio: ' + this.destinationPlace.neighborhood + '</p>';
    if (this.destinationPlace.postalCode) html += '<p>C.P.: ' + this.destinationPlace.postalCode + '</p>';
    if (this.destinationPlace.municipality) html += '<p>Municipalidad: ' + this.destinationPlace.municipality + '</p>';
    if (this.destinationPlace.region) html += '<p>Región: ' + this.destinationPlace.region + '</p>';
    if (this.destinationPlace.country) html += '<p>País: ' + this.destinationPlace.country + '</p>';
    html += '<p>Latitud: ' + coordinates[1] + '</p>';
    html += '<p>Longitud: ' + coordinates[0] + '</p>';
    html += '<input type="button" value="Ver menos" onclick="document.getElementById(\'destinationDetails\').style.display=\'none\'; document.getElementById(\'destinationViewMoreButton\').style.display=\'block;\'"></input>';
    html += '</div>';
    html += '<div id="destinationActions">';
    html += '<ion-icon onclick="window.homePage.cancelTrip()" name ="close-circle-outline" size="big" color="danger" > </ion-icon>';
    html += '<ion-icon onclick="window.homePage.startTrip()" name = "navigate-circle-outline" size="big" color="success" > </ion-icon>';

    //html += '<input type="button" id="cancelTripButtonPopUp" value="Cancelar" onclick="window.homePage.cancelTrip()"></input>';
    //html += '<input type="button" id="startTripButtonPopUp" value="Iniciar viaje" onclick="window.homePage.startTrip()"></input>';
    html += '</div>';
    //html += '<input id="destinationViewMoreButton" type="button" value="Ver más" onclick="document.getElementById(\'destinationDetails\').style.display=\'block\'; document.getElementById(\'destinationViewMoreButton\').style.display=\'none;\'"></input>';
    const popup = new mapboxgl.Popup({
      closeOnClick: true,
      //offset: 20
    }).setLngLat(coordinates)
      .setHTML(html);
    popup.addClassName('destinationPopUp');
    this.popUpDestination = popup;
    // Crea un popup y lo añade al mapa en el punto medio
    return popup;
  }

  cleanDestinationLabel(label: string): string {
    //TODO: Implementar limpieza de etiqueta de destino, seleccionando contenido hasta primera aparicion del caracter ","
    if (label.startsWith("(")) {
      return label;
    }
    const commaIndex = label.indexOf(',');
    if (commaIndex !== -1) {
      label = label.substring(0, commaIndex);
    }
    return label;
  }

  findMinLongitude(line: [number, number][]): number {
    return line.reduce((min, point) => Math.min(min, point[0]), Infinity);
  }

  compareLinePositionsNum(line1: [number, number][], line2: [number, number][]): number {
    const leftmostX1 = this.getLeftmostX(this.mapbox, line1);
    const leftmostX2 = this.getLeftmostX(this.mapbox, line2);

    // Compare the leftmost x-values in viewport coordinates
    if (leftmostX1 < leftmostX2) {
      //console.log("Line 0 is more to the left in the viewport.");
      return 0;
    } else {
      //console.log("Line 1 is more to the left in the viewport.");
      return 1;
    }
  }

  compareLinePositions(line1: [number, number][], line2: [number, number][]): string {
    const leftmostX1 = this.getLeftmostX(this.mapbox, line1);
    const leftmostX2 = this.getLeftmostX(this.mapbox, line2);

    // Compare the leftmost x-values in viewport coordinates
    if (leftmostX1 < leftmostX2) {
      //console.log("Line 1 is more to the left in the viewport.");
      return "left";
    } else {
      //console.log("Line 2 is more to the left in the viewport.");
      return "right";
    }
  }

  /**
   * Calculates the leftmost x-value in viewport coordinates for a given line.
   * @param {mapboxgl.Map} map - The Mapbox GL JS map instance.
   * @param {GeoJSON.Feature<GeoJSON.LineString>} line - The GeoJSON LineString feature.
   * @returns {number} - The smallest x-value in the viewport.
   */
  private getLeftmostX(map: mapboxgl.Map, line: [number, number][]): number {
    return Math.min(...line.map(coord => {
      const point = map.project(new mapboxgl.LngLat(coord[0], coord[1]));
      return point.x;
    }));
  }

  createRoutePopUpFromCoords(coordinates: number[][], route: any, routeClass: string, routeIndex: number, anchor: string): mapboxgl.Popup {
    //console.log(coordinates);
    //console.log(routeIndex);

    let divider = routeIndex + 2;

    const selectedIndex: number = this.mapControls.directions._stateSnapshot.routeIndex;
    if (routeIndex === selectedIndex) {
      this.coordinatesMainRoute = coordinates;
      divider = 1.5
    } else {
      this.coordinatesAltRoute = coordinates;
      divider = 2
    }

    // Convierte la ruta en un objeto GeoJSON
    const line = turf.lineString(coordinates);
    // Calcula la longitud total de la línea
    const lineLength = turf.length(line, { units: 'kilometers' });

    const distanceMain = route.distance / 1000;
    const durationMain = route.duration / 60;
    // Encuentra el punto medio
    const midPoint = turf.along(line, lineLength / divider, { units: 'kilometers' });
    const popUpMainRoute = new mapboxgl.Popup({
      closeOnClick: false,
      anchor: anchor as mapboxgl.Anchor, // Cast anchor to Anchor type,
      offset: 10
      // Cast anchor to Anchor type
    })
      .setLngLat(midPoint.geometry.coordinates as [number, number])
      .setHTML('<div onclick="selectRoute(' + routeIndex + ')"><p> ' + parseFloat(distanceMain.toFixed(2)) + ' KMs.</p><p>' + parseFloat(durationMain.toFixed(1)) + ' Minutos.</p></div>');
    popUpMainRoute.addClassName(routeClass);
    // Crea un popup y lo añade al mapa en el punto medio
    return popUpMainRoute;
  }

  createRoutePopUp(route: any, routeClass: string, routeIndex: number, anchor: string): mapboxgl.Popup {
    const coordinates = polyline.decode(route.geometry).map(coord => [coord[1], coord[0]]);
    let divider = routeIndex + 2;
    const selectedIndex: number = this.mapControls.directions._stateSnapshot.routeIndex;
    if (routeIndex === selectedIndex) {
      this.coordinatesMainRoute = coordinates;
      divider = 1.5
    } else {
      this.coordinatesAltRoute = coordinates;
      divider = 2
    }

    // Convierte la ruta en un objeto GeoJSON
    const line = turf.lineString(coordinates);
    // Calcula la longitud total de la línea
    const lineLength = turf.length(line, { units: 'kilometers' });

    const distanceMain = route.distance / 1000;
    const durationMain = route.duration / 60;
    // Encuentra el punto medio
    const midPoint = turf.along(line, lineLength / divider, { units: 'kilometers' });
    const popUpMainRoute = new mapboxgl.Popup({
      closeOnClick: false,
      anchor: anchor as mapboxgl.Anchor, // Cast anchor to Anchor type,
      offset: 10
      // Cast anchor to Anchor type
    })
      .setLngLat(midPoint.geometry.coordinates as [number, number])
      .setHTML('<div onclick="selectRoute(' + routeIndex + ')"><p> ' + parseFloat(distanceMain.toFixed(2)) + ' Km.</p><p>' + parseFloat(durationMain.toFixed(1)) + ' Minutos.</p></div>');
    popUpMainRoute.addClassName(routeClass);
    // Crea un popup y lo añade al mapa en el punto medio
    return popUpMainRoute;
  }

  checkOverlap(newPopup: mapboxgl.Popup): boolean {
    const newRect = newPopup.getElement()!.getBoundingClientRect();

    for (let existingPopup of this.popups) {
      const existingRect = existingPopup.getElement()!.getBoundingClientRect();
      if (this.rectOverlap(newRect, existingRect)) {
        return true;
      }
    }
    return false;
  }

  rectOverlap(rect1: DOMRect, rect2: DOMRect): boolean {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  }

  selectRoute(routeIndex: number) {
    this.cleanRoutePopups();
    this.mapControls.directions.actions.setRouteIndex(routeIndex);
    const selectedIndex: number = this.mapControls.directions._stateSnapshot.routeIndex;
    let altIndex: number = 0;
    if (selectedIndex == 0) {
      altIndex = 1
    }
    const routeAlt = this.mapControls.directions._stateSnapshot.directions[altIndex]; // Obtiene la primera ruta
    const routeMain = this.mapControls.directions._stateSnapshot.directions[selectedIndex];
    const coordinates1 = polyline.decode(routeMain.geometry).map(coord => [coord[1], coord[0]]);
    const coordinates2 = polyline.decode(routeAlt.geometry).map(coord => [coord[1], coord[0]]);
    let uniqueFromLine2 = this.uniqueCoordinates(coordinates2, coordinates1);
    if (uniqueFromLine2.length < 3) {
      uniqueFromLine2 = coordinates2;
    }
    let mainAnchor = "left";
    let altAnchor = "right";
    const routeLeftIndex: number = ((window as any).mapService as MapService).compareLinePositionsNum(polyline.decode(this.mapControls.directions._stateSnapshot.directions[0].geometry), polyline.decode(this.mapControls.directions._stateSnapshot.directions[1].geometry));
    if (routeLeftIndex == selectedIndex) {
      mainAnchor = "right";
      altAnchor = "left";
    }
    const popUpAltRoute = ((window as any).mapService as MapService).createRoutePopUpFromCoords(uniqueFromLine2, routeAlt, 'mapboxgl-popup-alt-route', altIndex, altAnchor);
    popUpAltRoute.addTo(this.mapbox);
    this.popUpAltRoute = popUpAltRoute;

    // Supongamos que ya tienes una ruta cargada
    const popUpMainRoute = ((window as any).mapService as MapService).createRoutePopUp(routeMain, 'mapboxgl-popup-main-route', selectedIndex, mainAnchor);
    popUpMainRoute.addTo(this.mapbox);
    this.popUpMainRoute = popUpMainRoute;

    this.actualRoute = this.mapControls.directions._stateSnapshot.directions[selectedIndex];
    const distanceMain = this.actualRoute.distance / 1000;
    const durationMain = this.actualRoute.duration / 60;
    ((window as any).homePage as HomePage).tripDistance = parseFloat(distanceMain.toFixed(2));
    ((window as any).homePage as HomePage).tripDuration = parseFloat(durationMain.toFixed(2));
  }

  changeRoute(route:any){
    this.actualRoute=route;
    const distanceMain = this.actualRoute.distance / 1000;
    const durationMain = this.actualRoute.duration / 60;
    //((window as any).homePage as HomePage).tripDistance = parseFloat(distanceMain.toFixed(2));
    //((window as any).homePage as HomePage).tripDuration = parseFloat(durationMain.toFixed(2));
    (this.mapbox.getSource('route') as mapboxgl.GeoJSONSource).setData(route.geometry);

  }

  setStreetFeature(feature:Feature<LineString>){
    if(this.mapbox.getSource('streetSource')){
      (this.mapbox.getSource('streetSource') as mapboxgl.GeoJSONSource).setData({
        "type": "FeatureCollection",
        "features": [feature]
      });
    }
    
  }

  setStreetSegment(feature:Feature<LineString>){
    if(feature && feature.geometry){
      if(this.mapbox.getSource('streetSourceFromSegment')){
        (this.mapbox.getSource('streetSourceFromSegment') as mapboxgl.GeoJSONSource).setData({
          "type": "FeatureCollection",
          "features": [feature]
        });
      }
     }
    
  }

  getMap(): mapboxgl.Map {
    return this.mapbox;
  }

  setLightPreset(id: string) {
    if (this.isStandardMap) {
      this.light = id;
      this.mapbox.setConfigProperty('basemap', 'lightPreset', id);
    } else {
      this.isStandardMap = true;
      this.light = id;
      this.sourcesAndLayers = this.getSourcesAndLayers();
      this.mapbox.setStyle('mapbox://styles/mapbox/standard');
    }
  }


  updateMarkerRotation(alpha: number) {
    const heading: number = this.getUserMarker().getRotation();
    const arrow = document.getElementById('arrowVision');
    let newRotation: number = alpha - heading;
    if (newRotation < 0) {
      newRotation += 360;
    }
    if (arrow) {
      //arrow.style.transform = 'rotateZ(' + newRotation + 'deg)';
    }

  }

  updateMarkerState(pos: Position,heading:number, currentStreet?:MapboxGeoJSONFeature): void {
    const newLocation: [number, number] = [pos.coords.longitude,pos.coords.latitude]; 
    const firstGeolocalizationEvent: boolean = this.isRotating;
    const marker: mapboxgl.Marker = this.getUserMarker();
    const markerVision: mapboxgl.Marker = this.getUserVisionMarker();

    if (this.mapbox && marker) {
      marker.setLngLat(newLocation);
      markerVision.setLngLat(newLocation);
    }
    const bearing = heading ? heading : this.mapbox.getBearing();
    if (firstGeolocalizationEvent) {
      this.mapEventIsFromTracking = true;
      marker.addTo(this.mapbox)
      markerVision.addTo(this.mapbox);
      /*const headingInit: number = this.calculateInitialHeading(new mapboxgl.LngLat(newLocation[0], newLocation[1]));    //   this.userLocationMarkerPrerequisitesOk = true;
      if (headingInit) {
        marker.setRotation(headingInit);
        markerVision.setRotation(headingInit);
      }*/
      this.isRotating = false;
      //((window as any).speedService as SpeedService).getSpeedDataFromArround(newLocation);
      this.setupInteractionListeners();
      ((window as any).homePage as HomePage).alreadyGeoLocated();
      ((window as any).cameraService as CameraService).updateCameraForUserMarkerFirstGeoEvent(newLocation, bearing);
      const timeOut: any = setTimeout(() => this.mapEventIsFromTracking = false, 1000); // Reset after a delay to ensure event is finished
      this.windowService.attachedTimeOut("home", "mapService_unflagEventIsFromTracking", timeOut);
    } else {
      if (heading) {
        marker.setRotation(heading);
        markerVision.setRotation(heading);
      }
      if (this.trackingUser) {
        this.mapEventIsFromTracking = true;
        ((window as any).cameraService as CameraService).updateCameraForUserMarkerGeoEvent(newLocation, bearing);
        const timeOut: any = setTimeout(() => this.mapEventIsFromTracking = false, 1000); // Reset after a delay to ensure event is finished
        this.windowService.attachedTimeOut("home", "mapService_unflagEventIsFromTracking", timeOut);

      }
    }
  }

  setFirstGeo(newLocation: [number, number], heading:number): void {
    const marker: mapboxgl.Marker = this.getUserMarker();
    const markerVision: mapboxgl.Marker = this.getUserVisionMarker();

    if (this.mapbox && marker) {
      marker.setLngLat(newLocation);
      markerVision.setLngLat(newLocation);
    }
      marker.addTo(this.mapbox)
      markerVision.addTo(this.mapbox);
      const headingInit: number = heading;
      if (headingInit) {
        marker.setRotation(headingInit);
        markerVision.setRotation(headingInit);
      }
      this.isRotating = false;
      this.userLocationMarkerPrerequisitesOk = true;

      //((window as any).speedService as SpeedService).getSpeedDataFromArround(newLocation);
      this.setupInteractionListeners();
      ((window as any).homePage as HomePage).alreadyGeoLocated();
    
  }


  getUserMarker(): mapboxgl.Marker {
    if (!this.userMarkerInstance) {
      const el = document.createElement('div');
      el.classList.add('mapboxgl-user-location');
      const dot: HTMLDivElement = document.createElement('div');
      dot.classList.add('mapboxgl-user-location-puk-dot');
      el.appendChild(dot);
      const heading: HTMLDivElement = document.createElement('div');
      heading.classList.add('mapboxgl-user-location-heading');
      el.appendChild(heading);
      const puk: HTMLDivElement = document.createElement('div');
      puk.classList.add('mapboxgl-user-puk');
      el.appendChild(puk);
      this.userMarkerInstance = new mapboxgl.Marker({
        element: el,
        rotationAlignment: 'map',
        pitchAlignment: 'map'
      });
    }
    return this.userMarkerInstance;
  }

  getUserVisionMarker(): mapboxgl.Marker {
    if (!this.userVisionMarkerInstance) {
      // Assuming 'map' is your initialized Mapbox GL JS map instance
      const el = document.createElement('div');
      el.className = 'markerVision';

      const arrow = document.createElement('div');
      arrow.className = 'arrowVision';
      arrow.id = "arrowVision";
      el.appendChild(arrow);
      this.userVisionMarkerInstance = new mapboxgl.Marker({
        element: el,
        rotationAlignment: 'map',
        pitchAlignment: 'map'
      });
    }
    return this.userVisionMarkerInstance;
  }

  setFullMapStyle(url: string): void {
    this.isStandardMap = false;
    this.sourcesAndLayers = this.getSourcesAndLayers();
    this.mapbox.setStyle(url);
  }

  setMapStye(id: String): void {
    this.isStandardMap = false;
    this.sourcesAndLayers = this.getSourcesAndLayers();
    this.mapbox.setStyle('mapbox://styles/mapbox/' + id);
  }

  getSourcesAndLayers(): any {
    const sourcesToTrack = [
      'directions',
      'directions:markers',
      //'maxspeedDataSource',
      'homeDataSource',
      'workDataSource',
      'favouritesDataSource',
      'streetSource',
      'streetSourceFromSegment',
      'speedCamerasDataSource'
      //'stopDataSource'
    ];

    this.sourcesAndLayers = {
      sources: {},
      layers: []
    };

    const style = this.mapbox.getStyle();

    sourcesToTrack.forEach(sourceId => {
      if (style!.sources[sourceId]) {
        this.sourcesAndLayers.sources[sourceId] = style!.sources[sourceId];
      }
    });

    style!.layers.forEach((layer: mapboxgl.Layer) => {
      if (sourcesToTrack.includes(layer.source as string)) {
        this.sourcesAndLayers.layers.push({
          sourceId: layer.source,
          layer: layer,
          layerId: layer.id
        });
      }
    });

    return this.sourcesAndLayers;
  }

  addAdditionalSourceAndLayer(sourcesAndLayers: any = null) {
    const sourcesToCheck = [
      'directions',
      'directions:markers',
      //'maxspeedDataSource',
      'streetSource',
      'streetSourceFromSegment',

      'homeDataSource',
      'workDataSource',
      'favouritesDataSource',


      'speedCamerasDataSource'
      //'stopDataSource'
    ];

    sourcesToCheck.forEach(sourceId => {
      if (sourcesAndLayers.sources[sourceId] && !this.mapbox.getSource(sourceId)) {
        this.mapbox.addSource(sourceId, sourcesAndLayers.sources[sourceId]);
      }
    });
    this.addImageIfNot('custom-home-marker', 'home.png');
    this.addImageIfNot('custom-work-marker', 'work.png');
    this.addImageIfNot('custom-favourites-marker', 'favourite.png');

    this.addImageIfNot('custom-speed-camera-marker', 'ironcamera.png');
   //this.addImageIfNot('custom-stop-marker', 'ironstop.png');
    this.reAddLayers(sourcesAndLayers);
  }

  reAddLayers(sourcesAndLayers: any = null): void {
    if (sourcesAndLayers && sourcesAndLayers.layers) {
      sourcesAndLayers.layers.forEach((layerLoaded: any) => {
        if (!this.mapbox.getLayer(layerLoaded.layerId)) {
          this.mapbox.addLayer(layerLoaded.layer);
        }
      });
    }
  }

  addImageIfNot(imageName: string, imageFileName: string): void {
    if (!this.mapbox.hasImage(imageName)) {
      this.mapbox.loadImage(`/assets/img/map-icons/${imageFileName}`, (error, image) => {
        if (error) throw error;
        if (image && !this.mapbox.hasImage(imageName)) {
          this.mapbox.addImage(imageName, image);
        }
      });
    }
  }



  /**
  * Agrega un marcador al mapa en las coordenadas especificadas.
  * @param coordinates Coordenadas donde se colocará el marcador.
  * @param options Opciones para el marcador.
  */
  addMarker(coordinates: mapboxgl.LngLatLike, options?:any): mapboxgl.Marker {
    const marker = new mapboxgl.Marker(options)
      .setLngLat(coordinates)
      .addTo(this.mapbox);
    return marker;
  }

  cancelTrip(): void {
    this.destination = "";

    this.isTripStarted = false;
    /*if (environment.mocking) {
      environment.mocking = false;
      this.geoLocationService.mocking = false;
    }*/
    this.mapControls.directions.removeRoutes();
    this.mapControls.directions.actions.clearDestination();
    this.mapControls.directions.actions.clearOrigin();
    this.cleanRoutePopups();
    this.popUpDestination?.remove();

    ((window as any).mapService as MapService).actualRoute = null;
    ((window as any).mapService as MapService).currentStep = 0;
    ((window as any).mapService as MapService).alreadySpoken = false;
    //((window as any).tripService as TripService).cancelTrip();

  }

  leaveMapPage() {
    if (this.mapbox && this.mapbox.getCanvas()) {
      this.hideUserCurrentStreetMaxSpeedWay();

      this.mapbox.remove();
      this.isAnimating = false; // Indicador de si una animación está en curso

      this.isTripStarted = false;
      this.isRotating = true; // Flag to control rotation

      this.introTimeWaited = false;
      this.trackingUser = true;
      this.mapEventIsFromTracking = false;
      this.sourcesAndLayers = { sources: { directions: null, userMarkerSource: null }, layers: [] };
    }
  }
async add3DModelMarkerSimulator(map:any, origin:any){
    const self = this;
    /*if(!map.getLayer('3dLocatorPukSimulator')){
      map.addLayer({
        id: '3dLocatorPukSimulator',
        type: 'custom',
        renderingMode: '3d',
        slot:'top',
  
        onAdd: async function (map:any, mbxContext:any) {
          if(!self.tb){
            self.tb = (window as any).tb;
 }*/      var options = {
            type: environment.locatorDefault.type,
            obj: environment.locatorDefault.obj,
            scale: environment.locatorDefault.scale,
            units: environment.locatorDefault.units,
            anchor: environment.locatorDefault.anchor,
            rotation: environment.locatorDefault.rotation, //rotation to postiion the truck and heading properly
          }     
          if(self.carModelSimulator){
            self.tb.remove(self.carModelSimulator);
          }
          self.carModelSimulator=null;

            const added = await self.tb.loadObj(options, function (model:any) {
              if(!self.carModelSimulator){
                let origin=[0,0];
                if(self.extendGeoService().getLastCurrentLocation())origin = [self.extendGeoService().getLastCurrentLocation().coords.longitude,self.extendGeoService().getLastCurrentLocation().coords.latitude];
                self.carModelSimulator = model.setCoords(origin);
                //self.carModel.addEventListener('ObjectChanged', self.onModelChanged, false);
                self.tb.add(self.carModelSimulator);
              }else{

              }
              self.tb.update();
    
            });


            
           //self.tb.update();
  /*
          },
        render: function (gl:any, matrix:any) {
          self.tb.update();
          //self.mapbox.triggerRepaint();
  
        }
      });
    }
    */
  }

  cleanSimulationResources(){
    //this.mapbox.removeLayer('3dLocatorPukSimulator');
    this.tb.remove(this.carModelSimulator);
  }

  async startNewSimulationTrip(){
      //if (!this.isTripStarted) {
        this.cleanRoutePopups();
        this.popUpDestination?.remove();
        //this.isTripStarted = true;
        this.mapbox.setLayoutProperty('directions-route-line-alt', 'visibility', 'none');
        // Get user's current location
        const userLocation: Position = this.geoLocationService.getLastCurrentLocation();
        if (userLocation) {
          // Get route information
          const route = ((window as any).mapService as MapService).actualRoute;
          console.log("Route:", route);
          if (route && route.legs && route.legs[0]) {
            const steps = route.legs[0].steps;
            // Set initial step index to 0
            let currentStepIndex = 0;
            // Speak the instruction associated with the first step
            this.tripSimulatorService.startSimulation([userLocation.coords.longitude, userLocation.coords.latitude], [this.getDestinationPositionFromRoute(route).coords.longitude,this.getDestinationPositionFromRoute(route).coords.latitude],this.actualRoute, this.getMap());

          }
        }
      //}
    }


    
  getDestinationPositionFromRoute(route: any): Position {
    const legs = route.legs;
    const lastLeg = legs[legs.length - 1]; // Get the last leg of the route
    const steps = lastLeg.steps;
    const lastStep = steps[steps.length - 1]; // Get the last step of the last leg
  
    // Extract the destination coordinates from the last step
    const [longitude, latitude] = lastStep.maneuver.location;
  
    // Return a Position object compatible with @capacitor/geolocation
    const destinationPosition: Position = {
      coords: {
        latitude,
        longitude,
        accuracy: 0, // You may want to set this if available
        altitude: null, // Optional, set if available
        altitudeAccuracy: null, // Optional, set if available
        heading: null, // Optional, set if available
        speed: null // Optional, set if available
      },
      timestamp: Date.now() // Current timestamp
    };
  
    return destinationPosition;
  }

  async startTrip(simulation:boolean): Promise<void> {
    if (!this.isTripStarted) {
      this.cleanRoutePopups();
      this.popUpDestination?.remove();
      this.isTripStarted = true;
      this.mapbox.setLayoutProperty('directions-route-line-alt', 'visibility', 'none');
      // Get user's current location
      const userLocation: Position = this.geoLocationService.getLastCurrentLocation();
      if (userLocation) {
        // Get route information
        const route = ((window as any).mapService as MapService).actualRoute;
        //console.log("Route:", route);
        if (route && route.legs && route.legs[0]) {
          const steps = route.legs[0].steps;
          // Set initial step index to 0
          let currentStepIndex = 0;
          // Speak the instruction associated with the first step
          ((window as any).tripService as TripService).startTrip(route,userLocation,simulation);
        }
      }
    }
  }

  async addWaypoint(waypoint: Place) {
    //console.log("Adding waypoint:", waypoint);
    if (waypoint.geometry && waypoint.geometry.point)
      this.mapControls.directions.actions.addWaypoint(0, {
        geometry: { coordinates: waypoint.geometry.point },
        properties: { id: 'waypoint0', label: waypoint.label, name: waypoint.label }
      });

  };
  async setDestination(destination: Place) {
    this.mapControls.directions.actions.setRouteIndex(0);
    this.cleanRoutePopups();
    this.destinationPlace = destination;
    if (destination.label) this.destination = this.cleanDestinationLabel(destination.label);
    if (destination.street) this.destinationAddress = destination.street;
    if (!this.mapControls.directions.getOrigin().type) {
      const position = this.geoLocationService.getLastCurrentLocation();
      if (position) {
        this.mapControls.directions.setOrigin([position.coords.longitude, position.coords.latitude]);
      }
      if (destination.geometry && destination.geometry.point) this.mapControls.directions.setDestination(destination.geometry.point);
    } else {
      if (destination.geometry && destination.geometry.point) this.mapControls.directions.setDestination(destination.geometry.point);
    }
  };

  setDestinationFromCoords() {
    if (this.popUpMapPressed && this.popUpMapPressed.getLngLat()) {
      let latlon: [number, number] = [this.popUpMapPressed.getLngLat().lng, this.popUpMapPressed.getLngLat().lat];
      this.mapControls.directions.actions.setRouteIndex(0);
      this.cleanRoutePopups();
      this.destination = "(" + latlon[0].toFixed(4) + "," + latlon[1].toFixed(4) + ")";

      this.destinationPlace = { label: this.destination, geometry: { point: latlon } };

      if (!this.mapControls.directions.getOrigin().type) {
        const position = this.geoLocationService.getLastCurrentLocation();
        if (position) {
          this.mapControls.directions.setOrigin([position.coords.longitude, position.coords.latitude]);
        }
        this.mapControls.directions.setDestination(latlon);
      } else {
        this.mapControls.directions.setDestination(latlon);
      }
    }

  };

  async reRoute(coordsOrigin:[number,number]):Promise<void>{
    //Para reroute solo asigno el origen nuevamente y mapboxDirections hace todo oeri basado en ese  origen
    try{
      this.isRerouting=true;
      await this.mapControls.directions.setOrigin(coordsOrigin);
    }catch(error){
      console.log(error);
      this.isRerouting=false;
    }
    return;
  }

  processRerouteResult(event:any){
    console.log(event);
    const mapService:MapService = ((window as any).mapService as MapService);
    const selectedIndex: number = mapService.mapControls.directions._stateSnapshot.routeIndex;
    mapService.actualRoute = event.route[selectedIndex];
    mapService.currentStep = 0;
    mapService.alreadySpoken = false;
    this.isRerouting=false;

    if(mapService)
      if(mapService.getMap().getLayer('directions-route-line-alt')){
        mapService.getMap().setLayoutProperty('directions-route-line-alt','visibility', 'none');
      }
      if(mapService.getMap().getLayer('directions-origin-point')){
        mapService.getMap().setLayoutProperty('directions-origin-point', 'visibility', 'none');
      }
      if(mapService.getMap().getLayer('directions-destination-point')){
        mapService.getMap().setLayoutProperty('directions-destination-point', 'visibility', 'none');
      }
      mapService.getMap().setPaintProperty('directions-route-line','line-occlusion-opacity',0.2);
      mapService.getMap().setPaintProperty('directions-route-line', 'line-emissive-strength', 2);
      mapService.getMap().setPaintProperty('directions-route-line', 'line-width', 12);
      mapService.getMap().setPaintProperty('directions-route-line', 'line-color', '#09a2e7');

    const tripService:TripService = ((window as any).tripService as TripService);
    tripService.reRouteTrip(mapService.actualRoute);
    const geoLocationAnimatedService = ((window as any).GeoLocationAnimatedService as GeoLocationAnimatedService);
    mapService.trackingUser=true;
    if (mapService.trackingUser) {
      this.mapEventIsFromTracking = true;
      mapService.setCameraPOVPosition(geoLocationAnimatedService.getLastPosition());
      this.resetMapEventTrackingFlag();
    }
    return mapService.actualRoute;
  }

  directionsOnNewRouteAction(event:any){
    console.log(event);
    const mapService = ((window as any).mapService as MapService);
    const selectedIndex: number = mapService.mapControls.directions._stateSnapshot.routeIndex;
        const homePage = ((window as any).homePage as HomePage);

        mapService.actualRoute = event.route[selectedIndex];
        mapService.currentStep = 0;
        mapService.alreadySpoken = false;
        mapService.cleanRoutePopups();

        const setMainRouteStyle = () => {
          mapService.mapbox.setPaintProperty('directions-route-line','line-occlusion-opacity',0.2);
          mapService.mapbox.setPaintProperty('directions-route-line', 'line-emissive-strength', 1);
          mapService.mapbox.setPaintProperty('directions-route-line', 'line-width', 12);
          mapService.mapbox.setPaintProperty('directions-route-line', 'line-color', '#09a2e7');
          mapService.mapbox.setPaintProperty('directions-destination-point', 'circle-color', '#ff4961');
          mapService.mapbox.setPaintProperty('directions-origin-point', 'circle-color', '#2fdf75');
          mapService.mapbox.setPaintProperty('directions-destination-point', 'circle-emissive-strength', 0.2);
          mapService.mapbox.setPaintProperty('directions-origin-point', 'circle-emissive-strength', 0.2);

          mapService.mapbox.setPaintProperty('directions-origin-point', 'circle-opacity', 0.2);
          mapService.mapbox.setLayoutProperty('directions-origin-point', 'visibility', 'none');
          mapService.mapbox.setLayoutProperty('directions-destination-point', 'visibility', 'none');

          mapService.mapbox.setPaintProperty('directions-destination-point', 'circle-opacity', 0.2);
        };

        const setAltRouteStyle = () => {
          mapService.mapbox.setPaintProperty('directions-route-line-alt','line-occlusion-opacity',0.2);
          mapService.mapbox.setPaintProperty('directions-route-line-alt', 'line-emissive-strength', 1);
          mapService.mapbox.setPaintProperty('directions-route-line-alt', 'line-width', 7);
          mapService.mapbox.setPaintProperty('directions-route-line-alt', 'line-color', '#ffc107');
        };
        let directionsBounds: LngLatBounds;
        const routeMain = event.route[selectedIndex];

        const coordinatesMain = polyline.decode(routeMain.geometry).map(coord => [coord[1], coord[0]]);
        mapService.coordinatesMainRoute = coordinatesMain;

        if (event.route.length < 2) {
          setMainRouteStyle();
          directionsBounds = mapService.calculateBounds([mapService.coordinatesMainRoute]);

        } else {
          const altIndex = selectedIndex === 0 ? 1 : 0;
          const routeAlt = event.route[altIndex];
          //const routeMain = event.route[selectedIndex];

          const mainAnchor = mapService.compareLinePositions(polyline.decode(routeMain.geometry), polyline.decode(routeAlt.geometry)) === "right" ? "left" : "right";
          const altAnchor = mainAnchor === "right" ? "left" : "right";

          //const coordinatesMain = polyline.decode(routeMain.geometry).map(coord => [coord[1], coord[0]]);
          const coordinatesAlt = polyline.decode(routeAlt.geometry).map(coord => [coord[1], coord[0]]);
          mapService.coordinatesAltRoute = coordinatesAlt;
          const uniqueFromLine2 = this.uniqueCoordinates(coordinatesAlt, coordinatesMain);
          directionsBounds = mapService.calculateBounds([mapService.coordinatesMainRoute, mapService.coordinatesAltRoute]);

          const popUpAltRoute = mapService.createRoutePopUpFromCoords(uniqueFromLine2.length < 3 ? coordinatesAlt : uniqueFromLine2, routeAlt, 'mapboxgl-popup-alt-route', altIndex, altAnchor);
          popUpAltRoute.addTo(this.mapbox);
          mapService.popUpAltRoute = popUpAltRoute;

          const popUpMainRoute = mapService.createRoutePopUp(routeMain, 'mapboxgl-popup-main-route', selectedIndex, mainAnchor);
          popUpMainRoute.addTo(this.mapbox);
          mapService.popUpMainRoute = popUpMainRoute;

          mapService.mapbox.setLayoutProperty('directions-route-line-alt', 'visibility', 'visible');
          setMainRouteStyle();
          setAltRouteStyle();
        }
        const feature = mapService.mapControls.directions._stateSnapshot.destination;
        const popup = mapService.createDestinationPopup(feature.geometry.coordinates as [number, number]);
        popup.addTo(this.mapbox);
        mapService.popUpDestination = popup;

        const distanceMain = mapService.actualRoute.distance / 1000;
        const durationMain = mapService.actualRoute.duration / 60;
        const tripDistance = parseFloat(distanceMain.toFixed(2));
        const tripDuration = parseFloat(durationMain.toFixed(2));

        this.trackingUser = false;
        this.mapEventIsFromTracking = false;

        const center = directionsBounds.getCenter();
        const bearing = this.calculateBearing(center, feature.geometry.coordinates as [number, number]);
        this.mapbox.fitBounds(directionsBounds, {essential:true, padding: {right:100,bottom: 100,top: 100,left: 100}, bearing: bearing, animate: true });
        const trip:Trip = {
          route:(mapService.actualRoute as Route),
          tripDuration:tripDuration,
          tripDistance:tripDistance,
          tripIsSimulation:false,
          tripDestinationAddress:'',
          userStartedTripFrom:mapService.geoLocationService.getLastCurrentLocation(),
          tripProgress:0,
          tripDestination:(mapService.actualRoute as Route).legs[0].steps[(mapService.actualRoute as Route).legs[0].steps.length-1].name
        }
        homePage.showTrip(trip);
  }

  setDestinationBookmark(place:Place) {
    this.mapControls.directions.actions.setRouteIndex(0);
    this.cleanRoutePopups();
    const destination = place;
    this.destinationPlace = destination;
    if (destination.label) this.destination = destination.label;
    if (destination.street) this.destinationAddress = destination.street;
    if (!this.mapControls.directions.getOrigin().type) {
      const position = this.geoLocationService.getLastCurrentLocation();
      if (position) {
        this.mapControls.directions.setOrigin([position.coords.longitude, position.coords.latitude]);
      }
      if (destination.geometry && destination.geometry.point) this.mapControls.directions.setDestination(destination.geometry.point);
    } else {
      if (destination.geometry && destination.geometry.point) this.mapControls.directions.setDestination(destination.geometry.point);
    }
  };

  setDestinationOSM(destinationId: number) {
    this.mapControls.directions.actions.setRouteIndex(0);
    this.closeOSMpopup(destinationId);
    this.cleanRoutePopups();
    const destination = this.osmPlaces[destinationId as number];
    this.destinationPlace = destination;
    if (destination.label) this.destination = destination.label;
    if (destination.street) this.destinationAddress = destination.street;
    if (!this.mapControls.directions.getOrigin().type) {
      const position = this.geoLocationService.getLastCurrentLocation();
      if (position) {
        this.mapControls.directions.setOrigin([position.coords.longitude, position.coords.latitude]);
      }
      if (destination.geometry && destination.geometry.point) this.mapControls.directions.setDestination(destination.geometry.point);
    } else {
      if (destination.geometry && destination.geometry.point) this.mapControls.directions.setDestination(destination.geometry.point);
    }
  };

  setCameraPOVPosition(position: Position) {
    this.mapEventIsFromTracking = true;
    this.trackingUser = true;
    ((window as any).cameraService as CameraService).setCameraPOVPosition(position);
    const timeOut: any = setTimeout(() => this.mapEventIsFromTracking = false, 500); // Reset after a delay to ensure event is finished
    this.windowService.attachedTimeOut("home", "mapService_unflagEventIsFromTracking", timeOut);

  }

  setCameraSKYPosition(position: Position) {
    this.trackingUser = false;

    ((window as any).cameraService as CameraService).setCameraSKYPosition(position);
    //this.mapbox.setTerrain(undefined);

  }

  setupInteractionListeners() {
    const userEvents = ['dragstart', 'zoomstart', 'rotatestart', 'pitchstart'];

    userEvents.forEach(event => {
      this.mapbox.on(event as any, () => {
        if (!this.mapEventIsFromTracking) {
          //console.log(`User interaction detected: ${event}`);
          this.trackingUser = false;
        }
      });
    });
  }



  setDefaults() {
    const map = this.mapbox;
    
    //this.addLineTileVectorLayer(map, "maxspeedDataSource", "litoxperaloca.apypi869", "maxspeedDataLayer", "export_1-12rpm8", 12, 22, "hsl(0, 90%, 45%)", 0.2, 0.2);
    //this.addSymbolTileVectorLayer(map, "ironsemaphore.png", "custom-semaphore-marker", "semaphoreDataSource", "litoxperaloca.3deav1ng", 0.40, "semaphoreDataLayer", "semaphores_uruguay-6l99vu", 14, 22);
    //this.addSymbolTileVectorLayer(map, "ironstop.png", "custom-stop-marker", "stopDataSource", "litoxperaloca.dlnykr8f", 0.50, "stopDataLayer", "stop_uruguay-6tysu4", 14, 22);
    this.createStreetSourceAndLayer();
    this.addBookmarksSourceAndLayer(map, "home.png", "custom-home-marker", "homeDataSource", 0.80, "homeDataLayer", 12, 22,"home","Casa");
    this.addBookmarksSourceAndLayer(map, "work.png", "custom-work-marker", "workDataSource", 0.80, "workDataLayer", 12, 22,"work","Trabajo");
    this.addBookmarksSourceAndLayer(map, "favourite.png", "custom-favourites-marker", "favouritesDataSource", 0.80, "favouritesDataLayer", 12, 22,"favourite","Favorito");
    this.updateBookmarks();
    this.addSymbolTileVectorLayer(map, "ironcamera.png", "custom-speed-camera-marker", "speedCamerasDataSource", "litoxperaloca.clzls3eaq0vit1ml7v290ziao-124rh", 0.60, "speedCamerasDataLayer", "camerasaUY", 12, 22);
    
  }

  async updateBookmarks(){
    await this.sourceAndLayerManager.updateBookmarks();
  }

  createStreetSourceAndLayer(){
    this.sourceAndLayerManager.createStreetSourceAndLayer();
  }
  
  createDirectionsSourcesAndLayer(){
    this.sourceAndLayerManager.createDirectionsSourcesAndLayer();
  }
  addBookmarksSourceAndLayer( 
     map: mapboxgl.Map,
    imageFileName: string,
    imageName: string,
    sourceId: string,
    imageSize: number,
    layerId: string,
    minZoom: number,
    maxZooam: number,
    bookmarkType:string,
    label:string):void{
      this.sourceAndLayerManager.addBookmarksSourceAndLayer(map, imageFileName, imageName, sourceId, imageSize, layerId, minZoom, maxZooam, bookmarkType, label);  
    };

    getOSMStreetHeading(street: mapboxgl.MapboxGeoJSONFeature): number {
      let  previousUserLocation: [number, number] | null = null;
      if(((window as any).GeoLocationAnimatedService as GeoLocationAnimatedService).preLastPosition){
        previousUserLocation= [((window as any).GeoLocationAnimatedService as GeoLocationAnimatedService).preLastPosition!.coords.longitude,((window as any).GeoLocationAnimatedService as GeoLocationAnimatedService).preLastPosition!.coords.latitude];;

      }
      let  currentUserLocation: [number, number] = [((window as any).GeoLocationAnimatedService as GeoLocationAnimatedService).lastPosition!.coords.longitude,((window as any).GeoLocationAnimatedService as GeoLocationAnimatedService).lastPosition!.coords.latitude];
      // Reiniciar el estado antes de cada cálculo
      this.userCurrentStreetHeadingNotFound = false;
    
      // Validar las propiedades de la calle y su geometría
      if (!street.properties || street.geometry.type !== "LineString") {
        this.userCurrentStreetHeadingNotFound = true;
        return 0;
      }
    
      // Obtener la propiedad "oneway"
      const oneway = street.properties["oneway"];
      const coordinates = street.geometry.coordinates;
    
      // Asegurarse de que la línea tenga al menos dos puntos
      if (coordinates.length < 2) {
        this.userCurrentStreetHeadingNotFound = true;
        return 0;
      }
    
      // Manejo de calles unidireccionales
      if (oneway && oneway !== 'no' && oneway !== 'false') {
        // Si "oneway" es '-1', invierte la dirección de los puntos
        const [start, end] = oneway === '-1' ? [coordinates[1], coordinates[0]] : [coordinates[0], coordinates[1]];
        const coordsFrom = new mapboxgl.LngLat(start[0], start[1]);
        const coordsTo = new mapboxgl.LngLat(end[0], end[1]);
        return turf.bearing(
          turf.point([coordsFrom.lng, coordsFrom.lat]),
          turf.point([coordsTo.lng, coordsTo.lat])
        );
      }
    
      // Manejo de calles de doble sentido
      if (!oneway || oneway === 'no' || oneway === 'false') {
        // Comparar la ubicación anterior y actual del usuario para determinar el sentido correcto
        const [start, end] = [coordinates[0], coordinates[1]];
        const coordsFrom = new mapboxgl.LngLat(start[0], start[1]);
        const coordsTo = new mapboxgl.LngLat(end[0], end[1]);
    
        // Calcular los bearings para ambos sentidos de la calle
        const bearingForward = turf.bearing(
          turf.point([coordsFrom.lng, coordsFrom.lat]),
          turf.point([coordsTo.lng, coordsTo.lat])
        );
    
        const bearingBackward = turf.bearing(
          turf.point([coordsTo.lng, coordsTo.lat]),
          turf.point([coordsFrom.lng, coordsFrom.lat])
        );
    
        // Si no hay ubicación anterior, devolver el bearing "forward" como predeterminado
        if (!previousUserLocation) {
          return bearingForward;
        }
    
        // Calcular el bearing entre la ubicación anterior del usuario y la actual
        const userBearing = turf.bearing(
          turf.point(previousUserLocation),
          turf.point(currentUserLocation)
        );
    
        // Calcular la diferencia absoluta entre los bearings del usuario y la calle
        const diffForward = Math.abs(turf.helpers.bearingToAzimuth(bearingForward) - turf.helpers.bearingToAzimuth(userBearing));
        const diffBackward = Math.abs(turf.helpers.bearingToAzimuth(bearingBackward) - turf.helpers.bearingToAzimuth(userBearing));
    
        // Seleccionar el sentido de la calle con la menor diferencia de bearing
        return diffForward < diffBackward ? bearingForward : bearingBackward;
      }
    
      // Si no se pudo determinar la dirección
      this.userCurrentStreetHeadingNotFound = true;
      return 0;
    }


  getOSMStreetHeadingOld(street: mapboxgl.MapboxGeoJSONFeature): number {
    // Reiniciar el estado antes de cada cálculo
    this.userCurrentStreetHeadingNotFound = false;

    // Validar las propiedades de la calle y su geometría
    if (!street.properties || street.geometry.type !== "LineString") {
      this.userCurrentStreetHeadingNotFound = true;
      return 0;
    }

    // Obtener la propiedad "oneway"
    const oneway = street.properties["oneway"];
    const coordinates = street.geometry.coordinates;

    // Asegurarse de que la línea tenga al menos dos puntos
    if (coordinates.length < 2) {
      this.userCurrentStreetHeadingNotFound = true;
      return 0;
    }

    // Manejo de calles unidireccionales
    if (oneway && oneway !== 'no' && oneway !== 'false') {
      // Si "oneway" es '-1', invierte la dirección de los puntos
      const [start, end] = oneway === '-1' ? [coordinates[1], coordinates[0]] : [coordinates[0], coordinates[1]];
      const coordsFrom = new mapboxgl.LngLat(start[0], start[1]);
      const coordsTo = new mapboxgl.LngLat(end[0], end[1]);
      return turf.bearing(
        turf.point([coordsFrom.lng, coordsFrom.lat]),
        turf.point([coordsTo.lng, coordsTo.lat])
      );
    }

    // Manejo de calles de doble sentido
    if (!oneway || oneway === 'no' || oneway === 'false') {
      // Para calles de doble sentido, devolver el heading del primer segmento
      const [start, end] = [coordinates[0], coordinates[1]];
      const coordsFrom = new mapboxgl.LngLat(start[0], start[1]);
      const coordsTo = new mapboxgl.LngLat(end[0], end[1]);
      return turf.bearing(
        turf.point([coordsFrom.lng, coordsFrom.lat]),
        turf.point([coordsTo.lng, coordsTo.lat])
      );
    }

    // Si no se pudo determinar la dirección
    this.userCurrentStreetHeadingNotFound = true;
    return 0;
  }
  
  setUserCurrentStreet(currentStreet: mapboxgl.MapboxGeoJSONFeature | null) {
    this.userCurrentStreet = currentStreet;
    if (this.userCurrentStreet) {
      this.currentStreetChanged.emit(this.userCurrentStreet);
      this.userCurrentStreetHeading=this.getOSMStreetHeading(this.userCurrentStreet);
    }

    if (this.showingMaxSpeedWay) {
      if (this.userCurrentStreet && this.userCurrentStreet.properties && this.userCurrentStreet.properties['@id']) {
        if (this.showingMaxSpeedWay && this.showingMaxSpeedWayId != this.userCurrentStreet.properties['@id']) {
          this.showingMaxSpeedWayId = this.userCurrentStreet.properties['@id'];
          if (this.userCurrentStreet.geometry!.type === "LineString") {
            if (this.popUpMaxSpeedWay) {
              this.popUpMaxSpeedWay.remove();
              this.popUpMaxSpeedWay = null;
            }
            const maxSpeedPopUp = this.createMaxSpeedWayPopUp(this.userCurrentStreet.properties['maxspeed'], this.userCurrentStreet.geometry!.coordinates);
            this.popUpMaxSpeedWay = maxSpeedPopUp;
            this.popUpMaxSpeedWay.addTo(this.mapbox);
          }
        }

      }
    }
  }

  setUserCurrentSegment(currentStreet: mapboxgl.MapboxGeoJSONFeature | null) {
    this.userCurrentStreetSegment = currentStreet;
    
    /*if (this.showingMaxSpeedWay) {
      if (this.userCurrentStreet && this.userCurrentStreet.properties && this.userCurrentStreet.properties['@id']) {
        if (this.showingMaxSpeedWay && this.showingMaxSpeedWayId != this.userCurrentStreet.properties['@id']) {
          this.showingMaxSpeedWayId = this.userCurrentStreet.properties['@id'];
          if (this.userCurrentStreet.geometry!.type === "LineString") {
            if (this.popUpMaxSpeedWay) {
              this.popUpMaxSpeedWay.remove();
              this.popUpMaxSpeedWay = null;
            }
            const maxSpeedPopUp = this.createMaxSpeedWayPopUp(this.userCurrentStreet.properties['maxspeed'], this.userCurrentStreet.geometry!.coordinates);
            this.popUpMaxSpeedWay = maxSpeedPopUp;
            this.popUpMaxSpeedWay.addTo(this.mapbox);
          }
        }

      }
    }*/
  }

  async hideUserCurrentStreetMaxSpeedWay() {
    await this.sourceAndLayerManager.hideUserCurrentStreetMaxSpeedWay();
  }

  createMaxSpeedWayPopUp(maxSpeed: number, coordinates: number[][]): mapboxgl.Popup {
    return this.sourceAndLayerManager.createMaxSpeedWayPopUp(maxSpeed, coordinates);
  }

  async showUserCurrentStreetMaxSpeedWay() {
    await this.sourceAndLayerManager.showUserCurrentStreetMaxSpeedWay();
  }

  addLineTileVectorLayer(
    map: mapboxgl.Map,
    sourceId: string,
    mapboxTileId: string,
    layerId: string,
    sourceLayerId: string,
    minZoom: number,
    maxZoom: number,
    lineColor: string,
    linWidth: number,
    lineOpacity: number
  ): void {
    this.sourceAndLayerManager.addLineTileVectorLayer(map,
      sourceId,
      mapboxTileId,
      layerId,
      sourceLayerId,
      minZoom,
      maxZoom,
      lineColor,
      linWidth,
      lineOpacity
      );
  }

  addSymbolTileVectorLayer(
    map: mapboxgl.Map,
    imageFileName: string,
    imageName: string,
    sourceId: string,
    mapboxTileId: string,
    imageSize: number,
    layerId: string,
    sourceLayerId: string,
    minZoom: number,
    maxZoom: number
  ): void {
    this.sourceAndLayerManager.addSymbolTileVectorLayer(map,
      imageFileName,
      imageName,
      sourceId,
      mapboxTileId,
      imageSize,
      layerId,
      sourceLayerId,
      minZoom,
      maxZoom
      );
    }
  


  addSymbolOSMLayer(
    map: mapboxgl.Map,
    imageFileName: string,
    imageName: string,
    sourceId: string,
    imageSize: number,
    layerId: string,
    minZoom: number,
    maxZoom: number,
    labelPropertyIndex: string,
    categoryName: string,
    category: any
  ): void {
    
    this.sourceAndLayerManager.addSymbolOSMLayer(map,
      imageFileName,
      imageName,
      sourceId,
      imageSize,
      layerId,
      minZoom,
      maxZoom,
      labelPropertyIndex,
      categoryName,
      category);
  };

  closeOSMpopup(id: number) {
    const popUp: mapboxgl.Popup = this.popups[id];
    popUp.remove();
  }

  closeCustomPopup() {
    if (this.popUpMapPressed) this.popUpMapPressed.remove();
  }

  convertOsmToJson(osmData: any[]): any {
    const features = osmData.map(node => ({
      type: "Feature",
      id: node.id,
      geometry: {
        type: "Point",
        coordinates: [node.lon, node.lat]
      },
      properties: node.tags  // Assuming all other details are in 'tags'
    }));

    return {
      type: "FeatureCollection",
      features: features
    };
  }
  addPlacesPoints(data: any[], category: { marker: string, name: string, icon: string, type: string, labelPropertyIndex: string }) {
    const map = this.mapbox;
    const sourceId = category.marker + "Source";
    if (data && data.length > 0) {
      const geoJsonFeatureCollection = this.convertOsmToJson(data);
      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geoJsonFeatureCollection);
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: this.convertOsmToJson(data)
        });
        const userLocation = {lat:this.geoLocationService.getLastCurrentLocation().coords.latitude, lon: this.geoLocationService.getLastCurrentLocation().coords.longitude}
        this.addSymbolOSMLayer(map, category.marker + ".png", category.marker, category.marker + "Source", 0.75, category.marker + "Layer", 7, 20, category.labelPropertyIndex, category.name, category);
        const closestFeature = this.findClosestFeature(userLocation, geoJsonFeatureCollection);
        const bounds = this.calculateBoundsToCollectionCloser(userLocation, closestFeature);
    
        this.fitMapToBounds(map, bounds);
        //((window as any).homePage as HomePage).setCameraMode('SKY');
      }
    } // Handle errors as needed
  }

  findClosestFeature(userLocation: { lat: number, lon: number }, geoJsonFeatureCollection: any) {
    const userPoint = turf.point([userLocation.lon, userLocation.lat]);
    const closestFeature = turf.nearestPoint(userPoint, geoJsonFeatureCollection);
    return closestFeature;
  }

  calculateBoundsToCollectionCloser(userLocation: { lat: number, lon: number }, closestFeature: any): mapboxgl.LngLatBoundsLike {
    const userCoords = [userLocation.lon, userLocation.lat];
    const featureCoords = closestFeature.geometry.coordinates;

    const bounds = new mapboxgl.LngLatBounds();
    
    bounds.extend(new mapboxgl.LngLat(userCoords[0],userCoords[1]));
    bounds.extend(featureCoords);

    return bounds;
  }

  fitMapToBounds(map: mapboxgl.Map, bounds: mapboxgl.LngLatBoundsLike) {
    map.fitBounds(bounds, {
      padding: { top: 20, bottom: 20, left: 20, right: 20 },
      maxZoom: 15
    });
  }

  private calculateInitialHeading(newPosition: mapboxgl.LngLat): number {
    const nearestLine = this.sensorService.getSensorClosestStreetFeatureLine(); // Devuelve la línea más cercana como un array de [lng, lat]
    if (nearestLine && nearestLine.geometry && nearestLine.geometry.type == 'LineString' && nearestLine.geometry.coordinates && nearestLine.geometry.coordinates.length > 1) {
      // Calcula el heading usando los primeros dos puntos de la línea
      return turf.bearing(
        turf.point([nearestLine.geometry.coordinates[0][0], nearestLine.geometry.coordinates[0][1]]), // Punto inicial de la línea
        turf.point([nearestLine.geometry.coordinates[1][0], nearestLine.geometry.coordinates[1][1]])  // Segundo punto de la línea
      );
    }
    return 0; // Default heading si no hay suficiente info
  }

  public updateUserMarkerSnapedPosition(useStreetHeading:boolean,userMoved:boolean,instantUpdate:boolean) {
    const newCoordinates: [number, number] = [
      this.sensorService.getSensorSnapLongitude(),
      this.sensorService.getSensorSnapLatitude()
    ];
    const newPosition = new mapboxgl.LngLat(newCoordinates[0], newCoordinates[1]);
    const userMarker = this.getUserMarker();
    const userMarkerVision = this.getUserVisionMarker();
    let rotationVision = this.sensorService.getSensorHeadingAbs();
    if(useStreetHeading&&!this.userCurrentStreetHeadingNotFound){
      rotationVision=this.userCurrentStreetHeading;
    }
    const startPosition = userMarker.getLngLat();
    let newHeading = this.calculateHeading(startPosition, newPosition, userMarker.getRotation());
    if(useStreetHeading&&!this.userCurrentStreetHeadingNotFound){
      newHeading=this.userCurrentStreetHeading;
    }
    if(instantUpdate){
      this.updateUserMarkerNoAnimation(newPosition,newHeading,userMoved);
      return;
    }
    const animationDuration = environment.gpsSettings.userMarkerAnimationDurationInMs;;

    // If the user marker doesn't exist, create it
    if (!userMarker) {
      this.createAndPositionUserMarker(newPosition, rotationVision);
      return;
    }

    // If already animating, update the animation target and exit
    
    if (this.isAnimating) {
      this.animationTarget = newPosition;
      return;
    }


    const startTime = performance.now();

    this.isAnimating = true;
    this.animationTarget = newPosition;

    const animateMarker = (currentTime: number) => {
      if (!this.isAnimating || !this.animationTarget) return;

      const progress = Math.min((currentTime - startTime) / animationDuration, 1);
      const interpolatedPosition = this.interpolatePosition(startPosition, this.animationTarget, progress);
      const interpolatedRotation = this.interpolateRotation(userMarker.getRotation(), newHeading, progress);

      userMarker.setLngLat(interpolatedPosition).setRotation(interpolatedRotation);
      this.updateModelPosition(interpolatedPosition as [number,number]);
      userMarkerVision.setLngLat(interpolatedPosition).setRotation(interpolatedRotation);
      this.updateModelRotation(interpolatedRotation);

      if (progress < 1) {
        requestAnimationFrame(animateMarker);
        //this.windowService.attachedAnimationFrameRequest("home", "mapService_updateUserSnapedPosition", frame);

      } else {
        this.completeAnimation(this.animationTarget, newHeading, userMoved);
      }
    };

    requestAnimationFrame(animateMarker);
    //this.windowService.attachedAnimationFrameRequest("home", "mapService_updateUserSnapedPosition", frame);
  }

  private createAndPositionUserMarker(newPosition: mapboxgl.LngLat, rotation: number) {
    const userMarker = this.getUserMarker().setLngLat(newPosition).setRotation(rotation).addTo(this.mapbox);
    this.getUserVisionMarker().setLngLat(newPosition).addTo(this.mapbox);
    this.updateModelPosition(newPosition.toArray());

    this.updateMarkerRotation(rotation);
    this.updateModelRotation(rotation);


    if (this.isRotating) {
      this.trackingUser = true;
      this.userLocationMarkerPrerequisitesOk = true;
      this.isRotating = false;
      this.setupInteractionListeners();
      ((window as any).homePage as HomePage).alreadyGeoLocated();
    }

    if (this.trackingUser) {
      this.mapEventIsFromTracking = true;
      ((window as any).cameraService as CameraService).updateCameraForUserMarkerGeoEvent([newPosition.lng, newPosition.lat], rotation);
      this.resetMapEventTrackingFlag();
    }
  }
  

  calculateHeading(startPosition: mapboxgl.LngLat, newPosition: mapboxgl.LngLat, currentRotation: number): number {
    //if (!this.lastPosition) return currentRotation || 0;

    const positionsAreEqual = startPosition.lat == newPosition.lat && startPosition.lng == newPosition.lng;
    if (positionsAreEqual) return currentRotation;

    return turf.bearing(
      turf.point([startPosition.lng, startPosition.lat]),
      turf.point([newPosition.lng, newPosition.lat])
    );
  }

  private interpolatePosition(startPosition: mapboxgl.LngLat, targetPosition: mapboxgl.LngLat, progress: number): mapboxgl.LngLatLike {
    return [
      startPosition.lng + (targetPosition.lng - startPosition.lng) * progress,
      startPosition.lat + (targetPosition.lat - startPosition.lat) * progress
    ];
  }

  private interpolateRotation(startRotation: number, targetRotation: number, progress: number): number {
    return startRotation + (targetRotation - startRotation) * progress;
  }

  private updateUserMarkerNoAnimation(newPosition: mapboxgl.LngLat, newHeading: number,userMoved:boolean) {
    this.trackingUser = true;
    const userMarker = this.getUserMarker();
    const userMarkerVision = this.getUserVisionMarker();
    userMarker.setLngLat(newPosition).setRotation(newHeading);
    this.updateModelPosition(newPosition.toArray());
    userMarkerVision.setLngLat(newPosition).setRotation(newHeading);
    this.updateModelRotation(newHeading);
    this.isAnimating = false;
    this.animationTarget=null;
    this.lastPosition = newPosition;
    this.mapEventIsFromTracking = true;
    ((window as any).cameraService as CameraService).updateCameraForUserMarkerGeoEvent([newPosition.lng, newPosition.lat], newHeading);
    this.resetMapEventTrackingFlag();
  }

  private async completeAnimation(newPosition: mapboxgl.LngLat, newHeading: number,userMoved:boolean) {
    console.log("ENTER to COMPLETE, last completed: ",this.lastLocationAnimationCompleted);

    if(this.lastLocationAnimationCompleted>this.positionIndex)return;
    const userMarker = this.getUserMarker();
    const userMarkerVision = this.getUserVisionMarker();
    userMarker.setLngLat(newPosition).setRotation(newHeading);
    this.updateModelPosition(newPosition.toArray());
    userMarkerVision.setLngLat(newPosition).setRotation(newHeading);
    this.updateModelRotation(newHeading);

    this.isAnimating = false;
    this.lastPosition = newPosition;
    //this.windowService.unAttachAnimationFrameRequest("home", "mapService_updateUserSnapedPosition");
    if (this.trackingUser&&userMoved) {
      this.mapEventIsFromTracking = true;
      ((window as any).cameraService as CameraService).updateCameraForUserMarkerGeoEvent([newPosition.lng, newPosition.lat], newHeading);
      this.resetMapEventTrackingFlag();
    }
    this.lastLocationAnimationCompleted=this.positionIndex;
    console.log("ANIMATION COMPLETED: ",this.lastLocationAnimationCompleted,newPosition);


  }

  public resetMapEventTrackingFlag() {
    const timeOut: any = setTimeout(() => this.mapEventIsFromTracking = false, 500);
    this.windowService.attachedTimeOut("home", "mapService_unflagEventIsFromTracking", timeOut);
  }


  public async updateUserMarkerSnapedPositionOsrm(newCoordinates: [number, number] ,useStreetHeading:boolean,userMoved:boolean,instantUpdate:boolean, newHeading:number, geoIndex:number) {
    console.log("Entering ANIMATION, last checked",this.positionIndex);

    if(geoIndex<=this.positionIndex)return;
    this.positionIndex=geoIndex;
    console.log("ANIMATING",this.positionIndex,newCoordinates);

    const newPosition = new mapboxgl.LngLat(newCoordinates[0], newCoordinates[1]);
    const userMarker = this.getUserMarker();
    if(useStreetHeading&&!this.userCurrentStreetHeadingNotFound){
      newHeading=this.userCurrentStreetHeading;
    }
    
    if(instantUpdate){
      this.updateUserMarkerNoAnimation(newPosition,newHeading,userMoved);
      return;
    }



    // If already animating, update the animation target and exit
    
      this.animationTarget = newPosition;
      this.animationHeading = newHeading;
     
    if (this.isAnimating) {
      return;
    }
    this.isAnimating=true;
    this.startTime=performance.now();
    this.animationDuration = environment.gpsSettings.userMarkerAnimationDurationInMs;
    this.startPosition = userMarker.getLngLat();
    this.userMoved = userMoved;

   
    requestAnimationFrame(this.animateMarker);
    //this.windowService.attachedAnimationFrameRequest("home", "mapService_updateUserSnapedPosition", frame);
  }

  animateMarker = (currentTime: number) => {
    if (!this.isAnimating || !this.animationTarget 
      ||!this.animationHeading
      ||!this.startTime
      ||!this.animationDuration
      ||!this.startPosition 
    ) return;
    let userMarker=this.getUserMarker();
    const progress = Math.min((currentTime -  this.startTime) / this.animationDuration, 1);
    const interpolatedPosition = this.interpolatePosition( this.startPosition, this.animationTarget, progress);
    const interpolatedRotation = this.interpolateRotation(userMarker.getRotation(), this.animationHeading, progress);
    userMarker.setLngLat(interpolatedPosition).setRotation(interpolatedRotation);
    this.updateModelPosition(interpolatedPosition as [number,number]);
    this.getUserVisionMarker().setLngLat(interpolatedPosition).setRotation(interpolatedRotation);
    this.updateModelRotation(interpolatedRotation);

    if (progress < 1) {
      requestAnimationFrame(this.animateMarker);
      //this.windowService.attachedAnimationFrameRequest("home", "mapService_updateUserSnapedPosition", frame);

    } else {
      this.completeAnimation(this.animationTarget, this.animationHeading,  this.userMoved);
    }
  };

  updateMarkerAnd3dModel(position: Position, heading: number){
    let userMarker=this.getUserMarker();
    let userMarkerVision = this.getUserVisionMarker();
    userMarker.setLngLat([position.coords.longitude,position.coords.latitude]).setRotation(heading);
    userMarkerVision.setLngLat([position.coords.longitude,position.coords.latitude]).setRotation(heading);
    this.snap3dModel([position.coords.longitude,position.coords.latitude],heading);
  }

  public extendGeoService(){
    return this.geoLocationService;
  }

}
