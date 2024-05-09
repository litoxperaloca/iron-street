import { Injectable } from '@angular/core';
import polyline from '@mapbox/polyline';
import * as turf from '@turf/turf';
import mapboxgl, { MapboxGeoJSONFeature } from 'mapbox-gl';

//import 'mapbox-gl/dist/mapbox-gl.css';
import { Position } from '@capacitor/geolocation';
import { environment } from 'src/environments/environment';
import { GeoLocationService } from './geo-location.service';
import { SpeedService } from './speed.service';
import { WindowService } from "./window.service";
//import { GeoJSON } from 'mapbox-gl';

//import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
//import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { Place } from '@aws-amplify/geo';
import { HomePage } from '../pages/home/home.page';
import { CameraService } from './camera.service';
import { SensorService } from './sensor.service';
import { TripService } from './trip.service';
import { VoiceService } from './voice.service';


@Injectable({
  providedIn: 'root'
})
export class MapService {
  startRoute() {
    throw new Error('Method not implemented.');
  }
  cancelRoute() {
    throw new Error('Method not implemented.');
  }

  private mapbox!: mapboxgl.Map;
  private userLocationMarkerPrerequisitesOk: boolean = false;
  isAnimating: boolean = false; // Indicador de si una animación está en curso
  private animationTarget: mapboxgl.LngLat | null = null; // Stores the target for ongoing animation
  mapControls: any = { directions: null };
  private routeSourceId!: string;
  private routeLayerId!: string;
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
  popUpAltRoute: mapboxgl.Popup | null = null;
  popUpDestination: mapboxgl.Popup | null = null;
  popups: mapboxgl.Popup[] = [];
  coordinatesMainRoute: number[][] = [];
  coordinatesAltRoute: number[][] = [];
  osmFeatures: mapboxgl.MapboxGeoJSONFeature[] = [];
  osmPlaces: Place[] = [];
  private lastPosition: mapboxgl.LngLat | null = null;


  constructor(private windowService: WindowService,
    private geoLocationService: GeoLocationService,
    private speedService: SpeedService,
    private voiceService: VoiceService,
    private sensorService: SensorService) {
    //this.windowService.setValueIntoProperty('mapservice', this);
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
      projection: 'globe' as any
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

      setTimeout(() => {
        this.introTimeWaited = true;
      }, this.introTime);

      this.windowService.setValueIntoProperty('map', map);
      this.setDefaults();
      this.mapControls.directions.on('route', (event: any) => {
        //console.log(event);
        const selectedIndex: number = this.mapControls.directions._stateSnapshot.routeIndex;

        ((window as any).mapService as MapService).actualRoute = event.route[selectedIndex];
        ((window as any).mapService as MapService).currentStep = 0;
        ((window as any).mapService as MapService).alreadySpoken = false;
        ((window as any).mapService as MapService).cleanRoutePopups();
        if (event.route.length < 2) {
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-route-line-alt', 'line-emissive-strength', 0.8);
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-route-line-alt', 'line-width', 8);
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-route-line-alt', 'line-color', '#ffc107');
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-route-line', 'line-emissive-strength', 1);
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-route-line', 'line-width', 12);
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-route-line', 'line-color', '#09a2e7');
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-destination-point', 'circle-color', '#ff4961');
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-origin-point', 'circle-color', '#2fdf75');
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-destination-point', 'circle-emissive-strength', 0.7);
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-origin-point', 'circle-emissive-strength', 0.7);
          ((window as any).homePage as HomePage).showTrip();

          const feature = ((window as any).mapService as MapService).mapControls.directions._stateSnapshot.destination;
          const popup = ((window as any).mapService as MapService).createDestinationPopup(feature.geometry.coordinates as [number, number]);
          // Set the popup's content and location
          /*if (this.checkOverlap(popup)) {
            console.log(popup, "Overlap detected, adjusting position...");
            // Implement logic to adjust position
          }*/
          popup.addTo(map);
          ((window as any).mapService as MapService).popUpDestination = popup;
        } else {
          let altIndex = 0;
          if (selectedIndex == 0) {
            altIndex = 1
          }
          const routeAlt = event.route[altIndex]; // Obtiene la primera ruta
          const routeMain = event.route[selectedIndex]; // Obtiene la primera ruta

          let mainAnchor = "right";
          let altAnchor = "left";
          const routeMainSide = ((window as any).mapService as MapService).compareLinePositions(polyline.decode(routeMain.geometry), polyline.decode(routeAlt.geometry));
          if (routeMainSide === "right") {
            mainAnchor = "left";
            altAnchor = "right";
          }
          const coordinates1 = polyline.decode(routeMain.geometry).map(coord => [coord[1], coord[0]]);
          const coordinates2 = polyline.decode(routeAlt.geometry).map(coord => [coord[1], coord[0]]);
          let uniqueFromLine2 = this.uniqueCoordinates(coordinates2, coordinates1);
          if (uniqueFromLine2.length < 3) {
            uniqueFromLine2 = coordinates2;
          }
          const popUpAltRoute = ((window as any).mapService as MapService).createRoutePopUpFromCoords(uniqueFromLine2, routeAlt, 'mapboxgl-popup-alt-route', altIndex, altAnchor);
          popUpAltRoute.addTo(map);
          ((window as any).mapService as MapService).popUpAltRoute = popUpAltRoute;
          //((window as any).mapService as MapService).popups.push(popUpAltRoute);

          // Supongamos que ya tienes una ruta cargada
          const popUpMainRoute = ((window as any).mapService as MapService).createRoutePopUp(routeMain, 'mapboxgl-popup-main-route', selectedIndex, mainAnchor);
          /* if (this.checkOverlap(popUpMainRoute)) {
             console.log(popUpMainRoute, "Overlap detected, adjusting position...");
             // Implement logic to adjust position
           }*/
          popUpMainRoute.addTo(map);
          ((window as any).mapService as MapService).popUpMainRoute = popUpMainRoute;
          // ((window as any).mapService as MapService).popups.push(popUpMainRoute);


          // ((window as any).mapService as MapService).popups.push(popup);


          ((window as any).mapService as MapService).mapbox.setLayoutProperty('directions-route-line-alt', 'visibility', 'visible');

          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-route-line-alt', 'line-emissive-strength', 1);
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-route-line-alt', 'line-width', 8);
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-route-line-alt', 'line-opacity', 0.5);
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-route-line-alt', 'line-color', '#ffc107');
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-route-line', 'line-emissive-strength', 1);
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-route-line', 'line-width', 11);
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-route-line', 'line-color', '#09a2e7');
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-destination-point', 'circle-color', '#ff4961');
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-origin-point', 'circle-color', '#2fdf75');
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-destination-point', 'circle-emissive-strength', 0.7);
          ((window as any).mapService as MapService).mapbox.setPaintProperty('directions-origin-point', 'circle-emissive-strength', 0.7);
          ((window as any).homePage as HomePage).showTrip();


          const feature = ((window as any).mapService as MapService).mapControls.directions._stateSnapshot.destination;
          const popup = ((window as any).mapService as MapService).createDestinationPopup(feature.geometry.coordinates as [number, number]);
          // Set the popup's content and location
          /*if (this.checkOverlap(popup)) {
            console.log(popup, "Overlap detected, adjusting position...");
            // Implement logic to adjust position
          }*/
          popup.addTo(map);
          const distanceMain = this.actualRoute.distance / 1000;
          const durationMain = this.actualRoute.duration / 60;
          ((window as any).homePage as HomePage).tripDistance = parseFloat(distanceMain.toFixed(2));
          ((window as any).homePage as HomePage).tripDuration = parseFloat(durationMain.toFixed(2));
          ((window as any).mapService as MapService).popUpDestination = popup;
          const directionsBounds = ((window as any).mapService as MapService).calculateBounds([((window as any).mapService as MapService).coordinatesMainRoute, ((window as any).mapService as MapService).coordinatesAltRoute]);
          map.fitBounds(directionsBounds, { padding: 10, zoom: 14 });
          const center = directionsBounds.getCenter();
          const targetPoint: [number, number] = feature.geometry.coordinates; // Arbitrary point for bearing
          const bearing = this.calculateBearing(center, targetPoint);
          map.rotateTo(bearing);
        }
      });
      map.on('click', 'directions-destination-point', function (e: any) {
        // Ensure there's data from which to derive a popup
        if (e.features.length > 0) {
          const feature = e.features[0];
          const popup = ((window as any).mapService as MapService).createDestinationPopup(feature.geometry.coordinates as [number, number]);
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

    });
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
    html += '<input type="button" id="cancelTripButtonPopUp" value="Cancelar" onclick="window.homePage.cancelTrip()"></input>';
    html += '<input type="button" id="startTripButtonPopUp" value="Iniciar viaje" onclick="window.homePage.startTrip()"></input>';
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
    const newRect = newPopup.getElement().getBoundingClientRect();

    for (let existingPopup of this.popups) {
      const existingRect = existingPopup.getElement().getBoundingClientRect();
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


  updateUserMarkerPosition(newLocation: [number, number]) {
    const firstGeolocalizationEvent: boolean = this.isRotating;

    const marker: mapboxgl.Marker = this.getUserMarker();
    marker.setLngLat(newLocation);
    const bearing = this.mapbox.getBearing();
    if (firstGeolocalizationEvent) {
      marker.addTo(this.mapbox)
      this.userLocationMarkerPrerequisitesOk = true;
      this.isRotating = false;
      ((window as any).homePage as HomePage).alreadyGeoLocated();
      ((window as any).cameraService as CameraService).updateCameraForUserMarkerFirstGeoEvent(newLocation, bearing);
    } else {
      ((window as any).cameraService as CameraService).updateCameraForUserMarkerGeoEvent(newLocation, bearing);
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
      this.setupInteractionListeners();
      ((window as any).homePage as HomePage).alreadyGeoLocated();
      ((window as any).cameraService as CameraService).updateCameraForUserMarkerFirstGeoEvent(newLocation, bearing);
      setTimeout(() => this.mapEventIsFromTracking = false, 1000); // Reset after a delay to ensure event is finished
    } else {
      if (heading) {
        marker.setRotation(heading);
        markerVision.setRotation(heading);
      }
      if (this.trackingUser) {
        this.mapEventIsFromTracking = true;
        ((window as any).cameraService as CameraService).updateCameraForUserMarkerGeoEvent(newLocation, bearing);
        setTimeout(() => this.mapEventIsFromTracking = false, 1000); // Reset after a delay to ensure event is finished
      }
    }
  }

  /*updateMarkerState(): void {
    const firstGeolocalizationEvent: boolean = this.isRotating;
    const newLocation: [number, number] = [this.sensorService.getSensorLongitude(), this.sensorService.getSensorLatitude()];
    const heading = this.sensorService.getSensorHeadingAbs();
    const marker: mapboxgl.Marker = this.getUserMarker();
    const rotation: number = heading ? heading : 0;
    if (this.mapbox && marker) {
      if (firstGeolocalizationEvent) {
        this.mapEventIsFromTracking = true;
        marker.setLngLat(newLocation).setRotation(rotation);
        marker.addTo(this.mapbox);
        this.userLocationMarkerPrerequisitesOk = true;
        this.isRotating = false;
        this.setupInteractionListeners();
        ((window as any).homePage as HomePage).alreadyGeoLocated();
        ((window as any).cameraService as CameraService).updateCameraForUserMarkerFirstGeoEvent(newLocation, heading);
        setTimeout(() => this.mapEventIsFromTracking = false, 1000); // Reset after a delay
      } else {
        // Always animate the marker regardless of the tracking state
        this.animateMarker(newLocation, heading);
        if (this.trackingUser) { // Only call camera service if tracking is active
          this.mapEventIsFromTracking = true;

          ((window as any).cameraService as CameraService).updateCameraForUserMarkerGeoEvent(newLocation, heading);
          setTimeout(() => this.mapEventIsFromTracking = false, 1000); // Reset after a delay
        }
      }
    }
  }*/

  private animateMarker(newLngLat: [number, number], newHeading: number) {
    if (this.isAnimating) return; // If already animating, ignore further calls
    this.isAnimating = true;
    const marker: mapboxgl.Marker = this.getUserMarker();

    const start = performance.now();
    const duration = 1000;
    const fromLngLat = marker.getLngLat();
    const fromRotation = marker.getRotation();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const lng = fromLngLat.lng + (newLngLat[0] - fromLngLat.lng) * progress;
      const lat = fromLngLat.lat + (newLngLat[1] - fromLngLat.lat) * progress;
      const rotation = fromRotation + (newHeading - fromRotation) * progress;

      marker.setLngLat([lng, lat]).setRotation(rotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimating = false; // Reset the flag once animation completes
      }
    };

    requestAnimationFrame(animate);
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


  setMapStye(id: String): void {
    this.isStandardMap = false;
    this.sourcesAndLayers = this.getSourcesAndLayers();
    this.mapbox.setStyle('mapbox://styles/mapbox/' + id);
  }

  getSourcesAndLayers(): any {
    this.sourcesAndLayers = {
      sources: {
        directions: null,
        directionsMarkers: null,
        maxspeedDataSource: null,
        //userMarkerSource: null
        //semaphoreDataSource: null,
        stopDataSource: null,
        speedCameraDataSource: null
      },
      layers: []
    };
    this.mapbox.getStyle().layers.forEach((layer: mapboxgl.Layer) => {
      if (layer.source === "directions"
        || layer.source === "directions:markers"
        || layer.source === "maxspeedDataSource"
        // || layer.source === "semaphoreDataSource"
        || layer.source === "speedCamerasDataSource"
        || layer.source === "stopDataSource"
      ) {
        const layerLoaded: any = {
          sourceId: layer.source,
          layer: layer,
          layerId: layer.id
        };
        this.sourcesAndLayers.layers.push(layerLoaded);
      }

    });
    if (this.mapbox.getStyle().sources["directions"]) {
      this.sourcesAndLayers.sources.directions = this.mapbox.getStyle().sources["directions"];
    };
    if (this.mapbox.getStyle().sources["directions:markers"]) {
      this.sourcesAndLayers.sources.directionsMarkers = this.mapbox.getStyle().sources["directions:markers"];
    };
    if (this.mapbox.getStyle().sources["maxspeedDataSource"]) {
      this.sourcesAndLayers.sources.maxspeedDataSource = this.mapbox.getStyle().sources["maxspeedDataSource"];
    };
    /*if (this.mapbox.getStyle().sources["semaphoreDataSource"]) {
       this.sourcesAndLayers.sources.semaphoreDataSource = this.mapbox.getStyle().sources["semaphoreDataSource"];
     };*/
    if (this.mapbox.getStyle().sources["speedCamerasDataSource"]) {
      this.sourcesAndLayers.sources.speedCamerasDataSource = this.mapbox.getStyle().sources["speedCamerasDataSource"];
    };
    if (this.mapbox.getStyle().sources["stopDataSource"]) {
      this.sourcesAndLayers.sources.stopDataSource = this.mapbox.getStyle().sources["stopDataSource"];
    };
    return this.sourcesAndLayers;
  }

  addAdditionalSourceAndLayer(sourcesAndLayers: any = null) {
    if (sourcesAndLayers.sources.directions) {
      if (!this.mapbox.getSource('directions')) this.mapbox.addSource('directions', sourcesAndLayers.sources.directions);
    };
    if (sourcesAndLayers.sources.directionsMarkers) {
      if (!this.mapbox.getSource('directions:markers')) this.mapbox.addSource('directions:markers', sourcesAndLayers.sources.directionsMarkers);
    };
    if (sourcesAndLayers.sources.maxspeedDataSource) {
      if (!this.mapbox.getSource('maxspeedDataSource')) this.mapbox.addSource('maxspeedDataSource', sourcesAndLayers.sources.maxspeedDataSource);
    };
    /* if (sourcesAndLayers.sources.semaphoreDataSource) {
       if (!this.mapbox.getSource('semaphoreDataSource')) this.mapbox.addSource('semaphoreDataSource', sourcesAndLayers.sources.semaphoreDataSource);
     };*/
    if (sourcesAndLayers.sources.speedCamerasDataSource) {
      if (!this.mapbox.getSource('speedCamerasDataSource')) this.mapbox.addSource('speedCamerasDataSource', sourcesAndLayers.sources.speedCamerasDataSource);
    };
    if (sourcesAndLayers.sources.stopDataSource) {
      if (!this.mapbox.getSource('stopDataSource')) this.mapbox.addSource('stopDataSource', sourcesAndLayers.sources.stopDataSource);
    };
    this.addImageIfNot("custom-speed-camera-marker", "ironcamera.png");
    //this.addImageIfNot("custom-semaphore-marker", "ironsemaphore.png");
    this.addImageIfNot("custom-stop-marker", "ironstop.png");
    this.reAddLayers(sourcesAndLayers);


  }

  reAddLayers(sourcesAndLayers: any = null): void {
    if (sourcesAndLayers && sourcesAndLayers.layers) {
      sourcesAndLayers.layers.forEach((layerLoaded: any) => {
        if (!this.mapbox.getLayer(layerLoaded.layerId)) this.mapbox.addLayer(layerLoaded.layer);
      });
    }
  }

  addImageIfNot(imageName: string, imageFileName: string): void {
    if (!this.mapbox.hasImage(imageName)) {
      this.mapbox.loadImage(
        '/assets/img/map-icons/' + imageFileName,
        (error, image) => {
          if (error) throw error;

          if (image) {
            if (!this.mapbox.hasImage(imageName)) this.mapbox.addImage(imageName, image);
          }
        });
    }
  }



  /**
  * Agrega un marcador al mapa en las coordenadas especificadas.
  * @param coordinates Coordenadas donde se colocará el marcador.
  * @param options Opciones para el marcador.
  */
  addMarker(coordinates: mapboxgl.LngLatLike, options?: mapboxgl.MarkerOptions): mapboxgl.Marker {
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
    if (environment.mocking) {
      environment.mocking = false;
    }
  }

  leaveMapPage() {
    this.sourcesAndLayers = { sources: { directions: null, maxspeedDataSource: null, userMarkerSource: null }, layers: [] };
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
          ((window as any).tripService as TripService).startTrip(route.legs[0]);
        }
      }
    }
  }

  lockCameraAtUserPosition(userLocation: any, currentStep: number) {
    // Lock the camera at the user's position
    const route = ((window as any).mapService as MapService).actualRoute;
    const step = route.legs[0].steps[currentStep];
    const bearing: number = step.maneuver.bearing_after;
    this.mapEventIsFromTracking = true;
    this.trackingUser = true;
    ((window as any).cameraService as CameraService).lockCameraAtPosition(userLocation, bearing);
    setTimeout(() => this.mapEventIsFromTracking = false, 1000); // Reset after a delay to ensure event is finished
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
    setTimeout(() => this.mapEventIsFromTracking = false, 1000); // Reset after a delay to ensure event is finished

  }

  setCameraSKYPosition(position: Position) {
    this.trackingUser = false;

    ((window as any).cameraService as CameraService).setCameraSKYPosition(position);

  }

  setupInteractionListeners() {
    const userEvents = ['dragstart', 'zoomstart', 'rotatestart', 'pitchstart'];

    userEvents.forEach(event => {
      this.mapbox.on(event, () => {
        if (!this.mapEventIsFromTracking) {
          //console.log(`User interaction detected: ${event}`);
          this.trackingUser = false;
        }
      });
    });
  }


  /* userStreet(position: Position) {
     let longitude = position.coords.longitude;
     let latitude = position.coords.latitude;
     // Convert the user's coordinates to a point
     const coordinates = [longitude, latitude];
     const userPoint = turf.point(coordinates);
     const bbox = ((window as any).geoLocationService as GeoLocationService).createUserBoundingBox(position);
     // Query the rendered line features at the user's location
     const features = ((window as any).mapService as MapService).mapbox.queryRenderedFeatures(undefined, { layers: ["maxspeedDataLayer"] })
     if (features.length > 0) {
       var closestFeature: MapboxGeoJSONFeature | null = null;
       var minDistance = Number.MAX_VALUE;
       // Iterate through all line features to find the closest one
       features.forEach(feature => {
         if (feature.layer.id === 'maxspeedDataLayer' && feature.geometry.type === 'LineString') {
           //console.log("Feature:", feature);
           const line = turf.lineString(feature.geometry.coordinates);
           const distance = turf.pointToLineDistance(userPoint, line);
           const pointInLine = turf.nearestPointOnLine(line, userPoint);
           const distancePoints: number = turf.distance(pointInLine, userPoint, { units: 'kilometers' });

           if (distancePoints < minDistance && distancePoints < 1) {
             minDistance = distancePoints;
             closestFeature = feature;
           }
         }
       });

       ((window as any).mapService as MapService).userCurrentStreet = closestFeature;
       const cF: MapboxGeoJSONFeature | null = ((window as any).mapService as MapService).userCurrentStreet;
       if (cF != null && cF.geometry && cF.geometry.type == 'LineString' && cF.geometry.coordinates && cF.geometry.coordinates.length > 0) {
         const nearestPoint: NearestPointOnLine = turf.nearestPointOnLine(turf.lineString(cF.geometry.coordinates), userPoint);
         this.sensorService.updateSnapToRoadPosition(nearestPoint.geometry.coordinates, cF, nearestPoint)
       }
     }
   }*/

  setDefaults() {
    const map = this.mapbox;
    this.addLineTileVectorLayer(map, "maxspeedDataSource", "litoxperaloca.apypi869", "maxspeedDataLayer", "export_1-12rpm8", 12, 22, "hsl(0, 90%, 45%)", 0.2, 0.2);
    //this.addSymbolTileVectorLayer(map, "ironsemaphore.png", "custom-semaphore-marker", "semaphoreDataSource", "litoxperaloca.3deav1ng", 0.40, "semaphoreDataLayer", "semaphores_uruguay-6l99vu", 14, 22);
    this.addSymbolTileVectorLayer(map, "ironstop.png", "custom-stop-marker", "stopDataSource", "litoxperaloca.dlnykr8f", 0.50, "stopDataLayer", "stop_uruguay-6tysu4", 14, 22);
    this.addSymbolTileVectorLayer(map, "ironcamera.png", "custom-speed-camera-marker", "speedCamerasDataSource", "litoxperaloca.c1pj6s0f", 0.60, "speedCamerasDataLayer", "speed_cameras_uruguay-9ef5og", 12, 22);
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
              let topHTML: string = '<h6>' + place.label + '</h6>';
              topHTML += '<h7>' + categoryName + '</h7>';
              const description = Object.keys(properties).map(key => {
                return `<p>${key}: ${properties[key]}</p>`;
              }).join('');
              let innerHtml = topHTML + '<div id="destinationDetails">' + description + '</div>';
              innerHtml += '<br><input type="button" id="cancelTripButtonPopUp" value="Cerrar" onclick="window.mapService.closeOSMpopup(\'' + feature.id + '\')"></input>';
              const self = ((window as any).mapService as MapService);
              innerHtml += '<input type="button" id="infoButtonPopUp" value="INFO" onclick="window.homePage.openInfoModalOSM(\'' + feature.id + '\')"></input>';

              if (!self.isTripStarted) {
                innerHtml += '<input type="button" id="startTripButtonPopUp" value="Buscar ruta" onclick="window.mapService.setDestinationOSM(\'' + feature.id + '\')"></input>';
              } else {
                innerHtml += '<input type="button" id="startTripButtonPopUp" value="Buscar ruta nueva" onclick="window.homePage.setDestinationOSMifAbortCurrent(\'' + feature.id + '\')"></input>';

              }


              const featurePopup = new mapboxgl.Popup({ closeOnClick: true, offset: 0, closeButton: true })
                .setLngLat(coordinates as mapboxgl.LngLatLike)
                .setHTML(innerHtml);
              featurePopup.addClassName('osmFeaturePopUp');
              if (self.popups.length > 0) {
                if (self.popups.includes(featurePopup)) self.popups[feature.id as number].remove();
              }
              feature.properties['category'] = category;
              featurePopup.addTo(map);
              self.popups[feature.id as number] = featurePopup;
              self.osmFeatures[feature.id as number] = feature;
              self.osmPlaces[feature.id as number] = place;
            }
          });
        }
      })
  };

  closeOSMpopup(id: number) {
    const popUp: mapboxgl.Popup = this.popups[id];
    popUp.remove();
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


  public updateUserSnapedPosition() {
    const newCoordinates: [number, number] = [this.sensorService.getSensorSnapLongitude(), this.sensorService.getSensorSnapLatitude()];
    const newPosition = new mapboxgl.LngLat(newCoordinates[0], newCoordinates[1]);
    const userMarker = this.getUserMarker();
    const userMarkerVision: mapboxgl.Marker = this.getUserVisionMarker();
    const map = this.mapbox;
    const firstGeolocalizationEvent: boolean = this.isRotating;
    const rotationVision: number = this.sensorService.getSensorHeadingAbs();

    if (userMarker) {
      if (this.isAnimating) {
        // Update the target position if an animation is already in progress
        this.animationTarget = newPosition;
        return;
      }

      const startPosition: mapboxgl.LngLat = userMarker.getLngLat();

      // Manually check if positions are the same
      let positionsAreEqual = this.lastPosition &&
        this.lastPosition.lng === newPosition.lng &&
        this.lastPosition.lat === newPosition.lat;

      // Calculate heading from last position to new position if lastPosition is available
      let newHeading = positionsAreEqual || !this.lastPosition ?
        userMarker.getRotation() || 0 :
        turf.bearing(turf.point([this.lastPosition.lng, this.lastPosition.lat]),
          turf.point([newPosition.lng, newPosition.lat]));


      const animationDuration = 800; // Duration in milliseconds
      const startTime = performance.now();
      this.isAnimating = true;
      this.animationTarget = newPosition;

      const animateMarker = (currentTime: number) => {

        if (!this.isAnimating) return; // Exit if animation was prematurely stopped

        const elapsedTime = currentTime - startTime;
        const progress = elapsedTime / animationDuration;

        if (progress < 1 && this.animationTarget) {
          const currentLng = startPosition.lng + (this.animationTarget.lng - startPosition.lng) * progress;
          const currentLat = startPosition.lat + (this.animationTarget.lat - startPosition.lat) * progress;
          const currentRotation = userMarker.getRotation() + (newHeading - userMarker.getRotation()) * progress;

          userMarker.setLngLat([currentLng, currentLat]);
          userMarker.setRotation(currentRotation);  // Assuming you have a method to set rotation

          userMarkerVision.setLngLat([currentLng, currentLat]);
          userMarkerVision.setRotation(currentRotation);
          if (this.trackingUser) {
            this.mapEventIsFromTracking = true;
            ((window as any).cameraService as CameraService).updateCameraForUserMarkerGeoEvent(newCoordinates, newHeading);
            setTimeout(() => this.mapEventIsFromTracking = false, 500); // Reset after a delay to ensure event is finished
          }
          requestAnimationFrame(animateMarker);
        } else {
          // Complete the animation
          if (this.animationTarget) {
            userMarker.setLngLat([this.animationTarget.lng, this.animationTarget.lat]);
            userMarker.setRotation(newHeading);
            userMarkerVision.setLngLat([this.animationTarget.lng, this.animationTarget.lat]);
            userMarkerVision.setRotation(newHeading);
            this.updateMarkerRotation(rotationVision);

            this.isAnimating = false; // Reset animation flag
            if (this.trackingUser) {
              this.mapEventIsFromTracking = true;
              ((window as any).cameraService as CameraService).updateCameraForUserMarkerGeoEvent([this.animationTarget.lng, this.animationTarget.lat], newHeading);
              setTimeout(() => this.mapEventIsFromTracking = false, 500); // Reset after a delay to ensure event is finished
            }
          }
        }
      };

      requestAnimationFrame(animateMarker);
    } else {
      let newHeading = 0;
      // If the marker does not exist, create a new one
      this.userMarkerInstance = this.getUserMarker()
        .setLngLat(newCoordinates)
        .setRotation(newHeading)  // Set initial rotation
        .addTo(map);
      if (firstGeolocalizationEvent) {
        this.trackingUser = true;
        this.userLocationMarkerPrerequisitesOk = true;
        this.isRotating = false;
        this.setupInteractionListeners();
        ((window as any).homePage as HomePage).alreadyGeoLocated();
        //this.getUserVisionMarker().setLngLat(newCoordinates).setRotation(rotationVision).addTo(map);
        this.getUserVisionMarker().setLngLat(newCoordinates).addTo(map);
        this.updateMarkerRotation(0);

      } else {
        //this.getUserVisionMarker().setLngLat(newCoordinates).setRotation(0).addTo(map);
        this.getUserVisionMarker().setLngLat(newCoordinates).addTo(map);
        this.updateMarkerRotation(0);

      }
      if (this.trackingUser) {
        this.mapEventIsFromTracking = true;
        ((window as any).cameraService as CameraService).updateCameraForUserMarkerGeoEvent(newCoordinates, newHeading);
        setTimeout(() => this.mapEventIsFromTracking = false, 500); // Reset after a delay to ensure event is finished
      }
    }

    // Update lastPosition for next move
    this.lastPosition = newPosition;
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

}
