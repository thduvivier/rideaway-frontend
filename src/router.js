import initializeNav from './modules/controllers/NavigationController';
import { clearAll } from './app';

class Router {
  goToNavigation(origin, destination) {
    initializeNav(origin, destination);
    document.querySelector('.routeplanner').classList.remove('visible');
    document.querySelector('.main-loading').classList.add('visible');
    document.querySelector('.navigation').classList.add('visible');
  }

  goToRouteplanner(clear) {
    if (clear) {
      clearAll();
    }
    document.querySelector('.navigation').classList.remove('visible');
    document.querySelector('.routeplanner').classList.add('visible');
  }
}

export default new Router();
