// direction.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DirectionService {
  private apiUrl = 'https://api.mapbox.com/directions/v5/mapbox';
  private accessToken = 'TU_ACCESS_TOKEN_AQUI';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene direcciones entre dos puntos.
   * @param origin Coordenadas del punto de origen.
   * @param destination Coordenadas del punto de destino.
   * @returns Observable con los datos de la ruta.
   */
  getDirections(origin: [number, number], destination: [number, number]): Observable<any> {
    const coordinates = `${origin.join(',')};${destination.join(',')}`;
    const url = `${this.apiUrl}/driving/${coordinates}?geometries=geojson&access_token=${this.accessToken}&overview=full`;

    return this.http.get(url).pipe(
      map(response => response)
    );
  }
}
