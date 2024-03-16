import { MapSettingsModalComponent } from '../modals/mapsettings-modal.component';
import { SearchModalComponent } from '../modals/search-modal.component';
import { SettingsModalComponent } from '../modals/settings-modal.component'; // Importa el resto de tus componentes
import { ModalComponents } from './modal-components.enum'; // Import the ModalComponents enum

export const ComponentRef = {
  [ModalComponents.Search]: {
    component: SearchModalComponent,
    cssClass: 'bottom-sheet-modal',
    breakpoints: [0, 0.5, 0.75, 1],
    initialBreakpoint: 0.5,
    backdropBreakpoint: 0.75,
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
    initialBreakpoint: 0.5,
    backdropBreakpoint: 0.75,
    props: {} // Añade las propiedades que necesites
  },
  // Añade el resto de tus componentes aquí
};
