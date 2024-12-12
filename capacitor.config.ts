import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uy.com.ironplatform.ironstreet',
  appName: 'IronStreet',
  webDir: 'www',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#000000ff",
      androidSplashResourceName: "splash",
      splashFullScreen: true,
      splashImmersive: true,
      launchFadeOutDuration: 500,  // Smooth fade-in transition
    },
    Geolocation: {
      locationWhenInUseUsageDescription: "This app needs access to your location to provide navigation features.",
      locationAlwaysUsageDescription: "This app needs access to your location to provide navigation features even when the app is not in use."
    },
    TextToSpeech: {
      voices: {
        "en-US": "com.apple.ttsbundle.Samantha-compact",
        "es-ES": "com.apple.ttsbundle.Monica-compact"
      },
      defaultVoice: "es-ES"
    }
  }
};

export default config;
