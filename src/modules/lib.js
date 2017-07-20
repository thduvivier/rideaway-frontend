export function uniq(a) {
  var prims = { boolean: {}, number: {}, string: {} },
    objs = [];

  return a.filter(function(item) {
    var type = typeof item;
    if (type in prims)
      return prims[type].hasOwnProperty(item)
        ? false
        : (prims[type][item] = true);
    else return objs.indexOf(item) >= 0 ? false : objs.push(item);
  });
}

export function displayDistance(m) {
  if (m < 1000) {
    return `${Math.round(m)} m`;
  }
  return `${Math.round(m / 100) / 10} km`;
}

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

export function displayArrival(s) {
  const arrival = new Date(Date.now() + s * 1000);

  var h = arrival.getHours();
  var m = arrival.getMinutes();

  return `${h}:${m}`;
}
