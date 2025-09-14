// Size of canvas. These get updated to fill the whole browser.
let width = 150;
let height = 150;

const numParticles = 100;
const speedLimit = 8;
let visualRange = 75;

let isVisitedOnPhone = false;

if (/Mobi|Android/i.test(navigator.userAgent)) {
  if (localStorage.getItem('visitedOnPhone')) {
    isVisitedOnPhone = true;
  } else {
    localStorage.setItem('visitedOnPhone', 'true');
  }

  // Track finger movement on touch devices
  document.addEventListener('touchmove', (event) => {
    if (event.touches.length > 0) {
      mouseX = event.touches[0].clientX;
      mouseY = event.touches[0].clientY;
    }
  });
}

// Add event listener for buttons
let theme = 'theme-birds';
let buttons = document.getElementsByClassName('theme-btn');

buttons[0].addEventListener('click', () => { changeTheme('theme-default'); });
buttons[1].addEventListener('click', () => { changeTheme('theme-birds'); });
buttons[2].addEventListener('click', () => { changeTheme('theme-fishes'); });

var particles = [];
let gBest = 0;
let gBestValue = 0;

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


// Called initially and whenever the window resizes to update the canvas
// size and width/height variables.
function sizeCanvas() {
  const canvas = document.getElementById("particles");
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // Adjust visual range for smaller screens
  if (width < 600) {
    visualRange = 20;
  } else {
    visualRange = 75;
  }
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

// fitnessFunction(particle)

// Evaluates the quality of the particle’s current position.

// This depends on what problem you’re optimizing.

// updatePersonalBest(particle)

// If current fitness is better than pBestValue, update pBest and pBestValue.

// updateGlobalBest()

// After all particles are checked, update the global best position and value.

// updateVelocity(particle)

// Velocity update rule using inertia, cognitive, and social components:

// inertia → keeps momentum

// cognitive → pull toward pBest

// social → pull toward gBest

// updatePosition(particle)

// Move based on velocity, then clamp inside bounds if needed.

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
  if (theme == 'theme-default') {
    ctx.fillStyle = "#efff78";
  } else if (theme == 'theme-birds') {
    ctx.fillStyle = "#222";
  } else if (theme == 'theme-fishes') {
    ctx.fillStyle = "#da7";
  }
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
    
    // TODO:
    // Evaluate fitness of each particle
    // Update personal bests
    // Update global best
    // Update velocities
    // Update positions
    // Draw particles (optional, for visualization)

    // Update the position based on the current velocity
    particle.x += particle.dx;
    particle.y += particle.dy;
  }

  // Clear the canvas and redraw all the particles in their current positions
  const ctx = document.getElementById("particles").getContext("2d");
  ctx.clearRect(0, 0, width, height);
  for (let particle of particles) {
    drawParticle(ctx, particle);
  }

  // Schedule the next frame
  window.requestAnimationFrame(animationLoop);
}

window.onload = () => {
  // Make sure the canvas always fills the whole window
  window.addEventListener("resize", sizeCanvas, false);
  sizeCanvas();

  // Randomly distribute the particles to start
  initParticles();

  // Schedule the main animation loop
  window.requestAnimationFrame(animationLoop);
};

function changeTheme(newTheme) {
  document.body.className = newTheme;
  theme = newTheme;
}