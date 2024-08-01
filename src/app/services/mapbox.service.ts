import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { environment } from '../../environments/environment';
import mapboxgl from 'mapbox-gl';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapboxService {
  private mapboxAccessToken: string = environment.mapboxMapConfig.accessToken;

  constructor() {
    mapboxgl.config.ACCESS_TOKEN = this.mapboxAccessToken;
  }

  // Calcular la distancia entre dos puntos
  calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const from = new mapboxgl.LngLat(coord1[0], coord1[1]);
    const to = new mapboxgl.LngLat(coord2[0], coord2[1]);
    return from.distanceTo(to); // Devuelve la distancia en metros
  }

  // Obtener una nueva ruta desde la ubicación actual
  async getNewRoute(coords: [number, number], waypoints: [number, number][]): Promise<any>{
    const waypointsString = waypoints.map((wp) => `${wp[0]},${wp[1]}`).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords[0]},${coords[1]};${waypointsString}?geometries=geojson&steps=true&access_token=${this.mapboxAccessToken}`;

      const data = await CapacitorHttp.get({ url }).then((response:any) => response.data.routes[0])
    return data;
  }

  // Convertir coordenadas a GeoJSON
  convertToGeoJSON(coords: [number, number]): GeoJSON.Feature<GeoJSON.Point> {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coords,
      },
      properties: {},
    };
  }

  // Convertir una lista de pasos en una línea GeoJSON
  convertStepsToGeoJSON(steps: any[]): GeoJSON.Feature<GeoJSON.LineString> {
    const coordinates = steps.map((step) => step.maneuver.location);
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates,
      },
      properties: {},
    };
  }
}
