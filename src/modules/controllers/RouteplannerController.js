import mapboxgl from 'mapbox-gl';

import { urls } from '../../constants';

import { swapArrayValues, fetchJSON, displayTime } from '../lib';

import MapController from './MapController';
import GeolocationController from './GeolocationController';
import { createGeocoder, getReverseLookup } from './GeocoderController';
import View from '../views/RouteplannerView';

import router from '../../router';

// Global variables
let places = {
  origin: null,
  destination: null
};

// Global handlers
let handlers = {
  nav: null
};

let map;
let mapController;
let geolocController;
let view;

export default function initialize(origin, destination) {
  // fresh load
  if (!map) {
    if (origin && destination) {
      origin = swapArrayValues(origin);
      destination = swapArrayValues(destination);
      places.origin = origin;
      places.destination = destination;
    }

    mapController = new MapController(map);
    geolocController = new GeolocationController();
    view = new View(mapController, geolocController);
    map = mapController.map;
    bindActions();
  } else {
    if (!origin || !destination) {
      clearAll();
    }
  }
}

export function clearAll() {
  view.hideNavigationBox();
  mapController.clearAllMapObjectsAndRoutes();
  document.querySelector('.routelist-all').click();
  view.clearGeocoderInputs();
  places.origin = null;
  places.destination = null;
}

/*
* Calculates route for every profile passed
* @param Object{origin: Array[int, int], destination: Array[int, int]} places - Origin / Dest
* @param Array[string] profiles - Array of the profiles
*/
function calculateProfiles(places, profiles) {
  view.toggleMapLoading();
  // Clear routes just to be sure
  mapController.clearRoutes();
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

      if (profile === 'shortest') {
        const lastFeature = json.route.features[json.route.features.length - 1];
        const { properties: { time } } = lastFeature;
        const text = displayTime(time);
        const middleFeature =
          json.route.features[Math.round(json.route.features.length / 2)];
        const LatLng = middleFeature.geometry.coordinates[0];
        mapController.addPopup(LatLng, text);
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

          router.goToNavigation(
            swapArrayValues(origin),
            swapArrayValues(destination)
          );
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

        // hide the loading icon
        view.toggleMapLoading();
      }
    })
    .catch(ex => {
      // eslint-disable-next-line
      console.warn('Problem calculating route: ', ex);
      if (profile === 'brussels') {
        view.toggleMapLoading();
        view.toggleErrorDialog();
      }
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
function setPlace(place, placeToSet = geolocController.userPosition) {
  // switches around origin and destination
  if (placeToSet === 'origin' || placeToSet === 'destination') {
    // swap variables
    const oldPlace = places[place];
    places[place] = places[placeToSet];
    places[placeToSet] = oldPlace;

    mapController.swapOriginDestMarkers();
  } else if (placeToSet === null) {
    mapController.clearAllMapObjectsAndRoutes();
    view.hideNavigationBox();
  } else {
    // set userposition as place
    places[place] = placeToSet;
  }
  const { origin, destination } = places;
  if (origin && destination) {
    // remove popup
    mapController.clearMapObject('shortestPopup');

    router.prepareHistory(origin, destination);
    calculateProfiles({ origin, destination }, ['shortest', 'brussels']);
  }
}

function onPlaceClear(place) {
  mapController.clearRoutes();
  mapController.clearMapObjects([`${place}Marker`, 'shortestPopup']);
  places[place] = null;
  view.hideNavigationBox();
}

function onPlaceResult(place, result) {
  // result event fires twice for some reason, this prevents it
  // from executing our code twice, resulting in errors
  // https://github.com/mapbox/mapbox-gl-geocoder/issues/99
  if (!places[place] || places[place] !== setPoint(result)) {
    mapController.clearMapObject(`${place}Marker`);
    places[place] = setPoint(result);
    mapController.addMarker(place, places[place]);

    // Calculate route if both are filled in
    if (places.origin && places.destination) {
      const { origin, destination } = places;
      // prepare the url
      router.prepareHistory(origin, destination);
      calculateProfiles(
        {
          origin,
          destination
        },
        ['shortest', 'brussels']
      );
    }
  }
}

function setMapClick(map) {
  map.on('click', e => {
    const LngLat = [e.lngLat.lng, e.lngLat.lat];
    // don't set if we already have a route
    if (places.origin && places.destination) {
      return;
    }
    // prepare result for function
    const result = { geometry: { coordinates: LngLat } };
    if (!places.origin) {
      getReverseLookup(LngLat).then(result =>
        view.setGeocoderInput('origin', result)
      );
      onPlaceResult('origin', result);
    } else {
      getReverseLookup(LngLat).then(result =>
        view.setGeocoderInput('destination', result)
      );
      onPlaceResult('destination', result);
    }
  });
}

function bindActions() {
  const routeChosen = places.origin && places.destination;

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

      routeChosen && mapController.toggleLayer('GFR_routes', 'none');
      routeChosen && mapController.toggleLayer('GFR_symbols', 'none');

      // If the origin & destination were passed, calculate a route
      if (places.origin && places.destination) {
        const { origin, destination } = places;
        mapController.addMarker('origin', origin);
        mapController.addMarker('destination', destination);
        calculateProfiles(
          {
            origin,
            destination
          },
          ['shortest', 'brussels']
        );
      }
    });

    // Create geocoders and add to map
    const geocoder = createGeocoder('origin');
    const geocoder2 = createGeocoder('destination');
    map.addControl(geocoder);
    map.addControl(geocoder2);

    // Configure all elements (geocoder, inputs, etc)
    view.configureAllElements(setPlace);

    if (routeChosen) {
      getReverseLookup(places.origin).then(result =>
        view.setGeocoderInput('origin', result)
      );
      getReverseLookup(places.destination).then(result =>
        view.setGeocoderInput('destination', result)
      );
    }

    // Fire functions on result
    // !!!!! Geocoder also fires this when the input box is unfocused
    // See configureInputs in domManipulations
    // Because we're clearing the marker and destination
    // It recalculates the route...
    // => weird behaviour when you unfocus after manually emptying the input
    // p l s use a different geocoder
    geocoder.on('result', ({ result }) => {
      onPlaceResult('origin', result);
    });
    geocoder2.on('result', ({ result }) => {
      onPlaceResult('destination', result);
    });
    // Functions fired when the geocoder is cleared
    geocoder.on('clear', () => {
      onPlaceClear('origin');
    });
    geocoder2.on('clear', () => {
      onPlaceClear('destination');
    });

    setMapClick(map);

    view.configureCenterButton();
  });
}
