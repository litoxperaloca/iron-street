import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import { Point, Position } from 'geojson';
import mapboxgl, { GeoJSONSource, LngLatLike, MapboxGeoJSONFeature } from 'mapbox-gl';

//import 'mapbox-gl/dist/mapbox-gl.css';
import { GeolocationPosition } from '@capacitor/geolocation';
import { environment } from 'src/environments/environment';
import { GeoLocationService } from './geo-location.service';
import { SpeedService } from './speed.service';
import { WindowService } from "./window.service";
//import { GeoJSON } from 'mapbox-gl';

//import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
//import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
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
  userCurrentStreet!: MapboxGeoJSONFeature | null;
  isTripStarted: boolean = false;

  constructor(private windowService: WindowService,
    private geoLocationService: GeoLocationService,
    private speedService: SpeedService,
    private voiceService: VoiceService) {
    //this.windowService.setValueIntoProperty('mapservice', this);
  }

  initMap() {

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
      attributionControl: environment.mapboxMapConfig.attributionControl
    });



    /*const geocoder = new MapboxGeocoder({
      accessToken: environment.mapboxControlSearchConfig.accessToken,
      mapboxgl: mapboxgl,
      countries: environment.mapboxControlSearchConfig.countries,
      language: environment.mapboxControlSearchConfig.language,
      placeholder: environment.mapboxControlSearchConfig.placeholder,
      autocomplete: environment.mapboxControlSearchConfig.autocomplete
    });
    map.addControl(geocoder, 'top-left');*/

    const MapboxDirections: any = require('@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions');
    const directions: any = new MapboxDirections(environment.mapboxControlDirectionsConfig);

    map.addControl(
      directions,
      'top-left'
    );

    this.mapControls.directions = directions;
    //Guardo Referencia

    this.mapbox = map;
    this.userLocationMarkerPrerequisitesOk = false;




    map.on('load', () => {
      map.resize();
      this.windowService.setValueIntoProperty('map', map);
      this.geoLocationService.startLocationObserver();
      //map.geoLocationService.startOrientationObserver();
    });

    map.on('style.load', (event) => {

      const defaultLightPreset = 'dusk';

      //let activeButton = document.getElementById(queryLightPreset || defaultLightPreset);
      //activeButton.classList.add('selected');
      map.setConfigProperty('basemap', 'lightPreset', defaultLightPreset);

      map.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
      map.setConfigProperty('basemap', 'showTransitLabels', true);
      map.setConfigProperty('basemap', 'showRoadLabels', true);
      map.setConfigProperty('basemap', 'showPlaceLabels', true);

      this.initUserMarkerDefs();

    });
  }




  getMap(): mapboxgl.Map {
    return this.mapbox;
  }

  setLightPreset(id: string) {
    //const map = this.windowService.getValueFromProperty('map');
    this.mapbox.setConfigProperty('basemap', 'lightPreset', id);
    //map.updateQueryParam('lightPreset', id);
    // Consider adding CSS selection logic here, if applicable
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

  updateUserFeatureRotation(newRotation: number) {
    if (this.userLocationMarkerPrerequisitesOk) {
      const source = this.mapbox.getSource('userMarkerSource') as mapboxgl.GeoJSONSource;
      if (source) {
        const data: mapboxgl.MapboxGeoJSONFeature[] = this.mapbox.querySourceFeatures('userMarkerSource');
        if (data.length > 0) {
          // Actualiza la propiedad 'bearing' con el nuevo valor de rotación
          let feature: mapboxgl.MapboxGeoJSONFeature = data[0];
          if (feature.properties) {
            feature.properties['bearing'] = newRotation;
            data[0] = feature;
          }

          // Aplica los datos actualizados a la fuente
          source.setData(turf.featureCollection(data));
        }
      }
    }
  }

  getFeaturesFromSource(sourceId: string): mapboxgl.MapboxGeoJSONFeature[] | null {
    const map = this.mapbox;
    if (!map.getSource(sourceId)) {
      return null;
    }
    const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
    if (source) {
      const data: mapboxgl.MapboxGeoJSONFeature[] = map.querySourceFeatures(sourceId);
      return data;
    }
    return null; // Add a return statement to handle the case when the source is not found
  }



  getUserFeatureMarkerPosition(): Position | null {
    const data: mapboxgl.MapboxGeoJSONFeature[] = this.mapbox.querySourceFeatures('userMarkerSource'); // Using _data directly for example purposes
    if (!data.length) return null;

    // Extract starting coordinates and bearing from the first feature
    if (data[0].geometry.type != 'Point') return null;

    var dataPoint = data[0].geometry as Point;
    const coords = dataPoint.coordinates;
    return coords;
  }


  public moveUserFeatureSymbolSmoothly(newLocation: LngLatLike): void {
    // Si ya hay una animación en curso, ajustar o cancelar según sea necesario
    if (this.isAnimating) {
      // Aquí podrías ajustar la lógica según necesites, por ejemplo, cancelando la animación actual
      // o ajustando el destino de la animación en curso. Para este ejemplo, simplemente retornaremos.
      return;
    }

    const source = this.mapbox.getSource('userMarkerSource') as mapboxgl.GeoJSONSource;
    if (!source) return;

    const data: mapboxgl.MapboxGeoJSONFeature[] = this.mapbox.querySourceFeatures('userMarkerSource');
    if (!data.length || data[0].geometry.type !== 'Point') return;

    const startCoords = (data[0].geometry as Point).coordinates;
    const degrees = data[0].properties?.['bearing'] || 0;
    const endCoords = mapboxgl.LngLat.convert(newLocation);

    let startTime: number | undefined;

    this.isAnimating = true; // Marcamos que la animación ha comenzado

    const animate = (timestamp: number): void => {
      if (!startTime) startTime = timestamp;

      const elapsedTime = timestamp - startTime;
      const progress = Math.min(elapsedTime / 1500, 1);

      const currentCoords: [number, number] = [
        startCoords[0] + (endCoords.lng - startCoords[0]) * progress,
        startCoords[1] + (endCoords.lat - startCoords[1]) * progress,
      ];

      source.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: currentCoords,
          },
          properties: {
            id: 'userLocationFeature',
            bearing: degrees,
            desc: 'User location',
          },
        }],
      });

      this.mapbox.easeTo({
        center: currentCoords,
        duration: 100,
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimating = false; // La animación ha terminado
      }
    };

    requestAnimationFrame(animate);
  }

  updateUserLocationFeatureSymbol(newLocation: [number, number]) {
    this.mapControls.directions.setOrigin(newLocation);
    if (this.userLocationMarkerPrerequisitesOk) {
      const source = this.mapbox.getSource('userMarkerSource');
      if (!source || source.type != 'geojson') return;
      // Verifica si la fuente ya tiene datos definidos
      const data: mapboxgl.MapboxGeoJSONFeature[] = this.mapbox.querySourceFeatures('userMarkerSource');
      let bearing: number = 0;
      if (data && data.length > 0 && data[0].properties) {
        bearing = data[0].properties['bearing'];
      }
      const UserPositionGeoJson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: newLocation // Nueva ubicación del usuario
          },
          properties: {
            id: "userLocationFeature",
            bearing: data[0],
            desc: "User location"
          }
        }]
      };
      (source as GeoJSONSource).setData(UserPositionGeoJson);
      this.mapbox.flyTo({}, newLocation);
    }


  }


  initUserMarkerDefs(): void {
    this.mapbox.loadImage(
      '/assets/ironPuk.png',
      (error, image) => {
        if (error) throw error;

        if (image) {
          this.mapbox.addImage('custom-user-marker', image);

          //Creo map source
          this.mapbox.addSource('userMarkerSource', {
            'type': 'geojson',
            'data': {
              type: 'FeatureCollection',
              features: []
            }
          });
        }

        //Añado layer con el icono a la source creada
        this.mapbox.addLayer({
          'id': 'userMarkerLayer',
          'type': 'symbol',
          'source': 'userMarkerSource',
          //'slot': 'top',
          'layout': {
            'icon-image': 'custom-user-marker',
            'icon-size': 1,
            'icon-rotate': ['get', 'bearing']
          }
        });

        this.userLocationMarkerPrerequisitesOk = true;
      });
  }


  setMaxspeedDataSourceAndLayer(features: turf.Feature<Point, turf.Properties>[]) {
    // Step 3: Add the data as a source to the Mapbox map
    //console.log(features);
    if (!this.mapbox.getSource('maxspeedDataSource')) {
      this.mapbox.addSource('maxspeedDataSource', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });

      this.mapbox.addLayer({
        id: 'maxspeedDataLayer',
        type: 'line',
        source: 'maxspeedDataSource',
        layout: {},
        // Remove the 'slot' property from the object literal
        //slot: "top",
        paint: {
          'line-width': 0.5,
          'line-opacity': 1,
          'line-emissive-strength': 6,
          // Use a visual variable for line-color based on 'maxSpeed'
          'line-color': [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'maxSpeed']],
            20, '#fa133e',
            30, '#fa133e',
            45, '#fa133e',
            60, '#faf413',
            75, '#13faf6',
            90, '#13fa13',
            110, '#13fa13',
            120, '#13fa13',
          ]
        }
      }, "userMarkerLayer");
    } else {
      (this.mapbox.getSource('maxspeedDataSource') as GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: features
      });
    }

  }

  setMapStye(id: String): void {
    this.mapbox.setStyle('mapbox://styles/mapbox/' + id);
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

  /**
   * Actualiza la posición de la cámara del mapa para centrarla en las coordenadas especificadas.
   * @param coordinates Coordenadas hacia las cuales la cámara debe moverse.
   */
  updateCameraPosition(coordinates: mapboxgl.LngLatLike): void {
    this.mapbox.flyTo({ center: coordinates });
  }


  followUserPosition(): void {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((position) => {
        const userPosition: mapboxgl.LngLatLike = [position.coords.longitude, position.coords.latitude];
        this.updateCameraPosition(userPosition);

        // Opcional: Agregar un marcador para la posición del usuario
        this.addMarker(userPosition, { color: "#d02922" }); // Puedes personalizar el marcador
      }, (error) => {
        console.error('Error al obtener la posición del usuario', error);
      }, {
        enableHighAccuracy: true
      });
    } else {
      console.error('Geolocalización no soportada por este navegador.');
    }
  }

  // Remove the duplicate addRoute function

  routes: string = 'route'; // Add the 'routes' property

  updateRoute(newRouteGeoJSON: any): void {
    const source = this.mapbox.getSource(this.routes) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(newRouteGeoJSON);
    }
  }

  clearRoutes(): void {
    if (this.mapbox.getLayer(this.routeLayerId)) {
      this.mapbox.removeLayer(this.routeLayerId);
    }
    if (this.mapbox.getSource(this.routeSourceId)) {
      this.mapbox.removeSource(this.routeSourceId);
    }
  }

  cancelTrip(): void {
    this.destination = "";
    this.isTripStarted = false;
    this.mapControls.directions.removeRoutes();
    /*this.mapControls.directions.removeWaypoints();*/
    this.mapControls.directions.actions.clearDestination();
    //this.mapControls.directions.actions.clearOrigin();
    (document.getElementById("tripControls") as HTMLDivElement).style.display = "none";
    (document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLDivElement).style.display = "none";
  }

  async startTrip(): Promise<void> {
    this.voiceService.speak("Iniciando viaje a " + this.destination);
    if (!this.isTripStarted) {
      this.isTripStarted = true;
      // Get user's current location
      const userLocation = await this.geoLocationService.getCurrentPosition();
      if (userLocation) {
        // Get route information
        const route = this.mapControls.directons.getRoute();
        if (route && route.routes && route.routes.length > 0) {
          const steps = route.routes[0].legs[0].steps;
          // Set initial step index to 0
          let currentStepIndex = 0;
          // Speak the instruction associated with the first step
          this.voiceService.speak(steps[currentStepIndex].maneuver.instruction);

          // Start watching user's location to track completion of steps
          this.geoLocationService.watchPosition(position => {
            const currentStep = steps[currentStepIndex];
            // Check if user has reached the current step
            if (position && position.coords) {
              if (this.hasReachedStep(position, currentStep)) {
                // Increment step index to get the next step
                currentStepIndex++;
                // Check if there are more steps
                if (currentStepIndex < steps.length) {
                  // Get the next step
                  const nextStep = steps[currentStepIndex];
                  // Speak the instruction associated with the next step
                  this.voiceService.speak(nextStep.maneuver.instruction);
                } else {
                  // All steps have been completed
                  this.voiceService.speak('Llegaste a tu destino.');
                  this.isTripStarted = false;
                  // Stop watching user's location
                  //this.geoLocationService.clearWatch(watchId);
                }
              }
            }
          });


          // Set the map camera behind the user's position and follow the user
          this.mapbox.flyTo({
            center: [userLocation.coords.longitude, userLocation.coords.latitude],
            zoom: 20,
            pitch: 85,
            bearing: steps[currentStepIndex].maneuver.bearing
          });
        }
      }
    }
  }

  // Method to check if the user has reached a step
  hasReachedStep(userCoords: GeolocationPosition, step: any): boolean {
    const stepCoords = step.geometry.coordinates;
    const userLngLat = new mapboxgl.LngLat(userCoords.coords.longitude, userCoords.coords.latitude);
    const stepLngLat = new mapboxgl.LngLat(stepCoords[0], stepCoords[1]);
    const distance = userLngLat.distanceTo(stepLngLat); // Distance in meters
    // You can adjust this threshold distance as needed
    return distance < 10; // Assuming the user has reached the step if they are within 10 meters
  }
  async setDestination(destination: any) {
    this.destination = destination.place_name;
    (document.getElementById("tripControls") as HTMLDivElement).style.display = "block";
    if (!this.mapControls.directions.getOrigin()) {
      this.geoLocationService.getCurrentPosition().then((position) => {
        if (position) {
          this.mapControls.directions.setOrigin([position.coords.longitude, position.coords.latitude]);
          this.mapControls.directions.setDestination(destination.geometry.coordinates);
          (document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLDivElement).style.display = "block";

        }
      });
    } else {
      this.mapControls.directions.setDestination(destination.geometry.coordinates);
      (document.getElementsByClassName("mapboxgl-ctrl-directions")[0] as HTMLDivElement).style.display = "block";
    }
  };

  /*setMaxspeedDataSourceAndLayer(features: turf.Feature<Point, turf.Properties>) {
    // Step 3: Add the data as a source to the Mapbox map
    this.mapbox.addSource('maxspeedDataSource', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: features
      }
    });

    // Step 4: Add a layer to visualize the data
    this.mapbox.addLayer({
      id: 'maxspeedDataLayer',
      type: 'line',
      source: 'maxspeedDataSource',
      layout: {},
      slot: "top",
      paint: {
        'line-width': 0.5,
        'line-opacity': 1,
        'line-emissive-strength': 6,
        // Use a visual variable for line-color based on 'maxSpeed'
        'line-color': [
          'interpolate',
          ['linear'],
          ['to-number', ['get', 'maxSpeed']],
          20, '#fa133e',
          30, '#fa133e',
          45, '#fa133e',
          60, '#faf413',
          75, '#13faf6',
          90, '#13fa13',
          110, '#13fa13',
          120, '#13fa13',
        ]
      }
    });*/

  setCameraPOVPosition(position: GeolocationPosition) {
    this.mapbox.flyTo({
      center: [position.coords.longitude,
      position.coords.latitude],
      zoom: 20,
      speed: 1,
      //curve: 1,
      easing(t: number) {
        return t;
      },
      essential: true,
      pitch: 80,
      bearing: 65
    });
  }

  setCameraSKYPosition(position: GeolocationPosition) {
    this.mapbox.flyTo({
      center: [position.coords.longitude,
      position.coords.latitude],
      zoom: 15,
      speed: 1,
      //curve: 1,
      easing(t: number) {
        return t;
      },
      essential: true,
      pitch: 0,
      bearing: 0
    });
  }
  //userStreet(longitude: number, latitude: number) {
  userStreet(position: GeolocationPosition) {
    let longitude = position.coords.longitude;
    let latitude = position.coords.latitude;
    // Convert the user's coordinates to a point
    const coordinates = [longitude, latitude];
    const userPoint = turf.point(coordinates);
    const bbox = ((window as any).geoLocationService as GeoLocationService).createUserBoundingBox(position);
    //console.log("coordinatesbbox:", bbox);
    // Query the rendered line features at the user's location
    if (((window as any).speedService as SpeedService).dataLoaded) {
      //const features = ((window as any).mapService as MapService).mapbox.queryRenderedFeatures([[bbox[0][0], bbox[0][1]], [bbox[1][0], bbox[1][1]]]);
      const features = ((window as any).mapService as MapService).mapbox.queryRenderedFeatures();

      //console.log("Rendered", features);
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
            //console.log("line:", line);
            //console.log("Distance:", distance);
            //console.log("Distance2:", distancePoints);
            if (distancePoints < minDistance) {
              minDistance = distancePoints;
              closestFeature = feature;
              //console.log("Closest:", closestFeature);
            }
          }
        });

        ((window as any).mapService as MapService).userCurrentStreet = closestFeature;
        //console.log("street:", ((window as any).mapService as MapService).userCurrentStreet);
      }
    }

  }
}
