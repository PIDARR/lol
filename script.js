const canvas = document.getElementById('heartCanvas');
const ctx = canvas.getContext('2d');
const audio = document.getElementById('bg-music');
const overlay = document.getElementById('start-overlay');

let particlesArray = [];
const numberOfParticles = 1000;
const glowRadius = 6;
let heartScale;
const idleAmplitude = 5;
const idleSpeed = 0.008;

let ripples = [];
const rippleRadius = 120;
const rippleStrength = 30;
const rippleDecay = 0.95;
const rippleWaveSpeed = 1.5;

const mouse = { x: null, y: null };
let hasInteracted = false;

// ─── Particle Class ────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 2 + 1;
    this.baseX = x;
    this.baseY = y;
    this.density = Math.random() * 10 + 5;
    this.angle = Math.random() * Math.PI * 2;
  }

  draw() {
    ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
    ctx.shadowBlur = glowRadius;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  update() {
    this.angle += idleSpeed;
    this.x = this.baseX + Math.cos(this.angle) * idleAmplitude;
    this.y = this.baseY + Math.sin(this.angle) * idleAmplitude;

    // Mouse / touch repulsion
    if (mouse.x !== null && mouse.y !== null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 100) {
        const force = (100 - distance) / 100 * 2;
        this.x -= (dx / distance) * force * this.density;
        this.y -= (dy / distance) * force * this.density;
      }
    }

    // Ripple effects
    for (const ripple of ripples) {
      const dx = this.x - ripple.x;
      const dy = this.y - ripple.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ripple.radius) {
        const force = Math.sin((dist / ripple.radius) * Math.PI) * ripple.strength;
        this.x += (dx / dist) * force;
        this.y += (dy / dist) * force;
      }
    }
  }
}

// ─── Heart math helpers ────────────────────────────────────
function getHeartPosition(angle) {
  const x = 16 * Math.pow(Math.sin(angle), 3);
  const y = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) -
              2 * Math.cos(3 * angle) - Math.cos(4 * angle));
  return { x, y };
}

function isPointInHeart(x, y, scale) {
  const hx = (x - canvas.width / 2) / scale;
  const hy = (y - canvas.height / 2) / scale;
  const eq = Math.pow(hx * hx + hy * hy - 1, 3) - hx * hx * hy * hy * hy;
  return eq <= 0;
}

function updateHeartScale() {
  heartScale = Math.min(canvas.width, canvas.height) / 2.5;
}

// ─── Init particles inside heart shape ─────────────────────
function initParticles() {
  particlesArray = [];
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  while (particlesArray.length < numberOfParticles) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * heartScale * 0.9; // slightly inside
    const pos = getHeartPosition(angle);
    const x = centerX + pos.x * (heartScale / 16);
    const y = centerY + pos.y * (heartScale / 16);

    if (isPointInHeart(x, y, heartScale)) {
      particlesArray.push(new Particle(x, y));
    }
  }
}

// ─── Animation loop ────────────────────────────────────────
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update & draw ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.radius += rippleWaveSpeed;
    r.strength *= rippleDecay;
    if (r.strength < 0.1 || r.radius > Math.max(canvas.width, canvas.height) * 2) {
      ripples.splice(i, 1);
    }
  }

  // Update & draw particles
  for (const p of particlesArray) {
    p.update();
    p.draw();
  }

  requestAnimationFrame(animate);
}

// ─── Input handling ────────────────────────────────────────
function updateMouse(e) {
  mouse.x = e.clientX || (e.touches && e.touches[0]?.clientX);
  mouse.y = e.clientY || (e.touches && e.touches[0]?.clientY);
}

function createRipple(e) {
  if (!hasInteracted) {
    hasInteracted = true;
    overlay.classList.add('hidden');

    // Try to play music on first real interaction
    audio.muted = false;
    audio.play().catch(err => {
      console.log("Play failed (still blocked?):", err);
      // Fallback: some browsers need volume=0 first then play
      audio.volume = 0;
      audio.play().then(() => {
        audio.volume = 1; // fade in possible, but simple here
      });
    });
  }

  updateMouse(e);
  ripples.push({
    x: mouse.x,
    y: mouse.y,
    radius: 0,
    strength: rippleStrength
  });
}

// Events
canvas.addEventListener('mousemove', updateMouse);
canvas.addEventListener('touchmove', e => { e.preventDefault(); updateMouse(e); }, { passive: false });

canvas.addEventListener('click', createRipple);
canvas.addEventListener('touchstart', e => { e.preventDefault(); createRipple(e); }, { passive: false });

// Resize
function handleResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateHeartScale();
  initParticles();
}

window.addEventListener('resize', handleResize);

// Start
handleResize();
animate();
