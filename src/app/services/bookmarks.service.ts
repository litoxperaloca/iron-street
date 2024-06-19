import { Injectable } from '@angular/core';
import { Place } from '@aws-amplify/geo';
import { Preferences } from '@capacitor/preferences';
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
  }

  async getHomeMarker(): Promise<Place | null> {
    const { value } = await Preferences.get({ key: this.homeKey });
    return value ? JSON.parse(value) : null;
  }

  async setWorkMarker(marker: Place): Promise<void> {
    await Preferences.set({ key: this.workKey, value: JSON.stringify(marker) });
  }

  async getWorkMarker(): Promise<Place | null> {
    const { value } = await Preferences.get({ key: this.workKey });
    return value ? JSON.parse(value) : null;
  }

  async addFavoriteMarker(marker: Place): Promise<void> {
    const markers: Place[] = await this.getFavoriteMarkers();
    markers.push(marker);
    await Preferences.set({ key: this.favoritesKey, value: JSON.stringify(markers) });
  }

  async getFavoriteMarkers(): Promise<Place[]> {
    const { value } = await Preferences.get({ key: this.favoritesKey });
    return value ? JSON.parse(value) : [];
  }

  async removeFavoriteMarker(marker: Place): Promise<void> {
    let markers = await this.getFavoriteMarkers();
    markers = markers.filter(m => m.geometry?.point[0] !== marker.geometry?.point[0] || m.geometry?.point[1] !== marker.geometry?.point[1]);
    await Preferences.set({ key: this.favoritesKey, value: JSON.stringify(markers) });
  }

  async removeHomeMarker(): Promise<void> {
    await Preferences.remove({ key: this.homeKey });
  }

  async removeWorkMarker(): Promise<void> {
    await Preferences.remove({ key: this.workKey });
  }
}
