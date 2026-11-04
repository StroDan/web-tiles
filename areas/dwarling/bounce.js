// Corner Bounce: a logo drifts diagonally and bounces off the edges of the screen,
// changing color at every bounce. Every so often it is steered so that it lands
// exactly in a corner, which sets off a celebration.

const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");

const MIN_SPEED = 0.4;
const MAX_SPEED = 3;

let view = { w: 0, h: 0 };        // window size in CSS pixels
let logo = { w: 0, h: 0 };        // logo size in CSS pixels
let range = { x: 0, y: 0 };       // how far the logo's top-left corner can travel

const state = {
  x: 0, y: 0,                     // logo top-left corner
  dirX: 1, dirY: 1,               // +1 or -1
  vx: 0, vy: 0,                   // speed along each axis, pixels per second
  speedMult: 1,
  hue: 200,
  corners: 0,
  bounces: 0,                     // bounces since the last corner
  nextCornerAt: 0,                // aim for a corner after this many bounces
  aimed: false,                   // a corner is planned
  forceAim: false,
};

const particles = [];
let flash = 0;                    // 1 right after a corner, fades to 0
let cornerTextTime = 0;

function baseSpeed() {
  return Math.min(view.w, view.h) * 0.28 * state.speedMult;
}

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  view.w = window.innerWidth;
  view.h = window.innerHeight;
  canvas.width = Math.round(view.w * dpr);
  canvas.height = Math.round(view.h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  logo.w = Math.max(80, Math.min(view.w, view.h * 1.6) * 0.2);
  logo.h = logo.w * 0.52;
  range.x = Math.max(1, view.w - logo.w);
  range.y = Math.max(1, view.h - logo.h);
  state.x = Math.min(Math.max(state.x, 0), range.x);
  state.y = Math.min(Math.max(state.y, 0), range.y);
  state.aimed = false;
}

function newHeading() {
  const b = baseSpeed();
  state.vx = b * randomBetween(0.85, 1.15);
  state.vy = b * randomBetween(0.85, 1.15);
  state.aimed = false;
}

function reset() {
  state.x = Math.random() * range.x;
  state.y = Math.random() * range.y;
  state.dirX = Math.random() < 0.5 ? 1 : -1;
  state.dirY = Math.random() < 0.5 ? 1 : -1;
  state.corners = 0;
  state.bounces = 0;
  state.nextCornerAt = Math.floor(randomBetween(6, 14));
  particles.length = 0;
  flash = 0;
  newHeading();
}

// Change the vertical (or horizontal) speed slightly so that the logo reaches a
// side wall and a top/bottom wall at exactly the same moment.
function aimForCorner() {
  const b = baseSpeed();
  const toWallX = state.dirX > 0 ? range.x - state.x : state.x;
  const toWallY = state.dirY > 0 ? range.y - state.y : state.y;
  let best = null;

  for (let n = 0; n < 5; n++) {
    for (let m = 0; m < 8; m++) {
      // Keep vx, adjust vy.
      const t1 = (toWallX + n * range.x) / state.vx;
      const vy = (toWallY + m * range.y) / t1;
      // Keep vy, adjust vx.
      const t2 = (toWallY + n * range.y) / state.vy;
      const vx = (toWallX + m * range.x) / t2;
      for (const c of [{ axis: "y", v: vy, t: t1 }, { axis: "x", v: vx, t: t2 }]) {
        if (c.t < 0.4 || c.v < b * 0.7 || c.v > b * 1.4) continue;
        const cost = Math.abs(c.v - b) / b + c.t * 0.01;
        if (!best || cost < best.cost) best = { ...c, cost };
      }
    }
  }

  if (best) {
    if (best.axis === "y") state.vy = best.v;
    else state.vx = best.v;
    state.aimed = true;
  }
}

function onBounce() {
  state.hue = (state.hue + randomBetween(60, 180)) % 360;
  state.bounces++;
  if (!state.aimed && (state.forceAim || state.bounces >= state.nextCornerAt)) {
    aimForCorner();
    if (state.aimed) state.forceAim = false;
  }
}

function onCorner() {
  state.corners++;
  state.bounces = 0;
  state.nextCornerAt = Math.floor(randomBetween(6, 14));
  flash = 1;
  cornerTextTime = 2.2;

  const cx = state.x <= 0.5 ? 0 : view.w;
  const cy = state.y <= 0.5 ? 0 : view.h;
  for (let i = 0; i < 160; i++) {
    // Spray into the screen, away from the corner.
    const angle = Math.atan2(cy ? -1 : 1, cx ? -1 : 1) + randomBetween(-0.8, 0.8);
    const speed = randomBetween(150, 750);
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: randomBetween(1.2, 2.6),
      age: 0,
      hue: Math.random() * 360,
      size: randomBetween(3, 8),
    });
  }
  newHeading();
}

function step(dt) {
  state.x += state.dirX * state.vx * dt;
  state.y += state.dirY * state.vy * dt;

  let hitX = false;
  let hitY = false;
  if (state.x <= 0) { state.x = -state.x; state.dirX = 1; hitX = true; }
  else if (state.x >= range.x) { state.x = 2 * range.x - state.x; state.dirX = -1; hitX = true; }
  if (state.y <= 0) { state.y = -state.y; state.dirY = 1; hitY = true; }
  else if (state.y >= range.y) { state.y = 2 * range.y - state.y; state.dirY = -1; hitY = true; }

  // Count a hit within a pixel of the other wall as a corner too.
  const nearX = state.x < 1 || state.x > range.x - 1;
  const nearY = state.y < 1 || state.y > range.y - 1;
  if ((hitX && (hitY || nearY)) || (hitY && nearX)) {
    state.x = state.dirX > 0 ? 0 : range.x;
    state.y = state.dirY > 0 ? 0 : range.y;
    state.hue = (state.hue + 120) % 360;
    onCorner();
  } else if (hitX || hitY) {
    onBounce();
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age += dt;
    if (p.age >= p.life) { particles.splice(i, 1); continue; }
    p.vy += 400 * dt;
    p.vx *= 1 - dt * 0.8;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  flash = Math.max(0, flash - dt * 1.5);
  cornerTextTime = Math.max(0, cornerTextTime - dt);
}

function drawLogo(x, y, color) {
  const w = logo.w;
  const h = logo.h;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;

  // Bold slanted letters across the top.
  ctx.font = `italic 900 ${h * 0.62}px system-ui, "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("DW", w / 2, h * 0.6, w * 0.95);

  // A flat disc underneath, with a dark band carrying a small word.
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.82, w * 0.48, h * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.82, w * 0.2, h * 0.075, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = `700 ${h * 0.09}px system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText("TILES", w / 2, h * 0.825);

  ctx.restore();
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, view.w, view.h);

  if (flash > 0) {
    ctx.fillStyle = `hsla(${state.hue}, 100%, 60%, ${flash * 0.35})`;
    ctx.fillRect(0, 0, view.w, view.h);
  }

  for (const p of particles) {
    const fade = 1 - p.age / p.life;
    ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${fade})`;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }

  const color = `hsl(${state.hue}, 100%, 60%)`;
  drawLogo(state.x, state.y, color);

  if (cornerTextTime > 0) {
    const a = Math.min(1, cornerTextTime);
    const pop = 1 + Math.max(0, cornerTextTime - 1.9) * 2;
    ctx.save();
    ctx.translate(view.w / 2, view.h / 2);
    ctx.scale(pop, pop);
    ctx.font = `900 ${Math.min(view.w, view.h) * 0.14}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `hsla(${(state.hue + 180) % 360}, 100%, 65%, ${a})`;
    ctx.fillText("CORNER!", 0, 0);
    ctx.restore();
  }

  hud.textContent =
    `Corners: ${state.corners}   ·   Bounces since last corner: ${state.bounces}` +
    `   ·   Speed: ${state.speedMult.toFixed(1)}x`;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  step(dt);
  draw();
  requestAnimationFrame(frame);
}

function setSpeed(mult) {
  const m = Math.min(MAX_SPEED, Math.max(MIN_SPEED, mult));
  const ratio = m / state.speedMult;
  state.speedMult = m;
  // Scaling both axes equally keeps any planned corner on target.
  state.vx *= ratio;
  state.vy *= ratio;
}

canvas.addEventListener("click", (e) => {
  state.x = Math.min(Math.max(e.clientX - logo.w / 2, 0), range.x);
  state.y = Math.min(Math.max(e.clientY - logo.h / 2, 0), range.y);
  state.dirX = Math.random() < 0.5 ? 1 : -1;
  state.dirY = Math.random() < 0.5 ? 1 : -1;
  newHeading();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") setSpeed(state.speedMult + 0.2);
  else if (e.key === "ArrowDown") setSpeed(state.speedMult - 0.2);
  else if (e.key === "c" || e.key === "C") { state.forceAim = true; state.aimed = false; }
  else if (e.key === " ") reset();
  else return;
  e.preventDefault();
});

window.addEventListener("resize", resize);

resize();
reset();
requestAnimationFrame(frame);
