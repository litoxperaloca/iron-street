import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import * as turf from '@turf/turf';
import { Point } from 'geojson';
import { environment } from 'src/environments/environment';
import { AlertService } from '../services/alert.service';
import { MapService } from '../services/map.service';
import { SpeedService } from '../services/speed.service';

@Injectable({
  providedIn: 'root',
})
export class GeoLocationMockService {

  private navigationInterval: any;
  private coordinates = [
    [-56.16597, -34.884953],
    [-56.165984, -34.884819],
    [-56.166047, -34.884154],
    [-56.166068, -34.883905],
    [-56.166155, -34.883771],
    [-56.16618, -34.883527],
    [-56.166197, -34.883481],
    [-56.166229, -34.883455],
    [-56.166278, -34.883434],
    [-56.166366, -34.883489],
    [-56.167014, -34.883937],
    [-56.167167, -34.88403],
    [-56.167268, -34.88407],
    [-56.167355, -34.884089],
    [-56.167549, -34.884101],
    [-56.168609, -34.884171],
    [-56.169879, -34.884251],
    [-56.169985, -34.884257],
    [-56.171298, -34.884334],
    [-56.171647, -34.884381],
    [-56.172536, -34.884568],
    [-56.173528, -34.884823],
    [-56.174, -34.884979],
    [-56.174751, -34.885237],
    [-56.175171, -34.885438],
    [-56.176174, -34.885972],
    [-56.177221, -34.886518],
    [-56.178238, -34.887089],
    [-56.178292, -34.887113],
    [-56.178338, -34.887128],
    [-56.179358, -34.887238],
    [-56.180498, -34.88735],
    [-56.180625, -34.887363],
    [-56.181151, -34.888283],
    [-56.181235, -34.888432],
    [-56.181642, -34.889208],
    [-56.181652, -34.889284],
    [-56.181605, -34.889419],
    [-56.181573, -34.889494],
    [-56.182858, -34.889869],
    [-56.183926, -34.890182],
    [-56.184917, -34.890474],
    [-56.18499, -34.890486],
    [-56.1856, -34.890528],
    [-56.185879, -34.890523],
    [-56.186017, -34.890522],
    [-56.186075, -34.890524],
    [-56.186503, -34.890379],
    [-56.186738, -34.890302],
    [-56.187151, -34.890164],
    [-56.187362, -34.890115],
    [-56.187488, -34.890094],
    [-56.187675, -34.890082],
    [-56.187782, -34.890082],
    [-56.187778, -34.890115],
    [-56.187765, -34.890207],
    [-56.187872, -34.890427],
    [-56.187863, -34.890484],
    [-56.187893, -34.890548],
    [-56.188058, -34.890893],
    [-56.188249, -34.891276],
    [-56.188417, -34.891622],
    [-56.188433, -34.891665],
    [-56.188442, -34.891715],
    [-56.188438, -34.891759],
    [-56.188418, -34.891828],
    [-56.188381, -34.891889],
    [-56.188367, -34.891907],
    [-56.188309, -34.89195],
    [-56.188146, -34.892101],
    [-56.188074, -34.89218],
    [-56.188, -34.892204],
    [-56.187994, -34.892277],
    [-56.187994, -34.892374],
    [-56.188016, -34.892661],
    [-56.188024, -34.892759],
    [-56.188046, -34.892871],
    [-56.188073, -34.892954],
    [-56.188274, -34.893359],
    [-56.188312, -34.893433],
    [-56.188535, -34.893885],
    [-56.188672, -34.894163],
    [-56.188712, -34.894245],
    [-56.189105, -34.895036],
    [-56.189444, -34.895723],
    [-56.190032, -34.896911],
    [-56.190299, -34.89747],
    [-56.190413, -34.8977],
    [-56.190669, -34.89821],
    [-56.190852, -34.898549],
    [-56.190966, -34.898757],
    [-56.191052, -34.898909],
    [-56.191131, -34.899023],
    [-56.191286, -34.899192],
    [-56.191402, -34.899311],
    [-56.192066, -34.899353],
    [-56.192502, -34.899383],
    [-56.193164, -34.899429],
    [-56.193242, -34.899433],
    [-56.194301, -34.899523],
    [-56.195053, -34.899593],
    [-56.195425, -34.899619],
    [-56.195605, -34.899627],
    [-56.195672, -34.899631],
    [-56.195745, -34.899612],
    [-56.195801, -34.899582],
    [-56.19584, -34.899535],
    [-56.195889, -34.899471],
    [-56.195949, -34.899429],
    [-56.195993, -34.8994],
    [-56.196066, -34.899382],
    [-56.196616, -34.899561],
    [-56.199245, -34.900446],
    [-56.199569, -34.90057],
    [-56.19991, -34.900761],
    [-56.200032, -34.900823],
    [-56.200172, -34.900895],
    [-56.200373, -34.900987],
    [-56.200678, -34.901089],
    [-56.201624, -34.901392],
    [-56.201931, -34.901482],
    [-56.202758, -34.901683],
    [-56.202941, -34.901737],
    [-56.203156, -34.901811],
    [-56.203515, -34.901948],
    [-56.203994, -34.902126],
    [-56.204168, -34.902172],
    [-56.204389, -34.902219],
    [-56.205055, -34.902352],
    [-56.205292, -34.902402],
    [-56.205516, -34.902466],
    [-56.205602, -34.902493],
    [-56.205694, -34.902529],
    [-56.205835, -34.902599],
    [-56.206004, -34.902713],
    [-56.206233, -34.902922],
    [-56.20642, -34.903099],
    [-56.206441, -34.903116]
  ];

  private currentPosition: any = null;
  private lastCurrentLocation: any;
  private lastBboxCalculatedForDataIncome: any = null;
  index = 0;
  private lastTimeStamp: number = 0;

  getLastCurrentLocation(): Position {
    return this.lastCurrentLocation;
  }

  setLastCurrentPosition(position: Position) {
    this.currentPosition = position;
    this.lastCurrentLocation = position;
  }

  setCoordinates(coordinates: number[][]) {
    this.coordinates = coordinates;
  }

  constructor(
    private mapService: MapService,
    private speedService: SpeedService,
    private alertService: AlertService) {
  }

  async getNextPosition() {
    if (this.index >= this.coordinates.length) {
      this.index = 0; // Reset or stop navigation
      const nullPosition: Position = {
        coords: {
          latitude: 0,
          longitude: 0,
          accuracy: 0, // Simulated accuracy
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: 0
        },
        timestamp: 0
      };
      return nullPosition;
    }
    //if (this.index > 0) setTimeout(() => { }, 1000); // Simulate delay between positions
    const currentCoord = this.coordinates[this.index];
    const time = Date.now();
    const position: Position = {
      coords: {
        latitude: currentCoord[1],
        longitude: currentCoord[0],
        accuracy: 5, // Simulated accuracy
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        //speed: this.getMockedSpeed(time)
        speed: 42 / 60 / 60 * 1000 // 42 km/h a m/s
      },
      timestamp: time
    };
    this.index++;
    this.lastTimeStamp = position.timestamp;
    return position;
  }

  getMockedSpeed(timeEnd: number) {
    if (this.index == 0) return 0;
    const pos1 = this.coordinates[this.index - 1];
    const pos2 = this.coordinates[this.index];
    const distance = turf.distance(turf.point(pos1), turf.point(pos2), { units: 'kilometers' });
    const distanceInMeters = distance * 1000;
    const timeBegin = this.lastTimeStamp;
    const timeDiff = timeEnd - timeBegin;
    const timeDiffSeconds = timeDiff / 1000;
    const speed = distanceInMeters / timeDiffSeconds;
    return speed;
  }

  getLastValidCurrentPosition(): Position {
    return this.currentPosition;
  }





  calculateDistanceToNearestBboxEdge(userLocation: Point, bbox: [[number, number], [number, number]]) {
    const [[minLongitude, minLatitude], [maxLongitude, maxLatitude]] = bbox;

    // Create points for bbox corners
    const bottomLeft = turf.point([minLongitude, minLatitude]);
    const bottomRight = turf.point([maxLongitude, minLatitude]);
    const topLeft = turf.point([minLongitude, maxLatitude]);
    const topRight = turf.point([maxLongitude, maxLatitude]);

    // Calculate distances from the userLocation to each bbox corner
    // For simplicity, using corners, but you can also create lines for bbox edges and calculate accordingly
    const distances = [
      turf.distance(userLocation, bottomLeft, { units: 'kilometers' }),
      turf.distance(userLocation, bottomRight, { units: 'kilometers' }),
      turf.distance(userLocation, topLeft, { units: 'kilometers' }),
      turf.distance(userLocation, topRight, { units: 'kilometers' })
    ];

    // Return the minimum distance
    return Math.min(distances[0], distances[1], distances[2], distances[3]);
  }


  createUserBoundingBox(position: Position): [[number, number], [number, number]] {
    //console.log(position)
    let center: { latitude: number, longitude: number } = { latitude: 0, longitude: 0 };
    if (!position) {
      //console.log("No hay posición")
      if (this.getLastCurrentLocation().coords) {
        center = this.getLastCurrentLocation().coords;
      }
    } else if (position.coords) {
      //console.log("Hay posición")
      center = position.coords;
    }
    if (center.latitude !== undefined || center.longitude !== undefined) {
      //console.log("Creando bbox", center)
      this.lastBboxCalculatedForDataIncome = this.createBoundingBox(center, environment.osmApiConfig.radioDistanceForInitialData);
      //console.log("Bbox creado", this.lastBboxCalculatedForDataIncome);
      return this.lastBboxCalculatedForDataIncome;
    } else {
      return [[0, 0], [0, 0]];
    }
  }


  createBoundingBox(center: { latitude: number, longitude: number }, distance: number): [[number, number], [number, number]] {
    const earthRadius = 6371; // radius of the earth in kilometers

    const lat = center.latitude;
    const lng = center.longitude;

    const maxLat = lat + this.rad2deg(distance / earthRadius);
    const minLat = lat - this.rad2deg(distance / earthRadius);

    // Compensate for degrees longitude getting smaller with increasing latitude
    const maxLng = lng + this.rad2deg(distance / earthRadius / Math.cos(this.deg2rad(lat)));
    const minLng = lng - this.rad2deg(distance / earthRadius / Math.cos(this.deg2rad(lat)));

    return [[minLng, minLat], [maxLng, maxLat]];
  }

  rad2deg(angle: number) {
    return angle * 57.29577951308232; // angle / Math.PI * 180
  }

  deg2rad(angle: number) {
    return angle * 0.017453292519943295; // angle * Math.PI / 180
  }


  getCurrentPositionScreenBox(): [[number, number], [number, number]] {
    const userPos: Position = this.getLastCurrentLocation();
    return this.createBoundingBox(userPos.coords, 2);
  }

  // Allow components to listen to the custom event

}
