import { EventEmitter, Injectable } from '@angular/core';
import polyline from '@mapbox/polyline';
import * as turf from '@turf/turf';
import mapboxgl, { AnyLayer, LngLatBounds, MapboxGeoJSONFeature, MapEvent } from 'mapbox-gl';

//import 'mapbox-gl/dist/mapbox-gl.css';
import { Position } from '@capacitor/geolocation';
import { environment } from 'src/environments/environment';
import { GeoLocationService } from './geo-location.service';
import { WindowService } from "./window.service";
//import { GeoJSON } from 'mapbox-gl';

//import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
//import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { Place } from '@aws-amplify/geo';
import { HomePage } from '../pages/home/home.page';
import { CameraService } from './camera.service';
import { SensorService } from './sensor.service';
import { TripService } from './trip.service';
@Injectable({
  providedIn: 'root'
})
export class MapService {
  private tb!: any;
  private carModel: any;
  private modelTransform: any;
  private mapbox!: mapboxgl.Map;
  userLocationMarkerPrerequisitesOk: boolean = false;
  isAnimating: boolean = false; // Indicador de si una animación está en curso
  private animationTarget: mapboxgl.LngLat | null = null; // Stores the target for ongoing animation
  mapControls: any = { directions: null };
  destination!: string;
  destinationAddress!: string;
  destinationPlace!: Place;
  userCurrentStreet: MapboxGeoJSONFeature | null = null;
  isTripStarted: boolean = false;
  actualRoute!: any;
  currentStep: number = 0;
  alreadySpoken: boolean = false;
  sourcesAndLayers: any = { sources: { directions: null, maxspeedDataSource: null, userMarkerSource: null }, layers: [] };
  isStandardMap: boolean = true;
  isRotating = true; // Flag to control rotation
  light: string = "dusk";
  userMarkerInstance: mapboxgl.Marker | null = null;
  userVisionMarkerInstance: mapboxgl.Marker | null = null;
  introTime: number = 2500;
  introTimeWaited: boolean = false;
  trackingUser: boolean = true;
  mapEventIsFromTracking: boolean = false;
  popUpMainRoute: mapboxgl.Popup | null = null;
  popUpMaxSpeedWay: mapboxgl.Popup | null = null;

  popUpAltRoute: mapboxgl.Popup | null = null;
  popUpDestination: mapboxgl.Popup | null = null;
  popups: mapboxgl.Popup[] = [];
  coordinatesMainRoute: number[][] = [];
  coordinatesAltRoute: number[][] = [];
  osmFeatures: mapboxgl.MapboxGeoJSONFeature[] = [];
  osmPlaces: Place[] = [];
  private lastPosition: mapboxgl.LngLat | null = null;
  mapPressedMarkerInstance: mapboxgl.Marker | null = null;
  popUpMapPressed: mapboxgl.Popup | null = null;
  firstTouchDone: boolean = false;
  showingMaxSpeedWay: boolean = false;
  showingMaxSpeedWayId: string | null = null;
  currentStreetChanged: EventEmitter<mapboxgl.MapboxGeoJSONFeature> = new EventEmitter<mapboxgl.MapboxGeoJSONFeature>();
  scene: any;
  renderer: any;
  camera: any;
  userCurrentStreetHeading: number = 0;

  constructor(private windowService: WindowService,
    private geoLocationService: GeoLocationService,
    private sensorService: SensorService) {
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
      projection: 'globe' as any,
      antialias:true
    });




    const MapboxDirections: any = require('@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions');
    const directions: any = new MapboxDirections(environment.mapboxControlDirectionsConfig);

    map.addControl(
      directions,
      'top-left'
    );

    this.mapControls.directions = directions;

    this.mapbox = map;



    map.on('load', () => {
      map.resize();

      const timeOutIntroTime = setTimeout(() => {
        this.introTimeWaited = true;
      }, this.introTime);
      this.windowService.attachedTimeOut("home", "mapService_introTime", timeOutIntroTime);
      this.windowService.setValueIntoProperty('map', map);
      this.setDefaults();

      this.mapControls.directions.on('route', (event: any) => {
        const selectedIndex: number = this.mapControls.directions._stateSnapshot.routeIndex;
        const mapService = ((window as any).mapService as MapService);
        const homePage = ((window as any).homePage as HomePage);

        mapService.actualRoute = event.route[selectedIndex];
        mapService.currentStep = 0;
        mapService.alreadySpoken = false;
        mapService.cleanRoutePopups();

        const setMainRouteStyle = () => {
          mapService.mapbox.setPaintProperty('directions-route-line', 'line-emissive-strength', 1);
          mapService.mapbox.setPaintProperty('directions-route-line', 'line-width', 12);
          mapService.mapbox.setPaintProperty('directions-route-line', 'line-color', '#09a2e7');
          mapService.mapbox.setPaintProperty('directions-destination-point', 'circle-color', '#ff4961');
          mapService.mapbox.setPaintProperty('directions-origin-point', 'circle-color', '#2fdf75');
          mapService.mapbox.setPaintProperty('directions-destination-point', 'circle-emissive-strength', 0.7);
          mapService.mapbox.setPaintProperty('directions-origin-point', 'circle-emissive-strength', 0.7);
        };

        const setAltRouteStyle = () => {
          mapService.mapbox.setPaintProperty('directions-route-line-alt', 'line-emissive-strength', 0.8);
          mapService.mapbox.setPaintProperty('directions-route-line-alt', 'line-width', 8);
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
        homePage.tripDistance = parseFloat(distanceMain.toFixed(2));
        homePage.tripDuration = parseFloat(durationMain.toFixed(2));

        this.trackingUser = false;
        this.mapEventIsFromTracking = false;

        const center = directionsBounds.getCenter();
        const bearing = this.calculateBearing(center, feature.geometry.coordinates as [number, number]);
        this.mapbox.fitBounds(directionsBounds, { padding: {right:100,bottom: 100,top: 100,left: 100}, bearing: bearing, animate: false });

        homePage.showTrip();

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
      
      self.addAdditionalSourceAndLayer(self.sourcesAndLayers);
      if (self.isStandardMap) {
        const defaultLightPreset = this.light;
        self.mapbox.setConfigProperty('basemap', 'lightPreset', defaultLightPreset);
        self.mapbox.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
        self.mapbox.setConfigProperty('basemap', 'showTransitLabels', true);
        self.mapbox.setConfigProperty('basemap', 'showRoadLabels', true);
        self.mapbox.setConfigProperty('basemap', 'showPlaceLabels', true);
      }
      self.mapbox.resize();
       // eslint-disable-next-line no-undef

      self.set3D();
    }); 
  }

  set3D(){
    const self = this;
    this.mapbox.addLayer({
      id: 'custom_layer',
      type: 'custom',
      renderingMode: '3d',
      onAdd: function (map, mbxContext) {
        (window as any).setUtils(self.mapbox, self.mapbox.getCanvas().getContext('webgl'));
        self.tb = (window as any).tb;

         var options = {
          type: 'gltf',
          obj: '/assets/models/car.glb',
          scale: 2,
          units: 'meters',
          anchor: "top",
          rotation: { x: 90, y: 0, z: 0 }, //rotation to postiion the truck and heading properly

        }

        self.tb.loadObj(options, function (model:any) {
          let origin=[0,0];
          if(self.geoLocationService.getLastCurrentLocation())origin = [self.geoLocationService.getLastCurrentLocation().coords.longitude,self.geoLocationService.getLastCurrentLocation().coords.latitude];
          self.carModel = model.setCoords(origin);
          self.carModel.addEventListener('ObjectChanged', self.onModelChanged, false);
          self.tb.add(self.carModel);
        })

      },

      render: function (gl:any, matrix:any) {
        self.tb.update();
      }
  });
  }

  async setLocator(locator:any){
    const options = locator.options;
    const self:MapService = this;
    const origin=this.carModel.coordinates;
    const rotation = this.carModel.rotation;
    this.tb.remove(self.carModel);
    await this.tb.loadObj(options, function (model:any) {
      self.carModel = model.setCoords(origin);
      self.carModel.addEventListener('ObjectChanged', self.onModelChanged, false);
      self.tb.add(self.carModel);
    });
    this.carModel.setRotation(rotation);
    this.tb.update();

  }

  updateModelRotation(degBasedOnMapNorth:number){
    let degInvertedOrientation:number = 360-degBasedOnMapNorth;
    let rad = this.toRad(degInvertedOrientation);
    let zAxis = new (window as any).THREE.Vector3(0, 0, 1);
    //this.carModel.setRotation({ x: 90, y: -90, z: rotationVision });
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

  addLongPressHandler() {

    this.mapbox.on('touchstart', (e) => {
      //console.log(e);
      this.trackingUser = false;
      this.mapEventIsFromTracking = false;
      if (this.mapbox.isEasing() || this.mapbox.isMoving()
        || this.mapbox.isRotating() || this.mapbox.isZooming()) {
        this.windowService.unAttachTimeOut("home", "mapService_longPressTimer");
        return;
      } else {
        if (this.firstTouchDone) {
          this.windowService.unAttachTimeOut("home", "mapService_longPressTimer");

        } else {
          this.firstTouchDone = true;
          const longPressTimer = setTimeout(() => {
            if (this.popUpMapPressed) {
              this.popUpMapPressed.remove();
            }
            const coordinates = e.lngLat;
            this.addMarkerWithPopup(coordinates);
          }, 3000); // 1000ms for a long press
          this.windowService.attachedTimeOut("home", "mapService_longPressTimer", longPressTimer);

        }

      }

    });

    this.mapbox.on('touchend', (e) => {
      // console.log(e);

      this.windowService.unAttachTimeOut("home", "mapService_longPressTimer");
      this.firstTouchDone = false;

    });
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

  getQueryParams() {
    var url = new URL(window.location.href);
    return url.searchParams;
  };

  updateQueryParam(key: any, value: any): void {
    var queryParams = this.getQueryParams();
    queryParams.set(key, value);
    var newUrl = new URL(window.location.href);
    newUrl.search = queryParams.toString();
    window.history.replaceState({}, '', newUrl.toString());
  };


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

  updateMarkerState(): void {
    const firstGeolocalizationEvent: boolean = this.isRotating;
    const newLocation: [number, number] = [this.sensorService.getSensorLongitude(), this.sensorService.getSensorLatitude()];
    const marker: mapboxgl.Marker = this.getUserMarker();
    const markerVision: mapboxgl.Marker = this.getUserVisionMarker();

    const heading = this.sensorService.getSensorHeadingAbs();
    if (this.mapbox && marker) {
      marker.setLngLat([this.sensorService.getSensorLongitude(), this.sensorService.getSensorLatitude()]);
      markerVision.setLngLat([this.sensorService.getSensorLongitude(), this.sensorService.getSensorLatitude()]);
    }
    const bearing = heading ? heading : this.mapbox.getBearing();
    if (firstGeolocalizationEvent) {
      this.mapEventIsFromTracking = true;
      marker.addTo(this.mapbox)
      markerVision.addTo(this.mapbox);
      const headingInit: number = this.calculateInitialHeading(new mapboxgl.LngLat(newLocation[0], newLocation[1]));    //   this.userLocationMarkerPrerequisitesOk = true;
      if (headingInit) {
        marker.setRotation(headingInit);
        markerVision.setRotation(headingInit);
      }
      this.isRotating = false;
      //((window as any).speedService as SpeedService).getSpeedDataFromArround(newLocation);
      this.setupInteractionListeners();
      ((window as any).homePage as HomePage).alreadyGeoLocated();
      ((window as any).cameraService as CameraService).updateCameraForUserMarkerFirstGeoEvent(newLocation, bearing);
      const timeOut: any = setTimeout(() => this.mapEventIsFromTracking = false, 500); // Reset after a delay to ensure event is finished
      this.windowService.attachedTimeOut("home", "mapService_unflagEventIsFromTracking", timeOut);
    } else {
      if (heading) {
        marker.setRotation(heading);
        markerVision.setRotation(heading);
      }
      if (this.trackingUser) {
        this.mapEventIsFromTracking = true;
        ((window as any).cameraService as CameraService).updateCameraForUserMarkerGeoEvent(newLocation, bearing);
        const timeOut: any = setTimeout(() => this.mapEventIsFromTracking = false, 500); // Reset after a delay to ensure event is finished
        this.windowService.attachedTimeOut("home", "mapService_unflagEventIsFromTracking", timeOut);

      }
    }
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
      'maxspeedDataSource',
      'speedCamerasDataSource',
      'stopDataSource'
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
      'maxspeedDataSource',
      'speedCamerasDataSource',
      'stopDataSource'
    ];

    sourcesToCheck.forEach(sourceId => {
      if (sourcesAndLayers.sources[sourceId] && !this.mapbox.getSource(sourceId)) {
        this.mapbox.addSource(sourceId, sourcesAndLayers.sources[sourceId]);
      }
    });

    this.addImageIfNot('custom-speed-camera-marker', 'ironcamera.png');
    this.addImageIfNot('custom-stop-marker', 'ironstop.png');
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
    this.mapControls.directions.removeRoutes();
    this.mapControls.directions.actions.clearDestination();
    this.mapControls.directions.actions.clearOrigin();
    this.cleanRoutePopups();
    this.popUpDestination?.remove();

    ((window as any).mapService as MapService).actualRoute = null;
    ((window as any).mapService as MapService).currentStep = 0;
    ((window as any).mapService as MapService).alreadySpoken = false;
    ((window as any).tripService as TripService).cancelTrip();
    if (environment.mocking) {
      environment.mocking = false;
      this.geoLocationService.mocking = false;
    }
  }

  cancelTripSimulation(): void {
    //this.destination = "";

    this.isTripStarted = false;
    //this.mapControls.directions.removeRoutes();
    //this.mapControls.directions.actions.clearDestination();
    //this.mapControls.directions.actions.clearOrigin();
    //this.cleanRoutePopups();
    //this.popUpDestination?.remove();

    //((window as any).mapService as MapService).actualRoute = null;
    ((window as any).mapService as MapService).currentStep = 0;
    ((window as any).mapService as MapService).alreadySpoken = false;
    ((window as any).tripService as TripService).cancelTrip();
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
      this.sourcesAndLayers = { sources: { directions: null, maxspeedDataSource: null, userMarkerSource: null }, layers: [] };
    }
  }

  async startTrip(): Promise<void> {
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
          ((window as any).tripService as TripService).startTrip(route);
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
    this.addLineTileVectorLayer(map, "maxspeedDataSource", "litoxperaloca.apypi869", "maxspeedDataLayer", "export_1-12rpm8", 12, 22, "hsl(0, 90%, 45%)", 0.2, 0.2);
    //this.addSymbolTileVectorLayer(map, "ironsemaphore.png", "custom-semaphore-marker", "semaphoreDataSource", "litoxperaloca.3deav1ng", 0.40, "semaphoreDataLayer", "semaphores_uruguay-6l99vu", 14, 22);
    this.addSymbolTileVectorLayer(map, "ironstop.png", "custom-stop-marker", "stopDataSource", "litoxperaloca.dlnykr8f", 0.50, "stopDataLayer", "stop_uruguay-6tysu4", 14, 22);
    this.addSymbolTileVectorLayer(map, "ironcamera.png", "custom-speed-camera-marker", "speedCamerasDataSource", "litoxperaloca.c1pj6s0f", 0.60, "speedCamerasDataLayer", "speed_cameras_uruguay-9ef5og", 12, 22);
  }

  getOSMStreetHeading(street:mapboxgl.MapboxGeoJSONFeature): number {
    if(!street.properties || !street.properties["oneway"] || street.geometry.type!="LineString")return 0;
    const oneway = street.properties["oneway"];
    const coordinates = street.geometry.coordinates;

    // Asegúrate de que la línea tenga al menos dos puntos
    if (coordinates.length < 2) return 0;

    // Usar los dos primeros puntos de la línea para calcular el heading
    const [start, end] = oneway === '-1' ? [coordinates[1], coordinates[0]] : [coordinates[0], coordinates[1]];
    let coordsFrom:mapboxgl.LngLat = new mapboxgl.LngLat(start[0], start[1]);
    let coordsTo:mapboxgl.LngLat = new mapboxgl.LngLat(end[0], end[1]);
    return turf.bearing(
      turf.point([coordsFrom.lng, coordsFrom.lat]),
      turf.point([coordsTo.lng, coordsTo.lat])
    );
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
          this.mapbox.setFilter('maxspeedRenderLayer', ['==', ['get', '@id'], this.userCurrentStreet.properties['@id']]);
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

  async hideUserCurrentStreetMaxSpeedWay() {
    if (this.mapbox.getLayer("maxspeedRenderLayer")) {
      this.mapbox.removeLayer("maxspeedRenderLayer");
      this.showingMaxSpeedWayId = null;
      this.showingMaxSpeedWay = false;
    }
    if (this.popUpMaxSpeedWay) {
      this.popUpMaxSpeedWay.remove();
      this.popUpMaxSpeedWay = null;
    }
  }

  createMaxSpeedWayPopUp(maxSpeed: number, coordinates: number[][]): mapboxgl.Popup {
    let divider = 2;

    // Convierte la ruta en un objeto GeoJSON
    const line = turf.lineString(coordinates);
    // Calcula la longitud total de la línea
    const lineLength = turf.length(line, { units: 'kilometers' });

    // Encuentra el punto medio
    const midPoint = turf.along(line, lineLength / divider, { units: 'kilometers' });
    const popUp = new mapboxgl.Popup({
      closeOnClick: false,
      anchor: "top" as mapboxgl.Anchor, // Cast anchor to Anchor type,
      offset: 10
      // Cast anchor to Anchor type
    })
      .setLngLat(midPoint.geometry.coordinates as [number, number])
      .setHTML('<div><p> ' + 'MAX: ' + maxSpeed + ' Km/h.</p</div>');

    let className: string = "red";
    this.mapbox.setPaintProperty('maxspeedRenderLayer', 'line-color', '#E91E63');

    if (maxSpeed >= 60) {
      className = "yellow";
      this.mapbox.setPaintProperty('maxspeedRenderLayer', 'line-color', '#ffc107');
    }
    if (maxSpeed >= 75) {
      className = "green";
      this.mapbox.setPaintProperty('maxspeedRenderLayer', 'line-color', '#079421');
    }
    popUp.addClassName("maxSpeedWayPopUp");

    popUp.addClassName(className + "PopUp");
    // Crea un popup y lo añade al mapa en el punto medio
    return popUp;
  }

  async showUserCurrentStreetMaxSpeedWay() {
    if (!this.mapbox.getLayer("maxspeedRenderLayer")) {
      this.mapbox.addLayer(
        {
          "id": "maxspeedRenderLayer",
          "minzoom": 7,
          "maxzoom": 22,
          "type": "line",
          "paint": {
            "line-color": "red",
            "line-width": 10,
            "line-opacity": 1,
            "line-emissive-strength": 2,
          },
          "layout": {
            "visibility": "visible",
          },
          "source": "maxspeedDataSource",
          "source-layer": "export_1-12rpm8"
        });
    }
    if (this.userCurrentStreet) {
      this.mapbox.setLayoutProperty("maxspeedRenderLayer", "visibility", "visible");

      if (this.userCurrentStreet.properties && this.userCurrentStreet.properties['@id']) {
        this.mapbox.setFilter('maxspeedRenderLayer', ['==', ['get', '@id'], this.userCurrentStreet.properties['@id']]);
        this.showingMaxSpeedWayId = this.userCurrentStreet.properties['@id'];
        this.showingMaxSpeedWay = true;
        if (this.userCurrentStreet.geometry!.type === "LineString") {
          const maxSpeedPopUp = this.createMaxSpeedWayPopUp(this.userCurrentStreet.properties['maxspeed'], this.userCurrentStreet.geometry!.coordinates);
          this.popUpMaxSpeedWay = maxSpeedPopUp;
          this.popUpMaxSpeedWay.addTo(this.mapbox);
        }
      } else {
        this.showingMaxSpeedWayId = null;
        this.showingMaxSpeedWay = false;
        if (this.popUpMaxSpeedWay) {
          this.popUpMaxSpeedWay.remove();
          this.popUpMaxSpeedWay = null;
        }

      }

    }
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
    map.addSource(sourceId, {
      type: 'vector',
      url: 'mapbox://' + mapboxTileId
    });
    map.addLayer(
      {
        "id": layerId,
        "minzoom": minZoom,
        "maxzoom": maxZoom,
        "type": "line",
        "paint": {
          "line-color": lineColor,
          "line-width": linWidth,
          "line-opacity": lineOpacity
        },
        "source": sourceId,
        "source-layer": sourceLayerId
      });
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
    map.loadImage(
      '/assets/img/map-icons/' + imageFileName,
      (error, image) => {
        if (error) throw error;
        if (image) {
          if (!map.hasImage(imageName)) map.addImage(imageName, image);
          map.addSource(sourceId, {
            type: 'vector',
            url: 'mapbox://' + mapboxTileId
          });
          map.addLayer(
            {
              "id": layerId,
              "minzoom": minZoom,
              "maxzoom": maxZoom,
              "type": "symbol",
              'layout': {
                'icon-image': imageName,
                'icon-size': imageSize,
                //'icon-allow-overlap': true,
                "icon-anchor": 'bottom',
                'visibility': 'visible',
                //'icon-rotate': ['get', 'bearing']
              },
              //"filter": ["<=", ["distance-from-center"], 0.5],

              "source": sourceId,
              "source-layer": sourceLayerId
            });
        }
      });
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
    map.loadImage(
      '/assets/img/map-icons/' + imageFileName,
      (error, image) => {
        if (error) throw error;
        if (image) {
          if (!map.hasImage(imageName)) map.addImage(imageName, image);
          map.addLayer(
            {
              "id": layerId,
              "minzoom": minZoom,
              "maxzoom": maxZoom,
              "type": "symbol",
              'paint': {
                'text-color': '#ffffff',
                'text-halo-color': '#000000',
                'text-halo-width': 0.5,
                'text-halo-blur': 0.7,
                'text-opacity': 1
              },
              'layout': {
                'icon-image': imageName,
                'icon-size': imageSize,
                //'icon-allow-overlap': true,
                "icon-anchor": 'bottom',
                'visibility': 'visible',
                'text-field': ['get', labelPropertyIndex],
                'text-justify': 'center',
                'text-offset': [0, 0.3],
                'text-anchor': 'top'

                //'icon-rotate': ['get', 'bearing']
              },
              //"filter": ["<=", ["distance-from-center"], 0.5],

              "source": sourceId,
            });
          map.on('click', layerId, function (e) {
            if (e.features && e.features[0] && e.features[0].properties && e.features[0].geometry.type == "Point") {
              const coordinates = e.features[0].geometry.coordinates.slice();
              const properties = e.features[0].properties;

              // Ensure that if the map is zoomed out such that multiple copies of the feature are visible,
              // the popup appears over the copy being pointed to.
              while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
              }
              const feature = e.features[0];
              if (!feature.properties || feature.geometry.type != "Point") return;
              const place: Place = {
                label: feature.properties[labelPropertyIndex] as string,
                addressNumber: "",
                country: "",
                municipality: "",
                neighborhood: "",
                postalCode: "",
                region: "",
                street: "",

                geometry: {
                  point: [
                    feature.geometry.coordinates[0], // Longitude
                    feature.geometry.coordinates[1]  // Latitude
                  ]
                }
              };
              let topHTML = '<ion-icon class="bookmarkIcon" onclick="window.homePage.addBookmark(\'' + feature.id + '\')" name="star-outline" size="big" color="warning"> </ion-icon>';

              topHTML += '<h6>' + place.label + '</h6>';

              topHTML += '<h7>' + categoryName + '</h7>';
              const description = Object.keys(properties).map(key => {
                return `<p>${key}: ${properties[key]}</p>`;
              }).join('');
              let innerHtml = topHTML + '<div id="destinationDetails">' + description + '</div>';
              //innerHtml += '<br><input type="button" id="cancelTripButtonPopUp" value="Cerrar" ></input>';
              innerHtml += '<div class="flexEqualRow"><ion-icon onclick="window.mapService.closeOSMpopup(\'' + feature.id + '\')" name="close-circle-outline" size="big" color="danger" > </ion-icon>';

              const self = ((window as any).mapService as MapService);
              //innerHtml += '<input type="button" id="infoButtonPopUp" value="INFO" onclick="window.homePage.openInfoModalOSM(\'' + feature.id + '\')"></input>';
              innerHtml += '<ion-icon  onclick="window.homePage.openInfoModalOSM(\'' + feature.id + '\')" name="information-circle-outline" size="big" color="secondary" > </ion-icon>';

              if (!self.isTripStarted) {
                //innerHtml += '<input type="button" id="startTripButtonPopUp" value="Buscar ruta" onclick="window.mapService.setDestinationOSM(\'' + feature.id + '\')"></input>';
                innerHtml += '<ion-icon  onclick="window.mapService.setDestinationOSM(\'' + feature.id + '\')" name="navigate-circle-outline" size="big" color="success" > </ion-icon>';

              } else {
                //innerHtml += '<input type="button" id="startTripButtonPopUp" value="Buscar ruta nueva" onclick="window.homePage.setDestinationOSMifAbortCurrent(\'' + feature.id + '\')"></input>';
                innerHtml += '<ion-icon  onclick="window.homePage.setDestinationOSMifAbortCurrent(\'' + feature.id + '\')" name="navigate-circle-outline" size="big" color="success" > </ion-icon>';

              }
              innerHtml += '</div>';


              const featurePopup = new mapboxgl.Popup({ closeOnClick: true, offset: 0, closeButton: true })
                .setLngLat(coordinates as mapboxgl.LngLatLike)
                .setHTML(innerHtml);
              featurePopup.addClassName('osmFeaturePopUp');
              if (self.popups.length > 0) {
                if (self.popups.includes(featurePopup)) self.popups[feature.id as number].remove();
              }
              feature.properties['category'] = category;
              //featurePopup.addTo(map);
              self.popups[feature.id as number] = featurePopup;
              self.osmFeatures[feature.id as number] = feature;
              self.osmPlaces[feature.id as number] = place;

              const iconElement = document.querySelector(`[data-id="${feature.id}"]`);
              if (iconElement) {
                iconElement.classList.toggle('highlight-icon');
              }
              ((window as any).homePage as HomePage).openOsmModal(feature.id as number);
              self.mapbox.flyTo({
                center: [coordinates[0], coordinates[1]]
              });
            }
          });
        }
      })
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
      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(this.convertOsmToJson(data));
      } else {
        map.addSource(sourceId, {
          type: 'geojson',
          data: this.convertOsmToJson(data)
        });

        this.addSymbolOSMLayer(map, category.marker + ".png", category.marker, category.marker + "Source", 0.75, category.marker + "Layer", 7, 20, category.labelPropertyIndex, category.name, category);
        ((window as any).homePage as HomePage).setCameraMode('SKY');
      }
    } // Handle errors as needed
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

  public updateUserMarkerSnapedPosition(useStreetHeading:boolean) {
    const newCoordinates: [number, number] = [
      this.sensorService.getSensorSnapLongitude(),
      this.sensorService.getSensorSnapLatitude()
    ];
    const newPosition = new mapboxgl.LngLat(newCoordinates[0], newCoordinates[1]);
    const userMarker = this.getUserMarker();
    const userMarkerVision = this.getUserVisionMarker();
    let rotationVision = this.sensorService.getSensorHeadingAbs();
    if(useStreetHeading){
      rotationVision=this.userCurrentStreetHeading;
    }
    const animationDuration = 800;

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

    const startPosition = userMarker.getLngLat();
    const newHeading = this.calculateHeading(startPosition, newPosition, userMarker.getRotation());
    const startTime = performance.now();

    this.isAnimating = true;
    this.animationTarget = newPosition;

    const animateMarker = (currentTime: number) => {
      if (!this.isAnimating) return;

      const progress = Math.min((currentTime - startTime) / animationDuration, 1);
      const interpolatedPosition = this.interpolatePosition(startPosition, newPosition, progress);
      const interpolatedRotation = this.interpolateRotation(userMarker.getRotation(), newHeading, progress);

      userMarker.setLngLat(interpolatedPosition).setRotation(interpolatedRotation);
      this.updateModelPosition(interpolatedPosition as [number,number]);
      userMarkerVision.setLngLat(interpolatedPosition).setRotation(interpolatedRotation);
      this.updateModelRotation(interpolatedRotation);

      if (progress < 1) {
        let frame = requestAnimationFrame(animateMarker);
        this.windowService.attachedAnimationFrameRequest("home", "mapService_updateUserSnapedPosition", frame);

      } else {
        this.completeAnimation(newPosition, newHeading);
      }
    };

    let frame = requestAnimationFrame(animateMarker);
    this.windowService.attachedAnimationFrameRequest("home", "mapService_updateUserSnapedPosition", frame);
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

  private completeAnimation(newPosition: mapboxgl.LngLat, newHeading: number) {
    const userMarker = this.getUserMarker();
    const userMarkerVision = this.getUserVisionMarker();

    userMarker.setLngLat(newPosition).setRotation(newHeading);
    this.updateModelPosition(newPosition.toArray());
    userMarkerVision.setLngLat(newPosition).setRotation(newHeading);
    this.updateModelRotation(newHeading);

    this.isAnimating = false;
    this.lastPosition = newPosition;
    this.windowService.unAttachAnimationFrameRequest("home", "mapService_updateUserSnapedPosition");
    if (this.trackingUser) {
      this.mapEventIsFromTracking = true;
      ((window as any).cameraService as CameraService).updateCameraForUserMarkerGeoEvent([newPosition.lng, newPosition.lat], newHeading);
      this.resetMapEventTrackingFlag();
    }
  }

  private resetMapEventTrackingFlag() {
    const timeOut: any = setTimeout(() => this.mapEventIsFromTracking = false, 500);
    this.windowService.attachedTimeOut("home", "mapService_unflagEventIsFromTracking", timeOut);
  }

}
