// favorites.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface Favorite {
  id: string;
  name: string;
  coordinates: [number, number];
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private favorites = new BehaviorSubject<Favorite[]>([]);

  constructor() {
    this.loadFavorites();
  }

  getFavorites() {
    return this.favorites.asObservable();
  }

  addFavorite(favorite: Favorite) {
    const currentFavorites = this.favorites.value;
    const updatedFavorites = [...currentFavorites, favorite];
    this.favorites.next(updatedFavorites);
    this.saveFavorites(updatedFavorites);
  }

  removeFavorite(favoriteId: string) {
    const updatedFavorites = this.favorites.value.filter(fav => fav.id !== favoriteId);
    this.favorites.next(updatedFavorites);
    this.saveFavorites(updatedFavorites);
  }

  private loadFavorites() {
    // Aquí cargarías los favoritos desde un almacenamiento persistente, como localStorage
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    this.favorites.next(favorites);
  }

  private saveFavorites(favorites: Favorite[]) {
    // Aquí guardarías los favoritos en un almacenamiento persistente
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }
}
