import { compassHeading } from '../lib';

export default class GeolocationController {
  constructor() {
    this.userPosition = null;
    this.userHeading = 0;
    this.onUpdate = null;
    this.trackingMode = 'default';
  }

  /*
  * Start tracking the user
  */
  startTracking() {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        position => this.onUpdate(position),
        null,
        { enableHighAccuracy: true }
      );
    } else {
      alert("Sorry, your browser doesn't support geolocation!");
    }
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', e => this._setHeading(e));
    }
  }

  _setHeading(e) {
    this.userHeading =
      compassHeading(e.alpha, e.beta, e.gamma) || e.webkitCompassHeading;
  }

  /*
  * Stops tracking the user
  */
  stopTracking() {
    navigator.geolocation.clearWatch(this.watchPositionId);
  }
}
