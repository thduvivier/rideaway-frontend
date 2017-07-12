import { startTracking } from './geolocation';

mapboxgl.accessToken = '';
const map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'https://openmaptiles.github.io/positron-gl-style/style-cdn.json', //stylesheet location
  center: [4.355975, 50.860633], // starting position
  zoom: 11 // starting zoom
});

function addAllRoutes() {
  map.addSource('GFR', {
    type: 'geojson',
    data: 'http://188.226.154.37/routes/GFR.json'
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

function addMarkers(origin, destination) {
  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: origin
        },
        properties: {
          title: 'START',
          iconSize: [50, 50]
        }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: destination
        },
        properties: {
          title: 'END',
          iconSize: [50, 50]
        }
      }
    ]
  };
  geojson.features.forEach(marker => {
    let el = document.createElement('img');
    el.className = 'marker';
    el.src = './icons/locator-yellow.svg';
    el.style.width = marker.properties.iconSize[0] + 'px';
    el.style.height = marker.properties.iconSize[1] + 'px';
    new mapboxgl.Marker(el, {
      offset: [
        -marker.properties.iconSize[0] / 2,
        -marker.properties.iconSize[1] / 2
      ]
    })
      .setLngLat(marker.geometry.coordinates)
      .addTo(map);
  });
}

function calculateRoute(origin, destination, profile) {
  // swap around values for the API
  origin = [origin[1], origin[0]];
  destination = [destination[1], destination[0]];
  const url = `http://188.226.154.37/route?loc1=${origin}&loc2=${destination}&profile=${profile}`;
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
  map.removeLayer('shortest');
  map.removeLayer('points');
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

function filterRoute(route) {
  map.setFilter('GFR_routes', ['==', 'icr', route]);
  map.setFilter('GFR_symbols', ['==', 'icr', route]);
}

map.on('load', function() {
  let origin = null;
  let destination = null;

  startTracking(map);

  addAllRoutes();

  // create geocoders and add to map
  const geocoder = createGeocoder('origin');
  const geocoder2 = createGeocoder('destination');
  map.addControl(geocoder);
  map.addControl(geocoder2);

  // do events on result
  geocoder.on('result', ({ result }) => (origin = setPoint(result)));
  geocoder2.on('result', ({ result }) => {
    console.log('geocoder2 result found!');
    destination = setPoint(result);
    calculateRoute(origin, destination, 'shortest');
    calculateRoute(origin, destination, 'networks');
    addMarkers(origin, destination);
    toggleLayer('GFR_routes');
    toggleLayer('GFR_symbols');
  });

  function setPoint(result) {
    return result.geometry.coordinates;
  }
});
