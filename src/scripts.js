mapboxgl.accessToken =
  'pk.eyJ1IjoiYXJuYXVkd2V5dHMiLCJhIjoiY2o0cGt3d3oxMXl0cDMzcXNlbThnM3RtaCJ9.BMUyxqHH-FC69pW4U4YO9A';
var map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/mapbox/streets-v9', //stylesheet location
  center: [4.355975, 50.860633], // starting position
  zoom: 11 // starting zoom
});

map.on('load', function() {
  map.addSource('route', {
    type: 'geojson',
    data:
      'https://raw.githubusercontent.com/oSoc17/rideaway-frontend-v2/master/GFR.geojson'
  });
  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
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
    id: 'symbols',
    type: 'symbol',
    source: 'route',
    layout: {
      'symbol-placement': 'line',
      'text-font': ['Open Sans Regular'],
      'text-field': '{icr}', // part 2 of this is how to do it
      'text-size': 16
    },
    paint: {
      'text-color': {
        type: 'identity',
        property: 'colour'
      }
    }
  });
  var origin = null;
  var destination = null;
  function addMarkers(origin, destination) {
    map.addLayer({
      id: 'points',
      type: 'symbol',
      source: {
        type: 'geojson',
        data: {
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
                icon: 'marker'
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
                icon: 'marker'
              }
            }
          ]
        }
      },
      layout: {
        'icon-image': '{icon}-15',
        'text-field': '{title}',
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-offset': [0, 0.6],
        'text-anchor': 'top'
      }
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
        'line-color': profile === 'networks' ? 'green' : 'yellow',
        'line-width': 4
      }
    });
  }
  map.addControl(new mapboxgl.GeolocateControl());
  var geocoder = new MapboxGeocoder({
    accessToken:
      'pk.eyJ1IjoiYXJuYXVkd2V5dHMiLCJhIjoiY2o0cGt3d3oxMXl0cDMzcXNlbThnM3RtaCJ9.BMUyxqHH-FC69pW4U4YO9A',
    flyTo: false,
    placeholder: 'Origin',
    country: 'BE'
  });
  var geocoder2 = new MapboxGeocoder({
    accessToken:
      'pk.eyJ1IjoiYXJuYXVkd2V5dHMiLCJhIjoiY2o0cGt3d3oxMXl0cDMzcXNlbThnM3RtaCJ9.BMUyxqHH-FC69pW4U4YO9A',
    flyTo: false,
    placeholder: 'Destination',
    country: 'BE'
  });
  map.addControl(geocoder);
  map.addControl(geocoder2);
  geocoder.on('result', getResult);
  function getResult(result) {
    origin = result.result.geometry.coordinates;
    map.removeLayer('networks');
    map.removeLayer('shortest');
    map.removeLayer('points');
  }
  geocoder2.on('result', getResult2);
  function getResult2(result) {
    destination = result.result.geometry.coordinates;
    console.log(origin, destination);
    calculateRoute(origin, destination, 'networks');
    calculateRoute(origin, destination, 'shortest');
    addMarkers(origin, destination);
  }
});
