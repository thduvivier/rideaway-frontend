import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { fetchJSON } from '../lib';
import { center } from '../../constants';

/*
* Returns a geocoder object
* @param String placeholder - The placeholder for the geocoder
* @returns MapboxGeocoder geocoder - The geocoder
*/
export function createGeocoder(placeholder) {
  return new MapboxGeocoder({
    // eslint-disable-next-line
    accessToken: process.env.MAPBOX_TOKEN,
    flyTo: false,
    placeholder,
    country: 'BE',
    proximity: { latitude: center.latlng[0], longitude: center.latlng[1] }
  });
}

export function getReverseLookup(LatLng) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${LatLng[0]},${LatLng[1]}.json?limit=1&access_token=${process
    .env.MAPBOX_TOKEN}`;
  return fetchJSON(url).then(json => {
    return json.features[0].place_name;
  });
}
