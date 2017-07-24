var origin = [
    4.448282718658447,
    50.854217806792526
];
var destination = [
    4.3930453062057495,
    50.8437861154778
];

var routeLine;

// use http://turfjs.org/docs/#pointonline to get the current location on the route
// use http://turfjs.org/docs/#pointonline to simulate the user moving along the route.

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

function distanceAtLocation(route, location){
    //point on line for every linestring
    var bestDist =  null;
    var bestIndex = null;
    for(var i = 0; i < route.features.length; i++){
        var feature = route.features[i];
        if (feature.geometry.type == "LineString") {
            var snapped = turf.pointOnLine(feature, location);
            var dist = turf.distance(snapped, location)
            //closest point is the location
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
    //calculate linedistance of every segment before + slice of current segment
    var length = 0.0;
    for (var j = 0; j < bestIndex; j++){
        length += turf.lineDistance(route.features[j]); 
    }
    length += turf.lineDistance(turf.lineSlice(turf.point(route.features[bestIndex].geometry.coordinates[0]), location, route.features[bestIndex]));
    
    //return
    return length;
}

function instructionAt(instructions, currentDistance){
    for (var i = 0; i< instructions.features.length; i++){
        var instruction = instructions.features[i];
        if (instruction.properties.distance >= currentDistance){
            return instruction;
        }
    }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.json())
      .then(json => resolve(json))
      .catch(ex => reject(ex));
  });
}

function startTracking() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position => {
        var coord = position.coords;
        var location = turf.point([coord.longitude, coord.latitude]);
        update(location);
    }      
    );
  } else {
    alert("Sorry, your browser doesn't support geolocation!");
  }
}

var result;

var length;
var dataAtLast;
var totalDistance;
var totalTime;

//console.log(dataAtLast);

var i = 0;
var loc1;
var loc2;

function initializeNavigation(result){    
    this.result = result;
    length = lengthOfRoute(result.route);
    dataAtLast = result.route.features[result.route.features.length - 1].properties;
    totalDistance = dataAtLast.distance / 1000.0;
    totalTime = dataAtLast.time;
}

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
    });
    document.getElementById("close-navigation").addEventListener("click", function(){
        location.href = "index.html"
    })
}

function step (){ 
    var location = pointAlongRoute(result.route, i).geometry.coordinates;
    update(location)
    
    i += 0.01;

    if (i < length) {
        setTimeout(step, 50);
    }
}

function update(location){
    

    var dataAtLocation = pointOnRoute(result.route, location);
    var distance = distanceAtLocation(result.route, location);
    var instruction = instructionAt(result.instructions, distance*1000);


    document.getElementById("next-instruction-distance").innerHTML = '' + Math.round((instruction.properties.distance - (distance*1000))/10)*10 + 'm';
    if (instruction.properties.type === "leave"){
        document.getElementById("next-instruction-message").setAttribute("data-l10n-id", "instr-leave");
        document.getElementById("next-instruction-message").style["display"] = "block";
        document.getElementById("next-instruction-road-ref").style["display"] = "none";
    }
    else if (instruction.properties.type === "stop"){
        document.getElementById("next-instruction-message").setAttribute("data-l10n-id", "instr-destination");        
    }
    else {
        document.getElementById("next-instruction-message").style["display"] = "none";
        document.getElementById("next-instruction-road-ref").style["display"] = "";
        document.getElementById("next-instruction-road-ref").innerHTML = '' + instruction.properties.nextRef;
    }

    if (instruction.properties.type === "enter"){
        document.getElementById("current-road-ref").style["display"] = "none";
        document.getElementById("current-road-message").style["display"] = "block";
    }
    else {
        document.getElementById("current-road-ref").style["display"] = "";
        document.getElementById("current-road-message").style["display"] = "none";
    }

    if (instruction.properties.colour)  {
        document.getElementById("current-road").style["background-color"] = instruction.properties.colour;
    } else {
        document.getElementById("current-road").style["background-color"] = "white";
    }
    if (instruction.properties.nextColour)  {
        document.getElementById("next-instruction").style["background-color"] = instruction.properties.nextColour
    } else {
        document.getElementById("next-instruction").style["background-color"] = "white";
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
    


    //debug
    /*
    document.getElementById("distance").innerHTML = '' + (totalDistance - distance);
    document.getElementById("time").innerHTML = '' + (totalTime - dataAtLocation.time);
    document.getElementById("instruction").innerHTML = '' + instruction.properties.instruction;
    document.getElementById("distanceNext").innerHTML = '' + (Math.round(instruction.properties.distance - (distance*1000))) + " m";

    document.getElementById("nextColour").style["background-color"] = instruction.properties.colour;
    document.getElementById("debug").innerHTML = '' + JSON.stringify(dataAtLocation);

    var direction;
    if (instruction.properties.angle){
        if (instruction.properties.angle.toLowerCase().indexOf("left") !== -1){
            direction =  "<-- " + instruction.properties.nextRef; 
        }
        else {
            direction = instruction.properties.nextRef + " -->"
        }
    }
    document.getElementById("direction").innerHTML = '' + direction;

    if (dataAtLocation.colour)  {
        document.getElementById("routeColour").style["background-color"] = dataAtLocation.colour;
    } else {
        document.getElementById("routeColour").style["background-color"] = "white";
    }*/
}

initialize();