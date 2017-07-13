function createMarker() {
  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        id: 'currentPosition',
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { iconSize: [50, 50] }
      }
    ]
  };

  // create our pulsating dot
  let el = document.createElement('div');
  el.className = 'marker';
  let child1 = document.createElement('div');
  child1.className = 'dot';
  let child2 = document.createElement('div');
  child2.className = 'pulse';
  el.appendChild(child1);
  el.appendChild(child2);

  return new mapboxgl.Marker(el);
}

export function startTracking(map) {
  const marker = createMarker();
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position =>
      onPosition(position, marker, map)
    );
  } else {
    alert("Sorry, your browser doesn't support geolocation!");
  }

  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', _setHeading);
  }
}

function stopTracking() {
  navigator.geolocation.clearWatch(this.state.watchPositionId);
  window.removeEventListener('deviceorientation', _setHeading);
}

function onPosition(position, marker, map) {
  marker.setLngLat([position.coords.longitude, position.coords.latitude]);
  marker.addTo(map);
}

function _setHeading(e) {}
