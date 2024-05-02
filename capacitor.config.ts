import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uy.com.ironplatform.ironstreet',
  appName: 'IronStreet',
  webDir: 'www',
  server: {
    allowNavigation: [
      'mapbox.com',
      '*.mapbox.com',
      '*.mapboxcdn.com',
    ],
    cleartext: false,  // Enforce HTTPS, disallow HTTP to improve security
    androidScheme: 'https'
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
      defaultVoice: "en-US"  // Default voice setting for better cross-device compatibility
    }
  }
};

export default config;
