// imports
import mapboxgl from 'mapbox-gl';
import 'whatwg-fetch';
import 'l20n';

// eslint-disable-next-line
require('add-to-homescreen');

import icons from './icons';
import { urls } from './constants';

import { findGetParameter, swapArrayValues, fetchJSON } from './modules/lib';

import MapController from './modules/controllers/MapController';
import GeolocationController from './modules/controllers/GeolocationController';

import { createGeocoder } from './modules/controllers/GeocoderController';
import initializeNav from './modules/controllers/NavigationController';

import View from './modules/views/View';

import * as OfflinePluginRuntime from 'offline-plugin/runtime';
// eslint-disable-next-line
if (process.env.NODE_ENV === 'PROD') {
  OfflinePluginRuntime.install();
}

import './scss/styles.scss';

// Global variables
let places = {
  origin: null,
  destination: null,
  userPosition: null
};

// Initialize the markers
let markers = {
  origin: null,
  destination: null
};

// Global handlers
let handlers = {
  nav: null
};

if (location.hash.includes('#nav')) {
  showNavigation();
} else {
  showRouteplanning();
}

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

// show dialog to add to homescreen
window.addToHomescreen({
  skipFirstVisit: true,
  startDelay: 5,
  maxDisplayCount: 1
});

document.querySelector('.center-btn--icon').src = icons.Center;
document.querySelector('.nav-white').src = icons.NavWhite;

function showNavigation() {
  initializeNav();
  document.querySelector('.routeplanner').classList.remove('visible');
  document.querySelector('.main-loading').classList.add('visible');
  document.querySelector('.navigation').classList.add('visible');
}

function showRouteplanning() {
  document.querySelector('.navigation').classList.remove('visible');
  document.querySelector('.routeplanner').classList.add('visible');
}

/*
* Calculates route for every profile passed
* @param Object{origin: Array[int, int], destination: Array[int, int]} places - Origin / Dest
* @param Array[string] profiles - Array of the profiles
*/
function calculateProfiles(places, profiles) {
  const { origin, destination } = places;
  profiles.forEach(profile => {
    calculateRoute(origin, destination, profile);
  });
}

/*
* Calculates a route and shows it on the map
* @param Array[int, int] origin - The LatLng Coords
* @param Array[int, int] destination - The LagLng Coords
* @param String profile - The routing profile
*/
function calculateRoute(origin, destination, profile) {
  // Clear routes just to be sure
  mapController.clearRoutes();

  // Swap around values for the API
  const originS = swapArrayValues(origin);
  const destinationS = swapArrayValues(destination);

  // Construct the url
  const url = `${urls.route}/route?loc1=${originS}&loc2=${destinationS}&profile=${profile}`;

  fetchJSON(url)
    .then(json => {
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

          history.pushState(
            '',
            'Navigation',
            `#nav?loc1=${originS}&loc2=${destinationS}`
          );
          showNavigation();
        };

        const lastFeature = json.route.features[json.route.features.length - 1];
        const { properties: { distance, time } } = lastFeature;

        // Always hide the layers
        mapController.toggleLayer('GFR_routes', 'none');
        mapController.toggleLayer('GFR_symbols', 'none');

        // Activate none
        document.querySelector('.routelist-none').click();

        // Show the navigation box, change the handler
        view.showNavigationBox(oldHandler, handlers.nav, distance, time);

        mapController.fitToBounds(origin, destination);
      }
    })
    .catch(ex => {
      // eslint-disable-next-line
      console.warn('Problem finding a route: ' + ex);
      view.toggleErrorDialog();
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
* Sets the origin/dest as the userPosition on default
* if placeToSet is null, it clears the route
* @param string place - Origin/Destination
*/
function setPlace(place, placeToSet = places.userPosition) {
  places[place] = placeToSet;
  if (placeToSet === null) {
    mapController.clearRoutes(map, markers[place]);
    view.hideNavigationBox();
  }
  const { origin, destination } = places;
  if (origin && destination) {
    calculateProfiles({ origin, destination }, ['shortest', 'brussels']);
  }
}

let map;
const mapController = new MapController(map);
const geolocController = new GeolocationController();
const view = new View(mapController, geolocController);
map = mapController.map;

// Executes when the map loaded
map.on('load', function() {
  // Change the position of the copyright controls
  map.addControl(new mapboxgl.AttributionControl(), 'bottom-left');

  // Start stracking the user
  geolocController.startTracking(map);

  // Show all the routes on the map
  fetchJSON(urls.network).then(json => {
    view.addFilters(json.features);
    mapController.addAllRoutes(json);
  });

  // If the origin & destination were passed, calculate a route
  if (places.origin && places.destination) {
    const { origin, destination } = places;
    calculateProfiles({ origin, destination }, ['shortest', 'brussels']);
  }

  // Create geocoders and add to map
  const geocoder = createGeocoder('origin');
  const geocoder2 = createGeocoder('destination');
  map.addControl(geocoder);
  map.addControl(geocoder2);

  // Configure all elements (geocoder, inputs, etc)
  view.configureAllElements(setPlace);

  // Fire functions on result
  // !!!!! Geocoder also fires this when the input box is unfocused
  // See configureInputs in domManipulations
  // Because we're clearing the marker and destination
  // It recalculates the route...
  // => weird behaviour when you unfocus after manually emptying the input
  // p l s use a different geocoder
  geocoder.on('result', ({ result }) => {
    // result event fires twice for some reason, this prevents it
    // from executing our code twice, resulting in errors
    // https://github.com/mapbox/mapbox-gl-geocoder/issues/99
    if (!places.origin || places.origin !== setPoint(result)) {
      markers.origin && markers.origin.remove();
      places.origin = setPoint(result);
      markers.origin = mapController.addMarker(places.origin);
      markers.origin.addTo(map);

      // Calculate route if destination is filled in
      if (places.destination) {
        const { origin, destination } = places;
        calculateProfiles({ origin, destination }, ['shortest', 'brussels']);
      }
    }
  });
  geocoder2.on('result', ({ result }) => {
    if (!places.destination || places.destination !== setPoint(result)) {
      markers.destination && markers.destination.remove();
      places.destination = setPoint(result);
      markers.destination = mapController.addMarker(places.destination);
      markers.destination.addTo(map);

      if (places.origin) {
        calculateRoute(places.origin, places.destination, 'shortest');
        calculateRoute(places.origin, places.destination, 'brussels');
      }
    }
  });
  // Functions fired when the geocoder is cleared
  geocoder.on('clear', () => {
    mapController.clearRoutes(markers.origin);
    places.origin = null;
    view.hideNavigationBox();
  });
  geocoder2.on('clear', () => {
    mapController.clearRoutes(markers.destination);
    places.destination = null;
    view.hideNavigationBox();
  });

  view.configureCenterButton();
});
