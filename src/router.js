import Navigo from 'navigo';

import initializeNav from './modules/controllers/NavigationController';

const root = null;
const useHash = true;
const hash = '#';

const router = new Navigo(root, useHash, hash);

router
  .on({
    // navigation handler
    '/nav*': () => {
      initializeNav();
      document.querySelector('.routeplanner').classList.remove('visible');
      document.querySelector('.main-loading').classList.add('visible');
      document.querySelector('.navigation').classList.add('visible');
    },
    // root handler
    '*': () => {
      document.querySelector('.navigation').classList.remove('visible');
      document.querySelector('.routeplanner').classList.add('visible');
    }
  })
  .resolve();

export default router;
