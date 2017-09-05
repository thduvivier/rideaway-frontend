import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';

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
    bbox: [4.225015, 50.74915, 4.524909, 50.938001]
  });
}
