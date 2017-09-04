import Konami from 'konami-js';
import _ from 'lodash';

import { routeConfig, center } from '../constants';
import { filterRoutes, toggleLayer, removeFilter } from './mapManipulations';
import { displayDistance, displayTime, displayArrival } from './lib';

// Global variable
let map;

/*
* Collapses the mobile menu
*/
function collapseMenu() {
  if (window.innerWidth <= 800) {
    const menu = document.querySelector('.menu');
    document.querySelector('.dimmed').style.display = 'none';
    menu.style.transform = `translateX(-${menu.offsetWidth + 6}px)`;
  }
}

/*
* Configures the all and none button
*/
function configureAllNone() {
  const all = document.querySelector('.routelist-all');
  all.addEventListener('click', () => {
    const items = document.querySelectorAll('.routelist-item');
    items.forEach(item => item.classList.remove('routelist-item--inactive'));
    document
      .querySelector('.routelist-none')
      .classList.remove('routelist-item--active');
    all.className += ' routelist-item--active';
    removeFilter(map);
    collapseMenu();
  });
  const none = document.querySelector('.routelist-none');
  none.addEventListener('click', () => {
    const items = document.querySelectorAll('.routelist-item');
    items.forEach(item => item.classList.add('routelist-item--inactive'));
    document
      .querySelector('.routelist-all')
      .classList.remove('routelist-item--active');
    none.className += ' routelist-item--active';
    toggleLayer(map, 'GFR_routes', 'none');
    toggleLayer(map, 'GFR_symbols', 'none');
    collapseMenu();
  });
}

/*
* Configures a single ListItem for the routemenu
* @param Object{name: string, colour: string} route - The route for that list item
* @return Element el - The configured html element
*/
function configureListItem(route) {
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
      filterRoutes(map, inactives);
      return;
    }

    if (!el.className.includes('routelist-item--inactive')) {
      el.classList.add('routelist-item--inactive');
      let inactives = Array.from(
        document.querySelectorAll('.routelist-item--inactive'),
        item => item.firstChild.innerHTML
      );
      filterRoutes(map, inactives);
    } else {
      el.classList.remove('routelist-item--inactive');
      let inactives = Array.from(
        document.querySelectorAll('.routelist-item--inactive'),
        item => item.firstChild.innerHTML
      );
      filterRoutes(map, inactives);
    }
    collapseMenu();

    // Only recenter the map if the route isn't calculated
    if (map.getSource('brussels')) {
      const visible = map.getLayoutProperty('brussels', 'visibility');
      if (!visible || visible === 'visible') {
        return;
      }
    }
    map.flyTo({ center: center.latlng, zoom: [center.zoom] });
  });

  return el;
}

/*
* Show the geocoder close button (for our inserted my location option)
* @param MapboxglGeocoder geocoder - The geocoder
*/
function showCloseButton(geocoder) {
  if (geocoder === 'origin') {
    document.querySelector(
      'div:nth-of-type(1) .geocoder-icon.geocoder-icon-close'
    ).style.display =
      'block';
  }
}

/*
* Hides my location from the suggestions
* @param Element input - The input element
*/
function hideMyLocationSuggestion(input) {
  const suggestions = input.parentElement.querySelector('.suggestions');
  suggestions.style.display = 'none';
}

/*
* Configures the mobile menu
*/
function configureMobileMenu() {
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
  document.querySelector('.dimmed').addEventListener('click', collapseMenu);

  document.querySelector('.menu-btn-close').addEventListener('click', () => {
    collapseMenu();
  });
}

/*
* Prepares the inputs for my location
* @param Function setPlace - Function for setting global variables
*/
function configureInputs(setPlace) {
  const inputs = document.querySelectorAll('.mapboxgl-ctrl-geocoder input');
  inputs.forEach(input => {
    // Define which input it is, would be better with a different data attribute
    const place = input.getAttribute('data-l10n-id').replace('-input', '');

    // Show location on focus
    input.addEventListener('focus', () => {
      showMyLocationSuggestion(input, setPlace);
    });

    input.addEventListener('keyup', e => {
      // Show location on keyup and empty field
      if (input.value.length === 0) {
        showMyLocationSuggestion(input, setPlace);
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
          showCloseButton('origin');
          hideMyLocationSuggestion(inputs[1]);
        } else {
          showCloseButton('destination');
          hideMyLocationSuggestion(inputs[0]);
        }
        setPlace(place);

        // Unfocus the input
        input.blur();
      }
    });

    // Hide my location
    input.addEventListener('focusout', () => {
      hideMyLocationSuggestion(input);
    });
  });
}

/*
* Show my location suggestion in the geocoder
* @param Element input - The geocoder input
* @param Function setPlace - Sets global variable
*/
function showMyLocationSuggestion(input, setPlace) {
  // Skip this function if the user isn't located
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

      showCloseButton(place);
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
export function addFilters(features) {
  // Get the properties we need
  let routes = [];
  features.forEach(feat => {
    routes.push({
      name: feat.properties.ref,
      color: feat.properties.colour
    });
  });

  // Configure the All & None buttons
  configureAllNone();

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
    const el = configureListItem(route);
    menu.appendChild(el);
  });
}

/*
* Configure all the elements, main function
* @param mapboxgl mapboxmap - The map
* @param Function setPlace - Function to set global variable
*/
export function configureAllElements(mapboxmap, setPlace) {
  // Set the map
  map = mapboxmap;
  configureMobileMenu();
  configureInputs(setPlace);
  new Konami(function() {
    alert('Secret feature activated!');
    document.querySelector('.nav-btn').style.display = 'block';
  });
}

/*
* Shows the navigation box when a route is found
* @param Function oldHandler - The previous handler to go to navigation
* @param Function navHandler - The new handler with updated coords
* @param int distance - The distance between the coords
* @param int time - The time in seconds
*/
export function showNavigationBox(oldHandler, navHandler, distance, time) {
  const navBox = document.querySelector('.nav-box');
  const button = document.querySelector('.center-btn');

  // Hide the center button
  button.style.display = 'none';

  // Set information in the navigation box
  document.querySelector('.nav-distance').innerHTML = displayDistance(distance);
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
export function hideNavigationBox() {
  const navBox = document.querySelector('.nav-box');
  navBox.style.transform = 'translateY(175px)';
  document.querySelector('.center-btn').style.display = 'block';
}
