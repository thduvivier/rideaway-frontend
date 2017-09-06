import initializeNav from './modules/controllers/NavigationController';
import initializeRouteplanner from './modules/controllers/RouteplannerController';

import { findGetParameter, swapArrayValues } from './modules/lib';

class Router {
  goToNavigation(origin, destination) {
    history.pushState(null, null, `nav?loc1=${origin}&loc2=${destination}`);
    document.querySelector('.routeplanner').classList.remove('visible');
    document.querySelector('.main-loading').classList.add('visible');
    initializeNav(origin, destination);
    document.querySelector('.navigation').classList.add('visible');
  }

  goToRouteplanner(origin, destination) {
    document.querySelector('.navigation').classList.remove('visible');
    document.querySelector('.routeplanner').classList.add('visible');
    if (origin && destination) {
      initializeRouteplanner(origin, destination);
    } else {
      initializeRouteplanner();
    }
  }

  initialize() {
    let navigateTo;

    // check if we should navigate or plan a route
    if (location.href.includes('nav')) {
      navigateTo = this.goToNavigation;
    } else {
      navigateTo = this.goToRouteplanner;
    }

    let origin;
    let destination;
    const loc1 = findGetParameter('loc1');
    const loc2 = findGetParameter('loc2');
    if (loc1 && loc2) {
      origin = swapArrayValues(loc1.split(',').map(coord => parseFloat(coord)));
      destination = swapArrayValues(
        loc2.split(',').map(coord => parseFloat(coord))
      );
    }

    navigateTo(origin, destination);
  }
}

export default new Router();
