import mapboxgl from 'mapbox-gl';

/*
* Creates a marker with a pulsating dot (for my location)
* @returns Marker marker - The marker
*/
function createMarker() {
  // Create our pulsating dot
  let el = document.createElement('div');
  el.className = 'marker';
  let child1 = document.createElement('div');
  child1.className = 'dot';
  let child2 = document.createElement('div');
  child2.className = 'pulse';
  el.appendChild(child1);
  el.appendChild(child2);

  return new mapboxgl.Marker(el, { offset: [-10 / 2, -10] });
}

/*
* Start tracking the user
* @param mapboxgl map - The map
* @param Function updatePosition - callback function
*/
export function startTracking(map, updatePosition) {
  // Add a marker to the map for userposition
  const marker = createMarker();
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position =>
      onPosition(position, marker, map, updatePosition)
    );
  } else {
    alert("Sorry, your browser doesn't support geolocation!");
  }

  // Bearing config -- not used
  /*if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', e => _setHeading(e, map));
  }*/
}

/*
* Callback function everytime the userposition is updated
* @param Object{} position - Position returned by navigator API
* @param Marker marker - The marker
* @param mapboxgl map - The map
* @param Function updatePosition - The callback function
*/
function onPosition(position, marker, map, updatePosition) {
  // Get coords
  const LngLat = [position.coords.longitude, position.coords.latitude];

  // Set user position in global variables
  updatePosition(LngLat);

  // Add marker to map
  marker.setLngLat(LngLat);
  marker.addTo(map);
}

/*
* Stops tracking the user
*/
export function stopTracking() {
  navigator.geolocation.clearWatch(this.state.watchPositionId);
  //window.removeEventListener('deviceorientation', () => _setHeading(map));
}

//function _setHeading(e, map) {}
