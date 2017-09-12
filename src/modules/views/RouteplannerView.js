import _ from 'lodash';

import { routeConfig, center } from '../../constants';
import { displayDistance, displayTime, displayArrival } from '../lib';

export default class View {
  constructor(mapController, geolocController) {
    this.mapController = mapController;
    this.geolocController = geolocController;
  }

  /*
  * Collapses the mobile menu
  */
  collapseMenu() {
    if (window.innerWidth <= 800) {
      const menu = document.querySelector('.menu');
      document.querySelector('.dimmed-full').style.display = 'none';
      menu.style.transform = `translateX(-${menu.offsetWidth + 6}px)`;
    }
  }

  /*
  * Configures the all and none button
  */
  configureAllNone() {
    const all = document.querySelector('.routelist-all');
    all.addEventListener('click', () => {
      const items = document.querySelectorAll('.routelist-item');
      items.forEach(item => item.classList.remove('routelist-item--inactive'));
      document
        .querySelector('.routelist-none')
        .classList.remove('routelist-item--active');
      all.className += ' routelist-item--active';
      this.mapController.removeFilter();
      this.collapseMenu();
    });
    const none = document.querySelector('.routelist-none');
    none.addEventListener('click', () => {
      const items = document.querySelectorAll('.routelist-item');
      items.forEach(item => item.classList.add('routelist-item--inactive'));
      document
        .querySelector('.routelist-all')
        .classList.remove('routelist-item--active');
      none.className += ' routelist-item--active';
      this.mapController.toggleLayer('GFR_routes', 'none');
      this.mapController.toggleLayer('GFR_symbols', 'none');
      this.collapseMenu();
    });
  }

  /*
  * Configures a single ListItem for the routemenu
  * @param Object{name: string, colour: string} route - The route for that list item
  * @return Element el - The configured html element
  */
  configureListItem(route) {
    let el = document.createElement('li');
    el.className = 'routelist-item';
    let child = document.createElement('span');
    child.innerHTML = route.name;
    el.appendChild(child);
    el.className += ' routelist-item-' + routeConfig[el.firstChild.innerHTML];
    el.style.backgroundColor = route.color;

    // Event listener
    el.addEventListener('click', () => {
      const active = document.querySelector('.routelist-item--active');
      active && active.classList.remove('routelist-item--active');

      // if all routes are selected, and one is clicked, select
      // the one clicked instead of deslecting it, feels better
      if (!document.querySelector('.routelist-item--inactive')) {
        const items = document.querySelectorAll('.routelist-item');
        items.forEach(item => item.classList.add('routelist-item--inactive'));
        el.classList.remove('routelist-item--inactive');
        let inactives = Array.from(
          document.querySelectorAll('.routelist-item--inactive'),
          item => item.firstChild.innerHTML
        );
        this.mapController.filterRoutes(inactives);
      } else if (!el.className.includes('routelist-item--inactive')) {
        el.classList.add('routelist-item--inactive');
        let inactives = Array.from(
          document.querySelectorAll('.routelist-item--inactive'),
          item => item.firstChild.innerHTML
        );
        if (
          inactives.length ===
          document.querySelectorAll('.routelist-item').length
        ) {
          document
            .querySelector('.routelist-none')
            .classList.add('routelist-item--active');
        }
        this.mapController.filterRoutes(inactives);
      } else {
        el.classList.remove('routelist-item--inactive');
        let inactives = Array.from(
          document.querySelectorAll('.routelist-item--inactive'),
          item => item.firstChild.innerHTML
        );
        this.mapController.filterRoutes(inactives);
      }
      this.collapseMenu();

      // Only recenter the map if the route isn't calculated
      if (this.mapController.map.getSource('brussels')) {
        const visible = this.mapController.map.getLayoutProperty(
          'brussels',
          'visibility'
        );
        if (!visible || visible === 'visible') {
          return;
        }
      }
      this.mapController.map.flyTo({
        center: center.latlng,
        zoom: [center.zoom]
      });
    });

    return el;
  }

  /*
  * Show the geocoder close button (for our inserted my location option)
  * @param MapboxglGeocoder geocoder - The geocoder
  */
  showCloseButton(geocoder) {
    const buttons = document.querySelectorAll(
      '.geocoder-icon.geocoder-icon-close'
    );
    if (geocoder === 'origin') {
      buttons[0].style.display = 'block';
    } else {
      buttons[1].style.display = 'block';
    }
  }

  configureCloseButtons() {
    const buttons = document.querySelectorAll(
      '.geocoder-icon.geocoder-icon-close'
    );
    const inputs = document.querySelectorAll('.mapboxgl-ctrl-geocoder input');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        inputs.forEach(input => (input.dataset.userLocation = null));
      });
    });
  }

  /*
  * Configures the mobile menu
  */
  configureMobileMenu() {
    const menuOpen = document.createElement('div');
    menuOpen.className = 'menu-btn-open';
    // mobile menu
    menuOpen.addEventListener('click', () => {
      document.querySelector('.menu').style.transform = 'translateX(0)';
      document.querySelector('.dimmed-full').style.display = 'block';
    });
    // insert menu button before
    const control = document.querySelector('.mapboxgl-ctrl-top-right');
    control.insertBefore(menuOpen, control.childNodes[0]);

    // collapse menu when the dimmed part is touched
    document
      .querySelector('.dimmed-full')
      .addEventListener('click', this.collapseMenu);

    document.querySelector('.menu-btn-close').addEventListener('click', () => {
      this.collapseMenu();
    });
  }

  /*
  * configures the reverse button
  */
  configureReverse(setPlace) {
    const reverse = document.createElement('div');
    reverse.className = 'reverse-btn';
    const geocoders = document.querySelectorAll(
      '.mapboxgl-ctrl-geocoder input'
    );
    reverse.addEventListener('click', () => {
      // save value for swapping
      const origin = geocoders[0].value;
      // swap values
      geocoders[0].value = geocoders[1].value;
      geocoders[1].value = origin;

      // swap variables
      setPlace('origin', 'destination');
    });
    // insert reverse button before second input
    const control = document.querySelector(
      '.mapboxgl-ctrl-geocoder.mapboxgl-ctrl.origin'
    );
    control.insertAdjacentElement('afterend', reverse);
  }

  /*
  * Prepares the inputs for my location
  * @param setPlace - for setting global variables
  */
  configureInputs(setPlace) {
    const inputs = document.querySelectorAll('.mapboxgl-ctrl-geocoder input');
    inputs.forEach(input => {
      // Define which input it is, would be better with a different data attribute
      const place = input.parentElement.dataset.place;

      // Show location when empty field

      input.addEventListener('focus', () => {
        this.showMyLocationSuggestion(input, setPlace);
      });

      input.addEventListener('keyup', e => {
        // Show location on keyup and empty field
        this.showMyLocationSuggestion(input, setPlace);

        // Clear place
        if (input.value === '') {
          setPlace(place, null);
          input.dataset.userLocation = null;
        }

        // Set location on enter
        if (e.key === 'Enter' && input.value === '') {
          input.value = input.parentElement.querySelector(
            '.mylocation a'
          ).innerHTML;

          input.dataset.userLocation = true;
          if (place === 'origin') {
            this.showCloseButton('origin');
          } else {
            this.showCloseButton('destination');
          }
          setPlace(place);

          // Unfocus the input
          input.blur();
        }
      });
    });
  }

  /*
  * Show my location suggestion in the geocoder
  * @param Element input - The geocoder input
  * @param setPlace - Sets global variable
  */
  showMyLocationSuggestion(input, setPlace) {
    // Skip this if the user isn't located
    if (!window.userLocated) {
      return;
    }

    const suggestions = input.parentElement.querySelector('.suggestions');

    // If the option doesn't exist, add it
    let myLoc = input.parentElement.querySelector('.mylocation');

    if (!myLoc) {
      myLoc = document.createElement('li');
      // Need to access the link for the translation
      myLoc.className = 'mylocation active';
      myLoc.style.display = 'none';

      const a = document.createElement('a');
      a.setAttribute('data-l10n-id', 'suggestion-location');

      // Event listener
      a.addEventListener('mousedown', () => {
        input.value = a.innerHTML;

        // set userlocation on input
        const place = input.parentElement.dataset.place;
        input.dataset.userLocation = true;

        // show the close button & set the variable
        this.showCloseButton(place);
        setPlace(place);
      });

      myLoc.appendChild(a);
      suggestions.appendChild(myLoc);
    }

    if (input.value === '') {
      // Only show if none are already set
      const inputs = document.querySelectorAll('.mapboxgl-ctrl-geocoder input');
      if (
        !(inputs[0].dataset.userLocation === 'true') &&
        !(inputs[1].dataset.userLocation === 'true')
      ) {
        myLoc.style.display = 'block';
        // Show the suggestions
        suggestions.style.display = 'block';
      }
    }
  }

  /*
  * Adds a filter option for every route to the menu
  * @param Array[{}] features - All of the routes
  */
  addFilters(features) {
    // Get the properties we need
    let routes = [];
    features.forEach(feat => {
      routes.push({
        name: feat.properties.ref,
        color: feat.properties.colour
      });
    });

    // Configure the All & None buttons
    this.configureAllNone();

    // uniqBy to remove duplicates, and  sort them in a good order
    const routesSorted = _.uniqBy(routes, 'name').sort((a, b) => {
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    // Loop over the sorted routes
    routesSorted.forEach(route => {
      // Ignore this unfinished route
      if (route.name === 'G/C') {
        return;
      }

      // Don't add filter buttons for a or b routes
      if (route.name.includes('a') || route.name.includes('b')) {
        return;
      }

      // Select appropiate route for menu
      const menu = document.querySelector(
        '.routelist-' + routeConfig[route.name]
      );

      // Configure the list item
      const el = this.configureListItem(route);
      menu.appendChild(el);
    });
  }

  /*
  * Configure all the elements, main function
  * @param mapboxgl mapboxmap - The map
  * @param setPlace - to set global variable
  */
  configureAllElements(setPlace) {
    this.configureGeocoders();
    this.configureMobileMenu();
    this.configureInputs(setPlace);
    this.configureReverse(setPlace);
    document
      .querySelector('.error-btn-close')
      .addEventListener('click', this.toggleErrorDialog);
  }

  /*
  * Shows the navigation box when a route is found
  * @param oldHandler - The previous handler to go to navigation
  * @param navHandler - The new handler with updated coords
  * @param int distance - The distance between the coords
  * @param int time - The time in seconds
  */
  showNavigationBox(oldHandler, navHandler, distance, time) {
    const navBox = document.querySelector('.nav-box');
    const button = document.querySelector('.center-btn');

    // Hide the center button
    button.style.display = 'none';

    // Set information in the navigation box
    document.querySelector('.nav-distance').innerHTML = displayDistance(
      distance
    );
    document.querySelector('.nav-time').innerHTML = displayTime(time);
    document.querySelector('.nav-arrival').innerHTML = displayArrival(time);

    const buttonNav = document.querySelector('.nav-btn');

    // Remove the old handler when starting navigation
    oldHandler && buttonNav.removeEventListener('click', oldHandler);

    // Add the new handler
    buttonNav.addEventListener('click', navHandler);

    // Show the navbox
    navBox.style.transform = 'translateY(0)';
  }

  /*
  * Hides the navigationbox
  */
  hideNavigationBox() {
    const navBox = document.querySelector('.nav-box');
    navBox.style.transform = 'translateY(175px)';
    document.querySelector('.center-btn').style.display = 'block';
  }

  /*
  * Show dialog when no route is found
  */
  toggleErrorDialog() {
    const dimmed = document.querySelector('.dimmed-map');
    const dialog = document.querySelector('.error-dialog');
    if (dialog.className.includes('visible')) {
      dimmed.classList.remove('visible');
      dialog.classList.remove('visible');
    } else {
      dimmed.classList.add('visible');
      dialog.classList.add('visible');
    }
  }

  /*
  * Toggle the main loading screen
  */
  toggleMainLoading() {
    const loading = document.querySelector('.main-loading');
    if (loading.className.includes('visible')) {
      loading.classList.remove('visible');
    } else {
      loading.classList.add('visible');
    }
  }

  /*
   *  Toggle loading icon on map
   */
  toggleMapLoading() {
    const dimmed = document.querySelector('.dimmed-map');
    const loading = document.querySelector('.loading');
    if (loading.className.includes('visible')) {
      dimmed.classList.remove('visible');
      loading.classList.remove('visible');
    } else {
      dimmed.classList.add('visible');
      loading.classList.add('visible');
    }
  }

  /*
  * Set the data attribute on the geocoders for the translations
  */
  configureGeocoders() {
    const geocoders = document.querySelectorAll('.mapboxgl-ctrl-geocoder');
    geocoders[0].classList.add('origin');
    geocoders[1].classList.add('destination');
    geocoders[0].dataset.place = 'origin';
    geocoders[1].dataset.place = 'destination';

    geocoders.forEach(geocoder => {
      const input = geocoder.querySelector('input');
      input.setAttribute('data-l10n-id', `${input.placeholder}-input`);
    });

    this.configureCloseButtons();
  }

  configureCenterButton() {
    // Configure the center button
    document.querySelector('.center-btn').addEventListener('click', () => {
      this.geolocController.userPosition &&
        this.mapController.map.flyTo({
          center: this.geolocController.userPosition,
          zoom: [15]
        });
    });
  }

  clearGeocoderInputs() {
    const inputs = document.querySelectorAll('.mapboxgl-ctrl-geocoder input');
    inputs.forEach(input => (input.value = ''));
    const closeIcons = document.querySelectorAll(
      '.geocoder-icon.geocoder-icon-close'
    );
    closeIcons.forEach(icon => (icon.style.display = 'none'));
  }

  setGeocoderInput(place, text) {
    const input = document.querySelector(
      `.mapboxgl-ctrl-geocoder.mapboxgl-ctrl.${place} input`
    );
    input.value = text;
    this.showCloseButton(place);
  }
}
