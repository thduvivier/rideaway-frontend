/**
 * Calculates the length of the route.
 * 
 * @param {Object} route - the route object.
 * @return {number} length of the route.
 */
function lengthOfRoute (route) {
    var length = 0.0;
    for(var i = 0; i < route.features.length; i++) {
        var feature = route.features[i];
        if (feature.geometry.type == "LineString") {
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
function pointAlongRoute (route, distance) {
    var length = 0.0;
    for(var i = 0; i < route.features.length; i++) {
        var feature = route.features[i];
        if (feature.geometry.type == "LineString") {
            var localLength = turf.lineDistance(feature);

            if (length <= distance &&
                distance <= localLength + length) {
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
    var best = 1000000;
    var bestData = {};
    for(var i = 0; i < route.features.length; i++) {
        var feature = route.features[i];
        if (feature.geometry.type == "LineString") {
            var snapped = turf.pointOnLine(feature, point);

            if (snapped.properties.dist < best) {
                best = snapped.properties.dist;
                bestData = feature.properties;
            }
        }
    }
    return bestData;
}

/**
 * Calculates the distance of the route between the startpoint and the
 * given location.
 * 
 * @param {Object} route - the route object
 * @param {Object} location - point along the route
 */
function distanceAtLocation(route, location){
    var bestDist =  null;
    var bestIndex = null;
    for(var i = 0; i < route.features.length; i++){
        var feature = route.features[i];
        if (feature.geometry.type == "LineString") {
            var snapped = turf.pointOnLine(feature, location);
            var dist = turf.distance(snapped, location)
            
            if(bestDist !== null){
                if (dist < bestDist){
                    bestDist = dist;
                    bestIndex = i;
                }
            }
            else {
                bestDist = dist;
                bestIndex = i;
            }
        }
    }

    var length = 0.0;
    for (var j = 0; j < bestIndex; j++){
        length += turf.lineDistance(route.features[j]); 
    }
    length += turf.lineDistance(turf.lineSlice(turf.point(route.features[bestIndex].geometry.coordinates[0]), location, route.features[bestIndex]));
    
    return length;
}

/**
 * Returns the instruction that is next when you are at the given distance on the route
 * 
 * @param {Object} instructions - list of the instructions
 * @param {number} currentDistance - the distance to get the instruction for
 */
function instructionAt(instructions, currentDistance){
    for (var i = 0; i< instructions.features.length; i++){
        var instruction = instructions.features[i];
        if (instruction.properties.distance >= currentDistance){
            return instruction;
        }
    }
}

/**
 * Calculates the bearing between the location and the location of the instruction.
 * @param {Object} location - current location
 * @param {Object} instruction - instruction to point to
 */
function calculateBearing(location, instruction){
    return turf.bearing(location, turf.point(instruction.geometry.coordinates));
}

/**
 * Get a url parameter by its name. If no url is given the current url is used.
 * 
 * @param {string} name - the name of the parameter 
 * @param {string} url - the url to get the parameter from
 */
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * Execute a GET request to get a json from a url.
 * 
 * @param {string} url - url to get json from 
 */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.json())
      .then(json => resolve(json))
      .catch(ex => reject(ex));
  });
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
    }      
    );
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

/**
 * Initialises the navigation with the result from the api.
 * 
 * @param {Object} result - result from the api 
 */
function initializeNavigation(result){    
    this.result = result;
    length = lengthOfRoute(result.route);
    dataAtLast = result.route.features[result.route.features.length - 1].properties;
    totalDistance = dataAtLast.distance / 1000.0;
    totalTime = dataAtLast.time;
}

/**
 * Initialises the navigation application.
 */
function initialize(){
    loc1 = getParameterByName("loc1");
    loc2 = getParameterByName("loc2");
    console.log(loc1);
    console.log(loc2);
    const url = `https://cyclerouting-api.osm.be/route?loc1=${loc1}&loc2=${loc2}&profile=brussels&instructions=true`;

    fetchJSON(url).then(json => {
        initializeNavigation(json);
        setTimeout(step, 50);
        //startTracking();
        document.getElementById("loading-screen").style["display"] = "none";
    });
    document.getElementById("close-navigation").addEventListener("click", function(){
        location.href = "index.html"
    });
    
    document.getElementById("goto-map").addEventListener("click", function() {
        location.href = `index.html?loc1=${loc1}&loc2=${loc2}`
    });
}

/**
 * Step function used in debug mode to iterate over the route.
 */
function step (){ 
    var location = pointAlongRoute(result.route, i).geometry.coordinates;
    update(location)
    
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
function update(location){
    var dataAtLocation = pointOnRoute(result.route, location);
    var distance = distanceAtLocation(result.route, location);
    var instruction = instructionAt(result.instructions, distance*1000);
    
    if (totalDistance - distance < 0.01){
        window.location.href = "index.html"
    }

    document.getElementById("next-instruction-distance").innerHTML = '' + Math.round((instruction.properties.distance - (distance*1000))/10)*10 + 'm';
    
    if (instruction.properties.type === "leave"){
        document.getElementById("next-instruction-message").setAttribute("data-l10n-id", "instr-leave");
        document.getElementById("next-instruction-message").style["display"] = "block";
        document.getElementById("next-instruction-road-ref").style["display"] = "none";
    }
    else if (instruction.properties.type === "stop"){
        document.getElementById("next-instruction-message").setAttribute("data-l10n-id", "instr-destination");        
        document.getElementById("next-instruction-arrow").style["display"] = "none";
        document.getElementById("direction-arrow").style["display"] = "block";

    }
    else if (instruction.properties.type === "enter"){
        document.getElementById("current-road-ref").style["display"] = "none";
        document.getElementById("current-road-message").style["display"] = "block";
        document.getElementById("direction-arrow").style["display"] = "block";
        document.getElementById("next-instruction-road-ref").innerHTML = '' + instruction.properties.nextRef;
    }
    else {
        document.getElementById("next-instruction-message").style["display"] = "none";
        document.getElementById("next-instruction-road-ref").style["display"] = "";
        document.getElementById("next-instruction-road-ref").innerHTML = '' + instruction.properties.nextRef;
        document.getElementById("current-road-ref").style["display"] = "";
        document.getElementById("current-road-message").style["display"] = "none";
        document.getElementById("direction-arrow").style["display"] = "none";
    }
    
    
    if (instruction.properties.type === "enter" || instruction.properties.type === "stop"){
        var dir = calculateBearing(location, instruction);
        if (heading){
            dir = dir - heading;
        }
        document.getElementById("direction-arrow").style["transform"] = `rotate(${dir + 90}deg)`
        console.log(heading);
    }


    if (instruction.properties.colour)  {
        document.getElementById("current-road").style["background-color"] = instruction.properties.colour;
    } else {
        document.getElementById("current-road").style["background-color"] = "lightgrey";
    }
    if (instruction.properties.nextColour)  {
        document.getElementById("next-instruction").style["background-color"] = instruction.properties.nextColour
    } else {
        document.getElementById("next-instruction").style["background-color"] = "lightgrey";
    }

    if (instruction.properties.angle){
        if (instruction.properties.angle.toLowerCase().indexOf("left") !== -1){
            document.getElementById("next-instruction-arrow-img").style["transform"] = "rotate(0deg)"
        }
        else if (instruction.properties.angle.toLowerCase().indexOf("right") !== -1){
            document.getElementById("next-instruction-arrow-img").style["transform"] = "rotate(180deg)"
        }
        else{
            document.getElementById("next-instruction-arrow-img").style["transform"] = "rotate(90deg)"

        }
    }
}

initialize();