import { Position } from "@capacitor/geolocation";

export type Longitude = number;
export type Latitude = number;
export type Coordinates = [Longitude, Latitude];
export interface PlaceGeometry {
  point: Coordinates;
}
export interface Place {
  addressNumber?: string;
  country?: string;
  geometry: PlaceGeometry | undefined;
  label?: string;
  municipality?: string;
  neighborhood?: string;
  postalCode?: string;
  region?: string;
  street?: string;
  subRegion?: string;
}

export interface Route {
    weight_typical: number;
    duration_typical: number;
    weight_name: string;
    weight: number;
    duration: number;
    distance: number;
    legs: Leg[];
    geometry:any
  }
  
  export interface Leg {
    via_waypoints: any[];
    admins: Admin[];
    annotation: Annotation;
    weight_typical: number;
    duration_typical: number;
    weight: number;
    duration: number;
    steps: Step[];
  }
  
  export interface Admin {
    iso_3166_1_alpha3: string;
    iso_3166_1: string;
  }
  
  export interface Annotation {
    congestion: string[];
  }
  
  export interface Step {
    intersections: Intersection[];
    maneuver: Maneuver;
    name: string;
    weight_typical: number;
    duration_typical: number;
    duration: number;
    distance: number;
    driving_side: string;
    weight: number;
    mode: string;
    geometry: string;
  }
  
  export interface Intersection {
    bearings: number[];
    entry: boolean[];
    mapbox_streets_v8: MapboxStreetsV8;
    is_urban: boolean;
    admin_index: number;
    out: number;
    geometry_index: number;
    location: number[];
    in?: number;
    duration?: number;
    turn_weight?: number;
    turn_duration?: number;
    weight?: number;
    traffic_signal?: boolean;
  }
  
  export interface MapboxStreetsV8 {
    class: string;
  }
  
  export interface Maneuver {
    type: string;
    instruction: string;
    bearing_after: number;
    bearing_before: number;
    location: number[];
    modifier?: string;
  }

  export interface Trip{
    tripProgress: number;
    tripDuration: number;
    tripDistance: number;
    tripDestination:string;
    tripDestinationAddress:string|null;
    tripIsSimulation:boolean|null;
    userStartedTripFrom:Position|null;
    route:Route|null;
  }