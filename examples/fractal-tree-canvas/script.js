const canvas = document.getElementById("tree-canvas");
const ctx = canvas.getContext("2d");
const depthValue = document.getElementById("depth-value");

const pointer = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.72,
};

const config = {
  minDepth: 1,
  maxDepth: 11,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  draw();
}

function drawBranch(x, y, length, angle, depth, spread, widthScale) {
  if (depth <= 0 || length < 2) {
    return;
  }

  const endX = x + Math.cos(angle) * length;
  const endY = y + Math.sin(angle) * length;

  const barkTone = Math.round(lerp(50, 104, depth / config.maxDepth));
  ctx.strokeStyle = `rgb(${barkTone}, ${Math.round(barkTone * 0.8)}, ${Math.round(barkTone * 0.55)})`;
  ctx.lineWidth = Math.max(1, depth * widthScale);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  if (depth < 3) {
    ctx.fillStyle = `rgba(74, 130, 82, ${0.18 + depth * 0.12})`;
    ctx.beginPath();
    ctx.arc(endX, endY, 3 + depth * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }

  const nextLength = length * 0.76;
  const sway = Math.sin(pointer.x * 0.01 + depth) * 0.08;

  drawBranch(endX, endY, nextLength, angle - spread - sway, depth - 1, spread, widthScale);
  drawBranch(endX, endY, nextLength, angle + spread + sway, depth - 1, spread, widthScale);
}

function drawGround(width, height) {
  const groundHeight = height * 0.18;
  const gradient = ctx.createLinearGradient(0, height - groundHeight, 0, height);
  gradient.addColorStop(0, "rgba(86, 121, 84, 0.1)");
  gradient.addColorStop(1, "rgba(63, 94, 60, 0.28)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, height - groundHeight * 0.48);
  ctx.quadraticCurveTo(width * 0.3, height - groundHeight, width * 0.56, height - groundHeight * 0.42);
  ctx.quadraticCurveTo(width * 0.78, height - groundHeight * 0.12, width, height - groundHeight * 0.54);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();
}

function draw() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  ctx.clearRect(0, 0, width, height);

  const normalizedX = clamp(pointer.x / width, 0, 1);
  const normalizedY = clamp(pointer.y / height, 0, 1);
  const depth = Math.round(lerp(config.maxDepth, config.minDepth, normalizedY));
  const spread = lerp(0.18, 0.82, normalizedX);
  const trunkLength = lerp(height * 0.18, height * 0.3, 1 - normalizedY);
  const widthScale = lerp(0.9, 1.55, 1 - normalizedY);

  depthValue.textContent = String(depth);
  drawGround(width, height);
  drawBranch(width * 0.5, height * 0.9, trunkLength, -Math.PI / 2, depth, spread, widthScale);
}

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  draw();
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
