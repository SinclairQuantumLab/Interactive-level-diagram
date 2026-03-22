const svg = d3.select("#tree-svg");
const depthValue = document.getElementById("depth-value");
const branchValue = document.getElementById("branch-value");

const pointer = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.72,
};

const config = {
  minDepth: 1,
  maxDepth: 11,
};

svg.append("defs")
  .append("linearGradient")
  .attr("id", "ground-gradient")
  .attr("x1", "0%")
  .attr("x2", "0%")
  .attr("y1", "0%")
  .attr("y2", "100%")
  .call((gradient) => {
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "rgb(86, 121, 84)")
      .attr("stop-opacity", 0.1);
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgb(63, 94, 60)")
      .attr("stop-opacity", 0.28);
  });

const scene = svg.append("g");
const ground = scene.append("path").attr("class", "ground");
const branchLayer = scene.append("g").attr("class", "branch-layer");
const leafLayer = scene.append("g").attr("class", "leaf-layer");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

function buildBranches(x, y, length, angle, depth, spread, widthScale, output) {
  if (depth <= 0 || length < 2) {
    return;
  }

  const endX = x + Math.cos(angle) * length;
  const endY = y + Math.sin(angle) * length;
  const barkTone = Math.round(lerp(50, 104, depth / config.maxDepth));
  const sway = Math.sin(pointer.x * 0.01 + depth) * 0.08;

  output.push({
    id: `${depth}-${Math.round(x)}-${Math.round(y)}-${Math.round(endX)}-${Math.round(endY)}`,
    x1: x,
    y1: y,
    x2: endX,
    y2: endY,
    width: Math.max(1, depth * widthScale),
    stroke: `rgb(${barkTone}, ${Math.round(barkTone * 0.8)}, ${Math.round(barkTone * 0.55)})`,
    depth,
  });

  const nextLength = length * 0.76;
  buildBranches(endX, endY, nextLength, angle - spread - sway, depth - 1, spread, widthScale, output);
  buildBranches(endX, endY, nextLength, angle + spread + sway, depth - 1, spread, widthScale, output);
}

function drawGround(width, height) {
  const groundHeight = height * 0.18;
  const d = [
    `M 0 ${height}`,
    `L 0 ${height - groundHeight * 0.48}`,
    `Q ${width * 0.3} ${height - groundHeight} ${width * 0.56} ${height - groundHeight * 0.42}`,
    `Q ${width * 0.78} ${height - groundHeight * 0.12} ${width} ${height - groundHeight * 0.54}`,
    `L ${width} ${height}`,
    "Z",
  ].join(" ");

  ground.attr("d", d);
}

function render() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const normalizedX = clamp(pointer.x / width, 0, 1);
  const normalizedY = clamp(pointer.y / height, 0, 1);
  const depth = Math.round(lerp(config.maxDepth, config.minDepth, normalizedY));
  const spread = lerp(0.18, 0.82, normalizedX);
  const trunkLength = lerp(height * 0.18, height * 0.3, 1 - normalizedY);
  const widthScale = lerp(0.9, 1.55, 1 - normalizedY);

  const branches = [];
  buildBranches(width * 0.5, height * 0.9, trunkLength, -Math.PI / 2, depth, spread, widthScale, branches);

  depthValue.textContent = String(depth);
  branchValue.textContent = String(branches.length);

  drawGround(width, height);

  branchLayer.selectAll("line")
    .data(branches, (d) => d.id)
    .join("line")
    .attr("class", "branch")
    .attr("x1", (d) => d.x1)
    .attr("y1", (d) => d.y1)
    .attr("x2", (d) => d.x2)
    .attr("y2", (d) => d.y2)
    .attr("stroke-width", (d) => d.width)
    .attr("stroke", (d) => d.stroke);

  leafLayer.selectAll("circle")
    .data(branches.filter((d) => d.depth < 3), (d) => d.id)
    .join("circle")
    .attr("class", "leaf")
    .attr("cx", (d) => d.x2)
    .attr("cy", (d) => d.y2)
    .attr("r", (d) => 3 + d.depth * 0.85);
}

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  render();
});

window.addEventListener("resize", render);

render();
