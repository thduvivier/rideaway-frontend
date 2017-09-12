import turf from 'turf';
import _ from 'lodash';

import {
  fetchJSON,
  lengthOfRoute,
  pointAlongRoute,
  pointOnRoute,
  distanceAtLocation,
  instructionAt,
  calculateAngle
} from '../lib';
import { degAngle } from '../../constants';

import NavView from '../views/NavView';

/**
 * Starts tracking your location and updating the screen.
 */
function startTracking(position) {
  var coord = position.coords;
  var location = turf.point([coord.longitude, coord.latitude]);
  heading = this.userHeading;
  update(location);
  if (loading) {
    loading = false;
    document.querySelector('.main-loading').classList.remove('visible');
  }
}
var navView;
var router;
var loading = true;

var result;
var heading;

var length;
var dataAtLast;
var totalDistance;
var totalTime;

var i = 0;
var loc1;
var loc2;

/**
 * Initialises the navigation with the result from the api.
 * 
 * @param {Object} result - result from the api 
 */
function initializeNavigation(jsonresult) {
  result = jsonresult;
  length = lengthOfRoute(result.route);
  dataAtLast =
    result.route.features[result.route.features.length - 1].properties;
  totalDistance = dataAtLast.distance / 1000.0;
  totalTime = dataAtLast.time;
  i = 0;
}

/**
 * Initialises the navigation application.
 */
export default function initialize(origin, destination, routerContext) {
  // do not reinitialize if everything is already set
  if (_.isEqual(loc1, origin) && _.isEqual(loc2, destination)) {
    document.querySelector('.main-loading').classList.remove('visible');
    return;
  }

  router = routerContext;

  navView = new NavView();
  loc1 = origin;
  loc2 = destination;
  const url = `https://cyclerouting-api.osm.be/route?loc1=${loc1}&loc2=${loc2}&profile=brussels&instructions=true`;

  fetchJSON(url).then(json => {
    loading = true;
    initializeNavigation(json);
    //setTimeout(step, 50);

    // if the userposition is already found, do a single update
    // if not, start tracking
    if (router.geolocController.userPosition) {
      var location = turf.point(router.geolocController.userPosition);
      heading = router.geolocController.userHeading;
      update(location);
      if (loading) {
        loading = false;
        document.querySelector('.main-loading').classList.remove('visible');
      }
    } else {
      router.geolocController.startTracking();
    }

    // keep updating when the userposition changes
    router.geolocController.onUpdate = startTracking;
  });
  document
    .getElementById('close-navigation')
    .addEventListener('click', function() {
      router.goToRouteplanner();
    });

  document.getElementById('goto-map').addEventListener('click', function() {
    router.goToRouteplanner(loc1, loc2);
  });
}

/**
 * Step function used in debug mode to iterate over the route.
 */
function step() {
  if (loading) {
    loading = false;
    document.querySelector('.main-loading').classList.remove('visible');
  }
  var location = pointAlongRoute(result.route, i).geometry.coordinates;
  update(location);

  i += 0.01;

  if (i < length) {
    setTimeout(step, 50);
  }
}

/**
 * Updates the screen based on the given location.
 * 
 * @param {Object} location - the current location 
 */
function update(location) {
  var closestPoint = pointOnRoute(result.route, location);
  var distance = distanceAtLocation(result.route, location);
  var instruction = instructionAt(result.instructions, distance * 1000);
  var distanceToNext = instruction.properties.distance - distance * 1000;
  var remainingDistance = (totalDistance - distance) * 1000;
  var remainingTime = remainingDistance / 3.6;

  if (totalDistance - distance < 0.01) {
    router.goToRouteplanner();
  }

  // if the user is more than 25m off route, show a direction arrow to navigate
  // back to the route.
  if (closestPoint.distance > 0.025) {
    distanceToNext = closestPoint.distance * 1000;
    distance += closestPoint.distance;
    instruction = {
      type: 'Feature',
      properties: {
        type: 'enter',
        nextColour: instruction.properties.colour,
        nextRef: instruction.properties.ref,
        angle: degAngle[calculateAngle(location, closestPoint)]
      },
      geometry: {
        type: 'Point',
        coordinates: closestPoint.point
      }
    };
  }

  var offset = 0;
  if (distanceToNext < 1000) {
    offset = (distanceToNext - 1000) * -1 / 20;
  }

  navView.updateRouteStats(remainingDistance, remainingTime);
  navView.updateCurrentRoadSquare(instruction);
  navView.updateNextRoadSquare(instruction, offset);
  navView.updateCurrentRoadColour(instruction, offset);
  navView.updateNextRoadColour(instruction, offset);
  navView.updateNextInstructionDistance(distanceToNext, offset);
  navView.updateNextRoadDirection(instruction, offset);
  console.log('updated heading:' + heading);
  navView.updateDirectionArrow(instruction, location, heading);
  navView.updateMessage(instruction);
}
