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
      document.querySelector('.dimmed').style.display = 'none';
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

  /*
  * Hides my location from the suggestions
  * @param Element input - The input element
  */
  hideMyLocationSuggestion(input) {
    const suggestions = input.parentElement.querySelector('.suggestions');
    suggestions.style.display = 'none';
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
      document.querySelector('.dimmed').style.display = 'block';
    });
    // insert menu button before
    const control = document.querySelector('.mapboxgl-ctrl-top-right');
    control.insertBefore(menuOpen, control.childNodes[0]);

    // collapse menu when the dimmed part is touched
    document
      .querySelector('.dimmed')
      .addEventListener('click', this.collapseMenu);

    document.querySelector('.menu-btn-close').addEventListener('click', () => {
      this.collapseMenu();
    });
  }

  /*
  * Prepares the inputs for my location
  * @param setPlace - for setting global variables
  */
  configureInputs(setPlace) {
    const inputs = document.querySelectorAll('.mapboxgl-ctrl-geocoder input');
    inputs.forEach(input => {
      // Define which input it is, would be better with a different data attribute
      const place = input.getAttribute('data-l10n-id').replace('-input', '');

      // Show location on focus
      input.addEventListener('focus', () => {
        this.showMyLocationSuggestion(input, setPlace);
      });

      input.addEventListener('keyup', e => {
        // Show location on keyup and empty field
        if (input.value.length === 0) {
          this.showMyLocationSuggestion(input, setPlace);
        }

        // Clear place
        if (input.value === '') {
          setPlace(place, null);
        }

        // Set location on enter
        if (
          e.key === 'Enter' &&
          (input.value === '' || input.value === 'My location')
        ) {
          input.value = 'My location';
          if (place === 'origin') {
            this.showCloseButton('origin');
            this.hideMyLocationSuggestion(inputs[1]);
          } else {
            this.showCloseButton('destination');
            this.hideMyLocationSuggestion(inputs[0]);
          }
          setPlace(place);

          // Unfocus the input
          input.blur();
        }
      });

      // Hide my location
      input.addEventListener('focusout', () => {
        this.hideMyLocationSuggestion(input);
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

    // Queryselectors
    const suggestions = input.parentElement.querySelector('.suggestions');

    // If the option doesn't exist, add it
    const myLoc = input.parentElement.querySelector('.mylocation');

    if (!myLoc) {
      const el = document.createElement('li');
      // Need to access the link for the translation
      const a = document.createElement('a');
      el.className = 'mylocation active';
      a.setAttribute('data-l10n-id', 'suggestion-location');

      // Event listener
      a.addEventListener('mousedown', () => {
        input.value = a.innerHTML;

        // Translation config
        const place = input.getAttribute('data-l10n-id').replace('-input', '');

        this.showCloseButton(place);
        setPlace(place);
      });

      el.appendChild(a);
      suggestions.appendChild(el);
    }

    // don't show my location if the one of the inputs is already showing it
    // disgusting if statements, because of the translations this is pretty hard
    // tbh you need a new geocoder component, hooking into the mapbox one sucks,
    // maybe try forking the mapbox one to add a my location functionality
    /*if (input.getAttribute('data-l10n-id').replace('-input', '') === 'origin') {
    if (
      inputs[1].value !== '' &&
      inputs[1].value ===
        suggestions.querySelector('.mylocation').firstChild.innerHTML
    ) {
      return;
    }
  } else {
    if (
      inputs[0].value !== '' &&
      inputs[0].value ===
        suggestions.querySelector('.mylocation').firstChild.innerHTML
    ) {
      return;
    }
  }*/

    // Show the suggestions
    suggestions.style.display = 'block';
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
    const dialog = document.querySelector('.error-dialog');
    const toggle =
      window.getComputedStyle(dialog, null).display === 'flex'
        ? 'none'
        : 'flex';
    dialog.style.display = toggle;
  }

  /*
  * Set the data attribute on the geocoders for the translations
  */
  configureGeocoders() {
    const inputs = document.querySelectorAll('.mapboxgl-ctrl-geocoder input');
    inputs.forEach(input => {
      input.setAttribute('data-l10n-id', `${input.placeholder}-input`);
    });
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
}
