/*
This project is licensed under the GNU General Public License v3.0
*/

// Built with p5.js (https://p5js.org/)

let plasticColors; // color palette for plastic
let plasticSpots = []; // saved plastic positions

function setup() {
  let canvas = createCanvas(1920, 1080);
  canvas.parent("canvas-container");
  pixelDensity(1);
  noLoop();
  strokeCap(ROUND);

  plasticColors = [
    color(255, 50, 120),
    color(200, 255, 0),
    color(255, 230, 0),
    color(255, 180, 200),
    color(255, 220, 180),
    color(255, 240, 200),
    color(120, 120, 120),
    color(180, 180, 180),
    color(220, 220, 220),
    color(80, 80, 80)
  ];
}

function draw() {
  background(255); // white background
  plasticSpots = []; // reset saved positions
  drawPlasticFlows(); // draw plastic first
  drawBlueDots(); // draw ocean dots after
}

// ------------------------
// PLASTIC
// ------------------------

function drawPlasticFlows() {
  for (let i = 0; i < 650; i++) {
    let start = getPlasticStartPoint();
    drawPlasticFlow(start.x, start.y);
  }
}

function getPlasticStartPoint() {
  let side = floor(random(10));
  let offsetAmount = random(-120, 120);

  if (side === 0) {
    return createVector(
      random(0, width * 0.12),
      constrain(random(height) + offsetAmount, 0, height)
    );
  }

  if (side === 1) {
    return createVector(
      random(width * 0.88, width),
      constrain(random(height) + offsetAmount, 0, height)
    );
  }

  return createVector(
    constrain(random(width) + offsetAmount, 0, width),
    random(0, height * 0.12)
  );
}

function drawPlasticFlow(x, y) {
  let c = random(plasticColors);
  let noiseOffsetX = random(1800);
  let noiseOffsetY = random(1800);

  stroke(c);
  strokeWeight(0.1);

  for (let i = 0; i < 700; i++) {
    let nextPoint = getNextPlasticPoint(x, y, noiseOffsetX, noiseOffsetY);
    line(x, y, nextPoint.x, nextPoint.y);

    x = nextPoint.x;
    y = nextPoint.y;

    if (i % 10 === 0) {
      drawPlasticShard(x, y, nextPoint.angle, c);
      savePlasticSpot(x, y);
    }

    if (outsideCanvas(x, y)) {
      break;
    }
  }
}

function getNextPlasticPoint(x, y, noiseOffsetX, noiseOffsetY) {
  let angle = noise((x + noiseOffsetX) * 0.03, (y + noiseOffsetY) * 0.02) * TWO_PI * 2;
  angle += random(-0.3, 0.3);

  return {
    x: x + cos(angle) * 10,
    y: y + sin(angle) * 5,
    angle: angle
  };
}

function drawPlasticShard(x, y, angle, c) {
  let scale = random(0.2, 0.7);

  push();
  translate(x, y);
  rotate(angle);
  noStroke();
  fill(c);
  beginShape();
  addShardVertices(scale);
  endShape(CLOSE);
  pop();
}

function addShardVertices(scale) {
  vertex(-4 * scale + random(-2, 2), -2 * scale + random(-2, 2));
  vertex(3 * scale + random(-3, 3), -5 * scale + random(-3, 3));
  vertex(6 * scale + random(-6, 6), random(-6, 6));
  vertex(2 * scale + random(-3, 3), 5 * scale + random(-3, 3));
  vertex(-5 * scale + random(-2, 2), 2 * scale + random(-2, 2));
}

function savePlasticSpot(x, y) {
  if (plasticSpots.length < 7500) {
    plasticSpots.push(createVector(x, y));
  }
}

// ------------------------
// BLUE DOTS
// ------------------------

function drawBlueDots() {
  let step = 13;
  noStroke();

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      drawBlueDot(x, y, step);
    }
  }
}

function drawBlueDot(x, y, step) {
  let offsetX = getOffsetDotX(x, y, step);
  let d = getNearestPlasticDistance(offsetX, y);
  let finalFactor = getDotIntensity(offsetX, y, d);

  if (d > 38 && finalFactor > 0.04) {
    let dotStyle = getDotStyle(finalFactor);
    fill(dotStyle.r, dotStyle.g, dotStyle.b, dotStyle.alpha);
    ellipse(offsetX, y, dotStyle.size, dotStyle.size);
  }
}

function getOffsetDotX(x, y, step) {
  if (floor(y / step) % 2 === 1) {
    return x + step * 0.5;
  }
  return x;
}

function getDotIntensity(x, y, distanceToPlastic) {
  let cleanFactor = map(distanceToPlastic, 50, 300, 0, 1);
  cleanFactor = constrain(cleanFactor, 0, 1);

  let xFactor = map(x, 0, width, 0, 1);
  let yFactor = map(y, 0, height, 0, 1);
  let diagonalFactor = (xFactor * 0.55) + (yFactor * 0.45);
  diagonalFactor = constrain(diagonalFactor, 0, 1);

  return cleanFactor * diagonalFactor;
}

function getDotStyle(finalFactor) {
  return {
    size: map(finalFactor, 0, 1, 1.2, 12.5),
    alpha: map(finalFactor, 0, 1, 18, 220),
    r: map(finalFactor, 0, 1, 215, 110),
    g: map(finalFactor, 0, 1, 235, 190),
    b: map(finalFactor, 0, 1, 245, 255)
  };
}

function getNearestPlasticDistance(x, y) {
  let nearestSq = 999999999;

  for (let i = 0; i < plasticSpots.length; i += 4) {
    let spot = plasticSpots[i];
    let dx = x - spot.x;
    let dy = y - spot.y;
    let dSq = dx * dx + dy * dy;

    if (dSq < nearestSq) {
      nearestSq = dSq;
    }
  }

  return sqrt(nearestSq);
}

function outsideCanvas(x, y) {
  return x < 0 || x > width || y < 0 || y > height;
}