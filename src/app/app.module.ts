import { HttpClientModule } from '@angular/common/http';
import { NgModule, isDevMode } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ManeurveModalComponent } from 'src/app/modals/maneurve-modal.component';
import { MapSettingsModalComponent } from 'src/app/modals/mapsettings-modal.component';
import { PermissionModalComponent } from 'src/app/modals/permission-modal.component';
import { RouteModalComponent } from 'src/app/modals/route-modal.component';
import { SearchModalComponent } from 'src/app/modals/search-modal.component';
import { SettingsModalComponent } from 'src/app/modals/settings-modal.component';
import { SpeedModalComponent } from 'src/app/modals/speed-modal.component';
import { TripProgressModalComponent } from 'src/app/modals/trip-progress-modal.component';
import { CameraService } from 'src/app/services/camera.service';
import { GeoLocationService } from 'src/app/services/geo-location.service';
import { OsmService } from 'src/app/services/osm.service';
import { RouteService } from 'src/app/services/route.service';
import { SearchService } from 'src/app/services/search.service';
import { SpeedService } from 'src/app/services/speed.service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapService } from './services/map.service';
import { ModalService } from './services/modal.service';
import { VoiceService } from './services/voice.service';

@NgModule({
  declarations:
    [
      AppComponent,
      PermissionModalComponent,
      SpeedModalComponent,
      TripProgressModalComponent,
      SearchModalComponent,
      ManeurveModalComponent,
      RouteModalComponent,
      SettingsModalComponent,
      MapSettingsModalComponent,
    ],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, FormsModule, ServiceWorkerModule.register('ngsw-worker.js', {
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
      RouteService
    ],
  bootstrap: [AppComponent],
})
export class AppModule { }
