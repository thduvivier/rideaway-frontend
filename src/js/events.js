function getElementByClassName(className) {
  const elements = document.getElementsByClassName(className);
  return elements[0];
}

export function registerEvents(map) {
  getElementByClassName('center-btn').addEventListener('click', () => {
    console.log(map.getSource('currentPosition'));
  });
}
