import {
  displayArrival,
  displayDistance,
  calculateRotationAngle
} from '../lib';
import { angleDeg } from '../../constants';
import turf from 'turf';

export default class NavView {
  constructor() {}

  updateCurrentRoadSquare(instruction) {
    if (
      instruction.properties.type === 'enter' ||
      instruction.properties.type === 'stop'
    ) {
      document.getElementById('current-road-ref').style['display'] = 'none';
    } else {
      document.getElementById('current-road-ref').style['display'] = '';
      document.getElementById('current-road-ref').innerHTML =
        '' + instruction.properties.ref;
    }
  }

  updateNextRoadSquare(instruction, offset) {
    document.getElementById('next-instruction-road-ref').style['top'] =
      offset - 11 + 'vh';

    if (
      instruction.properties.type === 'leave' ||
      instruction.properties.type === 'stop'
    ) {
      document.getElementById('next-instruction-road-ref').style['display'] =
        'none';
    } else {
      document.getElementById('next-instruction-road-ref').style['display'] =
        '';
      document.getElementById('next-instruction-road-ref').innerHTML =
        '' + instruction.properties.nextRef;
    }
  }

  updateRouteStats(remainingDistance, remainingTime) {
    document.getElementById('total-distance').innerHTML = displayDistance(
      remainingDistance
    );
    document.getElementById('arrival-time').innerHTML = displayArrival(
      remainingTime
    );
  }

  updateCurrentRoadColour(instruction, offset) {
    document.getElementById('current-road').style['height'] =
      80 - offset + 'vh';
    document.getElementById('current-road').style['top'] = offset + 20 + 'vh';

    if (instruction.properties.colour) {
      document.getElementById('current-road').style['background-color'] =
        instruction.properties.colour;
    } else {
      document.getElementById('current-road').style['background-color'] =
        'lightgrey';
    }
  }

  updateNextRoadColour(instruction, offset) {
    document.getElementById('next-instruction').style['height'] =
      offset + 20 + 'vh';

    if (instruction.properties.nextColour) {
      document.getElementById('next-instruction').style['background-color'] =
        instruction.properties.nextColour;
    } else {
      document.getElementById('next-instruction').style['background-color'] =
        'lightgrey';
    }
  }

  updateNextInstructionDistance(distanceToNext, offset) {
    document.getElementById('next-instruction-distance').style['top'] =
      offset + 20 + 'vh';
    document.getElementById(
      'next-instruction-distance'
    ).innerHTML = displayDistance(distanceToNext);
  }

  updateNextRoadDirection(instruction, offset) {
    document.getElementById('next-instruction-arrow').style['top'] =
      offset + 1 + 'vh';
    if (instruction.properties.angle) {
      document.getElementById('next-instruction-arrow-img').style[
        'transform'
      ] = `rotate(${angleDeg[instruction.properties.angle.toLowerCase()]}deg)`;
    }
    if (instruction.properties.type === 'stop') {
      document.getElementById('next-instruction-arrow').style['display'] =
        'none';
    }
  }

  updateDirectionArrow(instruction, location, heading) {
    const arrow = document.getElementById('direction-arrow');
    if (
      instruction.properties.type === 'enter' ||
      instruction.properties.type === 'stop'
    ) {
      arrow.style['display'] = 'block';

      let dir = turf.bearing(location, instruction);

      // new direction
      dir -= heading;
      if (dir < 0) {
        dir = dir + 360;
      }
      dir = Math.round(dir);

      const previousDir = parseInt(arrow.dataset.dir) || 0;
      const calculatedDir = calculateRotationAngle(previousDir, dir);
      arrow.dataset.dir = calculatedDir;

      arrow.style['transform'] = `rotate(${calculatedDir + 90}deg)`;
    } else {
      arrow.style['display'] = 'none';
    }
  }

  updateMessage(instruction) {
    if (instruction.properties.type === 'leave') {
      document
        .getElementById('message')
        .setAttribute('data-l10n-id', 'instr-leave');
      document.getElementById('message').style['display'] = 'block';
    } else if (instruction.properties.type === 'stop') {
      document.getElementById('message').style['display'] = 'block';
      document
        .getElementById('message')
        .setAttribute('data-l10n-id', 'instr-destination');
    } else if (instruction.properties.type === 'enter') {
      document.getElementById('message').style['display'] = 'block';
      document
        .getElementById('message')
        .setAttribute('data-l10n-id', 'instr-enter');
    } else {
      document.getElementById('message').style['display'] = 'none';
    }
  }
}
