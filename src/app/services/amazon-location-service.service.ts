import { Injectable } from '@angular/core';
import { Geo, Place, SearchForSuggestionsResults } from "@aws-amplify/geo";

@Injectable({
  providedIn: 'root'
})
export class AmazonLocationServiceService {

  constructor() { }

  searchOptionsWithBiasPosition = {
    //countries: ["URY", "ARG", "BRA"], // Alpha-3 country codes
    countries: ["URY"],
    maxResults: 10, // 50 is the max and the default
    /* biasPosition: [
      "lon",
      "lat"
    ], // Coordinates point to act as the center of the search*/
    searchIndexName: "IronStreetPublicSearchLocationIndex2-dev", // the string name of the search index
  }

  searchOptionsWithSearchAreaConstraints = {
    //countries: ["URY", "ARG", "BRA"], // Alpha-3 country codes
    countries: ["URY"],
    maxResults: 10, // 50 is the max and the default
    //searchAreaConstraints: [4564545, 6565467, 44444, 5654584758], // Bounding box to search inside of
    searchIndexName: "IronStreetPublicSearchLocationIndex2-dev", // the string name of the search index
  }

  searchByPlaceIdOptions = {
    searchIndexName: "IronStreetPublicSearchLocationIndex2-dev", // the string name of the search index
  }

  searchByTextOptions = {
    //countries: ["URY", "ARG", "BRA"], // Alpha-3 country codes
    countries: ["URY"],
    maxResults: 10, // 50 is the max and the default
    //searchAreaConstraints: [4564545, 6565467, 44444, 5654584758], // Bounding box to search inside of
    searchIndexName: "IronStreetPublicSearchLocationIndex2-dev", // the string name of the search index

  }

  async suggestPlace(name: string): Promise<SearchForSuggestionsResults> {
    return (await Geo.searchForSuggestions(name, this.searchOptionsWithSearchAreaConstraints));
  }

  async searchByPlaceId(placeId: string): Promise<Place | undefined> {
    return Geo.searchByPlaceId(placeId, this.searchByPlaceIdOptions);
  }


  async searchByText(searchTerm: string): Promise<Place[] | undefined> {
    return Geo.searchByText(searchTerm, this.searchByTextOptions);
  }
}
