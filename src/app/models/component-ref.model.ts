import { MapSettingsModalComponent } from '../modals/map-settings/mapsettings-modal.component';
import { SearchModalComponent } from '../modals/search/search-modal.component';
import { SettingsModalComponent } from '../modals/settings/settings-modal.component'; // Importa el resto de tus componentes
import { ModalComponents } from './modal-components.enum'; // Import the ModalComponents enum

export const ComponentRef = {
  [ModalComponents.Search]: {
    component: SearchModalComponent,
    cssClass: 'bottom-sheet-modal',
    breakpoints: [0, 0.5, 0.75, 1],
    initialBreakpoint: 1,
    backdropBreakpoint: 1,
    props: {} // Añade las propiedades que necesites
  },
  [ModalComponents.Settings]: {
    component: SettingsModalComponent,
    cssClass: 'bottom-sheet-modal',
    breakpoints: [0, 0.5, 0.75, 1],
    initialBreakpoint: 0.5,
    backdropBreakpoint: 0.75,
    props: {} // Añade las propiedades que necesites
  },
  [ModalComponents.MapSettings]: {
    component: MapSettingsModalComponent,
    cssClass: 'bottom-sheet-modal',
    breakpoints: [0, 0.5, 0.75, 1],
    initialBreakpoint: 1,
    backdropBreakpoint: 1,
    props: {} // Añade las propiedades que necesites
  },
  // Añade el resto de tus componentes aquí
};
