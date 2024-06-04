import { Injectable } from '@angular/core';
import { Place } from '@aws-amplify/geo';
import { Storage } from '@capacitor/storage';

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
    await Storage.set({ key: this.homeKey, value: JSON.stringify(marker) });
  }

  async getHomeMarker(): Promise<Place | null> {
    const { value } = await Storage.get({ key: this.homeKey });
    return value ? JSON.parse(value) : null;
  }

  async setWorkMarker(marker: Place): Promise<void> {
    await Storage.set({ key: this.workKey, value: JSON.stringify(marker) });
  }

  async getWorkMarker(): Promise<Place | null> {
    const { value } = await Storage.get({ key: this.workKey });
    return value ? JSON.parse(value) : null;
  }

  async addFavoriteMarker(marker: Place): Promise<void> {
    const markers: Place[] = await this.getFavoriteMarkers();
    markers.push(marker);
    await Storage.set({ key: this.favoritesKey, value: JSON.stringify(markers) });
  }

  async getFavoriteMarkers(): Promise<Place[]> {
    const { value } = await Storage.get({ key: this.favoritesKey });
    return value ? JSON.parse(value) : [];
  }

  async removeFavoriteMarker(marker: Place): Promise<void> {
    let markers = await this.getFavoriteMarkers();
    markers = markers.filter(m => m.geometry?.point[0] !== marker.geometry?.point[0] || m.geometry?.point[1] !== marker.geometry?.point[1]);
    await Storage.set({ key: this.favoritesKey, value: JSON.stringify(markers) });
  }

  async removeHomeMarker(): Promise<void> {
    await Storage.remove({ key: this.homeKey });
  }

  async removeWorkMarker(): Promise<void> {
    await Storage.remove({ key: this.workKey });
  }
}
