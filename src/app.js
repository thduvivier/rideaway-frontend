// imports
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'whatwg-fetch';
import _ from 'lodash';
import 'l20n';

import icons from './icons';
import { urls, center } from './constants';

import { startTracking } from './modules/geolocation';
import {
  addFilters,
  configureAllElements,
  showNavigationBox,
  hideNavigationBox
} from './modules/domManipulations';
import { findGetParameter, swapArrayValues } from './modules/lib';
import { toggleLayer, clearRoutes } from './modules/mapManipulations';
import * as OfflinePluginRuntime from 'offline-plugin/runtime';
OfflinePluginRuntime.install();

import './scss/styles.scss';

// Global variables
let places = {
  origin: null,
  destination: null,
  userPosition: null
};

// Global handlers
let handlers = {
  nav: null
};

// Set origin and destination from url params
const loc1 = findGetParameter('loc1');
const loc2 = findGetParameter('loc2');
if (loc1 && loc2) {
  places.origin = swapArrayValues(
    loc1.split(',').map(coord => parseFloat(coord))
  );
  places.destination = swapArrayValues(
    loc2.split(',').map(coord => parseFloat(coord))
  );
}

document.querySelector('.center-btn--icon').src = icons.Center;
document.querySelector('.nav-white').src = icons.NavWhite;

// Create a mapbox
mapboxgl.accessToken = '';
const map = new mapboxgl.Map({
  container: 'map', // container id
  style: urls.mapStyle, //stylesheet location
  center: center.latlng, // starting position
  zoom: center.zoom, // starting zoom
  attributionControl: false
});

/*
* Fetch a JSON
* @param String url - The url to fetch from
* @returns Object json - The fetched JSON
*/
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.json())
      .then(json => resolve(json))
      .catch(ex => reject(ex));
  });
}

/*
* Adds the filters and adds all of the routes to the map
* @param Object geojson - The geojson routes to add
*/
function addAllRoutes(geojson) {
  // Add filters for the routes
  addFilters(geojson.features);

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
      'text-field': '{icr}',
      'text-size': 16
    },
    paint: {
      'text-color': {
        type: 'identity',
        property: 'colour'
      }
    }
  });

  // Remove the loading screen
  document.querySelector('.main-loading').style.display = 'none';
}

/*
* Adds a yellow marker to the map
* @param Array[int, int] LatLng - The coords
* @returns mapboxgl.Marker marker - The marker
*/
function addMarker(LatLng) {
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

  // Return marker so we can reuse it
  return new mapboxgl.Marker(el, {
    offset: [0, -marker.properties.iconSize[1] / 2]
  }).setLngLat(marker.geometry.coordinates);
}

/*
* Calculates a route and shows it on the map
* @param Array[int, int] origin - The LatLng Coords
* @param Array[int, int] destination - The LagLng Coords
* @param String profile - The routing profile
*/
function calculateRoute(origin, destination, profile) {
  // Swap around values for the API
  const originS = swapArrayValues(origin);
  const destinationS = swapArrayValues(destination);

  // Construct the url
  const url = `${urls.route}/route?loc1=${originS}&loc2=${destinationS}&profile=${profile}`;
  fetchJSON(url).then(json => {
    // Check if profile already exists
    const calculatedRoute = map.getSource(profile);
    if (calculatedRoute) {
      // Just set the data
      calculatedRoute.setData(url);
    } else {
      // Add a new layer
      map.addLayer({
        id: profile,
        type: 'line',
        source: {
          type: 'geojson',
          data: json.route
        },
        paint: {
          'line-color':
            profile === 'shortest'
              ? 'lightgrey'
              : {
                  type: 'identity',
                  property: 'colour'
                },
          'line-width': 4
        },
        layout: {
          'line-cap': 'round'
        }
      });
    }

    // Move the network layer always on top
    if (profile === 'shortest' && map.getSource('brussels')) {
      map.moveLayer('shortest', 'brussels');
    }

    // If the profile is brussels, initiate the nav stuff
    if (profile === 'brussels') {
      const oldHandler = handlers.nav;

      // Set the new handler
      handlers.nav = () => {
        const { origin, destination } = places;
        const originS = [origin[1], origin[0]];
        const destinationS = [destination[1], destination[0]];

        location.href = `navigation.html?loc1=${originS}&loc2=${destinationS}`;
      };

      const lastFeature = json.route.features[json.route.features.length - 1];
      const { properties: { distance, time } } = lastFeature;

      // Always hide the layers
      toggleLayer(map, 'GFR_routes', 'none');
      toggleLayer(map, 'GFR_symbols', 'none');
      document.querySelector('.routelist-none').click();

      // Show the navigation box, change the handler
      showNavigationBox(oldHandler, handlers.nav, distance, time);

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
      map.fitBounds(bbox, {
        padding: 150
      });
    }
  });
}

/*
* Returns a geocoder object
* @param String placeholder - The placeholder for the geocoder
* @returns MapboxGeocoder geocoder - The geocoder
*/
function createGeocoder(placeholder) {
  return new MapboxGeocoder({
    accessToken:
      'pk.eyJ1IjoiYXJuYXVkd2V5dHMiLCJhIjoiY2o0cGt3d3oxMXl0cDMzcXNlbThnM3RtaCJ9.BMUyxqHH-FC69pW4U4YO9A',
    flyTo: false,
    placeholder,
    country: 'BE',
    bbox: [4.225015, 50.74915, 4.524909, 50.938001]
  });
}

/*
* Set the data attribute on the geocoders for the translations
*/
function configureGeocoders() {
  const inputs = document.querySelectorAll('.mapboxgl-ctrl-geocoder input');
  inputs.forEach(input => {
    input.setAttribute('data-l10n-id', `${input.placeholder}-input`);
  });
}

/*
* Converts a result object to coordinates
* @param Object{result: {geometry: coordinates: Array[Lat, Lng]}} result - The result from the geocoder
* @returns Array[int, int] LatLng Array - Array with the coords
*/
function setPoint(result) {
  return result.geometry.coordinates;
}

/*
* Updates the position variable and holds some other functions
* @param Array[int, int] position - The position of the user
*/
function updatePosition(position) {
  // hide loader icon and show center button
  if (!places.userPosition) {
    window.userLocated = true;
    document.querySelector(
      '.center-btn .sk-spinner.sk-spinner-pulse'
    ).style.display =
      'none';
    document.querySelector('.center-btn--icon').style.display = 'block';
    document.querySelector('.center-btn').disabled = false;
  }
  places.userPosition = position;
}

/*
* Sets the origin/dest as the userPosition
* @param string place - Origin/Destination
*/
function setPlace(place) {
  places[place] = places.userPosition;
}

// Executes when the map loaded
map.on('load', function() {
  // Change the position of the copyright controls
  map.addControl(new mapboxgl.AttributionControl(), 'bottom-left');

  // Initialize the markers
  let markerO = null;
  let markerD = null;

  // Start stracking the user
  startTracking(map, updatePosition);

  // Show all the routes on the map
  fetchJSON(urls.network).then(json => addAllRoutes(json));

  // If the origin & destination were passed, calculate a route
  if (places.origin && places.destination) {
    const { origin, destination } = places;
    calculateRoute(origin, destination, 'shortest');
    calculateRoute(origin, destination, 'brussels');
  }

  // Create geocoders and add to map
  const geocoder = createGeocoder('origin');
  const geocoder2 = createGeocoder('destination');
  map.addControl(geocoder);
  map.addControl(geocoder2);
  // Configure the geocoders
  configureGeocoders();

  // Configure all the other elements
  configureAllElements(map, setPlace);

  // Fire functions on result
  geocoder.on('result', ({ result }) => {
    // result event fires twice for some reason, this prevents it
    // from executing our code twice, resulting in errors
    // https://github.com/mapbox/mapbox-gl-geocoder/issues/99
    if (!places.origin || places.origin !== setPoint(result)) {
      markerO && markerO.remove();
      places.origin = setPoint(result);
      markerO = addMarker(places.origin);
      markerO.addTo(map);

      // Calculate route if destination is filled in
      if (places.destination) {
        calculateRoute(places.origin, places.destination, 'shortest');
        calculateRoute(places.origin, places.destination, 'brussels');
      }
    }
  });
  geocoder2.on('result', ({ result }) => {
    if (!places.destination || places.destination !== setPoint(result)) {
      markerD && markerD.remove();
      places.destination = setPoint(result);
      markerD = addMarker(places.destination);
      markerD.addTo(map);

      if (places.origin) {
        calculateRoute(places.origin, places.destination, 'shortest');
        calculateRoute(places.origin, places.destination, 'brussels');
      }
    }
  });
  // Functions fired when the geocoder is cleared
  geocoder.on('clear', () => {
    clearRoutes(map, markerO);
    places.origin = null;
    hideNavigationBox();
  });
  geocoder2.on('clear', () => {
    clearRoutes(map, markerD);
    places.destination = null;
    hideNavigationBox();
  });

  // Configure the center button
  document.querySelector('.center-btn').addEventListener('click', () => {
    places.userPosition &&
      map.flyTo({
        center: places.userPosition,
        zoom: [15]
      });
  });
});
