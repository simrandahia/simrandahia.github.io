const canvas = document.getElementById("swarm");
const ctx = canvas.getContext("2d");

const quoteScript = document.getElementById("quote-script");
const quoteMain = document.getElementById("quote-main");
const quoteCredit = document.getElementById("quote-credit");

const PARTICLE_COUNT = 2600;

const modes = [
  "attractor",
  "network",
  "galaxy",
  "flock",
  "dna",
  "waves",
  "pendulum",
  "tree"
];

const fallbackQuoteStore = {
  fallback: {
    script: "Before form",
    main: "Pattern waits in noise.",
    creator: "",
    source: ""
  },
  quotes: {
    chaos: [
      {
        script: "Before form",
        main: "Pattern waits in noise.",
        creator: "",
        source: ""
      }
    ]
  }
};

let quoteStore = fallbackQuoteStore;

let particles = [];
let width = 0;
let height = 0;
let dpr = 1;

let currentMode = "chaos";
let lastMode = null;
let hasHovered = false;
let quoteTimer = null;
let tick = 0;

async function loadQuotes() {
  try {
    const response = await fetch("./quotes.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`quotes.json failed to load. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.quotes) {
      throw new Error("quotes.json loaded, but it does not contain a top-level 'quotes' object.");
    }

    quoteStore = data;
    updateQuote(currentMode, false);
  } catch (error) {
    console.warn("Using fallback quotes because quotes.json could not be used:", error);
    quoteStore = fallbackQuoteStore;
    updateQuote(currentMode, false);
  }
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  width = rect.width;
  height = rect.height;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (!particles.length) {
    createParticles();
  }

  assignTargets(currentMode, false);
}

function createParticles() {
  particles = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: width / 2 + random(-80, 80),
      y: height / 2 + random(-80, 80),
      tx: width / 2,
      ty: height / 2,
      ox: 0,
      oy: 0,
      vx: random(-1.4, 1.4),
      vy: random(-1.4, 1.4),
      r: Math.random() < 0.11 ? 1.18 : 0.72,
      phase: Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      speed: random(0.004, 0.018),
      orbit: random(2, 13),
      drift: random(0.35, 1.15)
    });
  }
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function chooseMode() {
  if (!hasHovered) {
    hasHovered = true;
    lastMode = "flock";
    return "flock";
  }

  let next = modes[Math.floor(Math.random() * modes.length)];

  if (modes.length > 1) {
    while (next === lastMode) {
      next = modes[Math.floor(Math.random() * modes.length)];
    }
  }

  lastMode = next;
  return next;
}

function getQuoteForMode(mode) {
  const modeQuotes = quoteStore?.quotes?.[mode];

  if (Array.isArray(modeQuotes) && modeQuotes.length > 0) {
    return modeQuotes[Math.floor(Math.random() * modeQuotes.length)];
  }

  return quoteStore?.fallback || fallbackQuoteStore.fallback;
}

function renderQuoteCredit(quote) {
  if (!quoteCredit) return;

  quoteCredit.innerHTML = "";

  if (!quote || !quote.creator) {
    return;
  }

  quoteCredit.appendChild(document.createTextNode("— "));

  if (quote.source) {
    const link = document.createElement("a");
    link.href = quote.source;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = quote.creator;
    quoteCredit.appendChild(link);
  } else {
    quoteCredit.appendChild(document.createTextNode(quote.creator));
  }
}

function updateQuote(mode, animate = true) {
  if (!quoteScript || !quoteMain) return;

  const quote = getQuoteForMode(mode);

  if (!animate) {
    quoteScript.textContent = quote.script || "";
    quoteMain.textContent = quote.main || "";
    renderQuoteCredit(quote);
    return;
  }

  document.body.classList.add("quote-changing");

  clearTimeout(quoteTimer);
  quoteTimer = setTimeout(() => {
    quoteScript.textContent = quote.script || "";
    quoteMain.textContent = quote.main || "";
    renderQuoteCredit(quote);
    document.body.classList.remove("quote-changing");
  }, 180);
}

function assignTargets(mode, animateQuote = true) {
  currentMode = mode;
  updateQuote(mode, animateQuote);

  const points = getPointsForMode(mode);

  for (let i = 0; i < particles.length; i++) {
    const target = points[i % points.length];

    particles[i].tx = target.x + random(-1.8, 1.8);
    particles[i].ty = target.y + random(-1.8, 1.8);

    particles[i].orbit = mode === "chaos" ? random(7, 28) : random(2.5, 12);
    particles[i].speed = mode === "chaos" ? random(0.01, 0.034) : random(0.004, 0.018);
    particles[i].drift = mode === "chaos" ? random(0.8, 2.2) : random(0.35, 1.15);
  }
}

function getPointsForMode(mode) {
  if (mode === "chaos") return chaosPoints();
  if (mode === "attractor") return attractorPoints();
  if (mode === "network") return networkPoints();
  if (mode === "galaxy") return galaxyPoints();
  if (mode === "flock") return flockPoints();
  if (mode === "dna") return dnaPoints();
  if (mode === "waves") return wavePoints();
  if (mode === "pendulum") return pendulumPoints();
  if (mode === "tree") return treePoints();

  return chaosPoints();
}

function chaosPoints() {
  const points = [];
  const cx = width / 2;
  const cy = height / 2;
  const s = Math.min(width, height);

  const outer = s * 0.43;
  const inner = s * 0.08;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;

    const unevenRing = Math.random() < 0.68;
    const radius = unevenRing
      ? random(inner, outer) + Math.sin(angle * 5 + Math.random() * 8) * s * 0.035
      : Math.sqrt(random(inner * inner, outer * outer));

    const turbulence = s * 0.055;

    points.push({
      x: cx + Math.cos(angle) * radius + random(-turbulence, turbulence),
      y: cy + Math.sin(angle) * radius + random(-turbulence, turbulence)
    });
  }

  return points;
}

function attractorPoints() {
  const points = [];
  const cx = width / 2;
  const cy = height / 2;
  const scale = Math.min(width, height) * 0.18;

  let x = 0.1;
  let y = 0;
  const a = 1.4;
  const b = -2.3;
  const c = 2.4;
  const d = -2.1;

  for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
    const nx = Math.sin(a * y) - Math.cos(b * x);
    const ny = Math.sin(c * x) - Math.cos(d * y);

    x = nx;
    y = ny;

    if (i > 120) {
      points.push({
        x: cx + x * scale,
        y: cy + y * scale
      });
    }

    if (points.length >= PARTICLE_COUNT) break;
  }

  return points;
}

function networkPoints() {
  const points = [];
  const cx = width / 2;
  const cy = height / 2;
  const nodeCount = 58;
  const nodes = [];
  const s = Math.min(width, height);

  for (let i = 0; i < nodeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * s * 0.36;

    nodes.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius
    });
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const a = nodes[Math.floor(Math.random() * nodes.length)];
    const b = nodes[Math.floor(Math.random() * nodes.length)];
    const t = Math.random();

    points.push({
      x: a.x * (1 - t) + b.x * t + random(-1.4, 1.4),
      y: a.y * (1 - t) + b.y * t + random(-1.4, 1.4)
    });
  }

  return points;
}

function galaxyPoints() {
  const points = [];
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.39;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const arm = i % 4;
    const radius = Math.sqrt(Math.random()) * maxR;
    const spin = radius * 0.036;
    const angle = arm * Math.PI * 0.5 + spin + random(-0.24, 0.24);

    points.push({
      x: cx + Math.cos(angle) * radius + random(-10, 10),
      y: cy + Math.sin(angle) * radius * 0.72 + random(-10, 10)
    });
  }

  return points;
}

function flockPoints() {
  const points = [];
  const cx = width / 2;
  const cy = height / 2;
  const s = Math.min(width, height);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = Math.random();
    const side = Math.random() < 0.5 ? -1 : 1;

    const x = cx + (t - 0.5) * s * 0.82;
    const curve = Math.sin(t * Math.PI) * s * 0.18;
    const wing = side * curve * Math.pow(Math.random(), 0.5);
    const nose = -t * s * 0.08;

    points.push({
      x: x + random(-4, 4),
      y: cy + wing + nose + random(-5, 5)
    });
  }

  return points;
}

function dnaPoints() {
  const points = [];
  const cx = width / 2;
  const cy = height / 2;
  const s = Math.min(width, height);
  const h = s * 0.74;
  const amp = s * 0.13;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = i / PARTICLE_COUNT;
    const y = cy - h / 2 + t * h;
    const phase = t * Math.PI * 8.4;
    const strand = i % 4;

    let x;

    if (strand === 0) {
      x = cx + Math.sin(phase) * amp;
    } else if (strand === 1) {
      x = cx - Math.sin(phase) * amp;
    } else {
      x = cx + Math.sin(phase) * amp * random(-1, 1);
    }

    points.push({
      x: x + random(-3.5, 3.5),
      y: y + random(-3.5, 3.5)
    });
  }

  return points;
}

function wavePoints() {
  const points = [];
  const cx = width / 2;
  const cy = height / 2;
  const s = Math.min(width, height);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const ring = Math.floor(Math.random() * 15) + 1;
    const angle = Math.random() * Math.PI * 2;
    const r = ring * s * 0.024;

    const sourceShift = Math.random() < 0.5 ? -s * 0.11 : s * 0.11;

    points.push({
      x: cx + sourceShift + Math.cos(angle) * r * 1.12 + random(-2, 2),
      y: cy + Math.sin(angle) * r * 0.78 + random(-2, 2)
    });
  }

  return points;
}

function pendulumPoints() {
  const points = [];
  const cx = width / 2;
  const cy = height / 2;
  const s = Math.min(width, height);

  const top = { x: cx, y: cy - s * 0.34 };
  const bob = { x: cx + s * 0.11, y: cy + s * 0.25 };

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < PARTICLE_COUNT * 0.34) {
      const t = Math.random();

      points.push({
        x: top.x * (1 - t) + bob.x * t + random(-1.1, 1.1),
        y: top.y * (1 - t) + bob.y * t + random(-1.1, 1.1)
      });
    } else {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * s * 0.078;

      points.push({
        x: bob.x + Math.cos(a) * r,
        y: bob.y + Math.sin(a) * r
      });
    }
  }

  return points;
}

function treePoints() {
  const points = [];
  const cx = width / 2;
  const cy = height * 0.72;
  const s = Math.min(width, height);

  function branch(x, y, angle, length, depth) {
    if (depth <= 0 || points.length > PARTICLE_COUNT) return;

    const x2 = x + Math.cos(angle) * length;
    const y2 = y + Math.sin(angle) * length;
    const count = Math.max(8, Math.floor(length * 0.9));

    for (let i = 0; i < count; i++) {
      const t = i / count;

      points.push({
        x: x * (1 - t) + x2 * t + random(-2.1, 2.1),
        y: y * (1 - t) + y2 * t + random(-2.1, 2.1)
      });
    }

    branch(x2, y2, angle - random(0.34, 0.56), length * random(0.62, 0.74), depth - 1);
    branch(x2, y2, angle + random(0.34, 0.56), length * random(0.62, 0.74), depth - 1);

    if (Math.random() < 0.42) {
      branch(x2, y2, angle + random(-0.26, 0.26), length * 0.55, depth - 1);
    }
  }

  branch(cx, cy, -Math.PI / 2, s * 0.18, 9);

  while (points.length < PARTICLE_COUNT) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * s * 0.22;

    points.push({
      x: cx + Math.cos(a) * r,
      y: cy - s * 0.34 + Math.sin(a) * r * 0.7
    });
  }

  return points.slice(0, PARTICLE_COUNT);
}

function motionForParticle(p) {
  const t = tick;

  const modeMultiplier = currentMode === "chaos" ? 1.8 : 1;

  const orbitX = Math.cos(t * p.speed + p.phase) * p.orbit * modeMultiplier;
  const orbitY = Math.sin(t * p.speed * 1.37 + p.phase2) * p.orbit * 0.72 * modeMultiplier;

  const noiseX =
    Math.sin(t * 0.011 + p.phase * 3.1) *
    Math.cos(t * 0.007 + p.phase2) *
    p.drift *
    modeMultiplier;

  const noiseY =
    Math.cos(t * 0.012 + p.phase2 * 2.4) *
    Math.sin(t * 0.006 + p.phase) *
    p.drift *
    modeMultiplier;

  return {
    x: p.tx + orbitX + noiseX,
    y: p.ty + orbitY + noiseY
  };
}

function applyMildSeparation() {
  if (particles.length < 2) return;

  const step = currentMode === "chaos" ? 7 : 10;
  const radius = currentMode === "chaos" ? 9 : 6;
  const radiusSq = radius * radius;
  const strength = currentMode === "chaos" ? 0.018 : 0.01;

  for (let i = 0; i < particles.length; i += step) {
    const a = particles[i];

    for (let j = i + step; j < particles.length; j += step) {
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > 0.0001 && distSq < radiusSq) {
        const force = (1 - distSq / radiusSq) * strength;
        a.vx += dx * force;
        a.vy += dy * force;
        b.vx -= dx * force;
        b.vy -= dy * force;
      }
    }
  }
}

function drawConnections() {
  if (currentMode !== "network") return;

  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 0.55;

  const sampleStep = 7;
  const maxDist = Math.min(width, height) * 0.052;
  const maxDistSq = maxDist * maxDist;
  let drawn = 0;
  const maxLines = 280;

  for (let i = 0; i < particles.length; i += sampleStep) {
    for (let j = i + sampleStep; j < particles.length; j += sampleStep) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distSq = dx * dx + dy * dy;

      if (distSq < maxDistSq) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();

        drawn++;
        if (drawn > maxLines) {
          ctx.restore();
          return;
        }
      }
    }
  }

  ctx.restore();
}

function draw() {
  tick += 1;
  ctx.clearRect(0, 0, width, height);

  for (const p of particles) {
    const livingTarget = motionForParticle(p);

    const ax = (livingTarget.x - p.x) * (currentMode === "chaos" ? 0.012 : 0.021);
    const ay = (livingTarget.y - p.y) * (currentMode === "chaos" ? 0.012 : 0.021);

    p.vx += ax;
    p.vy += ay;

    if (currentMode === "chaos") {
      p.vx += Math.sin(tick * 0.013 + p.phase) * 0.012;
      p.vy += Math.cos(tick * 0.011 + p.phase2) * 0.012;
    }

    p.vx *= currentMode === "chaos" ? 0.925 : 0.895;
    p.vy *= currentMode === "chaos" ? 0.925 : 0.895;

    p.x += p.vx;
    p.y += p.vy;
  }

  applyMildSeparation();
  drawConnections();

  ctx.fillStyle = "#111111";

  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(draw);
}

canvas.addEventListener("mouseenter", () => {
  const mode = chooseMode();
  assignTargets(mode);
});

canvas.addEventListener("mouseleave", () => {
  assignTargets("chaos");
});

canvas.addEventListener("click", () => {
  const mode = chooseMode();
  assignTargets(mode);
});

canvas.addEventListener("touchstart", () => {
  const mode = chooseMode();
  assignTargets(mode);
}, { passive: true });

window.addEventListener("resize", resize);

loadQuotes();
resize();
assignTargets("chaos", false);
draw();