const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
const numberOfParticles = 1000; // Adjusted for better density
const glowRadius = 7; // Glow effect radius
const heartScale = 200; // Scale of the heart
const idleAmplitude = 6; // Amplitude of idle animation
const idleSpeed = 0.008; // Speed of idle animation

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

    // Calculate distance between particle and mouse
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Move particles away from the mouse
    const forceDirectionX = dx / distance;
    const forceDirectionY = dy / distance;
    const maxDistance = 150; // Hover radius
    const force = ((maxDistance - distance) / maxDistance) * 4; // Adjust the multiplier for hover strength

    if (distance < maxDistance) {
      this.x -= forceDirectionX * force * this.density;
      this.y -= forceDirectionY * force * this.density;
    } else {
      // Return particles to their original position (slower)
      if (this.x !== this.baseX) {
        const dx = this.baseX - this.x;
        this.x += dx / 20000000000000; // Slower return speed (larger divisor)
      }
      if (this.y !== this.baseY) {
        const dy = this.baseY - this.y;
        this.y += dy / 2000000000000; // Slower return speed (larger divisor)
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

  for (let i = 0; i < particlesArray.length; i++) {
    particlesArray[i].draw();
    particlesArray[i].update(mouse);
  }

  requestAnimationFrame(animate);
}

// Track mouse position
const mouse = {
  x: null,
  y: null,
};

canvas.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

canvas.addEventListener('mouseleave', () => {
  mouse.x = undefined;
  mouse.y = undefined;
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
