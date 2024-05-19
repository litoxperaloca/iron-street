import { HttpClientModule } from '@angular/common/http';
import { NgModule, isDevMode } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AmplifyAuthenticatorModule, AuthenticatorService } from '@aws-amplify/ui-angular';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { Amplify } from 'aws-amplify';
import { ManeurveModalComponent } from 'src/app/modals/maneurve/maneurve-modal.component';
import { PermissionModalComponent } from 'src/app/modals/permission/permission-modal.component';
import { RouteModalComponent } from 'src/app/modals/route/route-modal.component';
import { SearchModalComponent } from 'src/app/modals/search/search-modal.component';
import { SettingsModalComponent } from 'src/app/modals/settings/settings-modal.component';
import { SpeedModalComponent } from 'src/app/modals/speed/speed-modal.component';
import { TripProgressModalComponent } from 'src/app/modals/trip-progress/trip-progress-modal.component';
import { CameraService } from 'src/app/services/camera.service';
import { GeoLocationService } from 'src/app/services/geo-location.service';
import { OsmService } from 'src/app/services/osm.service';
import { SearchService } from 'src/app/services/search.service';
import { SpeedService } from 'src/app/services/speed.service';
import { TripService } from 'src/app/services/trip.service';
import awsconfig from '../aws-exports';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GeoLocationMockService } from './mocks/geo-location-mock.service';
import { MapSettingsModalComponent } from './modals/map-settings/mapsettings-modal.component';
import { PlaceInfoModalComponent } from './modals/place-info-modal/place-info-modal.component';
import { SearchReverseModalComponent } from './modals/search-reverse-modal/search-reverse-modal.component';
import { AlertService } from './services/alert.service';
import { AmazonLocationServiceService } from './services/amazon-location-service.service';
import { DeviceOrientationService } from './services/device-orientation.service';
import { MapService } from './services/map.service';
import { ModalService } from './services/modal.service';
import { SpeechRecognitionService } from './services/speech-recognition.service';
import { ThemeService } from './services/theme-service.service';
import { TripSimulatorService } from './services/trip-simulator.service';
import { VoiceService } from './services/voice.service';
import { WordpressService } from './services/wordpress-service.service';

Amplify.configure(awsconfig);



@NgModule({
  declarations:
    [
      AppComponent,
      PermissionModalComponent,
      SpeedModalComponent,
      TripProgressModalComponent,
      SearchModalComponent,
      SearchReverseModalComponent,
      ManeurveModalComponent,
      RouteModalComponent,
      SettingsModalComponent,
      MapSettingsModalComponent,
      PlaceInfoModalComponent
    ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    AmplifyAuthenticatorModule,
    ServiceWorkerModule.register('ngsw-worker.js',
      {
        enabled: !isDevMode(),
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000'
      })],
  providers:
    [
      { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
      VoiceService,
      MapService,
      ModalService,
      GeoLocationService,
      OsmService,
      SpeedService,
      CameraService,
      SearchService,
      TripService,
      DeviceOrientationService,
      AmazonLocationServiceService,
      ThemeService,
      WordpressService,
      AuthenticatorService,
      GeoLocationMockService,
      TripSimulatorService,
      AlertService,
      SpeechRecognitionService
    ],
  bootstrap: [AppComponent],
})
export class AppModule { }
