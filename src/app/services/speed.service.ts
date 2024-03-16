import { Injectable } from '@angular/core';
import { HttpResponse } from '@capacitor/core';
import { Geolocation, GeolocationPosition, Position } from '@capacitor/geolocation';
import { GeoLocationService } from './geo-location.service';
import { MapService } from './map.service';
import { OsmService } from './osm.service';
import { WindowService } from './window.service';


@Injectable({
  providedIn: 'root',
})
export class SpeedService {
  lastPosition!: Position;
  lastCurrentMaxSpeed!: number;
  lastCurrentSpeed!: number;
  lastCurrentMaxSpeedOsmObj!: any;
  dataLoaded: boolean = false;

  constructor(private osmService: OsmService,
    private mapService: MapService,
    private geoLocationService: GeoLocationService,
    private windowService: WindowService) {

  }

  addMaxSpeedDataToMap(osmApiResponse: any) {
    // Step 1: Filter out only 'way' elements
    const wayElements = osmApiResponse.elements.filter((el: any) => el.type === 'way' && el.tags.maxspeed);
    // Step 3: Add the data as a source to the Mapbox map
    let features: any[] = [];
    // Step 2: Extract relevant data and prepare Mapbox layer data
    wayElements.forEach((way: any) => { // Explicitly type 'way' as 'any'
      const coordinates = way.geometry.map((geom: any) => [geom.lon, geom.lat]);
      const maxSpeed = way.tags.maxspeed;

      // Create a GeoJSON Feature for each way
      const feature = {
        type: 'Feature',
        properties: {
          id: way.id,
          maxSpeed: maxSpeed,
          name: way.tags.name
        },
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      };

      features.push(feature);

    });
    //console.log(features);
    ((window as any).mapService as MapService).setMaxspeedDataSourceAndLayer(features);
    ((window as any).speedService as SpeedService).dataLoaded = true;

    //this.findNearestFeatureAndMaxSpeed((window as any).geoLocationService.getLastCurrentLocation().coords, this);
  }


  getMaxSpeedForCurrentLocation() {
    // TODO: Implement getMaxSpeedForCurrentLocation function

  }

  async getNearMaxSpeedData(position: GeolocationPosition) {
    //console.log('Getting near max speed data for position:', position);
    let userCenteredBbox: [[number, number], [number, number]] = ((window as any).geoLocationService as GeoLocationService).createUserBoundingBox(position);
    if (userCenteredBbox[0][0] != 0) {
      //console.log("Buscando datos de velocidad en OSM");
      await ((window as any).osmService as OsmService).getMaxSpeedData(userCenteredBbox).then((response: HttpResponse) => {
        //console.log(response);
        const maxSpeedData: any = response.data;
        //console.log('Max speed data:', maxSpeedData);
        ((window as any).speedService as SpeedService).addMaxSpeedDataToMap(maxSpeedData);

      }, error => { });
    }
  }

  async getCurrentSpeedAsPromise(): Promise<number> {
    try {
      const position: Position = await Geolocation.getCurrentPosition();
      if (position.coords.speed !== null) {
        const speed: number | null = position.coords.speed; // Speed in meters per second
        if (speed !== null) {
          return this.convertSpeedToKmh(speed); // Convert speed to km/h
        } else {
          return this.lastCurrentSpeed;
        }
      } else {
        return this.lastCurrentSpeed;
      }

    } catch (error) {
      console.error('Error getting current speed:', error);
      // Return a default speed or handle the error as needed
      return 0; // Default speed (assuming 0 km/h)
    }
  }

  convertSpeedToKmh(speed: number): number {
    return speed * 3.6; // Convert speed from meters per second to kilometers per hour
  }

  /*async getMaxSpeed(latitude: number, longitude: number): Promise<number> {
    const bbox = this.calculateBbox(latitude, longitude, 50); // Calculate bbox for 50km radius
    try {
      const maxSpeedData = await this.osmService.getMaxSpeedData(bbox).toPromise();
      // Extract and process max speed data to get the maximum speed limit
      const maxSpeed = this.extractMaxSpeed(maxSpeedData);
      return maxSpeed;
    } catch (error) {
      console.error('Error fetching max speed data:', error);
      // Return a default max speed or handle the error as needed
      return 45; // Default max speed (assuming 50 km/h)
    }
  }*/

  calculateBbox(latitude: number, longitude: number, radius: number): number[][] {
    // Calculate bounding box (bbox) for a given radius around the user's location
    const earthRadius = 6371; // Earth's radius in kilometers
    const latOffset = (radius / earthRadius) * (180 / Math.PI);
    const lonOffset = (radius / (earthRadius * Math.cos(Math.PI * latitude / 180))) * (180 / Math.PI);
    const bbox: number[][] = [
      [longitude - lonOffset, latitude - latOffset],
      [longitude + lonOffset, latitude + latOffset],
    ];
    return bbox;
  }

  extractMaxSpeed(maxSpeedData: any): number {
    // Extract and process max speed data to get the maximum speed limit
    // Modify this function according to the format of the data returned by getMaxSpeedData()
    // For example, if maxSpeedData is a JSON object with speed limits, you would parse it and extract the max speed
    // For now, returning a default value of 50 km/h
    return 50;
  }
}
