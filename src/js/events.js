import { getElementByClassName } from './lib';

export function registerEvents(map) {
  getElementByClassName('center-btn').addEventListener('click', () => {
    console.log(map.getSource('currentPosition'));
  });
}
