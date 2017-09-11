import mapboxgl from 'mapbox-gl';

import icons from '../../icons';
import { urls, center } from '../../constants';

/*
* @constructor
*/
export default class MapController {
  constructor(map) {
    this.map = map;
    this.mapObjects = {
      originMarker: null,
      destinationMarker: null,
      shortestPopup: null
    };

    // Create a mapbox
    mapboxgl.accessToken = '';
    this.map = new mapboxgl.Map({
      container: 'map', // container id
      style: urls.mapStyle, //stylesheet location
      center: center.latlng, // starting position
      zoom: center.zoom, // starting zoom
      attributionControl: false
    });
  }

  /*
  * Filters out the routes to a single route
  * @param map mapboxglmap - The map
  * @param route String
  */
  filterRoutes(inactives) {
    const map = this.map;
    // Filters, also filter out a/b routes
    const filter = ['all'];
    inactives.forEach(inactive => {
      filter.push(
        ['!=', 'ref', inactive],
        ['!=', 'ref', inactive + 'a'],
        ['!=', 'ref', inactive + 'b']
      );
    });
    map.setFilter('GFR_routes', filter);
    map.setFilter('GFR_symbols', filter);
    map.setLayoutProperty('GFR_routes', 'visibility', 'visible');
    map.setLayoutProperty('GFR_symbols', 'visibility', 'visible');
  }

  /*
  * Removes all the filters from the map
  * @param map mapboxglmap - The map
  */
  removeFilter() {
    const map = this.map;

    this.toggleLayer('GFR_routes', 'visible');
    this.toggleLayer('GFR_symbols', 'visible');
    map.setFilter('GFR_routes', null);
    map.setFilter('GFR_symbols', null);
  }

  /*
  * Clears the calculated routes
  */
  clearRoutes() {
    const map = this.map;

    if (map.getSource('brussels')) {
      map.removeLayer('brussels');
      map.removeSource('brussels');
    }
    if (map.getSource('shortest')) {
      map.removeLayer('shortest');
      map.removeSource('shortest');
    }
  }

  /*
  * Clears a map object
  * @param string identifier - Object identifier
  */
  clearMapObject(identifier) {
    this.mapObjects[identifier] && this.mapObjects[identifier].remove();
    this.mapObjects[identifier] = null;
  }

  /*
  * Clears the mapobjects following the passed identifiers
  * @param Array<string> identifiers - identifiers
  */
  clearMapObjects(identifiers) {
    identifiers.forEach(identifier => {
      this.clearMapObject(identifier);
    });
  }

  /*
  * Clears all map objects
  */
  clearAllMapObjectsAndRoutes() {
    this.clearRoutes();
    Object.keys(this.mapObjects).forEach(key => {
      this.clearMapObject(key);
    });
  }

  /*
  * Swaps around the origin and destination marker
  */
  swapOriginDestMarkers() {
    const originMarker = this.mapObjects.markerOrigin;
    this.mapObjects.markerOrigin = this.mapObjects.markerDest;
    this.mapObjects.markerDest = originMarker;
  }

  /*
  * Toggles the visibility of a layer
  * @param mapboxglmap map - The map
  * @param string id - The id of the layer
  * @param boolean showLayer - Force hide/show
  */
  toggleLayer(id, showLayer) {
    const map = this.map;

    let visibility;
    if (showLayer === undefined) {
      visibility = map.getLayoutProperty(id, 'visibility');
      if (visibility === 'visible') {
        visibility = 'none';
      } else {
        visibility = 'visible';
      }
    } else {
      visibility = showLayer;
    }
    map.setLayoutProperty(id, 'visibility', visibility);
  }

  /*
* Adds the filters and adds all of the routes to the map
* @param Object geojson - The geojson routes to add
*/
  addAllRoutes(geojson) {
    const map = this.map;

    // Add source
    map.addSource('GFR', {
      type: 'geojson',
      data: geojson
    });

    // Add layer
    map.addLayer({
      id: 'GFR_routes',
      type: 'line',
      source: 'GFR',
      layout: {
        visibility: 'visible'
      },
      paint: {
        'line-color': {
          type: 'identity',
          property: 'colour'
        },
        'line-width': 5,
        'line-opacity': 0.3
      }
    });

    // Add layer with route symbols
    map.addLayer({
      id: 'GFR_symbols',
      type: 'symbol',
      source: 'GFR',
      layout: {
        visibility: 'visible',
        'symbol-placement': 'line',
        'text-font': ['Open Sans Regular'],
        'text-field': '{ref}',
        'text-size': 16
      },
      paint: {
        'text-color': {
          type: 'identity',
          property: 'colour'
        }
      }
    });
  }

  /*
  * Adds a yellow marker to the map
  * @param Array[int, int] LatLng - The coords
  * @returns mapboxgl.Marker marker - The marker
  */
  addMarker(place, LatLng) {
    // create Geojson with the coords
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: LatLng
          },
          properties: {
            iconSize: [50, 50]
          }
        }
      ]
    };

    // Configure HTML marker
    const marker = geojson.features[0];
    let el = document.createElement('img');
    el.className = 'marker';
    el.src = icons.LocatorYellow;
    el.style.width = marker.properties.iconSize[0] + 'px';
    el.style.height = marker.properties.iconSize[1] + 'px';

    this.mapObjects[`${place}Marker`] = new mapboxgl.Marker(el, {
      offset: [0, -marker.properties.iconSize[1] / 2]
    })
      .setLngLat(marker.geometry.coordinates)
      .addTo(this.map);
  }

  addPopup(LatLng, text) {
    var div = window.document.createElement('div');
    div.innerHTML = text;

    this.mapObjects.shortestPopup = new mapboxgl.Popup({ closeOnClick: false })
      .setLngLat(LatLng)
      .setDOMContent(div)
      .addTo(this.map);
  }

  fitToBounds(origin, destination) {
    // sets the bounding box correctly
    let bbox = [];
    if (origin[0] > destination[0] && origin[1] > destination[1]) {
      bbox = [destination, origin];
    } else if (origin[0] < destination[0] && origin[1] > destination[1]) {
      bbox = [[origin[0], destination[1]], [destination[0], origin[1]]];
    } else if (origin[0] > destination[0] && origin[1] < destination[1]) {
      bbox = [[destination[0], origin[1]], [origin[0], destination[1]]];
    } else {
      bbox = [origin, destination];
    }

    // Fit the map to the route
    this.map.fitBounds(bbox, {
      padding: {
        top: 200,
        right: 50,
        bottom: 200,
        left: 50
      }
    });
  }
}
