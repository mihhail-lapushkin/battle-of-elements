const ELEMENT_HIERARCHY = [ 'fire', 'wind', 'water' ];
const CELL_COUNT = 100;
const MIN_LIFE = 0;
const MAX_LIFE = 255;
const WEAK_FACTOR = 0.5;
const STRONG_FACTOR = 2.0;

const canvas = document.getElementById('canvas');
const canvasContext = canvas.getContext('2d');
const cellWidth = canvas.width / CELL_COUNT;
const cellHeight = canvas.height / CELL_COUNT;

let shouldConfine = false;
let cells = [];
let requestAnimationFrameId;

document.getElementById('confined').checked = localStorage.getItem('battleOfElements.confined') === 'true';

function toggleConfined() {
  shouldConfine = document.getElementById('confined').checked;
  localStorage.setItem('battleOfElements.confined', shouldConfine);
}

function updateButtons() {
  document.getElementById('start').style.display = requestAnimationFrameId === undefined ? '' : 'none';
  document.getElementById('stop').style.display = requestAnimationFrameId === undefined ? 'none' : '';
  document.getElementById('restart').style.display = '';
}

function clear() {
  cells = [];

  for (let i = 0; i < CELL_COUNT; i++) {
    const row = [];
    cells.push(row);

    for (let j = 0; j < CELL_COUNT; j++) {
      row.push({ fire: MIN_LIFE, wind: MIN_LIFE, water: MIN_LIFE });
    }
  }

  randomCell().fire = MAX_LIFE;
  randomCell().wind = MAX_LIFE;
  randomCell().water = MAX_LIFE;
}

clear();
redraw();

function restart() {
  clear();
  stop();
  start();
}

function start() {
  scheduleStep();
  updateButtons();
  document.getElementById('start').textContent = 'Resume';
}

function stop() {
  cancelAnimationFrame(requestAnimationFrameId);
  requestAnimationFrameId = undefined;
  updateButtons();
}

function onStep() {
  attack('fire');
  attack('wind');
  attack('water');
  redraw();
  scheduleStep();
}

function scheduleStep() {
  requestAnimationFrameId = requestAnimationFrame(onStep);
}

function attack(element) {
  const elementIndex = ELEMENT_HIERARCHY.indexOf(element);
  const weakElement = ELEMENT_HIERARCHY[elementIndex === ELEMENT_HIERARCHY.length - 1 ? 0 : elementIndex + 1];
  const strongElement = ELEMENT_HIERARCHY[elementIndex === 0 ? ELEMENT_HIERARCHY.length - 1 : elementIndex - 1];
  const attackOrder = [ weakElement, strongElement, element, 'neutral' ];

  for (let i = 0; i < CELL_COUNT; i++) {
    for (let j = 0; j < CELL_COUNT; j++) {
      if (cells[i][j][element] === MAX_LIFE) {
        let lifeLeft = MAX_LIFE;
        attackOrder.forEach(opponent => {
          if (lifeLeft > MIN_LIFE) {
            lifeLeft = battle(i, j, element, opponent, weakElement, lifeLeft);
          }
        });
      }
    }
  }
}

function battle(i, j, attacker, target, weakElement, lifeLeft) {
  const iDeltas = [];
  const jDeltas = [];

  while (iDeltas.length < 3) {
    const delta = randomBetween(-1, 1);

    if (iDeltas.indexOf(delta) < 0) {
      iDeltas.push(delta);
    }
  }

  while (jDeltas.length < 3) {
    const delta = randomBetween(-1, 1);

    if (jDeltas.indexOf(delta) < 0) {
      jDeltas.push(delta);
    }
  }

  for (const iDelta of iDeltas) {
    for (const jDelta of jDeltas) {
      const row = cells[tryConfine(i + iDelta)];

      if (!row) {
        continue;
      }

      const cell = row[tryConfine(j + jDelta)];

      if (!cell || cell[attacker] === MAX_LIFE) {
        continue;
      }

      if (target === 'neutral') {
        if (cell.fire === MIN_LIFE && cell.wind === MIN_LIFE && cell.water === MIN_LIFE) {
          cell[attacker] = lifeLeft;
          lifeLeft = MIN_LIFE;
        }
      } else if (cell[target] > MIN_LIFE) {
        if (target === attacker) {
          const newLife = cell[target] + lifeLeft;

          if (newLife >= MAX_LIFE) {
            lifeLeft = newLife - MAX_LIFE;
            cell[target] = MAX_LIFE;
          } else {
            cell[target] += lifeLeft;
          }
        } else {
          const factor = target === weakElement ? WEAK_FACTOR : STRONG_FACTOR;
          const newLife = lifeLeft - Math.floor(cell[target] * factor);

          if (newLife <= MIN_LIFE) {
            cell[target] = -Math.floor(newLife / factor);
            lifeLeft = MIN_LIFE;
          } else {
            cell[target] = MIN_LIFE;
            lifeLeft = newLife;
          }
        }
      }

      if (lifeLeft === MIN_LIFE) {
        return lifeLeft;
      }
    }
  }

  return lifeLeft;
}

function redraw() {
  for (let i = 0; i < CELL_COUNT; i++) {
    for (let j = 0; j < CELL_COUNT; j++) {
      const cell = cells[i][j];
      canvasContext.beginPath();
      canvasContext.rect(cellWidth * i, cellHeight * j, cellWidth, cellHeight);
      canvasContext.fillStyle = 'rgb(' + cell.fire + ',' + cell.wind + ',' + cell.water + ')';
      canvasContext.fill();
    }
  }
}

function tryConfine(index) {
  if (!shouldConfine) {
    if (index < 0) {
      return index + CELL_COUNT;
    } else if (index >= CELL_COUNT) {
      return index - CELL_COUNT;
    }
  }

  return index;
}

function randomCell() {
  return cells[randomBetween(0, CELL_COUNT - 1)][randomBetween(0, CELL_COUNT - 1)];
}

function randomBetween(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
