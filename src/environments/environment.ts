
export const environment = {
  production: true,
  osmApiConfig: {
    radioDistanceForInitialData: 50,
    minimunDistanceToBboxContainerDataBorder: 3,
    urlToCustomGeoJsonApi: 'https://overpass-api.de/api/interpreter',
    urlToAllNearDataApi: 'https://api.openstreetmap.org/api/0.6/map?bbox=',
    maxspeedsQuerySelector: '[out:json][timeout:300];nwr["maxspeed"]',
    outputQueryGeom: 'out geom;',
  },
  mapboxUserMarkerOptions: {
    positionOptions: {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 6000 /* 6 sec */
    },
    fitBoundsOptions: {
      maxZoom: 15
    },
    trackUserLocation: false,
    showAccuracyCircle: false,
    showUserLocation: true,
    showUserHeading: true
  },
  mapboxMapConfig: {
    accessToken: 'pk.eyJ1IjoibGl0b3hwZXJhbG9jYSIsImEiOiJjbGc3ZW95OGQwNXRtM2V0bHM3ZTcwajVmIn0.rZXdOoZoUFuJ2K4eFyxamg',
    container: 'mapbox',
    style: "mapbox://styles/litoxperaloca/clun8375j04km01nwcqa93oq7",
    zoom: 0,
    minZoom: 0,
    center: [0, 0],
    pitch: 0,
    bearing: 0,
    hash: false,
    performanceMetricsCollection: false,
    attributionControl: true,
    maxZoom: 20,
    maxPitch: 55,
    projection: 'globe'
  },
  mapboxStylesURLs: {
    '3DMapboxStandard': 'mapbox://styles/mapbox/standard',
    '3DIronStreetDefaultDark': 'mapbox://styles/litoxperaloca/clixdgfzd02ih01p63ec51eu0',
    '3DIronStreetDefaultLight': 'mapbox://styles/litoxperaloca/clixno03g02k901p6agjg4lgd',
    '3DIronStreetCyberPunk': 'mapbox://styles/litoxperaloca/clg6s2tmm00bg01mqol1454ui',
    '3DIronStreetRedRoadsDark': 'mapbox://styles/litoxperaloca/clddmyslc002x01ry4jkrnuvx',
    '3DMapBoxDefaultNavigationDark': 'mapbox://styles/litoxperaloca/clixfsndj02fc01qpgf3x1qwk',
    '2DIronStreetDefaultDark': 'mapbox://styles/litoxperaloca/clixeoyvx02jm01pdcnzl0u8j',
    '2DIronStreetDefaultLight': 'mapbox://styles/litoxperaloca/cliybywv002lj01qpcimhb07l',
    '2DIronStreetCyberPunk': 'mapbox://styles/litoxperaloca/clixfhf2f02it01p6cm5efk6e',
    '2DIronStreetRedRoadsDark': 'mapbox://styles/litoxperaloca/clixfmy1c02go01qpbbdp1lbl',
    '2DMapBoxDefaultStellite': 'mapbox://styles/litoxperaloca/clixnhtko00bx01qqdk95ebfa'
  },
  mapboxControlStyleList: [
    {
      title: '3DMapboxStandard',
      uri: 'mapbox://styles/mapbox/standard',
    }, {
      title: '3DIronStreetDefaultDark',
      uri: 'mapbox://styles/litoxperaloca/clixdgfzd02ih01p63ec51eu0',
    }, {
      title: '3DIronStreetDefaultLight',
      uri: 'mapbox://styles/litoxperaloca/clixno03g02k901p6agjg4lgd',
    }, {
      title: '3DIronStreetCyberPunk',
      uri: 'mapbox://styles/litoxperaloca/clg6s2tmm00bg01mqol1454ui',
    }, {
      title: '3DIronStreetRedRoadsDark',
      uri: 'mapbox://styles/litoxperaloca/clddmyslc002x01ry4jkrnuvx',
    }, {
      title: '3DMapBoxDefaultNavigationDark',
      uri: 'mapbox://styles/litoxperaloca/clixfsndj02fc01qpgf3x1qwk',
    }, {
      title: '2DIronStreetDefaultDark',
      uri: 'mapbox://styles/litoxperaloca/clixeoyvx02jm01pdcnzl0u8j',
    }, {
      title: '2DIronStreetDefaultLight',
      uri: 'mapbox://styles/litoxperaloca/cliybywv002lj01qpcimhb07l',
    }, {
      title: '2DIronStreetCyberPunk',
      uri: 'mapbox://styles/litoxperaloca/clixfhf2f02it01p6cm5efk6e',
    }, {
      title: '2DIronStreetRedRoadsDark',
      uri: 'mapbox://styles/litoxperaloca/clixfmy1c02go01qpbbdp1lbl',
    }, {
      title: '2DMapBoxDefaultStellite',
      uri: 'mapbox://styles/litoxperaloca/clixnhtko00bx01qqdk95ebfa',
    },

  ],
  mapboxControlStylesConf: {
    defaultStyle: "3DMapboxStandard",
    eventListeners: {},
  },
  mapBoxControlGeolocateConfig: {
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true,
    showAccuracyCircle: false,
    travelInProgress: false
  },
  mapboxControlDirectionsConfig: {
    accessToken: 'pk.eyJ1IjoibGl0b3hwZXJhbG9jYSIsImEiOiJjbGc3ZW95OGQwNXRtM2V0bHM3ZTcwajVmIn0.rZXdOoZoUFuJ2K4eFyxamg',
    interactive: false,
    profile: "mapbox/driving-traffic",
    unit: "metric",
    language: "es-ES",
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
  },
  mapboxControlNavConfig: {
    visualizePitch: true,
    voiceInstructions: true
  },
  mapboxControlSearchConfig: {
    accessToken: 'pk.eyJ1IjoibGl0b3hwZXJhbG9jYSIsImEiOiJjbGc3ZW95OGQwNXRtM2V0bHM3ZTcwajVmIn0.rZXdOoZoUFuJ2K4eFyxamg',
    mapboxgl: null,
    countries: "uy",
    language: "es",
    placeholder: "Buscar...",
    autocomplete: true
  },
  firebaseConfig: {
    apiKey: "AIzaSyDuG_jOO-S3kO3_h3HKML-6FT5EzJQKH80",
    authDomain: "iron-street.firebaseapp.com",
    databaseURL: "https://iron-street-default-rtdb.firebaseio.com",
    projectId: "iron-street",
    storageBucket: "iron-street.appspot.com",
    messagingSenderId: "648927307257",
    appId: "1:648927307257:web:e21a086fad397f92590928",
    measurementId: "G-DXLP88QG6G"
  },
  recaptcha: {
    key: '6LcUFakmAAAAADV6XQHjGkpkkPj4MsCpm_g3fdVm',
    secret: '6LcUFakmAAAAAB11GNciqZEOTh5zpQkry-m-nt1w',
  },
  openai: {
    key: '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',
    organization: 'IronPlatform',
    organizationId: 'org-IWywnjX9Isu2YYfgRwBooytZ'
  },

};
