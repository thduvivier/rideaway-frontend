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
  var m = Math.floor(s % 3600 / 60);
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
