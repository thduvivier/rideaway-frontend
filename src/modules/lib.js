/*
* Fetch a JSON
* @param String url - The url to fetch from
* @returns Object json - The fetched JSON
*/
export function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => response.json())
      .then(json => resolve(json))
      .catch(ex => reject(ex));
  });
}

/*
* Displays the distance a string format
* @param int m - The distance in meters
* @returns string distance - Formatted distance
*/
export function displayDistance(m) {
  if (m < 1000) {
    return `${Math.round(m)} m`;
  }
  return `${Math.round(m / 100) / 10} km`;
}

/*
* Display the time in a string format
* @param int s - The time in seconds
* @returns string time - Formatted time
*/
export function displayTime(s) {
  if (s < 60) {
    return `1 min`;
  }
  if (s < 3600) {
    return `${Math.round(s / 60)} min`;
  }
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  return `${h} h ${m} min`;
}

/*
* Display the arrival time formatted in a string
* @param int s - The time in seconds
* @returns string arrival - Formatted arrival time
*/
export function displayArrival(s) {
  const arrival = new Date(Date.now() + s * 1000);

  var h = arrival.getHours();
  var m = arrival.getMinutes();

  return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
}

/*
* Gets a paramtername
* @param string paramterName - Paramter
* @returns {} param - The param
*/
export function findGetParameter(parameterName) {
  var result = null,
    tmp = [];
  location.search
    .substr(1)
    .split('&')
    .forEach(function(item) {
      tmp = item.split('=');
      if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    });
  return result;
}

/*
* Swaps around the values in a 2 value array
* @param Array[int, int] array - The array to swap
* @returns Array[int, int] swapped - The swapped array
*/
export function swapArrayValues(array) {
  const array2 = [];
  array2.push(array[1]);
  array2.push(array[0]);
  return array2;
}

/**
 * Get a url parameter by its name. If no url is given the current url is used.
 * 
 * @param {string} name - the name of the parameter 
 * @param {string} url - the url to get the parameter from
 */
export function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
