import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uy.com.ironplatform.ironstreet',
  appName: 'IronStreet',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  "plugins": {
    CapacitorHttp: {
      enabled: true,
    },
    "SplashScreen": {
      "launchShowDuration": 3000,
      "launchAutoHide": true,
      "backgroundColor": "#ffffffff",
      "androidSplashResourceName": "splash",
      "iosSplashResourceName": "splash",
      "splashFullScreen": true,
      "splashImmersive": true
    },
    "PushNotifications": {
      "presentationOptions": ["alert", "badge", "sound"]
    },
    "Geolocation": {
      "locationWhenInUseUsageDescription": "This app needs access to your location to provide navigation features.",
      "locationAlwaysUsageDescription": "This app needs access to your location to provide navigation features even when the app is not in use."
    },
    "Camera": {
      "cameraUsageDescription": "This app needs access to the camera to take photos.",
      "photosUsageDescription": "This app needs access to photos to select pictures."
    },
    "TextToSpeech": {
      "voices": {
        "en-US": "com.apple.ttsbundle.Samantha-compact",
        "es-ES": "com.apple.ttsbundle.Monica-compact"
      }
    }
  }
};

export default config;
