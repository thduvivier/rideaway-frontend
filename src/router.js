import initializeNav from './modules/controllers/NavigationController';
import initializeRouteplanner from './modules/controllers/RouteplannerController';
import GeolocationController from './modules/controllers/GeolocationController';

import { findGetParameter, swapArrayValues } from './modules/lib';

class Router {
  constructor() {
    this.geolocController = new GeolocationController();
    history.replaceState('routeplanner', null, null);
    this.onURLChanged(true);
    // keep watching changes
    window.onpopstate = () => {
      if (history.state) {
        this.onURLChanged();
      }
    };
  }

  goToNavigation(origin, destination) {
    document.querySelector('.routeplanner').classList.remove('visible');
    document.querySelector('.main-loading').classList.add('visible');
    initializeNav(origin, destination, this);
    document.querySelector('.navigation').classList.add('visible');
  }

  goToRouteplanner(origin, destination) {
    document.querySelector('.navigation').classList.remove('visible');
    document.querySelector('.routeplanner').classList.add('visible');
    initializeRouteplanner(origin, destination, this);
  }

  prepareRouteplannerHistory(origin, destination) {
    history.pushState(
      'routeplanner',
      null,
      `/?loc1=${swapArrayValues(origin)}&loc2=${swapArrayValues(destination)}`
    );
  }

  prepareNavHistory(origin, destination) {
    history.pushState(
      'navigation',
      null,
      `/?nav=true&loc1=${origin}&loc2=${destination}`
    );
  }

  clearHistory() {
    history.pushState('routeplanner', null, '/');
  }

  onURLChanged(freshLoad) {
    let navigateTo;

    // check if we should navigate or plan a route
    if (findGetParameter('nav') === 'true') {
      navigateTo = (origin, destination) =>
        this.goToNavigation(origin, destination);
    } else {
      navigateTo = (origin, destination) =>
        this.goToRouteplanner(origin, destination);
    }

    let origin;
    let destination;
    const loc1 = findGetParameter('loc1');
    const loc2 = findGetParameter('loc2');
    if (loc1 && loc2) {
      origin = loc1.split(',').map(coord => parseFloat(coord));
      destination = loc2.split(',').map(coord => parseFloat(coord));
    }

    navigateTo(origin, destination);
  }
}

export default Router;
