import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'whatwg-fetch';
import _ from 'lodash';

import icons from './icons';

import { getElementByClassName } from './modules/lib';
import { startTracking } from './modules/geolocation';
//import { registerEvents } from './events';
import './scss/styles.scss';

const routeConfig = {
  All: 'all',
  '1': 'radial',
  '2': 'radial',
  '3': 'radial',
  '4': 'radial',
  '5': 'radial',
  '6': 'radial',
  '7': 'radial',
  '8': 'radial',
  '9': 'radial',
  '10': 'radial',
  '11': 'radial',
  '12': 'radial',
  MM: 'transverse',
  SZ: 'transverse',
  CK: 'transverse',
  PP: 'transverse',
  A: 'loop',
  B: 'loop',
  C: 'loop'
};

mapboxgl.accessToken = '';
const map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'https://openmaptiles.github.io/positron-gl-style/style-cdn.json', //stylesheet location
  center: [4.355975, 50.860633], // starting position
  zoom: 11 // starting zoom
});

/*
* Uses fetch to get the JSON
* Calls addAllRoutes(json)
*/
function showAllRoutes() {
  fetch('https://cyclerouting-api.osm.be/routes/GFR.json')
    .then(response => response.json())
    .then(json => {
      addAllRoutes(json);
    })
    .catch(ex => console.log(ex));
}

/*
* Adds the filters and adds all of the routes to the map
*/
function addAllRoutes(geojson) {
  addFilters(geojson.features);

  map.addSource('GFR', {
    type: 'geojson',
    data: geojson
  });

  // actual routes
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

  // route identifiers
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
}

function toggleLayer(id, showLayer) {
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
* Adds a yellow marker to the map
* @param LatLng Array[Lat, Lng]
*/
function addMarker(LatLng) {
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
  const marker = geojson.features[0];
  let el = document.createElement('img');
  el.className = 'marker';
  el.src = icons.LocatorYellow;
  el.style.width = marker.properties.iconSize[0] + 'px';
  el.style.height = marker.properties.iconSize[1] + 'px';
  return new mapboxgl.Marker(el, {
    offset: [
      -marker.properties.iconSize[0] / 2,
      -marker.properties.iconSize[1] / 2
    ]
  }).setLngLat(marker.geometry.coordinates);
}

/*
* Calculates a route and shows it on the map
* @param origin Array[Lat, Lng]
* @param destination Array[Lat, Lng]
* @param profile String
*/
function calculateRoute(origin, destination, profile) {
  // swap around values for the API
  origin = [origin[1], origin[0]];
  destination = [destination[1], destination[0]];
  const url = `https://cyclerouting-api.osm.be/route?loc1=${origin}&loc2=${destination}&profile=${profile}`;
  // check if profile already exists
  const calculatedRoute = map.getSource(profile);
  if (calculatedRoute) {
    calculatedRoute.setData(url);
  } else {
    map.addLayer({
      id: profile,
      type: 'line',
      source: {
        type: 'geojson',
        data: url
      },
      paint: {
        'line-color': profile === 'networks' ? 'red' : 'grey',
        'line-width': 4
      }
    });
  }
}

/*
* Clears the routes
*/
function clearRoutes(marker) {
  if (map.getSource('networks')) {
    map.removeLayer('networks');
    map.removeSource('networks');
  }
  if (map.getSource('shortest')) {
    map.removeLayer('shortest');
    map.removeSource('shortest');
  }
  marker.remove();
}

/*
* Returns a geocoder object
* @param placeholder String
* @returns MapboxGeocoder object
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
* Converts a result object to coordinates
* @param result Object{result: {geometry: coordinates: Array[Lat, Lng]}}
* @returns Array[Lat, Lng]
*/
function setPoint(result) {
  return result.geometry.coordinates;
}

/*
* Filters out the routes to a single route
* @param route String
*/
function filterRoute(route) {
  map.setFilter('GFR_routes', ['==', 'icr', route]);
  map.setFilter('GFR_symbols', ['==', 'icr', route]);
  map.setLayoutProperty('GFR_routes', 'visibility', 'visible');
  map.setLayoutProperty('GFR_symbols', 'visibility', 'visible');
}

/*
* Removes all the filters from the map
*/
function removeFilter() {
  map.setFilter('GFR_routes', null);
  map.setFilter('GFR_symbols', null);
}

/*
* Configures a ListItem for the routemenu
* @param route Object{name: string, colour: string}
* @return el Element the configured html element
*/
function configureListItem(route) {
  let el = document.createElement('li');
  el.className = 'routelist-item';
  let child = document.createElement('span');
  child.innerHTML = route.name;
  el.appendChild(child);
  el.className += ' routelist-item-' + routeConfig[el.firstChild.innerHTML];
  el.style.backgroundColor = route.color;

  // event listener
  el.addEventListener('click', () => {
    const active = document.querySelector('.routelist-item--active');
    active && active.classList.remove('routelist-item--active');
    el.className += ' routelist-item--active';
    filterRoute(route.name);
  });

  return el;
}

/*
* Configures the all button
*/
function configureAll() {
  let el = getElementByClassName('routelist-all');
  el.addEventListener('click', () => {
    const active = document.querySelector('.routelist-item--active');
    active && active.classList.remove('routelist-item--active');
    el.className += ' routelist-item--active';
    removeFilter();
  });
}

/*
* Adds a filter option for every route to the menu
* @param features Array[{}] all the routes
*/
function addFilters(features) {
  // get the properties we need
  let routes = [];
  features.forEach(feat => {
    routes.push({
      name: feat.properties.icr,
      color: feat.properties.colour
    });
  });
  configureAll();
  // uniqBy to remove duplicates, sortBy to sort them in a good order
  _.sortBy(_.uniqBy(routes, 'name'), 'name').forEach(route => {
    if (route.name === 'G/C') {
      return;
    }
    const menu = getElementByClassName('routelist-' + routeConfig[route.name]);
    const el = configureListItem(route);
    menu.appendChild(el);
  });
}

function showMyLocationSuggestion(input) {
  const suggestions = input.parentElement.querySelector('.suggestions');
  // if the option doesn't exist, add it
  if (!input.parentElement.querySelector('.mylocation')) {
    const el = document.createElement('li');
    el.className = 'mylocation';
    const a = document.createElement('a');
    a.innerHTML = 'My location';
    a.addEventListener('mousedown', e => {
      input.value = 'My location';
    });
    el.appendChild(a);
    suggestions.appendChild(el);
  }
  suggestions.style.display = 'block';
}

function hideMyLocationSuggestion(input) {
  const suggestions = input.parentElement.querySelector('.suggestions');
  suggestions.style.display = 'none';
}

function setLocation(location) {
  console.log(location);
}

// executes when the map is loading
map.on('load', function() {
  getElementByClassName('marker-white').src = icons.NavWhite;
  let origin = null;
  let destination = null;
  let markerO = null;
  let markerD = null;

  // start stracking the user
  startTracking(map);

  // register any buttons
  // registerEvents(map);

  showAllRoutes();

  // create geocoders and add to map
  const geocoder = createGeocoder('origin');
  const geocoder2 = createGeocoder('destination');
  map.addControl(geocoder);
  map.addControl(geocoder2);

  // fire functions on result
  geocoder.on('result', ({ result }) => {
    // result event fires twice for some reason, this prevents it
    // from executing our code twice, resulting in errors
    // https://github.com/mapbox/mapbox-gl-geocoder/issues/99
    if (!origin || destination !== setPoint(result)) {
      markerO && markerO.remove();
      origin = setPoint(result);
      markerO = addMarker(origin);
      markerO.addTo(map);

      // calculate route if destination is filled in
      destination && calculateRoute(origin, destination, 'shortest');
      destination && calculateRoute(origin, destination, 'networks');
    }
  });
  geocoder2.on('result', ({ result }) => {
    if (!destination || destination !== setPoint(result)) {
      markerD && markerD.remove();
      destination = setPoint(result);
      markerD = addMarker(destination);
      markerD.addTo(map);

      origin && calculateRoute(origin, destination, 'shortest');
      origin && calculateRoute(origin, destination, 'networks');

      // always hide the layer
      toggleLayer('GFR_routes', 'none');
      toggleLayer('GFR_symbols', 'none');
    }
  });
  geocoder.on('clear', () => {
    clearRoutes(markerO);
    origin = null;
  });
  geocoder2.on('clear', () => {
    clearRoutes(markerD);
    destination = null;
  });

  const inputs = document.querySelectorAll('.mapboxgl-ctrl-geocoder input');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      showMyLocationSuggestion(input);
    });
    input.addEventListener('keyup', e => {
      if (input.value.length === 0) {
        showMyLocationSuggestion(input);
      }
    });
    input.addEventListener('focusout', () => {
      hideMyLocationSuggestion(input);
    });
  });
});
