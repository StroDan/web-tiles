const canvas = document.getElementById("box");
const ctx = canvas.getContext("2d");
const countLabel = document.getElementById("count");

const GRAVITY = 900; // pixels per second squared
const BOUNCE = 0.85; // share of speed kept after hitting a wall
const MAX_BALLS = 400;

let balls = [];
let gravity = { x: 0, y: GRAVITY };

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function addBall(x, y) {
  const radius = 10 + Math.random() * 20;
  balls.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 600,
    vy: (Math.random() - 0.5) * 600,
    r: radius,
    color: `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`,
  });
  if (balls.length > MAX_BALLS) balls.shift();
}

function update(dt) {
  const w = canvas.width;
  const h = canvas.height;
  for (const b of balls) {
    b.vx += gravity.x * dt;
    b.vy += gravity.y * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * BOUNCE; }
    if (b.x + b.r > w) { b.x = w - b.r; b.vx = -Math.abs(b.vx) * BOUNCE; }
    if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy) * BOUNCE; }
    if (b.y + b.r > h) { b.y = h - b.r; b.vy = -Math.abs(b.vy) * BOUNCE; }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const b of balls) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
  }
  countLabel.textContent = `${balls.length} balls`;
}

let last = performance.now();
function frame(now) {
  // Cap the step so a hidden tab does not fling balls through the walls.
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

canvas.addEventListener("click", (e) => {
  for (let i = 0; i < 5; i++) addBall(e.clientX, e.clientY);
});

window.addEventListener("keydown", (e) => {
  const directions = {
    ArrowUp: { x: 0, y: -GRAVITY },
    ArrowDown: { x: 0, y: GRAVITY },
    ArrowLeft: { x: -GRAVITY, y: 0 },
    ArrowRight: { x: GRAVITY, y: 0 },
  };
  if (directions[e.key]) {
    gravity = directions[e.key];
    e.preventDefault();
  } else if (e.key === " ") {
    balls = [];
    gravity = { x: 0, y: GRAVITY };
    e.preventDefault();
  }
});

window.addEventListener("resize", resize);
resize();
for (let i = 0; i < 15; i++) {
  addBall(Math.random() * canvas.width, Math.random() * canvas.height / 2);
}
requestAnimationFrame(frame);
