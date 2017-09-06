import turf from 'turf';
import { 
  fetchJSON, 
  getParameterByName, 
  displayArrival, 
  displayDistance, 
  lengthOfRoute, 
  pointAlongRoute, 
  pointOnRoute, 
  distanceAtLocation,
  instructionAt,
  calculateAngle
} from '../lib';

import router from '../../router';

/**
 * Starts tracking your location and updating the screen.
 */
function startTracking() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position => {
      if(loading){
        loading = false;
        document.querySelector('.main-loading').classList.remove('visible');        
      }
      var coord = position.coords;
      var location = turf.point([coord.longitude, coord.latitude]);
      heading = position.coords.heading;
      update(location);
    });
  } else {
    alert("Sorry, your browser doesn't support geolocation!");
  }
}
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

const arrowDeg = {
  sharpleft: -45,
  left: 0,
  slightlyleft: 45,
  straighton: 90,
  slightlyright: 135,
  right: 180,
  sharpright: 225
};

const degAngle = {
  270: 'sharpleft',
  0: 'left',
  45: 'slightlyleft',
  90: 'straighton',
  135: 'slightlyright',
  180: 'right',
  225: 'sharpright'
};

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
}

/**
 * Initialises the navigation application.
 */
export default function initialize(origin, destination) {
  loc1 = origin;
  loc2 = destination;
  console.log(loc1);
  console.log(loc2);
  const url = `https://cyclerouting-api.osm.be/route?loc1=${loc1}&loc2=${loc2}&profile=brussels&instructions=true`;

  fetchJSON(url).then(json => {
    loading = true;
    initializeNavigation(json);
    setTimeout(step, 50);
    
    //startTracking();
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
  if(loading){
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

  if (totalDistance - distance < 0.01) {
    router.goToRouteplanner();
  }

  // if the user is more than 25m off route, show a direction arrow to navigate
  // back to the route.
  if (closestPoint.distance > 0.025){
    distanceToNext = closestPoint.distance * 1000;
    instruction = {
      type: "Feature",
      properties:{
        type: "enter",
        nextColour: instruction.properties.colour,
        nextRef: instruction.properties.ref,
        angle: degAngle[calculateAngle(location, closestPoint)]
      },
      geometry:{ 
        type: "Point",
        coordinates: closestPoint.point
      }
    }
  }

  document.getElementById('next-instruction-distance').innerHTML = displayDistance(distanceToNext);

  updateOffsets(distanceToNext);
  updateCurrentRoad(instruction);
  updateNextInstruction(instruction);
  updateDirection(location, instruction);
  updateRouteStats(distance);
}

function updateRouteStats(distance){
  var remainingDistance = (totalDistance -distance)*1000;
  var remainingTime = remainingDistance / 3.6;

  document.getElementById('total-distance').innerHTML = displayDistance(remainingDistance);
  document.getElementById('arrival-time').innerHTML = displayArrival(remainingTime);
}

function updateOffsets(distanceToNext){
  var offset = 0;
  if (distanceToNext < 1000){
    offset = (distanceToNext-1000)*-1/20;   
  }
  document.getElementById("next-instruction-distance").style["top"] = offset + 20 + "vh";
  document.getElementById("next-instruction").style["height"] = offset + 20 + "vh";
  document.getElementById("current-road").style["height"] = 80 - offset + "vh";
  document.getElementById("current-road").style["top"] = offset + 20 + "vh";
  document.getElementById("next-instruction-arrow").style["top"] = offset + 1 + "vh";
  document.getElementById("next-instruction-road-ref").style["top"] = offset - 11 + "vh";
}

/**
 * Updates the direction arrow when the location is not yet on the route.
 * 
 * @param {Object} location - current location
 * @param {Object} instruction - current instruction
 */
function updateDirection(location, instruction) {
  if (
    instruction.properties.type === 'enter' ||
    instruction.properties.type === 'stop'
  ) {
    document.getElementById('direction-arrow').style['display'] = 'block';

    var dir = turf.bearing(location, instruction);
    if (heading) {
      dir = dir - heading;
    }
    document.getElementById('direction-arrow').style[
      'transform'
    ] = `rotate(${dir + 90}deg)`;
  } else {
    document.getElementById('direction-arrow').style['display'] = 'none';
  }
}

/**
 * Updates the view of the current road.
 * 
 * @param {Object} instruction - current instruction 
 */
function updateCurrentRoad(instruction) {
  if (instruction.properties.colour) {
    document.getElementById('current-road').style['background-color'] =
      instruction.properties.colour;
  } else {
    document.getElementById('current-road').style['background-color'] =
      'lightgrey';
  }

  if (instruction.properties.type === 'enter') {
    document.getElementById('current-road-ref').style['display'] = 'none';
  } else {
    document.getElementById('current-road-ref').style['display'] = '';
    document.getElementById('current-road-ref').innerHTML =
      '' + instruction.properties.ref;
  }
}

/**
 * Updates the view for the next instruction.
 * 
 * @param {Object} instruction - the current instruction 
 */
function updateNextInstruction(instruction) {
  if (instruction.properties.nextColour) {
    document.getElementById('next-instruction').style['background-color'] =
      instruction.properties.nextColour;
  } else {
    document.getElementById('next-instruction').style['background-color'] =
      'lightgrey';
  }
  if (instruction.properties.angle) {
    document.getElementById('next-instruction-arrow-img').style[
      'transform'
    ] = `rotate(${arrowDeg[instruction.properties.angle.toLowerCase()]}deg)`;
  }

  if (instruction.properties.type === 'leave') {
    document
      .getElementById('message')
      .setAttribute('data-l10n-id', 'instr-leave');
    document.getElementById('message').style['display'] = 'block';
    document.getElementById('next-instruction-road-ref').style['display'] =
      'none';
  } else if (instruction.properties.type === 'stop') {
    document.getElementById('current-road-ref').style['display'] = 'none';
    document
      .getElementById('message')
      .setAttribute('data-l10n-id', 'instr-destination');
    document.getElementById('next-instruction-arrow').style['display'] = 'none';
  } else if (instruction.properties.type === 'enter') {
    document.getElementById('next-instruction-road-ref').innerHTML =
      '' + instruction.properties.nextRef;
    document.getElementById('message').style['display'] = 'block';
    document
      .getElementById('message')
      .setAttribute('data-l10n-id', 'instr-enter');
  } else {
    document.getElementById('message').style['display'] = 'none';
    document.getElementById('next-instruction-road-ref').style['display'] = '';
    document.getElementById('next-instruction-road-ref').innerHTML =
      '' + instruction.properties.nextRef;
  }
}
