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

// Find the center of mass of the other particles and adjust velocity slightly to
// point towards the center of mass.
function flyTowardsCenter(particle) {
  const centeringFactor = 0.005; // adjust velocity by this %

  let centerX = 0;
  let centerY = 0;
  let numNeighbors = 0;

  for (let otherParticle of particles) {
    if (distance(particle, otherParticle) < visualRange) {
      centerX += otherParticle.x;
      centerY += otherParticle.y;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    centerX = centerX / numNeighbors;
    centerY = centerY / numNeighbors;

    particle.dx += (centerX - particle.x) * centeringFactor;
    particle.dy += (centerY - particle.y) * centeringFactor;
  }
}

// Move away from other particles that are too close to avoid colliding
function avoidOthers(particle) {
  const minDistance = 20; // The distance to stay away from other particles
  const avoidFactor = 0.05; // Adjust velocity by this %
  let moveX = 0;
  let moveY = 0;
  for (let otherParticle of particles) {
    if (otherParticle !== particle) {
      if (distance(particle, otherParticle) < minDistance) {
        moveX += particle.x - otherParticle.x;
        moveY += particle.y - otherParticle.y;
      }
    }
  }

  particle.dx += moveX * avoidFactor;
  particle.dy += moveY * avoidFactor;
}

function avoidCursor(particle) {
  const minDistance = 10;
  const maxDistance = 200;
  const avoidFactor = 0.01;
  let moveX = 0;
  let moveY = 0;

  const cursor = { x: mouseX, y: mouseY };
  const dist = distance(particle, cursor);

  if (dist < maxDistance) {
    const strength = (maxDistance - dist) / (maxDistance - minDistance);
    moveX += (particle.x - cursor.x) * strength;
    moveY += (particle.y - cursor.y) * strength;
  }

  particle.dx += moveX * avoidFactor;
  particle.dy += moveY * avoidFactor;
}

// Find the average velocity (speed and direction) of the other particles and
// adjust velocity slightly to match.
function matchVelocity(particle) {
  const matchingFactor = 0.05; // Adjust by this % of average velocity

  let avgDX = 0;
  let avgDY = 0;
  let numNeighbors = 0;

  for (let otherParticle of particles) {
    if (distance(particle, otherParticle) < visualRange) {
      avgDX += otherParticle.dx;
      avgDY += otherParticle.dy;
      numNeighbors += 1;
    }
  }

  if (numNeighbors) {
    avgDX = avgDX / numNeighbors;
    avgDY = avgDY / numNeighbors;

    particle.dx += (avgDX - particle.dx) * matchingFactor;
    particle.dy += (avgDY - particle.dy) * matchingFactor;
  }
}

// Speed will naturally vary in flocking behavior, but real animals can't go
// arbitrarily fast.
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
    // Update the velocities according to each rule
    flyTowardsCenter(particle);
    avoidOthers(particle);
    avoidCursor(particle);
    matchVelocity(particle);
    limitSpeed(particle);
    keepWithinBounds(particle);

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