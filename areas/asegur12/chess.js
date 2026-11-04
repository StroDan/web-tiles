// Chess pieces wander around a black and white board. Each piece moves by its
// own chess rule to a random free square, glides there, rests, and repeats.
// Click adds a random piece on that square. Space pauses and resumes.

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const ROWS = 10;
const KINDS = ["pawn", "rook", "knight", "bishop", "queen", "king"];
const pieces = [];
let cols = 16;
let cell = 80;
let paused = false;
let last = performance.now();

// The board always covers the whole window: square cells, ROWS tall, and as
// many columns as it takes to reach the right edge.
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cell = canvas.height / ROWS;
  cols = Math.max(1, Math.ceil(canvas.width / cell));
  for (const p of pieces) {
    p.col = Math.min(p.col, cols - 1);
    p.toCol = Math.min(p.toCol, cols - 1);
  }
}

function occupied(col, row, self) {
  return pieces.some(p => p !== self && (
    (p.toCol === col && p.toRow === row) || (p.col === col && p.row === row)));
}

function onBoard(c, r) {
  return c >= 0 && r >= 0 && c < cols && r < ROWS;
}

function addPiece(kind, white, col, row) {
  pieces.push({
    kind, white, col, row, toCol: col, toRow: row,
    t: 1, wait: Math.random() * 1500, dir: white ? -1 : 1,
  });
}

// Squares a piece could move to under its own rule, ignoring checks and
// captures. Sliding pieces stop before any other piece.
function moves(p) {
  const out = [];
  const step = (dc, dr, max) => {
    for (let i = 1; i <= max; i++) {
      const c = p.col + dc * i, r = p.row + dr * i;
      if (!onBoard(c, r) || occupied(c, r, p)) break;
      out.push([c, r]);
    }
  };
  const straight = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const diagonal = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const far = Math.max(cols, ROWS);
  switch (p.kind) {
    case "pawn":
      // Pawns march forward; at the edge they turn around.
      if (!onBoard(p.col, p.row + p.dir)) p.dir = -p.dir;
      step(0, p.dir, Math.random() < 0.3 ? 2 : 1);
      break;
    case "rook":   straight.forEach(([c, r]) => step(c, r, far)); break;
    case "bishop": diagonal.forEach(([c, r]) => step(c, r, far)); break;
    case "queen":  [...straight, ...diagonal].forEach(([c, r]) => step(c, r, far)); break;
    case "king":   [...straight, ...diagonal].forEach(([c, r]) => step(c, r, 1)); break;
    case "knight":
      for (const [c, r] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) {
        const nc = p.col + c, nr = p.row + r;
        if (onBoard(nc, nr) && !occupied(nc, nr, p)) out.push([nc, nr]);
      }
      break;
  }
  return out;
}

function update(dt) {
  for (const p of pieces) {
    if (p.t < 1) {
      p.t = Math.min(1, p.t + dt / p.duration);
      if (p.t === 1) {
        p.col = p.toCol;
        p.row = p.toRow;
        p.wait = 300 + Math.random() * 1500;
      }
      continue;
    }
    p.wait -= dt;
    if (p.wait > 0) continue;
    const options = moves(p);
    if (options.length === 0) { p.wait = 500; continue; }
    const [c, r] = options[Math.floor(Math.random() * options.length)];
    p.toCol = c;
    p.toRow = r;
    p.t = 0;
    p.duration = 400 + Math.hypot(c - p.col, r - p.row) * 120;
  }
}

function drawBoard() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? "#f2f2f2" : "#111";
      ctx.fillRect(c * cell, r * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }
}

// Each piece is drawn in a unit box (0..1) with a shared base, then filled in
// its own colour and outlined in the opposite one so it shows on any square.
function piecePath(kind) {
  ctx.beginPath();
  // base
  ctx.rect(0.22, 0.78, 0.56, 0.1);
  switch (kind) {
    case "pawn":
      ctx.moveTo(0.36, 0.78); ctx.lineTo(0.42, 0.5); ctx.lineTo(0.58, 0.5); ctx.lineTo(0.64, 0.78);
      ctx.moveTo(0.62, 0.38); ctx.arc(0.5, 0.38, 0.12, 0, Math.PI * 2);
      break;
    case "rook":
      ctx.rect(0.32, 0.36, 0.36, 0.42);
      ctx.moveTo(0.26, 0.36); ctx.lineTo(0.26, 0.18); ctx.lineTo(0.36, 0.18); ctx.lineTo(0.36, 0.25);
      ctx.lineTo(0.45, 0.25); ctx.lineTo(0.45, 0.18); ctx.lineTo(0.55, 0.18); ctx.lineTo(0.55, 0.25);
      ctx.lineTo(0.64, 0.25); ctx.lineTo(0.64, 0.18); ctx.lineTo(0.74, 0.18); ctx.lineTo(0.74, 0.36);
      ctx.closePath();
      break;
    case "knight":
      ctx.moveTo(0.3, 0.78); ctx.lineTo(0.36, 0.5); ctx.lineTo(0.22, 0.46); ctx.lineTo(0.26, 0.36);
      ctx.lineTo(0.44, 0.2); ctx.lineTo(0.46, 0.12); ctx.lineTo(0.54, 0.18);
      ctx.quadraticCurveTo(0.76, 0.3, 0.72, 0.78); ctx.closePath();
      break;
    case "bishop":
      ctx.moveTo(0.36, 0.78); ctx.lineTo(0.4, 0.6);
      ctx.quadraticCurveTo(0.28, 0.42, 0.5, 0.2);
      ctx.quadraticCurveTo(0.72, 0.42, 0.6, 0.6);
      ctx.lineTo(0.64, 0.78); ctx.closePath();
      ctx.moveTo(0.56, 0.14); ctx.arc(0.5, 0.14, 0.06, 0, Math.PI * 2);
      break;
    case "queen":
      ctx.moveTo(0.3, 0.78); ctx.lineTo(0.22, 0.3); ctx.lineTo(0.36, 0.5); ctx.lineTo(0.42, 0.24);
      ctx.lineTo(0.5, 0.46); ctx.lineTo(0.58, 0.24); ctx.lineTo(0.64, 0.5); ctx.lineTo(0.78, 0.3);
      ctx.lineTo(0.7, 0.78); ctx.closePath();
      break;
    case "king":
      ctx.moveTo(0.32, 0.78); ctx.lineTo(0.28, 0.4); ctx.lineTo(0.72, 0.4); ctx.lineTo(0.68, 0.78); ctx.closePath();
      ctx.rect(0.46, 0.1, 0.08, 0.3);
      ctx.rect(0.36, 0.18, 0.28, 0.07);
      break;
  }
}

function drawPiece(p) {
  const e = p.t < 1 ? p.t * p.t * (3 - 2 * p.t) : 1; // smooth start and stop
  const x = (p.col + (p.toCol - p.col) * e) * cell;
  let y = (p.row + (p.toRow - p.row) * e) * cell;
  if (p.kind === "knight" && p.t < 1) y -= Math.sin(Math.PI * p.t) * cell * 0.6; // knights jump
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(cell, cell);
  piecePath(p.kind);
  ctx.fillStyle = p.white ? "#fff" : "#000";
  ctx.strokeStyle = p.white ? "#000" : "#fff";
  ctx.lineWidth = 0.035;
  ctx.lineJoin = "round";
  ctx.fill("nonzero");
  ctx.stroke();
  ctx.restore();
}

function frame(now) {
  const dt = Math.min(100, now - last);
  last = now;
  if (!paused) update(dt);
  drawBoard();
  // Moving pieces are drawn last so they pass over resting ones.
  for (const p of pieces) if (p.t >= 1) drawPiece(p);
  for (const p of pieces) if (p.t < 1) drawPiece(p);
  requestAnimationFrame(frame);
}

function randomFreeSquare() {
  for (let i = 0; i < 200; i++) {
    const c = Math.floor(Math.random() * cols), r = Math.floor(Math.random() * ROWS);
    if (!occupied(c, r, null)) return [c, r];
  }
  return null;
}

function start() {
  resize();
  const set = ["king", "queen", "rook", "rook", "bishop", "bishop", "knight", "knight",
    "pawn", "pawn", "pawn", "pawn"];
  for (const white of [true, false]) {
    for (const kind of set) {
      const sq = randomFreeSquare();
      if (sq) addPiece(kind, white, sq[0], sq[1]);
    }
  }
  requestAnimationFrame(frame);
}

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / cell);
  const r = Math.floor((e.clientY - rect.top) / cell);
  if (onBoard(c, r) && !occupied(c, r, null)) {
    addPiece(KINDS[Math.floor(Math.random() * KINDS.length)], Math.random() < 0.5, c, r);
  }
});

window.addEventListener("keydown", e => {
  if (e.code === "Space") {
    paused = !paused;
    e.preventDefault();
  }
});

window.addEventListener("resize", resize);
start();
