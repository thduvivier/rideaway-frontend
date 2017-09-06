import turf from 'turf';
import { fetchJSON, getParameterByName } from '../lib';

import router from '../../router';

/**
 * Calculates the length of the route.
 * 
 * @param {Object} route - the route object.
 * @return {number} length of the route.
 */
function lengthOfRoute(route) {
  var length = 0.0;
  for (var i = 0; i < route.features.length; i++) {
    var feature = route.features[i];
    if (feature.geometry.type == 'LineString') {
      length += turf.lineDistance(feature);
    }
  }
  return length;
}

/**
 * Returns the feature at the given distance on the route
 * 
 * @param {Object} route - the route object
 * @param {number} distance - distance on route 
 */
function pointAlongRoute(route, distance) {
  var length = 0.0;
  for (var i = 0; i < route.features.length; i++) {
    var feature = route.features[i];
    if (feature.geometry.type == 'LineString') {
      var localLength = turf.lineDistance(feature);

      if (length <= distance && distance <= localLength + length) {
        return turf.along(feature, distance - length);
      }

      length += localLength;
    }
  }
  return length;
}

/**
 * Returns the properties of the geojson feature that is closest to the
 * given point.
 * 
 * @param {Object} route - the route object 
 * @param {Object} point - a coordinate along the route
 */
function pointOnRoute (route, point) {
  var ret = {
      distance: 1000000,
      point: {},
      data: {},
      nextPoint: {}
  };
  for(var i = 0; i < route.features.length; i++) {
      var feature = route.features[i];
      if (feature.geometry.type == "LineString") {
          var snapped = turf.pointOnLine(feature, point);

          if (snapped.properties.dist < ret.distance) {
              ret.distance = snapped.properties.dist;
              ret.point = snapped.geometry.coordinates;
              ret.data = feature.properties;
              ret.nextPoint = feature.geometry.coordinates[snapped.properties.index];
          }
      }
  }
  return ret;
}

/**
 * Calculates the distance of the route between the startpoint and the
 * given location.
 * 
 * @param {Object} route - the route object
 * @param {Object} location - point along the route
 */
function distanceAtLocation(route, location) {
  var bestDist = null;
  var bestIndex = null;
  for (var i = 0; i < route.features.length; i++) {
    var feature = route.features[i];
    if (feature.geometry.type == 'LineString') {
      var snapped = turf.pointOnLine(feature, location);
      var dist = turf.distance(snapped, location);

      if (bestDist !== null) {
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      } else {
        bestDist = dist;
        bestIndex = i;
      }
    }
  }

  var length = 0.0;
  for (var j = 0; j < bestIndex; j++) {
    length += turf.lineDistance(route.features[j]);
  }
  length += turf.lineDistance(
    turf.lineSlice(
      turf.point(route.features[bestIndex].geometry.coordinates[0]),
      location,
      route.features[bestIndex]
    )
  );

  return length;
}

/**
 * Returns the instruction that is next when you are at the given distance on the route
 * 
 * @param {Object} instructions - list of the instructions
 * @param {number} currentDistance - the distance to get the instruction for
 */
function instructionAt(instructions, currentDistance) {
  for (var i = 0; i < instructions.features.length; i++) {
    var instruction = instructions.features[i];
    if (instruction.properties.distance >= currentDistance) {
      return instruction;
    }
  }
}

/**
 * Calculates the bearing between the location and the location of the instruction.
 * @param {Object} location - current location
 * @param {Object} instruction - instruction to point to
 */
function calculateBearing(location, instruction) {
  return turf.bearing(location, turf.point(instruction.geometry.coordinates));
}

/**
 * Starts tracking your location and updating the screen.
 */
function startTracking() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position => {
      var coord = position.coords;
      var location = turf.point([coord.longitude, coord.latitude]);
      heading = position.coords.heading;
      update(location);
    });
  } else {
    alert("Sorry, your browser doesn't support geolocation!");
  }
}

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
  270: "sharpleft",
  0: "left",
  45: "slightlyleft",
  90: "straighton",
  135: "slightlyright",
  180: "right",
  225: "sharpright"
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
    initializeNavigation(json);
    setTimeout(step, 50);
    //startTracking();
    document.querySelector('.main-loading').classList.remove('visible');
  });
  document
    .getElementById('close-navigation')
    .addEventListener('click', function() {
      router.goToRouteplanner(true);
    });

  document.getElementById('goto-map').addEventListener('click', function() {
    router.goToRouteplanner(false);
  });
}

/**
 * Step function used in debug mode to iterate over the route.
 */
function step() {
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
  var instruction = instructionAt(result.instructions, distance*1000);
  var distanceToNext = instruction.properties.distance - (distance*1000);

  if (totalDistance - distance < 0.01) {
    router.goToRouteplanner(true);
  }

  // if the user is more than 25m off route, show a direction arrow to navigate
    // back to the route.
    if (closestPoint.distance > 0.025){
      distanceToNext = closestPoint.distance * 1000;
      var angle1 = turf.bearing(location, turf.point(closestPoint.point));
      var angle2 = turf.bearing(turf.point(closestPoint.point), turf.point(closestPoint.nextPoint));
      var dif = angle2 - angle1;
      if (dif < 0){
          dif += 360
      }
      dif -= 90
      dif = Math.round(dif / 45)*45

      instruction = {
          properties:{
              type: "enter",
              nextColour: instruction.properties.colour,
              nextRef: instruction.properties.ref,
              angle: degAngle[dif]
          },
          geometry: closestPoint.point
      }
  }
  if (distanceToNext > 1000){
    document.getElementById('next-instruction-distance').innerHTML =
      '' +
      Math.round(distanceToNext/100)/10 +
      'km';
  }
  else {
    document.getElementById('next-instruction-distance').innerHTML =
      '' +
      Math.round(distanceToNext/10)*10 +
      'm';
  }

  var offset = 20;
  if (distanceToNext < 1000){
    offset += (distanceToNext-1000)*-1/20;
  }

  updateOffsets(offset);
  updateCurrentRoad(instruction);
  updateNextInstruction(instruction);
  updateDirection(location, instruction);
  updateRouteStats(distance);
}

function updateRouteStats(distance){
  var remainingDistance = (totalDistance -distance)*1000;
  if(remainingDistance > 1000){
    document.getElementById('total-distance').innerHTML =
      '' +
      Math.round(remainingDistance/100)/10 +
      'km';
  }
  else {
    document.getElementById('total-distance').innerHTML =
      '' +
      Math.round(remainingDistance/10)*10 +
      'm';
  }
  
  //document.getElementById("total-distance")
}

function updateOffsets(offset){
  document.getElementById("next-instruction-distance").style["top"] = offset + "vh";
  document.getElementById("next-instruction").style["height"] = offset + "vh";
  document.getElementById("current-road").style["height"] = (100 - offset) + "vh";
  document.getElementById("current-road").style["top"] = offset + "vh";
  document.getElementById("next-instruction-arrow").style["top"] = offset - 19 + "vh";
  document.getElementById("next-instruction-road-ref").style["top"] = offset - 31 + "vh";
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

    var dir = calculateBearing(location, instruction);
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
    document.getElementById('message').style['display'] =
      'block';
    document.getElementById('next-instruction-road-ref').style['display'] =
      'none';
  } else if (instruction.properties.type === 'stop') {
    document.getElementById("current-road-ref").style["display"] = "none";    
    document
      .getElementById('message')
      .setAttribute('data-l10n-id', 'instr-destination');
    document.getElementById('next-instruction-arrow').style['display'] = 'none';
  } else if (instruction.properties.type === 'enter') {
    document.getElementById('next-instruction-road-ref').innerHTML =
      '' + instruction.properties.nextRef;
    document.getElementById("message").style["display"] = "block";
    document.getElementById("message").setAttribute("data-l10n-id", "instr-enter");  
  } else {
    document.getElementById('message').style['display'] =
      'none';
    document.getElementById('next-instruction-road-ref').style['display'] = '';
    document.getElementById('next-instruction-road-ref').innerHTML =
      '' + instruction.properties.nextRef;
  }
}
