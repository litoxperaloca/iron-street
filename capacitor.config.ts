import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uy.com.ironplatform.ironstreet',
  appName: 'IronStreet',
  webDir: 'www',
  loggingBehavior: 'none',
  server: {
    hostname: 'ironstreet.com.uy',
    cleartext: false,  // Enforce HTTPS, disallow HTTP to improve security
    androidScheme: 'https',
    allowNavigation: [
      'https://*.ironplatform.com.uy',
      'https://*.ironstreet.com.uy',
      'https://*.osm.com',
      'https://*.mapbox.com',
      'https://*.amplifyapp.com',
      // Firebase URLs
      "https://*.firebaseapp.com",
      "https://*.cloudfunctions.net",
      "https://firestore.googleapis.com",
      "https://firebasestorage.googleapis.com",
      "https://*.firebaseio.com",
      "https://firebasehosting.googleapis.com",
      "https://*.web.app",
      "https://api.ironstreet.com.uy",


      // Mapbox URLs
      "https://api.mapbox.com",
      "https://*.tiles.mapbox.com",

      // OpenStreetMap URLs
      "https://*.tile.openstreetmap.org",

      // AWS Location Service URLs
      "https://*.amazonaws.com",

      // Nominatim URLs
      "https://nominatim.openstreetmap.org",

      // Google APIs
      "https://*.googleapis.com",

      // Ionic URLs
      "https://api.ionicjs.com",
      "https://apps.ionic.io",
      "https://api.ionicframework.com",

      // Google Authentication
      "https://accounts.google.com",
      "https://*.googleusercontent.com",

      // Apple Authentication
      "https://appleid.apple.com",

      // Facebook Authentication
      "https://www.facebook.com",
      "https://*.facebook.com",

      // Google Cloud Services
      "https://storage.googleapis.com",
      "https://pubsub.googleapis.com"

    ]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#000000ff",
      androidSplashResourceName: "splash",
      iosSplashResourceName: "splash",
      splashFullScreen: true,
      splashImmersive: true,
      fadeInDuration: 500,  // Smooth fade-in transition
      fadeOutDuration: 500  // Smooth fade-out transition
    },
    PushNotifications: {
      presentationOptions: ["alert", "badge", "sound"]
    },
    Geolocation: {
      locationWhenInUseUsageDescription: "This app needs access to your location to provide navigation features.",
      locationAlwaysUsageDescription: "This app needs access to your location to provide navigation features even when the app is not in use."
    },
    Camera: {
      cameraUsageDescription: "This app needs access to the camera to take photos.",
      photosUsageDescription: "This app needs access to photos to select pictures.",
      saveToGallery: true  // Optionally save photos to the gallery after capture
    },
    TextToSpeech: {
      voices: {
        "en-US": "com.apple.ttsbundle.Samantha-compact",
        "es-ES": "com.apple.ttsbundle.Monica-compact"
      },
      defaultVoice: "es-ES"  // Default voice setting for better cross-device compatibility
    }
  }
};

export default config;
