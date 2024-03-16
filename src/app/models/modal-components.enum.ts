export enum ModalComponents {
  Search = 'Search',
  Settings = 'Settings',
  MapSettings = 'MapSettings',
}


// Importa los componentes modales
import { MapSettingsModalComponent } from '../modals/mapsettings-modal.component';
import { SearchModalComponent } from '../modals/search-modal.component';
import { SettingsModalComponent } from '../modals/settings-modal.component';
// Mapeo de tipos de modal a componentes
export const ModalComponentMap: { [key in ModalComponents]: any } = {
  [ModalComponents.Search]: SearchModalComponent,
  [ModalComponents.Settings]: SettingsModalComponent,
  [ModalComponents.MapSettings]: MapSettingsModalComponent,
  // Añade otros mapeos según sea necesario
};
