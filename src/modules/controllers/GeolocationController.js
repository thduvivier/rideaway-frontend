import mapboxgl from 'mapbox-gl';

export default class GeolocationController {
  constructor() {
    this.userPosition = null;
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
    // Add a marker to the map for userposition
    const marker = this.createMarker();
    const updatePosition = this.updatePosition;
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(position =>
        this.onPosition(position, marker, map, LngLat =>
          this.updatePosition(LngLat)
        )
      );
    } else {
      alert("Sorry, your browser doesn't support geolocation!");
    }
  }

  /*
  * Callback function everytime the userposition is updated
  * @param Object{} position - Position returned by navigator API
  * @param Marker marker - The marker
  * @param mapboxgl map - The map
  * @param Function updatePosition - The callback function
  */
  onPosition(position, marker, map, updatePosition) {
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
  stopTracking() {
    navigator.geolocation.clearWatch(this.state.watchPositionId);
  }

  /*
  * Updates the position variable and holds some other functions
  * @param Array[int, int] position - The position of the user
  */
  updatePosition(position) {
    // hide loader icon and show center button
    if (!this.userPosition) {
      window.userLocated = true;
      document.querySelector(
        '.center-btn .sk-spinner.sk-spinner-pulse'
      ).style.display =
        'none';
      document.querySelector('.center-btn--icon').style.display = 'block';
      document.querySelector('.center-btn').disabled = false;
    }
    this.userPosition = position;
  }
}
