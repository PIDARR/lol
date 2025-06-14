const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
const numberOfParticles = 1000; // Adjusted for better density
const glowRadius = 10; // Glow effect radius
const heartScale = 200; // Scale of the heart
const idleAmplitude = 5; // Amplitude of idle animation
const idleSpeed = 0.008; // Speed of idle animation

// Ripple effect variables
let ripples = []; // Stores multiple ripples
const rippleRadius = 150; // Radius of the ripple effect
const rippleStrength = 16; // Strength of the ripple effect
const rippleDecay = 0.95; // How quickly the ripple fades
const rippleWaveSpeed = 5; // Speed of the ripple wave propagation

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 2 + 1;
    this.baseX = x; // Original x position
    this.baseY = y; // Original y position
    this.density = (Math.random() * 10) + 5; // Controls how far particles move
    this.angle = Math.random() * Math.PI * 2; // Random angle for idle animation
  }

  draw() {
    // Glow effect
    ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
    ctx.shadowBlur = glowRadius;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Particle
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  update(mouse) {
    // Idle animation: slow and smooth movement
    this.angle += idleSpeed;
    this.x = this.baseX + Math.cos(this.angle) * idleAmplitude;
    this.y = this.baseY + Math.sin(this.angle) * idleAmplitude;

    // Calculate distance between particle and mouse/touch
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Move particles away from the mouse/touch
    const forceDirectionX = dx / distance;
    const forceDirectionY = dy / distance;
    const maxDistance = 100; // Hover radius
    const force = ((maxDistance - distance) / maxDistance) * 2; // Adjust the multiplier for hover strength

    if (distance < maxDistance) {
      this.x -= forceDirectionX * force * this.density;
      this.y -= forceDirectionY * force * this.density;
    } else {
      // Return particles to their original position (slower)
      if (this.x !== this.baseX) {
        const dx = this.baseX - this.x;
        this.x += dx / 20; // Slower return speed (larger divisor)
      }
      if (this.y !== this.baseY) {
        const dy = this.baseY - this.y;
        this.y += dy / 20; // Slower return speed (larger divisor)
      }
    }

    // Apply ripple effects
    for (let i = 0; i < ripples.length; i++) {
      const ripple = ripples[i];
      const rippleDx = this.x - ripple.x;
      const rippleDy = this.y - ripple.y;
      const rippleDistance = Math.sqrt(rippleDx * rippleDx + rippleDy * rippleDy);

      if (rippleDistance < ripple.radius) {
        const rippleForce = Math.sin((rippleDistance / ripple.radius) * Math.PI) * ripple.strength;
        this.x += (rippleDx / rippleDistance) * rippleForce;
        this.y += (rippleDy / rippleDistance) * rippleForce;
      }
    }
  }
}

// Heart shape formula (fixed to flip the heart upright)
function getHeartPosition(angle) {
  const x = 16 * Math.pow(Math.sin(angle), 3);
  const y = -1 * (
    13 * Math.cos(angle) -
    5 * Math.cos(2 * angle) -
    2 * Math.cos(3 * angle) -
    Math.cos(4 * angle)
  );
  return { x, y }; // No need to flip y here, as we handle it in particle placement
}

// Check if a point is inside the heart
function isPointInHeart(x, y, scale) {
  const heartX = (x - canvas.width / 2) / scale;
  const heartY = (y - canvas.height / 2) / scale;
  const heartEquation =
    Math.pow(heartX * heartX + heartY * heartY - 1, 3) -
    heartX * heartX * heartY * heartY * heartY;
  return heartEquation <= 0;
}

function init() {
  particlesArray.length = 0; // Clear existing particles

  // Generate particles inside the heart
  while (particlesArray.length < numberOfParticles) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;

    if (isPointInHeart(x, y, heartScale)) {
      // Flip the y-coordinate to make the heart upright
      particlesArray.push(new Particle(x, canvas.height - y));
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].radius += rippleWaveSpeed; // Expand the ripple
    ripples[i].strength *= rippleDecay; // Reduce ripple strength

    // Remove ripple if it's too weak or too large
    if (ripples[i].strength < 0.1 || ripples[i].radius > canvas.width * 2) {
      ripples.splice(i, 1);
    }
  }

  for (let i = 0; i < particlesArray.length; i++) {
    particlesArray[i].draw();
    particlesArray[i].update(mouse);
  }

  requestAnimationFrame(animate);
}

// Track touch/mouse position
const mouse = {
  x: null,
  y: null,
};

// Handle touch events
function handleTouchStart(e) {
  const touch = e.touches[0];
  mouse.x = touch.clientX;
  mouse.y = touch.clientY;

  // Trigger ripple effect on touch
  ripples.push({
    x: touch.clientX,
    y: touch.clientY,
    radius: 0, // Start with a small radius
    strength: rippleStrength, // Initial ripple strength
  });
}

function handleTouchMove(e) {
  const touch = e.touches[0];
  mouse.x = touch.clientX;
  mouse.y = touch.clientY;
}

function handleTouchEnd() {
  mouse.x = undefined;
  mouse.y = undefined;
}

// Add touch event listeners
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

// Handle mouse events (for desktop compatibility)
canvas.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

canvas.addEventListener('mouseleave', () => {
  mouse.x = undefined;
  mouse.y = undefined;
});

canvas.addEventListener('click', (e) => {
  ripples.push({
    x: e.clientX,
    y: e.clientY,
    radius: 0, // Start with a small radius
    strength: rippleStrength, // Initial ripple strength
  });
});

// Handle window resize
function handleResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  init(); // Reinitialize particles to center the heart
}

window.addEventListener('resize', handleResize);

// Initial setup
handleResize(); // Center the heart on page load
animate();
