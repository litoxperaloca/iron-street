import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OsmService {

  constructor(private http: HttpClient) { }

  getMapData(lon: number, lat: number, zoom: number) {
    const url = environment.osmApiConfig.urlToAllNearDataApi + lon + ',' + lat + ',' + zoom;
    return this.http.get(url, { responseType: 'text' });
  }

  async doGet(url: string, params: Record<string, string>): Promise<HttpResponse> {
    const options = {
      url: url,
      headers: { 'X-Fake-Header': 'Fake-Value' },
      params: params,
    };

    return await CapacitorHttp.get(options);
  };


  async getJsonDataFromOverpassApi(query: string): Promise<HttpResponse> {
    const url = environment.osmApiConfig.urlToCustomGeoJsonApi;

    const params = {
      data: query,
    };

    return this.doGet(url, params);
  }

  async getMaxSpeedData(bbox: [[number, number], [number, number]]): Promise<HttpResponse> {
    var query = environment.osmApiConfig.maxspeedsQuerySelector;
    query += '(' + bbox[0][1] + ',' + bbox[0][0] + ',' + bbox[1][1] + ',' + bbox[1][0] + ');' + environment.osmApiConfig.outputQueryGeom;
    return this.getJsonDataFromOverpassApi(query)
  }

}
