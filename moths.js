// Size of canvas. These get updated to fill the whole browser.
let width = 150;
let height = 150;

const numParticles = 10;
const speedLimit = 5;
let visualRange = 75;

let isVisitedOnPhone = false;

if (/Mobi|Android/i.test(navigator.userAgent)) {
  if (localStorage.getItem('visitedOnPhone')) {
    isVisitedOnPhone = true;
  } else {
    localStorage.setItem('visitedOnPhone', 'true');
  }
}

const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
let imgData = null;

var particles = [];
let globalBest = { x: 0, y: 0 };
let globalBestValue = -Infinity;

// Global peaks array - will be populated with random peaks
let peaks = [];
let maxPossibleValue = 0;

// PSO parameters - tuned for moth-like behavior
const inertiaWeight = 0.05;  // High inertia for momentum/overshoot
const cognitiveWeight = 0.003;  // Lower cognitive to reduce direct attraction
const socialWeight = 0.0003;    // Higher social for strong attraction to peaks

let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

function initParticles() {
  for (var i = 0; i < numParticles; i += 1) {
    particles[particles.length] = {
      x: Math.random() * width,
      y: Math.random() * height,
      dx: Math.random() * 10 - 5,
      dy: Math.random() * 10 - 5,
      pBest: null,
      pBestValue: null,
      fitness: 0
    };
  }
}

function distance(particle1, particle2) {
  return Math.sqrt(
    (particle1.x - particle2.x) * (particle1.x - particle2.x) +
      (particle1.y - particle2.y) * (particle1.y - particle2.y),
  );
}

// Generate random peaks for the fitness landscape
function generateRandomPeaks(numPeaks = 3) {
  peaks = [];
  let totalAmplitude = 0;
  
  // First pass: generate random amplitudes
  for (let i = 0; i < numPeaks; i++) {
    const amplitude = Math.random() * 0.6 + 0.4; // Random amplitude: 0.4-1.0
    peaks.push({
      cx: Math.random() * width * 0.8 + width * 0.1,  // Keep peaks away from edges
      cy: Math.random() * height * 0.8 + height * 0.1, // Keep peaks away from edges
      sigma: Math.random() * 80 + 40,                   // Random spread: 40-120
      amplitude: amplitude
    });
    totalAmplitude += amplitude;
  }
  
  // Second pass: normalize amplitudes so they sum to 1
  tallestPeakValue = 0;
  for (let peak of peaks) {
    peak.amplitude /= totalAmplitude;
    tallestPeakValue = Math.max(tallestPeakValue, peak.amplitude);
  }
  
  maxPossibleValue = 1.0; // Now always 1 since amplitudes sum to 1
}

// Called initially and whenever the window resizes to update the canvas
// size and width/height variables.
function sizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // Generate new random peaks for the new canvas size
  generateRandomPeaks();

  // Adjust visual range for smaller screens
  if (width < 600) {
    visualRange = 20;
  } else {
    visualRange = 75;
  }
}

// Example fitness function: a simple 2D Gaussian
function fitnessFunctionSingle(x, y) {
  const cx = width / 2;
  const cy = height / 2;
  const sigma = Math.min(width, height) / 12;
  return Math.exp(-((x - cx) * (x - cx) + (y - cy) * (y - cy)) / (2 * sigma * sigma));
}

// Normalize fitness value to [0,1] based on expected min/max
function normalize(value) {
  // Assuming fitnessFunction returns values in [0,1]
  return Math.max(0, Math.min(1, value));
}

function fitnessFunctionMulti(x, y) {
  // Use the globally generated random peaks
  if (peaks.length === 0) {
    generateRandomPeaks(); // Fallback if peaks not generated yet
  }

  let value = 0;

  // Sum contributions from each peak
  for (let peak of peaks) {
    const dx = x - peak.cx;
    const dy = y - peak.cy;
    const dist2 = dx * dx + dy * dy;
    value += peak.amplitude * Math.exp(-dist2 / (2 * peak.sigma * peak.sigma));
  }

  // Normalize so maximum possible value is 1
  return value / maxPossibleValue;
}



function colormap(t) {
  // blue → green → red
  const g = Math.floor(455 * t);
  const r = Math.floor(255 * (1 - Math.abs(t - 0.5) * 2));
  const b = Math.floor(55 * (1 - t));
  return [r, g, b];
}

// Draw the landscape on the canvas using the fitness function
function drawLandscape() {
  imgData = ctx.createImageData(width, height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const value = fitnessFunctionMulti(x, y);
      const normValue = normalize(value);
      const [r, g, b] = colormap(normValue);
      const index = (x + y * width) * 4;
      imgData.data[index] = r;
      imgData.data[index + 1] = g;
      imgData.data[index + 2] = b;
      imgData.data[index + 3] = 255; // alpha
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

// Constrain a particle to within the window. If it gets too close to an edge,
// nudge it back in and reverse its direction.
function keepWithinBounds(particle) {
  const margin = 10;
  const turnFactor = 0.5;

  if (particle.x < margin) {
    particle.dx += turnFactor;
  }
  if (particle.x > width - margin) {
    particle.dx -= turnFactor
  }
  if (particle.y < margin) {
    particle.dy += turnFactor;
  }
  if (particle.y > height - margin) {
    particle.dy -= turnFactor;
  }
}

function updatePersonalBest(particle) {
  const currentFitness = fitnessFunctionMulti(particle.x, particle.y);
  particle.fitness = currentFitness;
  if (particle.pBestValue === null || currentFitness > particle.pBestValue) {
    particle.pBest = { x: particle.x, y: particle.y };
    particle.pBestValue = currentFitness;
  }
}
// If current fitness is better than pBestValue, update pBest and pBestValue.

function updateGlobalBest() {
  for (let particle of particles) {
    if (particle.fitness > globalBestValue) {
      globalBestValue = particle.fitness;
      globalBest = { x: particle.x, y: particle.y };
    }
  }
}

function updateVelocity(particle) {
  // PSO velocity update rule: v = w*v + c1*r1*(pBest - x) + c2*r2*(gBest - x)
  // Modified for moth-like behavior with spiral momentum
  
  const r1 = Math.random();
  const r2 = Math.random();
  
  // Inertia component: keeps momentum for overshooting
  const inertiaX = inertiaWeight * particle.dx;
  const inertiaY = inertiaWeight * particle.dy;
  
  // Cognitive component: pull toward personal best (reduced)
  let cognitiveX = 0;
  let cognitiveY = 0;
  if (particle.pBest) {
    cognitiveX = cognitiveWeight * r1 * (particle.pBest.x - particle.x);
    cognitiveY = cognitiveWeight * r1 * (particle.pBest.y - particle.y);
  }
  
  // Social component: strong pull toward global best
  const socialX = socialWeight * r2 * (globalBest.x - particle.x);
  const socialY = socialWeight * r2 * (globalBest.y - particle.y);
  
  // Add perpendicular component for spiraling (moth-like behavior)
  const distToGlobal = Math.sqrt((globalBest.x - particle.x) ** 2 + (globalBest.y - particle.y) ** 2);
  const spiralStrength = 0.05; // Adjust for more/less spiraling
  const spiralX = -spiralStrength * (globalBest.y - particle.y) / (distToGlobal + 1);
  const spiralY = spiralStrength * (globalBest.x - particle.x) / (distToGlobal + 1);
  
  // Update velocity with all components
  particle.dx += inertiaX + cognitiveX + socialX + spiralX;
  particle.dy += inertiaY + cognitiveY + socialY + spiralY;
}

function avoidCursor(boid) {
  const minDistance = 10;
  const maxDistance = 200;
  const avoidFactor = 0.01;
  let moveX = 0;
  let moveY = 0;

  const cursor = { x: mouseX, y: mouseY };
  const dist = distance(boid, cursor);

  if (dist < maxDistance) {
    const strength = (maxDistance - dist) / (maxDistance - minDistance);
    moveX += (boid.x - cursor.x) * strength;
    moveY += (boid.y - cursor.y) * strength;
  }

  boid.dx += moveX * avoidFactor;
  boid.dy += moveY * avoidFactor;
}

function updatePosition(particle) {
  // Move based on velocity, then clamp inside bounds if needed.
  particle.x += particle.dx;
  particle.y += particle.dy;
  keepWithinBounds(particle);
}

function limitSpeed(particle) {

  const speed = Math.sqrt(particle.dx * particle.dx + particle.dy * particle.dy);
  if (speed > speedLimit) {
    particle.dx = (particle.dx / speed) * speedLimit;
    particle.dy = (particle.dy / speed) * speedLimit;
  }
}

function drawParticle(ctx, particle) {
  const angle = Math.atan2(particle.dy, particle.dx);
  ctx.translate(particle.x, particle.y);
  ctx.rotate(angle);
  ctx.translate(-particle.x, -particle.y);

  // Make opacity depend on fitness (0.3 to 1.0 opacity range)
  const opacity = Math.max(0.2, Math.min(1.0, particle.fitness * 5)); // Scale fitness for visibility
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  ctx.fillStyle = `#ffffaa${alpha}`;
  
  ctx.beginPath();
  ctx.moveTo(particle.x, particle.y);
  ctx.lineTo(particle.x - 15, particle.y + 5);
  ctx.lineTo(particle.x - 15, particle.y - 5);
  ctx.lineTo(particle.x, particle.y);
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// Main animation loop
function animationLoop() {
  // Update each particle
  for (let particle of particles) {
    updatePersonalBest(particle);
    updateGlobalBest();
    updateVelocity(particle);
    limitSpeed(particle);
    updatePosition(particle);


    // Update the position based on the current velocity
    particle.x += particle.dx;
    particle.y += particle.dy;
  }

  // Clear the canvas and redraw the landscape and all particles
  const ctx = document.getElementById("particles").getContext("2d");
  ctx.clearRect(0, 0, width, height);
  
  // Redraw the fitness landscape
  ctx.putImageData(imgData, 0, 0);
  
  for (let particle of particles) {
    drawParticle(ctx, particle);
  }

  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);
}

window.onload = () => {
  // Make sure the canvas always fills the whole window
  window.addEventListener("resize", sizeCanvas, false);
  window.addEventListener("resize", drawLandscape, false);
  sizeCanvas();
  drawLandscape();

  // Randomly distribute the particles to start
  initParticles();

  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);
};
