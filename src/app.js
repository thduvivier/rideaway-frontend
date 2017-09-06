// imports
import 'whatwg-fetch';
import 'l20n';

// eslint-disable-next-line
require('add-to-homescreen');

import icons from './icons';

import router from './router';

import * as OfflinePluginRuntime from 'offline-plugin/runtime';
// eslint-disable-next-line
if (process.env.NODE_ENV === 'PROD') {
  OfflinePluginRuntime.install();
}

import './scss/styles.scss';

// show dialog to add to homescreen
window.addToHomescreen({
  skipFirstVisit: true,
  startDelay: 5,
  maxDisplayCount: 1
});

document.querySelector('.center-btn--icon').src = icons.Center;
document.querySelector('.nav-white').src = icons.NavWhite;
document.querySelector('#next-instruction-arrow-img').src = icons.Arrow;
document.querySelector('#swoosh-left').src = icons.SwooshLeft;
document.querySelector('#swoosh-right').src = icons.SwooshRight;
document.querySelector('#bike').src = icons.Bike;

router.initialize();

window.onpopstate = () => router.initialize();
