const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
const numberOfParticles = 1000;
const glowRadius = 6;
let heartScale;
const idleAmplitude = 5;
const idleSpeed = 0.008;

let ripples = [];
const rippleRadius = 120;
const rippleStrength = 12;
const rippleDecay = 0.95;
const rippleWaveSpeed = 2;

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 2 + 1;
    this.baseX = x;
    this.baseY = y;
    this.density = (Math.random() * 10) + 5;
    this.angle = Math.random() * Math.PI * 2;
  }

  draw() {
    ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
    ctx.shadowBlur = glowRadius;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  update(mouse) {
    this.angle += idleSpeed;
    this.x = this.baseX + Math.cos(this.angle) * idleAmplitude;
    this.y = this.baseY + Math.sin(this.angle) * idleAmplitude;

    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const forceDirectionX = dx / distance;
    const forceDirectionY = dy / distance;
    const maxDistance = 100;
    const force = ((maxDistance - distance) / maxDistance) * 2;

    if (distance < maxDistance) {
      this.x -= forceDirectionX * force * this.density;
      this.y -= forceDirectionY * force * this.density;
    } else {
      if (this.x !== this.baseX) {
        const dx = this.baseX - this.x;
        this.x += dx / 20;
      }
      if (this.y !== this.baseY) {
        const dy = this.baseY - this.y;
        this.y += dy / 20;
      }
    }

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

function getHeartPosition(angle) {
  const x = 16 * Math.pow(Math.sin(angle), 3);
  const y = -1 * (
    13 * Math.cos(angle) -
    5 * Math.cos(2 * angle) -
    2 * Math.cos(3 * angle) -
    Math.cos(4 * angle)
  );
  return { x, y };
}

function isPointInHeart(x, y, scale) {
  const heartX = (x - canvas.width / 2) / scale;
  const heartY = (y - canvas.height / 2) / scale;
  const heartEquation =
    Math.pow(heartX * heartX + heartY * heartY - 1, 3) -
    heartX * heartX * heartY * heartY * heartY;
  return heartEquation <= 0;
}

function updateHeartScale() {
  heartScale = Math.min(canvas.width, canvas.height) / 3;
}

function init() {
  particlesArray.length = 0;
  while (particlesArray.length < numberOfParticles) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;

    if (isPointInHeart(x, y, heartScale)) {
      particlesArray.push(new Particle(x, canvas.height - y));
    }
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].radius += rippleWaveSpeed;
    ripples[i].strength *= rippleDecay;

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

const mouse = {
  x: null,
  y: null,
};

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  mouse.x = touch.clientX;
  mouse.y = touch.clientY;

  ripples.push({
    x: touch.clientX,
    y: touch.clientY,
    radius: 0,
    strength: rippleStrength,
  });
}

function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  mouse.x = touch.clientX;
  mouse.y = touch.clientY;
}

function handleTouchEnd() {
  mouse.x = undefined;
  mouse.y = undefined;
}

canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd);

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
    radius: 0,
    strength: rippleStrength,
  });
});

function handleResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateHeartScale();
  init();
}

window.addEventListener('resize', handleResize);

handleResize();
animate();
