import initializeNav from './modules/controllers/NavigationController';

class Router {
  showNavigation() {
    initializeNav();
    document.querySelector('.routeplanner').classList.remove('visible');
    document.querySelector('.main-loading').classList.add('visible');
    document.querySelector('.navigation').classList.add('visible');
  }

  showRouteplanning() {
    document.querySelector('.navigation').classList.remove('visible');
    document.querySelector('.routeplanner').classList.add('visible');
  }
}

export default new Router();
