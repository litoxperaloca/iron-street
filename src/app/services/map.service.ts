import { Injectable } from '@angular/core';
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
import { TripService } from './trip.service';
import { VoiceService } from './voice.service.spec';


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
  private isAnimating: boolean = false; // Indicador de si una animación está en curso
  mapControls: any = { directions: null };
  private routeSourceId!: string;
  private routeLayerId!: string;
  destination!: string;
  destinationAddress!: string;
  userCurrentStreet: MapboxGeoJSONFeature | null = null;
  isTripStarted: boolean = false;
  actualRoute!: any;
  currentStep: number = 0;
  alreadySpoken: boolean = false;
  sourcesAndLayers: any = { sources: { directions: null, maxspeedDataSource: null, userMarkerSource: null }, layers: [] };
  isStandardMap: boolean = false;
  isRotating = true; // Flag to control rotation
  light: string = "dusk";
  userMarkerInstance: mapboxgl.Marker | null = null;

  constructor(private windowService: WindowService,
    private geoLocationService: GeoLocationService,
    private speedService: SpeedService,
    private voiceService: VoiceService) {
    //this.windowService.setValueIntoProperty('mapservice', this);
  }

  initMap() {
    this.isRotating = true;
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
      this.windowService.setValueIntoProperty('map', map);
      this.setDefaults();
      this.mapControls.directions.on('route', (event: any) => {
        //console.log(event);
        ((window as any).mapService as MapService).actualRoute = event;
        ((window as any).mapService as MapService).currentStep = 0;
        ((window as any).mapService as MapService).alreadySpoken = false;
        ((window as any).homePage as HomePage).showTrip();
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

  // Function to rotate the camera around the world
  rotateCamera(timestamp: number) {
    if (((window as any).mapService as MapService).isRotating) {
      ((window as any).cameraService as CameraService).rotateCamera(timestamp);
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


  updateMarkerRotation(newRotation: number) {
    if (newRotation && newRotation > 0) {
      this.getUserMarker().setRotation(newRotation);
      this.getUserMarker().getElement().classList.add('mapboxgl-user-location-show-heading');
    } else {
      this.getUserMarker().setRotation(0);
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


  setMapStye(id: String): void {
    this.isStandardMap = false;
    this.sourcesAndLayers = this.getSourcesAndLayers();
    this.mapbox.setStyle('mapbox://styles/mapbox/' + id);
  }

  getSourcesAndLayers(): any {
    this.sourcesAndLayers = {
      sources: {
        directions: null,
        maxspeedDataSource: null,
        //userMarkerSource: null
        semaphoreDataSource: null,
        stopDataSource: null,
        speedCameraDataSource: null
      },
      layers: []
    };
    this.mapbox.getStyle().layers.forEach((layer: mapboxgl.Layer) => {
      if (layer.source === "directions"
        || layer.source === "maxspeedDataSource"
        || layer.source === "semaphoreDataSource"
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
    if (this.mapbox.getStyle().sources["maxspeedDataSource"]) {
      this.sourcesAndLayers.sources.maxspeedDataSource = this.mapbox.getStyle().sources["maxspeedDataSource"];
    };
    if (this.mapbox.getStyle().sources["semaphoreDataSource"]) {
      this.sourcesAndLayers.sources.semaphoreDataSource = this.mapbox.getStyle().sources["semaphoreDataSource"];
    };
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
    if (sourcesAndLayers.sources.maxspeedDataSource) {
      if (!this.mapbox.getSource('maxspeedDataSource')) this.mapbox.addSource('maxspeedDataSource', sourcesAndLayers.sources.maxspeedDataSource);
    };
    if (sourcesAndLayers.sources.semaphoreDataSource) {
      if (!this.mapbox.getSource('semaphoreDataSource')) this.mapbox.addSource('semaphoreDataSource', sourcesAndLayers.sources.semaphoreDataSource);
    };
    if (sourcesAndLayers.sources.speedCamerasDataSource) {
      if (!this.mapbox.getSource('speedCamerasDataSource')) this.mapbox.addSource('speedCamerasDataSource', sourcesAndLayers.sources.speedCamerasDataSource);
    };
    if (sourcesAndLayers.sources.stopDataSource) {
      if (!this.mapbox.getSource('stopDataSource')) this.mapbox.addSource('stopDataSource', sourcesAndLayers.sources.stopDataSource);
    };
    this.addImageIfNot("custom-speed-camera-marker", "ironcamera.png");
    this.addImageIfNot("custom-semaphore-marker", "ironsemaphore.png");
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
    ((window as any).mapService as MapService).actualRoute = null;
    ((window as any).mapService as MapService).currentStep = 0;
    ((window as any).mapService as MapService).alreadySpoken = false;
    ((window as any).tripService as TripService).cancelTrip();
  }

  leaveMapPage() {
    this.sourcesAndLayers = { sources: { directions: null, maxspeedDataSource: null, userMarkerSource: null }, layers: [] };
  }

  async startTrip(): Promise<void> {
    if (!this.isTripStarted) {
      this.isTripStarted = true;
      // Get user's current location
      const userLocation: Position = this.geoLocationService.getLastCurrentLocation();
      if (userLocation) {
        // Get route information
        const route = ((window as any).mapService as MapService).actualRoute;
        //console.log("Route:", route);
        if (route && route.route && route.route.length > 0) {
          const steps = route.route[0].legs[0].steps;
          // Set initial step index to 0
          let currentStepIndex = 0;
          // Speak the instruction associated with the first step
          ((window as any).tripService as TripService).startTrip(route.route[0].legs[0]);
        }
      }
    }
  }

  lockCameraAtUserPosition(userLocation: any, currentStep: number) {
    // Lock the camera at the user's position
    const route = ((window as any).mapService as MapService).actualRoute;
    const step = route.route[0].legs[0].steps[currentStep];
    const bearing: number = step.maneuver.bearing_after;
    ((window as any).cameraService as CameraService).lockCameraAtPosition(userLocation, bearing);
  }

  async setDestination(destination: Place) {
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
    ((window as any).cameraService as CameraService).setCameraPOVPosition(position);

  }

  setCameraSKYPosition(position: Position) {
    ((window as any).cameraService as CameraService).setCameraSKYPosition(position);

  }
  userStreet(position: Position) {
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
    }
  }

  setDefaults() {
    const map = this.mapbox;
    this.addLineTileVectorLayer(map, "maxspeedDataSource", "litoxperaloca.apypi869", "maxspeedDataLayer", "export_1-12rpm8", 12, 22, "hsl(0, 90%, 45%)", 0.2, 0.2);
    this.addSymbolTileVectorLayer(map, "ironsemaphore.png", "custom-semaphore-marker", "semaphoreDataSource", "litoxperaloca.3deav1ng", 0.40, "semaphoreDataLayer", "semaphores_uruguay-6l99vu", 14, 22);
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
                'icon-allow-overlap': true,
                "icon-anchor": 'bottom',
                'visibility': 'visible',
                //'icon-rotate': ['get', 'bearing']
              },
              "filter": ["<=", ["distance-from-center"], 0.5],

              "source": sourceId,
              "source-layer": sourceLayerId
            });
        }
      });
  }



}
