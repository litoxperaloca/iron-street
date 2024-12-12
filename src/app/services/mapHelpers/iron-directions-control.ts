import { Injectable, EventEmitter } from '@angular/core';
import { Feature, LineString, FeatureCollection } from 'geojson';
import * as turf from '@turf/turf';
import polyline from '@mapbox/polyline';
import { ValhallaDirectionsApiService } from '../valhalla-directions-api.service';
import { MapService } from '../map.service';
import mapboxgl, { LngLatLike } from 'mapbox-gl';

@Injectable({
  providedIn: 'root'
})
export class IronDirectionsControl {

  // State to replicate the _stateSnapshot property from Mapbox Directions
  private stateSnapshot: any;
  private mapService: MapService;
  private valhallaService: ValhallaDirectionsApiService;

  // Event emitters to replace Mapbox Directions' event listeners
  private routeEmitter = new EventEmitter<any>();

  constructor(valhallaService: ValhallaDirectionsApiService, mapService: MapService) {
    this.valhallaService = valhallaService;
    this.mapService = mapService;

    // Initialize the _stateSnapshot to mimic the Mapbox Directions state
    this.stateSnapshot = {
      profile: 'mapbox/driving-traffic',
      language: 'es-ES',
      origin: null,
      destination: null,
      waypoints: [],
      routeIndex: 0,
      directions: [],
      interactive: false,
      unit: "metric",
      alternatives: true,
      annotations: "maxspeed, distance, duration, congestion, closure",
      banner_instructions: true,
      geometries: "polyline",
      overview: "full",
      steps: true,
      continue_straight: true,
      roundabout_exits: true,
      waypoints_per_route: true,
      coordinates: [-56.147969, -34.88154],
      waypoint_names: "a,b,c",
      voice_instructions: true,
      voice_units: "metric",
      engine: "electric_no_recharge",
      notifications: "all",
      placeholderDestination: "Destino",
      placeholderOrigin: "Origen",
      instructions: {
        showWaypointInstructions: true,
      },
      controls: {
        instructions: true,
        inputs: true,
        profileSwitcher: false
      },
      zoom: 15,
      routePadding: 150,
      congestion: true,
      flyTo: true,
      geocoder: undefined
    };
  }

  /**
   * Set the origin for the directions service.
   */
  setOriginFromCoordinates(coordinates: [number, number]): void {
    this.stateSnapshot.origin = this.createFeature(coordinates, 'origin');
    this.updateRoute();
  }

  /**
   * Set the destination for the directions service.
   */
  setDestinationFromCoordinates(coordinates: [number, number]): void {
    this.stateSnapshot.destination = this.createFeature(coordinates, 'destination');
    this.updateRoute();
  }

  /**
   * Add a waypoint to the route.
   */
  addWaypoint(index: number, waypoint: [number, number]): void {
    this.stateSnapshot.waypoints.splice(index, 0, this.createFeature(waypoint, `waypoint${index}`));
    this.updateRoute();
  }

  /**
   * Set the route index (useful for selecting an alternative route).
   */
  setRouteIndex(index: number): void {
    if (index >= 0 && index < this.stateSnapshot.directions.length) {
      this.stateSnapshot.routeIndex = index;
      //this.mapService.selectRoute(index);
    }
  }

  /**
   * Wrapper to query the route using Valhalla service.
   */
  private async updateRoute(): Promise<void> {
    const { origin, destination, waypoints } = this.stateSnapshot;
    if (!origin || !destination) return;

    const allCoordinates = [
      origin.geometry.coordinates,
      ...waypoints.map((wp: any) => wp.geometry.coordinates),
      destination.geometry.coordinates
    ];

    try {
      const response = await this.valhallaService.getRouteForWaypoints(allCoordinates);
      if (response) {
        // Update the state snapshot with Valhalla response
        this.stateSnapshot.directions = response.routes;
        this.stateSnapshot.routeIndex = 0;

        // Emit the new route to listeners
        this.routeEmitter.emit(this.stateSnapshot.directions);
        
        // Display the main route on the map
        //this.mapService.displayRoute(response.routes[0]);
      }
    } catch (error) {
      console.error('Error updating route:', error);
    }
  }

  /**
   * Helper function to create a GeoJSON feature for a point.
   */
  private createFeature(coordinates: [number, number], id: string): Feature {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates
      },
      properties: {
        id
      }
    };
  }

  /**
   * Set profile for the routing service (e.g., driving, walking, cycling).
   */
  setProfile(profile: string): void {
    this.stateSnapshot.profile = profile;
    this.updateRoute();
  }

  /**
   * Subscribe to the route event.
   */
  subscribeToRoute(callback: (route: any) => void): void {
    this.routeEmitter.subscribe(callback);
  }

  /**
   * Clear the current origin.
   */
  clearOrigin(): void {
    this.stateSnapshot.origin = null;
    this.updateRoute();
  }

  /**
   * Clear the current destination.
   */
  clearDestination(): void {
    this.stateSnapshot.destination = null;
    this.updateRoute();
  }

  // Other methods to replicate Mapbox Directions functionalities can be added here
}
