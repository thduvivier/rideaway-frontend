import 'whatwg-fetch';

import { getElementByClassName, uniq } from './lib';
import { startTracking } from './geolocation';
import { registerEvents } from './events';

mapboxgl.accessToken = '';
const map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'https://openmaptiles.github.io/positron-gl-style/style-cdn.json', //stylesheet location
  center: [4.355975, 50.860633], // starting position
  zoom: 11 // starting zoom
});

function showAllRoutes() {
  let geojson;
  fetch('https://cyclerouting-api.osm.be/routes/GFR.json')
    .then(response => response.json())
    .then(json => {
      addAllRoutes(json);
    })
    .catch(ex => console.log(ex));
}

function addAllRoutes(geojson) {
  addFilters(geojson.features);

  map.addSource('GFR', {
    type: 'geojson',
    data: geojson
  });
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

function toggleLayer(id) {
  let visibility = map.getLayoutProperty(id, 'visibility');
  if (visibility === 'visible') {
    visibility = 'none';
  } else {
    visibility = 'visible';
  }
  map.setLayoutProperty(id, 'visibility', visibility);
}

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
  el.src = './icons/locator-yellow.svg';
  el.style.width = marker.properties.iconSize[0] + 'px';
  el.style.height = marker.properties.iconSize[1] + 'px';
  return new mapboxgl.Marker(el, {
    offset: [
      -marker.properties.iconSize[0] / 2,
      -marker.properties.iconSize[1] / 2
    ]
  }).setLngLat(marker.geometry.coordinates);
}

function calculateRoute(origin, destination, profile) {
  // swap around values for the API
  origin = [origin[1], origin[0]];
  destination = [destination[1], destination[0]];
  const url = `https://cyclerouting-api.osm.be/route?loc1=${origin}&loc2=${destination}&profile=${profile}`;
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

function clearRoutes() {
  map.removeLayer('networks');
  map.getSource('networks');
  map.removeLayer('shortest');
}

function createGeocoder(placeholder) {
  return new MapboxGeocoder({
    accessToken:
      'pk.eyJ1IjoiYXJuYXVkd2V5dHMiLCJhIjoiY2o0cGt3d3oxMXl0cDMzcXNlbThnM3RtaCJ9.BMUyxqHH-FC69pW4U4YO9A',
    flyTo: false,
    placeholder,
    country: 'BE'
  });
}

function setPoint(result) {
  return result.geometry.coordinates;
}

function filterRoute(route) {
  map.setFilter('GFR_routes', ['==', 'icr', route]);
  map.setFilter('GFR_symbols', ['==', 'icr', route]);
}

function removeFilter() {
  map.setFilter('GFR_routes', null);
  map.setFilter('GFR_symbols', null);
}

function configureStyle(el, color) {
  const routeConfig = {
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
  el.className += '-' + routeConfig[el.innerHTML];
  el.style.backgroundColor = color;
  return el;
}

function addFilters(features) {
  let menu = getElementByClassName('routelist');
  let routes = [{}];
  features.forEach(feat => {
    routes.push({
      name: feat.properties.icr,
      color: feat.properties.colour
    });
  });
  let all = document.createElement('li');
  all.className = 'routelist-item routelist-item--active';
  all.innerHTML = 'All';
  all.addEventListener('click', () => {
    const active = document.querySelector('.routelist-item--active');
    active.classList.remove('routelist-item--active');
    all.className += ' routelist-item--active';
    removeFilter();
  });
  menu.appendChild(all);
  uniq(routes).forEach(route => {
    console.log(route);
    let el = document.createElement('li');
    el.className = 'routelist-item';
    el.innerHTML = route.name;
    el = configureStyle(el, route.color);
    el.addEventListener('click', () => {
      const active = document.querySelector('.routelist-item--active');
      active.classList.remove('routelist-item--active');
      el.className += ' routelist-item--active';
      filterRoute(route.name);
    });
    menu.appendChild(el);
  });
}

map.on('load', function() {
  let origin = null;
  let destination = null;
  let markerO = null;
  let markerD = null;
  let routes = null;

  startTracking(map);

  registerEvents(map);

  routes = showAllRoutes();

  // create geocoders and add to map
  const geocoder = createGeocoder('origin');
  const geocoder2 = createGeocoder('destination');
  map.addControl(geocoder);
  map.addControl(geocoder2);

  // fire functions on result
  geocoder.on('result', ({ result }) => {
    // result event fires twice for some reason, this prevents it
    // from executing our code twice, resulting in errors
    if (!origin || destination !== setPoint(result)) {
      markerO && markerO.remove();
      origin = setPoint(result);
      markerO = addMarker(origin);
      markerO.addTo(map);
    }
  });
  geocoder2.on('result', ({ result }) => {
    if (!destination || destination !== setPoint(result)) {
      destination && clearRoutes();
      markerD && markerD.remove();
      destination = setPoint(result);
      markerD = addMarker(destination);
      markerD.addTo(map);
      calculateRoute(origin, destination, 'shortest');
      calculateRoute(origin, destination, 'networks');
      toggleLayer('GFR_routes');
      toggleLayer('GFR_symbols');
    }
  });
});
