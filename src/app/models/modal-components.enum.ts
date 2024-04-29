export enum ModalComponents {
  Search = 'Search',
  Settings = 'Settings',
  MapSettings = 'MapSettings',
  PlaceInfo = 'PlaceInfo'
}


// Importa los componentes modales
import { MapSettingsModalComponent } from '../modals/map-settings/mapsettings-modal.component';
import { PlaceInfoModalComponent } from '../modals/place-info-modal/place-info-modal.component';
import { SearchModalComponent } from '../modals/search/search-modal.component';
import { SettingsModalComponent } from '../modals/settings/settings-modal.component';
// Mapeo de tipos de modal a componentes
export const ModalComponentMap: { [key in ModalComponents]: any } = {
  [ModalComponents.Search]: SearchModalComponent,
  [ModalComponents.Settings]: SettingsModalComponent,
  [ModalComponents.MapSettings]: MapSettingsModalComponent,
  [ModalComponents.PlaceInfo]: PlaceInfoModalComponent,

};
