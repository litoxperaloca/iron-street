import { Injectable } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import distance from '@turf/distance';
import { Feature, LineString, lineString, point } from '@turf/helpers';
import nearestPointOnLine, { NearestPointOnLine } from '@turf/nearest-point-on-line';
import { MapboxGeoJSONFeature } from 'mapbox-gl';
import { GeoLocationService } from './geo-location.service';
import { MapService } from './map.service';
import { OsmService } from './osm.service';
import { SensorService } from './sensor.service';
//import distance from '@turf/distance';
interface Way {
  id: number,
  geometry: [{ lat: number, lon: number }],
  tags: {
    '@id': string,
    maxspeed: number,
    name: string,
    highway: string,
    'source:maxspeed': string
  },
  type: 'way',
  bounds: {
    minlat: number,
    minlon: number,
    maxlat: number,
    maxlon: number
  },
  nodes: Array<number>
}

@Injectable({
  providedIn: 'root',
})
export class SpeedService {
  lastPosition!: Position;
  lastCurrentMaxSpeed!: number;
  lastCurrentSpeed!: number;
  lastCurrentMaxSpeedOsmObj!: any;
  dataLoaded: boolean = false;
  data: any = [];
  lastCurrentStreet!: MapboxGeoJSONFeature | null;

  constructor(
    private mapService: MapService,
    private geoLocationService: GeoLocationService,
    private sensorService: SensorService,
    private osmService: OsmService
  ) { }


  async getSpeedDataFromArround(pos: [number, number]): Promise<any> {
    const bbox = this.calculateBbox(pos[1], pos[0], 0.5);
    let closestFeature: any;
    await this.osmService.getMaxSpeedData(bbox).then((data) => {
      const maxspeedData = data.data.elements;
      closestFeature = this.findClosestOsmWayFeature(maxspeedData, pos);
      /* await this.saveMaxSpeedData(maxspeed);
       this.dataLoaded = true;
       const dataSaved = this.loadStoredMaxSpeedData();*/
    });
    return closestFeature;
  }

  convertSpeedToKmh(speed: number): number {
    return speed * 3.6; // Convert speed from meters per second to kilometers per hour
  }

  calculateBbox(latitude: number, longitude: number, radius: number): [[number, number], [number, number]] {
    const earthRadius = 6371; // Earth's radius in kilometers
    const latOffset = (radius / earthRadius) * (180 / Math.PI);
    const lonOffset = (radius / (earthRadius * Math.cos(Math.PI * latitude / 180))) * (180 / Math.PI);
    return [
      [longitude - lonOffset, latitude - latOffset],
      [longitude + lonOffset, latitude + latOffset],
    ];
  }

  async locationUpdate() {
    const geoLocationService: GeoLocationService = (window as any).geoLocationService as GeoLocationService;
    const userPosition: Position = geoLocationService.getLastCurrentLocation(); // Get user's current location
    if (userPosition === this.lastPosition) {
      return;
    }
    this.lastPosition = userPosition;
    this.updateUserStreet(userPosition);
    const userCurrentStreet = await this.updateUserStreet(userPosition);
    if (userCurrentStreet && userCurrentStreet.properties) {
      (window as any).homePage.currentMaxSpeed = Number.parseInt(userCurrentStreet.properties["maxspeed"]);
    }
  }

  async updateUserStreet(position: Position): Promise<MapboxGeoJSONFeature | undefined> {
    const mapService = ((window as any).mapService as MapService)
    const map = mapService.getMap();

    if (!position || !map.getLayer("maxspeedDataLayer")) {
      mapService.setUserCurrentStreet(null);
      return;
    }

    const userPoint = point([position.coords.longitude, position.coords.latitude]);
    const features = map.querySourceFeatures('maxspeedDataSource', { sourceLayer: 'export_1-12rpm8' });

    if (features.length > 0) {
      const closestFeature = await this.findClosestFeature(features, userPoint);
      mapService.setUserCurrentStreet(closestFeature);
      this.updateSnapToRoadPosition(closestFeature, userPoint);
      if (closestFeature) return closestFeature;
    }
    return;
  }

  findClosestOsmWayFeature(ways: any[], pointed: [number, number]): any {
    let closestFeature: any | null = null;
    let minDistance = Number.MAX_VALUE;

    ways.forEach(way => {
      if (way.type != "way") return;
      const line = lineString(this.convertCoordsToPosition(way.geometry));
      const nearestPoint = nearestPointOnLine(line, point(pointed));
      const distanced = distance(point(pointed), nearestPoint, { units: 'kilometers' });

      if (distanced < minDistance) {
        minDistance = distanced;
        closestFeature = way;
      }
    });
    console.log(closestFeature);
    return closestFeature;
  }

  convertCoordsToPosition(coords: [any]): [[number, number]] {
    let pos: any[] = [];
    coords.forEach(coord => {
      pos.push([coord.lon, coord.lat]);
    });
    return pos as [[number, number]];
  }
  private async findClosestFeature(features: MapboxGeoJSONFeature[], userPoint: any): Promise<MapboxGeoJSONFeature | null> {
    let closestFeature: MapboxGeoJSONFeature | null = null;
    let minDistance = Number.MAX_VALUE;

    features.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
        const line = lineString(feature.geometry.coordinates);
        const pointInLine = nearestPointOnLine(line, userPoint);
        const distancePoints = distance(pointInLine, userPoint, { units: 'kilometers' });

        if (distancePoints < minDistance && distancePoints < 0.05) {
          minDistance = distancePoints;
          closestFeature = feature;
        }
      }
    });
    if (closestFeature == null) {
      closestFeature = await this.getSpeedDataFromArround(userPoint.geometry.coordinates);
      if (closestFeature) {
        closestFeature = this.wayToGeoJsonFeature(closestFeature) as MapboxGeoJSONFeature;
      }
    }
    return closestFeature;
  }

  private updateSnapToRoadPosition(closestFeature: MapboxGeoJSONFeature | null, userPoint: any): void {
    const sensorService = ((window as any).sensorService as SensorService);
    if (closestFeature && closestFeature.geometry.type === 'LineString') {
      const nearestPoint: NearestPointOnLine = nearestPointOnLine(lineString(closestFeature.geometry.coordinates), userPoint);
      sensorService.updateSnapToRoadPosition(nearestPoint.geometry.coordinates, closestFeature, nearestPoint);
    }
  }

  wayToGeoJsonFeature(way: any): Feature<LineString> {
    const coordinates = (way as Way).geometry.map(point => [point.lon, point.lat]);

    let geoJsonFeature: Feature<LineString> = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates,
      },
      properties: way.tags,
      id: way.id,
    };
    if (geoJsonFeature.properties) geoJsonFeature.properties["@id"] = way.id;
    return geoJsonFeature;
  }
}
