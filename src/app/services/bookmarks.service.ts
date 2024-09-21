import { Injectable } from '@angular/core';
import { Place } from 'src/app/models/route.interface';
import { Preferences } from '@capacitor/preferences';
import { MapService } from './map.service';
export interface Marker {
  name: string;
  lat: number;
  lng: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookmarksService {
  private readonly homeKey = 'home_marker';
  private readonly workKey = 'work_marker';
  private readonly favoritesKey = 'favorite_markers';

  constructor() { }

  async setHomeMarker(marker: Place): Promise<void> {
    await Preferences.set({ key: this.homeKey, value: JSON.stringify(marker) });
    ((window as any).mapService as MapService).updateBookmarks();
  }

  async getHomeMarker(): Promise<Place | null> {
    const { value } = await Preferences.get({ key: this.homeKey });
    return value ? JSON.parse(value) : null;
  }

  async setWorkMarker(marker: Place): Promise<void> {
    await Preferences.set({ key: this.workKey, value: JSON.stringify(marker) });
    ((window as any).mapService as MapService).updateBookmarks();
  }

  async getWorkMarker(): Promise<Place | null> {
    const { value } = await Preferences.get({ key: this.workKey });
    return value ? JSON.parse(value) : null;
  }

  async addFavoriteMarker(marker: Place): Promise<void> {
    const markers: Place[] = await this.getFavoriteMarkers();
    markers.push(marker);
    await Preferences.set({ key: this.favoritesKey, value: JSON.stringify(markers) });
    ((window as any).mapService as MapService).updateBookmarks();

  }

  async getFavoriteMarkers(): Promise<Place[]> {
    const { value } = await Preferences.get({ key: this.favoritesKey });
    return value ? JSON.parse(value) : [];
  }

  async removeFavoriteMarker(marker: Place): Promise<void> {
    let markers = await this.getFavoriteMarkers();
    markers = markers.filter(m => m.geometry?.point[0] !== marker.geometry?.point[0] || m.geometry?.point[1] !== marker.geometry?.point[1]);
    await Preferences.set({ key: this.favoritesKey, value: JSON.stringify(markers) });
    ((window as any).mapService as MapService).updateBookmarks();

  }

  async removeHomeMarker(): Promise<void> {
    await Preferences.remove({ key: this.homeKey });
    ((window as any).mapService as MapService).updateBookmarks();

  }

  async removeWorkMarker(): Promise<void> {
    await Preferences.remove({ key: this.workKey });
    ((window as any).mapService as MapService).updateBookmarks();

  }
}
