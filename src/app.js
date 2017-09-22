// imports
import 'whatwg-fetch';
import 'l20n';

// eslint-disable-next-line
require('add-to-homescreen');

import Router from './router';

import * as OfflinePluginRuntime from 'offline-plugin/runtime';
// eslint-disable-next-line
if (process.env.NODE_ENV === 'PROD') {
  OfflinePluginRuntime.install({
    onUpdating: () => {
      console.log('SW Event:', 'onUpdating');
    },
    onUpdateReady: () => {
      console.log('SW Event:', 'onUpdateReady');
      // Tells to new SW to take control immediately
      OfflinePluginRuntime.applyUpdate();
    },
    onUpdated: () => {
      console.log('SW Event:', 'onUpdated');
      // Reload the webpage to load into the new version
      window.location.reload();
    },
    onUpdateFailed: () => {
      console.log('SW Event:', 'onUpdateFailed');
    }
  });
}

import './scss/styles.scss';

// show dialog to add to homescreen
window.addToHomescreen({
  skipFirstVisit: true,
  startDelay: 5,
  maxDisplayCount: 1
});

new Router();
