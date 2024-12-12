import { Injectable, EventEmitter } from '@angular/core';
import { ValhallaDirectionsApiService } from '../valhalla-directions-api.service';
import { MapService } from '../map.service';
import { GeoLocationAnimatedService } from '../geo-location-animated.service';
import { Feature, FeatureCollection, LineString } from 'geojson';
import * as turf from '@turf/turf';
import polyline from '@mapbox/polyline';
import mapboxgl from 'mapbox-gl';
import { Place, Route } from 'src/app/models/route.interface';

@Injectable({
  providedIn: 'root'
})
export class IronMapboxGlDirectionsService {
  origin: [number, number] | null = null;
  isBusy: boolean = false;
  routeUpdated: EventEmitter<Route> = new EventEmitter<Route>();
  selectedRouteIndex: number = 0;

  constructor(
    private valhallaService: ValhallaDirectionsApiService,
    private geoLocationAnimatedService: GeoLocationAnimatedService,
    private mapService: MapService
  ) {}

  async getValhallaTraceRoutes(waypoints: number[][], isReRoutingNow: boolean = false): Promise<void> {
    if (this.isBusy) return;
    this.isBusy = true;

    try {
      const traceRouteValhallaResponse = await this.valhallaService.getRouteForWaypoints(waypoints);
      this.isBusy = false;
      if (traceRouteValhallaResponse) {
        await this.loadRouteAndLegsFromResponse(traceRouteValhallaResponse, 0);
      }
    } catch (error) {
      this.isBusy = false;
      console.error('Error getting Valhalla route:', error);
    }
  }

  async loadRouteAndLegsFromResponse(routes: Route[], selectedRouteIndex: number): Promise<void> {
    this.selectedRouteIndex = selectedRouteIndex;
    const selectedRoute = routes[selectedRouteIndex];
    const alternativeRoutes = routes.filter((_, index) => index !== selectedRouteIndex);
    
    this.mapService.actualRoute = selectedRoute;
    this.mapService.currentStep = 0;
    this.mapService.cleanRoutePopups();

    // Main Route
    const coordinatesMain = polyline.decode(selectedRoute.geometry).map(coord => [coord[1], coord[0]]);
    this.mapService.coordinatesMainRoute = coordinatesMain;
    this.updateRouteLayer('directions-route-line', this.mapService.coordinatesMainRoute, '#09a2e7', 12);

    // Alternative Routes
    const alternateLineStrings: Feature<LineString>[] = [];
    alternativeRoutes.forEach((route, index) => {
      const altCoordinates = polyline.decode(route.geometry).map(coord => [coord[1], coord[0]]);
      const altLineString: Feature<LineString> = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: altCoordinates
        },
        properties: { index: index, type: 'alternative' }
      };
      alternateLineStrings.push(altLineString);
    });

    const alternateSourceData: FeatureCollection<LineString> = {
      type: 'FeatureCollection',
      features: alternateLineStrings
    };
    this.updateAlternateRouteLayer('directions-route-line-alt', alternateSourceData, '#ffc107', 8, 'dashed');

    // Show Popups for Routes
    this.showRoutePopups(selectedRoute, alternativeRoutes);

    // Fit bounds and show destination popup
    this.showDestinationPopup(this.mapService.destinationPlace?.geometry?.point as [number, number]);

    // Emit the updated route to any listeners
    this.routeUpdated.emit(selectedRoute);
  }

  /**
   * Update the specified route line layer on the map.
   * @param layerId ID of the map layer to update
   * @param coordinates Route coordinates as a LineString
   * @param color Color of the line
   * @param width Width of the line
   */
  private updateRouteLayer(layerId: string, coordinates: number[][], color: string, width: number) {
    const geojsonLine: Feature<LineString> = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      },
      properties:{}
    };

    const source = this.mapService.getMap().getSource(layerId) as mapboxgl.GeoJSONSource;
    source.setData(geojsonLine);
    this.mapService.getMap().setPaintProperty(layerId, 'line-color', color);
    this.mapService.getMap().setPaintProperty(layerId, 'line-width', width);
  }

  /**
   * Updates the specified alternate route line layer on the map.
   * @param layerId ID of the map layer to update
   * @param featureCollection GeoJSON FeatureCollection containing the alternative routes
   * @param color Color of the line
   * @param width Width of the line
   * @param lineStyle Style of the line (solid, dashed)
   */
  private updateAlternateRouteLayer(layerId: string, featureCollection: FeatureCollection<LineString>, color: string, width: number, lineStyle: 'solid' | 'dashed' | 'dotted') {
    const source = this.mapService.getMap().getSource(layerId) as mapboxgl.GeoJSONSource;
    source.setData(featureCollection);

    this.mapService.getMap().setPaintProperty(layerId, 'line-color', color);
    this.mapService.getMap().setPaintProperty(layerId, 'line-width', width);
    this.mapService.getMap().setPaintProperty(layerId, 'line-dasharray', lineStyle === 'dashed' ? [2, 2] : lineStyle === 'dotted' ? [1, 2] : [1]);
  }

  /**
   * Show a popup at the destination point.
   * @param coordinates Coordinates of the destination
   */
  private showDestinationPopup(coordinates: [number, number]) {
    const popup = this.createDestinationPopup(coordinates);
    popup.addTo(this.mapService.getMap());
    this.mapService.popUpDestination = popup;
  }

  /**
   * Creates a Mapbox GL popup for the destination point.
   * @param coordinates Coordinates of the destination point
   * @returns Popup instance
   */
  private createDestinationPopup(coordinates: [number, number]): mapboxgl.Popup {
    let html = '<h6>Destino</h6>';
    if (this.mapService.destinationPlace?.label) {
      html += `<p>${this.mapService.destinationPlace.label}</p>`;
    }

    const popup = new mapboxgl.Popup({
      closeOnClick: true
    }).setLngLat(coordinates)
      .setHTML(html);

    popup.addClassName('destinationPopUp');
    return popup;
  }

  /**
   * Shows popups for each route (main and alternatives).
   * @param mainRoute Main route to show popup for
   * @param alternativeRoutes List of alternative routes to show popups for
   */
  private showRoutePopups(mainRoute: Route, alternativeRoutes: Route[]): void {
    const mainPopup = this.createRoutePopup(mainRoute, 'route-popup-main', 'left');
    mainPopup.addTo(this.mapService.getMap());
    this.mapService.popUpMainRoute = mainPopup;

    alternativeRoutes.forEach((route, index) => {
      const altPopup = this.createRoutePopup(route, `route-popup-alt-${index}`, 'right');
      altPopup.addTo(this.mapService.getMap());
      this.mapService.popUpAltRoute = altPopup;
    });
  }

  /**
   * Creates a Mapbox GL popup with route information.
   * @param route Route to display in the popup
   * @param className Class name for the popup
   * @param anchor Anchor position for the popup
   * @returns Popup instance
   */
  private createRoutePopup(route: Route, className: string, anchor: 'left' | 'right'): mapboxgl.Popup {
    const distanceInKm = (route.distance / 1000).toFixed(2);
    const durationInMinutes = (route.duration / 60).toFixed(1);
    const coordinates = polyline.decode(route.geometry).map(coord => [coord[1], coord[0]]);

    const midPointIndex = Math.floor(coordinates.length / 2);
    const midPoint = coordinates[midPointIndex] as [number, number];

    const html = `<div><p>Distancia: ${distanceInKm} km</p><p>Duración: ${durationInMinutes} min</p></div>`;
    const popup = new mapboxgl.Popup({
      closeOnClick: false,
      anchor: anchor as mapboxgl.Anchor,
      offset: 10
    }).setLngLat(midPoint)
      .setHTML(html);
    popup.addClassName(className);

    return popup;
  }
}
