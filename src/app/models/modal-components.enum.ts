export enum ModalComponents {
  Search = 'Search',
  SearchReverse = 'SearchReverse',
  Settings = 'Settings',
  MapSettings = 'MapSettings',
  PlaceInfo = 'PlaceInfo',
  BookmarkAdd = 'BookmarkAdd',
  Osm = 'Osm',
  Location = 'Location',
  Conf = 'Conf',
  MaxSpeed = 'MaxSpeed',
  YourSpeed = 'YourSpeed',
  Debug = 'Debug',
  UserMarkerSettings = 'UserMarkerSettingsModal',
  BookmarkSaved = 'BookmarkSaved',
  CalibrateApp ='CalibrateApp'
}


import { BookmarkModalComponent } from '../modals/bookmark-modal/bookmark-modal.component';
import { BookmarkSavedModalComponent } from '../modals/bookmark-saved-modal/bookmark-saved-modal.component';
import { CalibrateAppModalComponent } from '../modals/calibrate-app-modal/calibrate-app-modal.component';
import { ConfModalComponent } from '../modals/conf-modal/conf-modal.component';
import { DebugModalComponent } from '../modals/debug-modal/debug-modal.component';
import { LocationModalComponent } from '../modals/location-modal/location-modal.component';
// Importa los componentes modales
import { MapSettingsModalComponent } from '../modals/map-settings/mapsettings-modal.component';
import { MaxSpeedDetailsModalComponent } from '../modals/max-speed-details-modal/max-speed-details-modal.component';
import { OsmModalComponent } from '../modals/osm-modal/osm-modal.component';
import { PlaceInfoModalComponent } from '../modals/place-info-modal/place-info-modal.component';
import { SearchReverseModalComponent } from '../modals/search-reverse-modal/search-reverse-modal.component';
import { SearchModalComponent } from '../modals/search/search-modal.component';
import { SettingsModalComponent } from '../modals/settings/settings-modal.component';
import { UserMarkerSettingsModalComponent } from '../modals/user-marker-settings-modal/user-marker-settings-modal.component';
import { YourSpeedModalComponent } from '../modals/your-speed-modal/your-speed-modal.component';
// Mapeo de tipos de modal a componentes
export const ModalComponentMap: { [key in ModalComponents]: any } = {
  [ModalComponents.Search]: SearchModalComponent,
  [ModalComponents.SearchReverse]: SearchReverseModalComponent,

  [ModalComponents.Settings]: SettingsModalComponent,
  [ModalComponents.MapSettings]: MapSettingsModalComponent,
  [ModalComponents.PlaceInfo]: PlaceInfoModalComponent,
  [ModalComponents.BookmarkAdd]: BookmarkModalComponent,
  [ModalComponents.Osm]: OsmModalComponent,
  [ModalComponents.Location]: LocationModalComponent,
  [ModalComponents.Conf]: ConfModalComponent,
  [ModalComponents.MaxSpeed]: MaxSpeedDetailsModalComponent,
  [ModalComponents.YourSpeed]: YourSpeedModalComponent,
  [ModalComponents.Debug]: DebugModalComponent,
  [ModalComponents.UserMarkerSettings]: UserMarkerSettingsModalComponent,
  [ModalComponents.BookmarkSaved]: BookmarkSavedModalComponent,
  [ModalComponents.CalibrateApp]: CalibrateAppModalComponent



};
