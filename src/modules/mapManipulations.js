/*
* Filters out the routes to a single route
* @param map mapboxglmap - The map
* @param route String
*/
export function filterRoutes(map, inactives) {
  // Filters, also filter out a/b routes
  const filter = ['all'];
  inactives.forEach(inactive => {
    filter.push(
      ['!=', 'ref', inactive],
      ['!=', 'ref', inactive + 'a'],
      ['!=', 'ref', inactive + 'b']
    );
  });
  map.setFilter('GFR_routes', filter);
  map.setFilter('GFR_symbols', filter);
  map.setLayoutProperty('GFR_routes', 'visibility', 'visible');
  map.setLayoutProperty('GFR_symbols', 'visibility', 'visible');
}

/*
* Removes all the filters from the map
* @param map mapboxglmap - The map
*/
export function removeFilter(map) {
  toggleLayer(map, 'GFR_routes', 'visible');
  toggleLayer(map, 'GFR_symbols', 'visible');
  map.setFilter('GFR_routes', null);
  map.setFilter('GFR_symbols', null);
}

/*
* Clears the calculated routes
* @param mapboxglmap map - The map
* @param Marker marker - The marker (origin/dest)
*/
export function clearRoutes(map, marker) {
  if (map.getSource('brussels')) {
    map.removeLayer('brussels');
    map.removeSource('brussels');
  }
  if (map.getSource('shortest')) {
    map.removeLayer('shortest');
    map.removeSource('shortest');
  }
  marker && marker.remove();
}

/*
* Toggles the visibility of a layer
* @param mapboxglmap map - The map
* @param string id - The id of the layer
* @param boolean showLayer - Force hide/show
*/
export function toggleLayer(map, id, showLayer) {
  let visibility;
  if (showLayer === undefined) {
    visibility = map.getLayoutProperty(id, 'visibility');
    if (visibility === 'visible') {
      visibility = 'none';
    } else {
      visibility = 'visible';
    }
  } else {
    visibility = showLayer;
  }
  map.setLayoutProperty(id, 'visibility', visibility);
}
