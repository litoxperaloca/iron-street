declare module 'navigation.js' {
  interface Options {
    units?: 'miles' | 'kilometers';
    maxReRouteDistance?: number;
    maxSnapToLocation?: number;
    completionDistance?: number;
    shortCompletionDistance?: number;
    warnUserTime?: number;
    userBearingCompleteThreshold?: number;
  }

  interface Step {
    maneuver: {
      bearing_before: number;
      bearing_after: number;
    };
  }

  interface Route {
    steps: Step[];
  }

  interface UserLocation {
    type: 'Feature';
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
  }

  interface CurrentStep {
    step: number;
    distance: number;
    snapToLocation: UserLocation;
  }

  function getCurrentStep(user: UserLocation, route: Route, userCurrentStep: number, userBearing?: number): CurrentStep;
}
