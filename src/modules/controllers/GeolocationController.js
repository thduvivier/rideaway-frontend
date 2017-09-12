import mapboxgl from 'mapbox-gl';

export default class GeolocationController {
  constructor() {
    this.userPosition = null;
    this.onUpdate = null;
    this.marker = this.createMarker();
  }

  /*
  * Creates a marker with a pulsating dot (for my location)
  * @returns Marker marker - The marker
  */
  createMarker() {
    // Create our pulsating dot
    let el = document.createElement('div');
    el.className = 'marker';
    let child1 = document.createElement('div');
    child1.className = 'dot';
    let child2 = document.createElement('div');
    child2.className = 'pulse';
    el.appendChild(child1);
    el.appendChild(child2);

    return new mapboxgl.Marker(el, {
      offset: [-10 / 2, -10]
    });
  }

  /*
  * Start tracking the user
  * @param mapboxgl map - The map
  * @param Function updatePosition - callback function
  */
  startTracking(map) {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(position =>
        this.onUpdate(position, map)
      );
    } else {
      alert("Sorry, your browser doesn't support geolocation!");
    }
  }

  /*
  * Stops tracking the user
  */
  stopTracking() {
    navigator.geolocation.clearWatch(this.state.watchPositionId);
  }
}
