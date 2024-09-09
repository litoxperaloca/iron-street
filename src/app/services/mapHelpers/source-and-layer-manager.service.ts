import { Injectable } from '@angular/core';
import { MapService } from '../map.service';
import { environment } from 'src/environments/environment';
import { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { Place } from '@aws-amplify/geo';
import { HomePage } from 'src/app/pages/home/home.page';
import { BookmarksService } from '../bookmarks.service';
import mapboxgl, { AnyLayer, GeoJSONFeature, LngLatBounds, MapboxGeoJSONFeature, MapEvent } from 'mapbox-gl';
import { lineString } from '@turf/helpers';
import length from '@turf/length';
import { along } from '@turf/turf';

@Injectable({
  providedIn: 'root'
})
export class SourceAndLayerManagerService {

  constructor(private mapService:MapService) { }

  add3DModelToMapIfNot(locator:any){
    const map = ((window as any).mapService as MapService).getMap();
    if (!map.hasModel(locator.id)) {
     map.loadImage(locator.img, (error, image) => {
        if (error) throw error;
        if (image && !map.hasImage(locator.id)) {
          map.addImage(locator.id, image);
          map.addModel(locator.id,locator.options.obj);
        }
      });
    }
  }

  set3DWithModelLayers(){
    const map = ((window as any).mapService as MapService).getMap();
    if(!map.getSource('eraser')){
      map.addSource('eraser', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': [
            ]
        }
      });
    }
    
    if(!map.getSource('mysourceModel')){
      map.addSource('mysourceModel', {
        'type': 'geojson',
        'data': {
            'type': 'FeatureCollection',
            'features': [
            ]
        }  
      });
    }

    if(!map.getLayer('eraser')){

      map.addLayer({
        'id': 'eraser',
        'type': 'clip',
        'source': 'eraser',
        'slot': 'middle',
        'layout': {
            'clip-layer-types': ['symbol', 'model']
        }
      });
    }


    if(!map.getLayer('modellayer')){
      map.addLayer({
          'id': 'modellayer',
          'type': 'model',
          'source': 'mysourceModel',
          //'minzoom': 14,
          //'maxzoom': 22,
          'slot':'top',
          'layout': {
              'model-id': ['get', 'model-uri'],
              'visibility': 'visible'
           },
          'paint': {
              'model-opacity': 1,
              'model-rotation': ['get', 'model-rotation'],
              'model-scale': ['get', 'model-scale'],          
              //'model-color-mix-intensity': 0,
              'model-emissive-strength': 1,
              'model-type':'location-indicator',
              'model-cast-shadows': true
          }
      });
      (map.getLayer('modellayer')! as any).scope = '';

    }
  }

  createBBoxFeatureEraser(latLon:[number, number],metersFromCenter:number,locator:any):GeoJSONFeature {
    const [lat, lon] = latLon;
    const metersPerDegree = 111320; // Aproximado para longitud en el ecuador

    // Expand 10 meters in every direction (North, South, East, West)
    const deltaDegrees = metersFromCenter / metersPerDegree; // Aproximación en grados
    
    // Calcula las coordenadas del bbox
    const bbox = [
        [lon - deltaDegrees, lat - deltaDegrees], // Bottom-left
        [lon + deltaDegrees, lat - deltaDegrees], // Bottom-right
        [lon + deltaDegrees, lat + deltaDegrees], // Top-right
        [lon - deltaDegrees, lat + deltaDegrees], // Top-left
        [lon - deltaDegrees, lat - deltaDegrees]  // Closing the polygon
    ];

    // Crear un Feature de tipo Polygon en formato GeoJSON
    const geoJSONFeature:GeoJSONFeature = {
        type: "Feature",
        //id: 'clipper-'+locator.id,
        geometry: {
            type: "Polygon",         
            coordinates: [bbox]
        },
        properties: {
        },
        source: 'eraser'
    };

    return geoJSONFeature;
}


  
  setLocatorWithModelLayers(locator:any){
    const options = locator.options;
    const self:MapService = ((window as any).mapService as MapService);
    const map = ((window as any).mapService as MapService).getMap();
    if(!map.getSource('mysourceModel')){
      return;   
    };
    this.add3DModelToMapIfNot(locator);
    const origin=self.getUserMarker().getLngLat();
    const heading = self.getUserMarker().getRotation();
    const featureClipData = this.createBBoxFeatureEraser([origin.lng,origin.lat],50,locator);

    const featureModelData:GeoJSONFeature=
        {
          'type': 'Feature',
          'id':locator.id,
          'properties': {
              'model-uri':locator.id,
              'model-name':locator.name,
              'model-rotation': [locator.options.rotationDeg.x,locator.options.rotationDeg.y,heading],
              'model-scale': [locator.options.scale, locator.options.scale, locator.options.scale],
              'model-anchor': locator.options.anchor,
              'model-img':  locator.img,
              'model-units': locator.options.units,
              'model-vehicleType':locator.vehicleType,
              'model-cast-shadows': true
           },
          'source':'mysourceModel',
          'geometry': {
              'coordinates': [origin.lng, origin.lat],
              'type': 'Point'
          }
        };

    (map.getSource('eraser') as mapboxgl.GeoJSONSource).setData(featureClipData);
    (map.getSource('mysourceModel') as mapboxgl.GeoJSONSource).setData(featureModelData);

    if(locator.id==='redarrow'){
      document.body.classList.remove('noCircle');
    }else{
      document.body.classList.remove('noCircle');
      document.body.classList.add('noCircle');
    }
  
  }



  async updateBookmarks(){
    const map = ((window as any).mapService as MapService).getMap();

    const data:FeatureCollection = {
      "type": "FeatureCollection",
      "features": []
    }
    const bookmarkService =     (window as any).bookmarkService as BookmarksService;
    const homeMarker = await bookmarkService.getHomeMarker();
    if(homeMarker && homeMarker.geometry){
      const homeMarkerAsGeoJson:any = {
        "type": "FeatureCollection",
        "features": [
          {"type":"Feature",
          "id":"999999999998",
          "properties":
            {"@id":"node/999999999998",
              "name":"Casa",
              "label":"Casa",
              "street":homeMarker.street,
              "addressNumber":homeMarker.addressNumber,
              "country":homeMarker.country,
              "municipality":homeMarker.municipality,
              "neighborhood":homeMarker.neighborhood,
              "postalCode":homeMarker.postalCode,
              "region":homeMarker.region,
              "subRegion":homeMarker.subRegion
            },
            "geometry": {"type":"Point",
                          "coordinates":[homeMarker.geometry.point[0],homeMarker.geometry.point[1]]
                        }
          }
        ]
      };
      (map.getSource("homeDataSource") as mapboxgl.GeoJSONSource).setData(homeMarkerAsGeoJson);
      
    }else{
      (map.getSource("homeDataSource") as mapboxgl.GeoJSONSource).setData(data);

    }
    
    const workMarker = await bookmarkService.getWorkMarker();
    if(workMarker && workMarker.geometry){
      const workMarkerAsGeoJson:FeatureCollection = {
        "type": "FeatureCollection",
        "features": [
          {"type":"Feature",
          "id":"999999999999",
          "properties":
            {"@id":"node/999999999999",
              "name":"Trabajo",
              "label":"Trabajo",
              "street":workMarker.street,
              "addressNumber":workMarker.addressNumber,
              "country":workMarker.country,
              "municipality":workMarker.municipality,
              "neighborhood":workMarker.neighborhood,
              "postalCode":workMarker.postalCode,
              "region":workMarker.region,
              "subRegion":workMarker.subRegion
            },
            "geometry": {"type":"Point",
                          "coordinates":
                            [workMarker.geometry.point[0],
                            workMarker.geometry.point[1]]
                        }
          }
        ]
      };
      (map.getSource("workDataSource") as mapboxgl.GeoJSONSource).setData(workMarkerAsGeoJson);
    }else{

      (map.getSource("workDataSource") as mapboxgl.GeoJSONSource).setData(data);

    }
    const favouritesMarker = await bookmarkService.getFavoriteMarkers();
    let index = 0;
    if(favouritesMarker && favouritesMarker.length>0){
      const features:any[]=[];
      favouritesMarker.forEach(fav => {
       if(fav.geometry){
        const feature =  {
          "type":"Feature",
          "id":"9999999998"+index,
          "properties":
            {"@id":"node/999999999999",
              "name":"Favorito",
              "label":"Favorito",
              "street":fav.street,
              "addressNumber":fav.addressNumber,
              "country":fav.country,
              "municipality":fav.municipality,
              "neighborhood":fav.neighborhood,
              "postalCode":fav.postalCode,
              "region":fav.region,
              "subRegion":fav.subRegion,
              "favIndex":index
            },
            "geometry": {"type":"Point",
                          "coordinates":
                            [fav.geometry.point[0],
                            fav.geometry.point[1]]
                        }
          };
          index++;
          features.push(feature);
        }
  
          const favouritesMarkerAsGeoJson:FeatureCollection = {
            "type": "FeatureCollection",
            "features": features
          };
        (map.getSource("favouritesDataSource") as mapboxgl.GeoJSONSource).setData(favouritesMarkerAsGeoJson);
  
      });
    }else{
      (map.getSource("favouritesDataSource") as mapboxgl.GeoJSONSource).setData(data);

    }
  }

  createStreetSourceAndLayer(){
    const self:MapService = ((window as any).mapService as MapService);
    const map = ((window as any).mapService as MapService).getMap();  // Add the source to the Mapbox map
  map.addSource("streetSource", {
    type: 'geojson',
    data: {
      "type": "FeatureCollection",
      "features": []
    }
    });

  // Add the layer to the Mapbox map
  map.addLayer({
    id: "streetLayer",
    type: 'line',
    source: "streetSource",
    slot:'middle',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
      'visibility': 'none'
    },
    paint: {
      'line-color': '#007cbf',
      'line-width': 4,
      "line-occlusion-opacity": 0.6
    },
  });

  }

  addBookmarksSourceAndLayer( 
     map: mapboxgl.Map,
    imageFileName: string,
    imageName: string,
    sourceId: string,
    imageSize: number,
    layerId: string,
    minZoom: number,
    maxZoom: number,
    bookmarkType:string,
    label:string):void{

    const self:MapService = this.mapService;
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          "type": "FeatureCollection",
          "features": []
        }
        });
    
      map.loadImage(
        '/assets/img/map-icons/' + imageFileName,
        (error, image) => {
          if (error) throw error;
          if (image) {
            if (!map.hasImage(imageName)) map.addImage(imageName, image);
            map.addLayer(
              {
                "id": layerId,
                "minzoom": minZoom,
                "maxzoom": maxZoom,
                "type": "symbol",
                'paint': {
                  'text-color': '#ffffff',
                  'text-halo-color': '#000000',
                  'text-halo-width': 0.5,
                  'text-halo-blur': 0.7,
                  'text-opacity': 1
                },
                'layout': {
                  'icon-image': imageName,
                  'icon-size': imageSize,
                  //'icon-allow-overlap': true,
                  "icon-anchor": 'bottom',
                  'visibility': 'visible',
                  'text-field': ['get', "label"],
                  'text-justify': 'center',
                  'text-offset': [0, 0.3],
                  'text-anchor': 'top'
  
                  //'icon-rotate': ['get', 'bearing']
                },
                //"filter": ["<=", ["distance-from-center"], 0.5],
  
                "source": sourceId,
              });
            map.on('click', layerId, function (e) {
              if (e.features && e.features[0] && e.features[0].properties && e.features[0].geometry.type == "Point") {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const properties = e.features[0].properties;
  
                // Ensure that if the map is zoomed out such that multiple copies of the feature are visible,
                // the popup appears over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                  coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }
                const feature = e.features[0];
                if (!feature.properties || feature.geometry.type != "Point") return;
                const place: Place = {
                  label: feature.properties["name"] as string,
                  addressNumber: "",
                  country: "",
                  municipality: "",
                  neighborhood: "",
                  postalCode: "",
                  region: "",
                  street: "",
  
                  geometry: {
                    point: [
                      feature.geometry.coordinates[0], // Longitude
                      feature.geometry.coordinates[1]  // Latitude
                    ]
                  }
                };
  
                const self = ((window as any).mapService as MapService);
              
                self.selectedBookmarkType = bookmarkType;
                if(bookmarkType==="favourite"){
                  self.selectedFavIndex=feature.properties["favIndex"];
                }
                
                //featurePopup.addTo(map);
                
                const iconElement = document.querySelector(`[data-id="${feature.id}"]`);
                if (iconElement) {
                  iconElement.classList.toggle('highlight-icon');
                }
                ((window as any).homePage as HomePage).openBookmarkSavedModal();
                self.getMap().flyTo({
                  center: [coordinates[0], coordinates[1]]
                });
              }
            });
          }
        })
    };


    async hideUserCurrentStreetMaxSpeedWay() {
      const self:MapService = ((window as any).mapService as MapService);
      const map = ((window as any).mapService as MapService).getMap();
      if (map.getLayer("maxspeedRenderLayer")) {
        map.setLayoutProperty('maxspeedRenderLayer', "visibility", 'none');
        self.showingMaxSpeedWayId = null;
        self.showingMaxSpeedWay = false;
      }
      if (self.popUpMaxSpeedWay) {
        self.popUpMaxSpeedWay.remove();
        self.popUpMaxSpeedWay = null;
      }
    }
  
    createMaxSpeedWayPopUp(maxSpeed: number, coordinates: number[][]): mapboxgl.Popup {
      const self = this.mapService;
      const map = ((window as any).mapService as MapService).getMap();
      let divider = 2;
  
      // Convierte la ruta en un objeto GeoJSON
      const line = lineString(coordinates);
      // Calcula la longitud total de la línea
      const lineLength = length(line, { units: 'kilometers' });
  
      // Encuentra el punto medio
      const midPoint = along(line, lineLength / divider, { units: 'kilometers' });
      const popUp = new mapboxgl.Popup({
        closeOnClick: false,
        anchor: "top" as mapboxgl.Anchor, // Cast anchor to Anchor type,
        offset: 10
        // Cast anchor to Anchor type
      })
        .setLngLat(midPoint.geometry.coordinates as [number, number])
        .setHTML('<div><p> ' + 'MAX: ' + maxSpeed + ' Km/h.</p</div>');
        map.setLayoutProperty('maxspeedRenderLayer', 'visibility', 'visible');
  
      let className: string = "red";
      map.setPaintProperty('maxspeedRenderLayer', 'line-color', '#E91E63');
  
      if (maxSpeed >= 60) {
        className = "yellow";
        map.setPaintProperty('maxspeedRenderLayer', 'line-color', '#ffc107');
      }
      if (maxSpeed >= 75) {
        className = "green";
        map.setPaintProperty('maxspeedRenderLayer', 'line-color', '#079421');
      }
      popUp.addClassName("maxSpeedWayPopUp");
  
      popUp.addClassName(className + "PopUp");
      // Crea un popup y lo añade al mapa en el punto medio
      return popUp;
    }
  
    async showUserCurrentStreetMaxSpeedWay() {
      const self:MapService = ((window as any).mapService as MapService);
      const map = ((window as any).mapService as MapService).getMap();
      if (!map.getLayer("maxspeedRenderLayer")) {
        map.addLayer(
          {
            "id": "maxspeedRenderLayer",
            "minzoom": 7,
            "maxzoom": 22,
            "type": "line",
            "paint": {
              "line-color": "red",
              "line-width": 10,
              "line-opacity": 1,
              "line-emissive-strength": 2,
            },
            "layout": {
              "visibility": "visible",
            },
            "source": "streetSource",
          });
      }
      if (self.userCurrentStreet) {
        map.setLayoutProperty("maxspeedRenderLayer", "visibility", "visible");
  
        if (self.userCurrentStreet.properties && self.userCurrentStreet.properties['@id']) {
          self.showingMaxSpeedWayId = self.userCurrentStreet.properties['@id'];
          self.showingMaxSpeedWay = true;
          if (self.userCurrentStreet.geometry!.type === "LineString") {
            const maxSpeedPopUp = this.createMaxSpeedWayPopUp(self.userCurrentStreet.properties['maxspeed'], self.userCurrentStreet.geometry!.coordinates);
            self.popUpMaxSpeedWay = maxSpeedPopUp;
            self.popUpMaxSpeedWay.addTo(map);
          }
        } else {
          self.showingMaxSpeedWayId = null;
          self.showingMaxSpeedWay = false;
          if (self.popUpMaxSpeedWay) {
            self.popUpMaxSpeedWay.remove();
            self.popUpMaxSpeedWay = null;
          }
  
        }
  
      }
    }
  
    addLineTileVectorLayer(
      map: mapboxgl.Map,
      sourceId: string,
      mapboxTileId: string,
      layerId: string,
      sourceLayerId: string,
      minZoom: number,
      maxZoom: number,
      lineColor: string,
      linWidth: number,
      lineOpacity: number
    ): void {
      map.addSource(sourceId, {
        type: 'vector',
        url: 'mapbox://' + mapboxTileId
      });
      map.addLayer(
        {
          "id": layerId,
          "minzoom": minZoom,
          "maxzoom": maxZoom,
          "type": "line",
          "paint": {
            "line-color": lineColor,
            "line-width": linWidth,
            "line-opacity": lineOpacity
          },
          "source": sourceId,
          "source-layer": sourceLayerId
        });
    }
  
    addSymbolTileVectorLayer(
      map: mapboxgl.Map,
      imageFileName: string,
      imageName: string,
      sourceId: string,
      mapboxTileId: string,
      imageSize: number,
      layerId: string,
      sourceLayerId: string,
      minZoom: number,
      maxZoom: number
    ): void {
      map.loadImage(
        '/assets/img/map-icons/' + imageFileName,
        (error, image) => {
          if (error) throw error;
          if (image) {
            if (!map.hasImage(imageName)) map.addImage(imageName, image);
            map.addSource(sourceId, {
              type: 'vector',
              url: 'mapbox://' + mapboxTileId
            });
            map.addLayer(
              {
                "id": layerId,
                "minzoom": minZoom,
                "maxzoom": maxZoom,
                "type": "symbol",
                'layout': {
                  'icon-image': imageName,
                  'icon-size': imageSize,
                  //'icon-allow-overlap': true,
                  "icon-anchor": 'bottom',
                  'visibility': 'visible',
                  //'icon-rotate': ['get', 'bearing']
                },
                //"filter": ["<=", ["distance-from-center"], 0.5],
  
                "source": sourceId,
                "source-layer": sourceLayerId
              });
          }
        });
    }
  
  
    addSymbolOSMLayer(
      map: mapboxgl.Map,
      imageFileName: string,
      imageName: string,
      sourceId: string,
      imageSize: number,
      layerId: string,
      minZoom: number,
      maxZoom: number,
      labelPropertyIndex: string,
      categoryName: string,
      category: any
    ): void {
      map.loadImage(
        '/assets/img/map-icons/' + imageFileName,
        (error, image) => {
          if (error) throw error;
          if (image) {
            if (!map.hasImage(imageName)) map.addImage(imageName, image);
            map.addLayer(
              {
                "id": layerId,
                'slot': 'middle',
                "minzoom": minZoom,
                "maxzoom": maxZoom,
                "type": "symbol",
                'paint': {
                  'text-color': '#ffffff',
                  'text-halo-color': '#000000',
                  'text-halo-width': 0.5,
                  'text-halo-blur': 0.7,
                  'text-opacity': 1
                },
                'layout': {
                  'icon-image': imageName,
                  'icon-size': imageSize,
                  //'icon-allow-overlap': true,
                  "icon-anchor": 'bottom',
                  'visibility': 'visible',
                  'text-field': ['get', labelPropertyIndex],
                  'text-justify': 'center',
                  'text-offset': [0, 0.3],
                  'text-anchor': 'top'
  
                  //'icon-rotate': ['get', 'bearing']
                },
                //"filter": ["<=", ["distance-from-center"], 0.5],
  
                "source": sourceId,
              });
            map.on('click', layerId, function (e) {
              if (e.features && e.features[0] && e.features[0].properties && e.features[0].geometry.type == "Point") {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const properties = e.features[0].properties;
  
                // Ensure that if the map is zoomed out such that multiple copies of the feature are visible,
                // the popup appears over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                  coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }
                const feature = e.features[0];
                if (!feature.properties || feature.geometry.type != "Point") return;
                const place: Place = {
                  label: feature.properties[labelPropertyIndex] as string,
                  addressNumber: "",
                  country: "",
                  municipality: "",
                  neighborhood: "",
                  postalCode: "",
                  region: "",
                  street: "",
  
                  geometry: {
                    point: [
                      feature.geometry.coordinates[0], // Longitude
                      feature.geometry.coordinates[1]  // Latitude
                    ]
                  }
                };
                let topHTML = '<ion-icon class="bookmarkIcon" onclick="window.homePage.addBookmark(\'' + feature.id + '\')" name="star-outline" size="big" color="warning"> </ion-icon>';
  
                topHTML += '<h6>' + place.label + '</h6>';
  
                topHTML += '<h7>' + categoryName + '</h7>';
                const description = Object.keys(properties).map(key => {
                  return `<p>${key}: ${properties[key]}</p>`;
                }).join('');
                let innerHtml = topHTML + '<div id="destinationDetails">' + description + '</div>';
                //innerHtml += '<br><input type="button" id="cancelTripButtonPopUp" value="Cerrar" ></input>';
                innerHtml += '<div class="flexEqualRow"><ion-icon onclick="window.mapService.closeOSMpopup(\'' + feature.id + '\')" name="close-circle-outline" size="big" color="danger" > </ion-icon>';
  
                const self = ((window as any).mapService as MapService);
                //innerHtml += '<input type="button" id="infoButtonPopUp" value="INFO" onclick="window.homePage.openInfoModalOSM(\'' + feature.id + '\')"></input>';
                innerHtml += '<ion-icon  onclick="window.homePage.openInfoModalOSM(\'' + feature.id + '\')" name="information-circle-outline" size="big" color="secondary" > </ion-icon>';
  
                if (!self.isTripStarted) {
                  //innerHtml += '<input type="button" id="startTripButtonPopUp" value="Buscar ruta" onclick="window.mapService.setDestinationOSM(\'' + feature.id + '\')"></input>';
                  innerHtml += '<ion-icon  onclick="window.mapService.setDestinationOSM(\'' + feature.id + '\')" name="navigate-circle-outline" size="big" color="success" > </ion-icon>';
  
                } else {
                  //innerHtml += '<input type="button" id="startTripButtonPopUp" value="Buscar ruta nueva" onclick="window.homePage.setDestinationOSMifAbortCurrent(\'' + feature.id + '\')"></input>';
                  innerHtml += '<ion-icon  onclick="window.homePage.setDestinationOSMifAbortCurrent(\'' + feature.id + '\')" name="navigate-circle-outline" size="big" color="success" > </ion-icon>';
  
                }
                innerHtml += '</div>';
  
  
                const featurePopup = new mapboxgl.Popup({ closeOnClick: true, offset: 0, closeButton: true })
                  .setLngLat(coordinates as mapboxgl.LngLatLike)
                  .setHTML(innerHtml);
                featurePopup.addClassName('osmFeaturePopUp');
                if (self.popups.length > 0) {
                  if (self.popups.includes(featurePopup)) self.popups[feature.id as number].remove();
                }
                feature.properties['category'] = category;
                //featurePopup.addTo(map);
                self.popups[feature.id as number] = featurePopup;
                self.osmFeatures[feature.id as number] = feature;
                self.osmPlaces[feature.id as number] = place;
  
                const iconElement = document.querySelector(`[data-id="${feature.id}"]`);
                if (iconElement) {
                  iconElement.classList.toggle('highlight-icon');
                }
                ((window as any).homePage as HomePage).openOsmModal(feature.id as number);
               map.flyTo({
                  center: [coordinates[0], coordinates[1]]
                });
              }
            });
          }
        })
    };
  


/*********************************************************************************
 * 
 * 
 * 
 * 
 * 
 */





  /** THREEBOX MODELS */
  set3D(){
    const self:MapService = ((window as any).mapService as MapService);
    const map = ((window as any).mapService as MapService).getMap();

     map.addLayer({
      id: '3dLocatorPukLayer',
      type: 'custom',
      renderingMode: '3d',
      slot:'top',
      onAdd: async function (map, mbxContext) {
        (window as any).setUtils(map, map.getCanvas().getContext('webgl'));
        self.tb = (window as any).tb;

         var options = {
          type: environment.locatorDefault.type,
          obj: environment.locatorDefault.obj,
          scale: environment.locatorDefault.scale,
          units: environment.locatorDefault.units,
          anchor: environment.locatorDefault.anchor,
          rotation: environment.locatorDefault.rotation, //rotation to postiion the truck and heading properly

        }

         const added = await self.tb.loadObj(options, function (model:any) {
          if(!self.carModel){
            let origin=[0,0];
            if(self.extendGeoService().getLastCurrentLocation())origin = [self.extendGeoService().getLastCurrentLocation().coords.longitude,self.extendGeoService().getLastCurrentLocation().coords.latitude];
            self.carModel = model.setCoords(origin);
            //self.carModel.addEventListener('ObjectChanged', self.onModelChanged, false);
            self.tb.add(self.carModel);
          }else{
            //self.carModel.addEventListener('ObjectChanged', self.onModelChanged, false);
            self.tb.add(self.carModel);
          }
          self.tb.update();

        });

      },

      render: function (gl:any, matrix:any) {
        self.tb.update();
        //self.mapbox.triggerRepaint();

      }
    });
  }

  async setLocator(locator:any){
    const self:MapService = ((window as any).mapService as MapService);
    const map = ((window as any).mapService as MapService).getMap();
    const options = locator.options;
    const origin=self.carModel.coordinates;
    const rotation = self.carModel.rotation;
    self.tb.remove(self.carModel);

    await self.tb.loadObj(options, function (model:any) {
      self.carModel = model.setCoords(origin);
      //self.carModel.addEventListener('ObjectChanged', self.onModelChanged, false);
      self.tb.add(self.carModel);
      if(locator.id==='redarrow'){
        document.body.classList.remove('noCircle');
      }else{
        document.body.classList.remove('noCircle');
        document.body.classList.add('noCircle');
      }
    });
    if(self.carModel){
      self.carModel.setRotation(rotation);
    }
    self.tb.update();

  }


}
