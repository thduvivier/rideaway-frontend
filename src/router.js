import initializeNav from './modules/controllers/NavigationController';
import initializeRouteplanner from './modules/controllers/RouteplannerController';

import { findGetParameter, swapArrayValues } from './modules/lib';

class Router {
  goToNavigation(origin, destination) {
    const originS = swapArrayValues(origin);
    const destinationS = swapArrayValues(destination);
    history.pushState(null, null, `/nav?loc1=${originS}&loc2=${destinationS}`);
    document.querySelector('.routeplanner').classList.remove('visible');
    document.querySelector('.main-loading').classList.add('visible');
    initializeNav(originS, destinationS);
    document.querySelector('.navigation').classList.add('visible');
  }

  goToRouteplanner(origin, destination) {
    document.querySelector('.navigation').classList.remove('visible');
    document.querySelector('.routeplanner').classList.add('visible');
    if (origin && destination) {
      history.replaceState('', null, `/?loc1=${origin}&loc2=${destination}`);
      initializeRouteplanner(origin, destination);
    } else {
      history.pushState('', document.title, '/');
      initializeRouteplanner();
    }
  }

  initialize() {
    let navigateTo;

    // check if we should navigate or plan a route
    if (location.href.includes('nav')) {
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

export default new Router();
