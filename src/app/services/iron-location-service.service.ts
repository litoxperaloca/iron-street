import { Injectable } from '@angular/core';
import { Coordinates, Place, } from "src/app/models/route.interface";
import { CapacitorHttp, HttpResponse } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class IronLocationServiceService {

  constructor() { }

  async doGet(url: string, params: Record<string, string>): Promise<HttpResponse> {
    const options = {
      url: url,
      headers: { },
      params: params,
    };

    return await CapacitorHttp.get(options);
  };

  async suggestPlace(name: string): Promise<HttpResponse> {
    let url = `https://search.ironstreet.com.uy/intersections`;
  
    //let url = `https://api.ironstreet.com.uy/nearest/v1/driving/${userPosition.coords.longitude},${userPosition.coords.latitude}.json`;
    const parms = {
      search: name
    }

    return (await this.doGet(url,parms));
  }

  /*async searchByPlaceId(placeId: string): Promise<Place | undefined> {
    return Geo.searchByPlaceId(placeId);
  }


  async searchByText(searchTerm: string): Promise<Place[] | undefined> {
    return Geo.searchByText(searchTerm);
  }*/

  async searchByCoordinates(coordinates: Coordinates): Promise<HttpResponse> {
    let url = 'https://nominatim.openstreetmap.org/reverse.php';
    const parms = {
      lat: ""+coordinates[1],
      lon:""+coordinates[0],
      zoom:"18",
      format:'jsonv2'
    }
    return (await this.doGet(url,parms));
  }



  getCountryName(countryCode: string): string | null {
    const codeToCountryName: { [key: string]: string } = {
      "AFG": "Afghanistan",
      "ALB": "Albania",
      "DZA": "Algeria",
      "AND": "Andorra",
      "AGO": "Angola",
      "ATG": "Antigua and Barbuda",
      "ARG": "Argentina",
      "ARM": "Armenia",
      "AUS": "Australia",
      "AUT": "Austria",
      "AZE": "Azerbaijan",
      "BHS": "Bahamas",
      "BHR": "Bahrain",
      "BGD": "Bangladesh",
      "BRB": "Barbados",
      "BLR": "Belarus",
      "BEL": "Belgium",
      "BLZ": "Belize",
      "BEN": "Benin",
      "BTN": "Bhutan",
      "BOL": "Bolivia",
      "BIH": "Bosnia and Herzegovina",
      "BWA": "Botswana",
      "BRA": "Brazil",
      "BRN": "Brunei",
      "BGR": "Bulgaria",
      "BFA": "Burkina Faso",
      "BDI": "Burundi",
      "CPV": "Cabo Verde",
      "KHM": "Cambodia",
      "CMR": "Cameroon",
      "CAN": "Canada",
      "CAF": "Central African Republic",
      "TCD": "Chad",
      "CHL": "Chile",
      "CHN": "China",
      "COL": "Colombia",
      "COM": "Comoros",
      "COG": "Congo (Congo-Brazzaville)",
      "CRI": "Costa Rica",
      "HRV": "Croatia",
      "CUB": "Cuba",
      "CYP": "Cyprus",
      "CZE": "Czechia (Czech Republic)",
      "DNK": "Denmark",
      "DJI": "Djibouti",
      "DMA": "Dominica",
      "DOM": "Dominican Republic",
      "ECU": "Ecuador",
      "EGY": "Egypt",
      "SLV": "El Salvador",
      "GNQ": "Equatorial Guinea",
      "ERI": "Eritrea",
      "EST": "Estonia",
      "SWZ": "Eswatini (fmr. Swaziland)",
      "ETH": "Ethiopia",
      "FJI": "Fiji",
      "FIN": "Finland",
      "FRA": "France",
      "GAB": "Gabon",
      "GMB": "Gambia",
      "GEO": "Georgia",
      "DEU": "Germany",
      "GHA": "Ghana",
      "GRC": "Greece",
      "GRD": "Grenada",
      "GTM": "Guatemala",
      "GIN": "Guinea",
      "GNB": "Guinea-Bissau",
      "GUY": "Guyana",
      "HTI": "Haiti",
      "HND": "Honduras",
      "HUN": "Hungary",
      "ISL": "Iceland",
      "IND": "India",
      "IDN": "Indonesia",
      "IRN": "Iran",
      "IRQ": "Iraq",
      "IRL": "Ireland",
      "ISR": "Israel",
      "ITA": "Italy",
      "JAM": "Jamaica",
      "JPN": "Japan",
      "JOR": "Jordan",
      "KAZ": "Kazakhstan",
      "KEN": "Kenya",
      "KIR": "Kiribati",
      "PRK": "Korea (North)",
      "KOR": "Korea (South)",
      "XKX": "Kosovo",
      "KWT": "Kuwait",
      "KGZ": "Kyrgyzstan",
      "LAO": "Laos",
      "LVA": "Latvia",
      "LBN": "Lebanon",
      "LSO": "Lesotho",
      "LBR": "Liberia",
      "LBY": "Libya",
      "LIE": "Liechtenstein",
      "LTU": "Lithuania",
      "LUX": "Luxembourg",
      "MDG": "Madagascar",
      "MWI": "Malawi",
      "MYS": "Malaysia",
      "MDV": "Maldives",
      "MLI": "Mali",
      "MLT": "Malta",
      "MHL": "Marshall Islands",
      "MRT": "Mauritania",
      "MUS": "Mauritius",
      "MEX": "Mexico",
      "FSM": "Micronesia",
      "MDA": "Moldova",
      "MCO": "Monaco",
      "MNG": "Mongolia",
      "MNE": "Montenegro",
      "MAR": "Morocco",
      "MOZ": "Mozambique",
      "MMR": "Myanmar (formerly Burma)",
      "NAM": "Namibia",
      "NRU": "Nauru",
      "NPL": "Nepal",
      "NLD": "Netherlands",
      "NZL": "New Zealand",
      "NIC": "Nicaragua",
      "NER": "Niger",
      "NGA": "Nigeria",
      "MKD": "North Macedonia (formerly Macedonia)",
      "NOR": "Norway",
      "OMN": "Oman",
      "PAK": "Pakistan",
      "PLW": "Palau",
      "PSE": "Palestine State",
      "PAN": "Panama",
      "PNG": "Papua New Guinea",
      "PRY": "Paraguay",
      "PER": "Peru",
      "PHL": "Philippines",
      "POL": "Poland",
      "PRT": "Portugal",
      "QAT": "Qatar",
      "ROU": "Romania",
      "RUS": "Russia",
      "RWA": "Rwanda",
      "KNA": "Saint Kitts and Nevis",
      "LCA": "Saint Lucia",
      "VCT": "Saint Vincent and the Grenadines",
      "WSM": "Samoa",
      "SMR": "San Marino",
      "STP": "Sao Tome and Principe",
      "SAU": "Saudi Arabia",
      "SEN": "Senegal",
      "SRB": "Serbia",
      "SYC": "Seychelles",
      "SLE": "Sierra Leone",
      "SGP": "Singapore",
      "SVK": "Slovakia",
      "SVN": "Slovenia",
      "SLB": "Solomon Islands",
      "SOM": "Somalia",
      "ZAF": "South Africa",
      "SSD": "South Sudan",
      "ESP": "Spain",
      "LKA": "Sri Lanka",
      "SDN": "Sudan",
      "SUR": "Suriname",
      "SWE": "Sweden",
      "CHE": "Switzerland",
      "SYR": "Syria",
      "TWN": "Taiwan",
      "TJK": "Tajikistan",
      "TZA": "Tanzania",
      "THA": "Thailand",
      "TLS": "Timor-Leste",
      "TGO": "Togo",
      "TON": "Tonga",
      "TTO": "Trinidad and Tobago",
      "TUN": "Tunisia",
      "TUR": "Turkey",
      "TKM": "Turkmenistan",
      "TUV": "Tuvalu",
      "UGA": "Uganda",
      "UKR": "Ukraine",
      "ARE": "United Arab Emirates",
      "GBR": "United Kingdom",
      "USA": "United States",
      "URY": "Uruguay",
      "UZB": "Uzbekistan",
      "VUT": "Vanuatu",
      "VAT": "Vatican City",
      "VEN": "Venezuela",
      "VNM": "Vietnam",
      "YEM": "Yemen",
      "ZMB": "Zambia",
      "ZWE": "Zimbabwe"
    };
    return codeToCountryName[countryCode] || null;
  }
}
