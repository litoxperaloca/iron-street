import { BookmarkModalComponent } from '../modals/bookmark-modal/bookmark-modal.component';
import { ConfModalComponent } from '../modals/conf-modal/conf-modal.component';
import { LocationModalComponent } from '../modals/location-modal/location-modal.component';
import { MapSettingsModalComponent } from '../modals/map-settings/mapsettings-modal.component';
import { OsmModalComponent } from '../modals/osm-modal/osm-modal.component';
import { PlaceInfoModalComponent } from '../modals/place-info-modal/place-info-modal.component';
import { SearchReverseModalComponent } from '../modals/search-reverse-modal/search-reverse-modal.component';
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
  [ModalComponents.SearchReverse]: {
    component: SearchReverseModalComponent,
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
  [ModalComponents.PlaceInfo]: {
    component: PlaceInfoModalComponent,
    cssClass: 'bottom-sheet-modal',
    breakpoints: [0, 0.5, 0.75, 1],
    initialBreakpoint: 1,
    backdropBreakpoint: 1,
    props: {} // Añade las propiedades que necesites
  },
  [ModalComponents.BookmarkAdd]: {
    component: BookmarkModalComponent,
    cssClass: 'bottom-sheet-modal',
    breakpoints: [0, 0.5],
    initialBreakpoint: 0.5,
    backdropBreakpoint: 0.75,
    props: {} // Añade las propiedades que necesites
  },
  [ModalComponents.Osm]: {
    component: OsmModalComponent,
    cssClass: 'bottom-sheet-modal',
    breakpoints: [0, 0.24, 0.55, 0.75, 1],
    initialBreakpoint: 0.24,
    backdropBreakpoint: 1,
    props: {} // Añade las propiedades que necesites
  },
  [ModalComponents.Location]: {
    component: LocationModalComponent,
    cssClass: 'bottom-sheet-modal',
    breakpoints: [0, 0.24, 0.45, 0.55, 0.75, 1],
    initialBreakpoint: 0.24,
    backdropBreakpoint: 1,
    props: {} // Añade las propiedades que necesites
  },
  [ModalComponents.Conf]: {
    component: ConfModalComponent,
    cssClass: 'bottom-sheet-modal',
    breakpoints: [0, 0.55],
    initialBreakpoint: 0.55,
    backdropBreakpoint: 0.75,
    props: {} // Añade las propiedades que necesites
  },
};
