const COLORS = {
  background: "rgba(0, 3, 2, 0.94)",
  grid: "rgba(38, 112, 73, 0.12)",
  trail: "86, 214, 128",
  head: "#d9ffe0",
  captured: "#efb95e"
};

export function createWordRainSchedule(tokens, seed) {
  const random = seededRandom(seed);
  return tokens.map((token, index) => ({
    token,
    lane:index,
    x:0.08 + random() * 0.78,
    y:-0.08 - random() * 0.9,
    speed:0.055 + random() * 0.075,
    phase:random(),
    trail:3 + Math.floor(random() * 4)
  }));
}

export function mountWordRain({canvas, tokens, seed, captured = [], onCapture}) {
  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const drops = createWordRainSchedule(tokens, seed).map((drop) => ({...drop}));
  const capturedSet = new Set(captured);
  let frame = 0;
  let previous = performance.now();
  let width = 1;
  let height = 1;
  let dpr = 1;

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(now) {
    const delta = Math.min(0.05, Math.max(0, (now - previous) / 1000));
    previous = now;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = COLORS.background;
    context.fillRect(0, 0, width, height);
    drawGrid();

    const lineHeight = 23;
    const fontSize = Math.min(13, (width - 24) / (Math.max(...tokens.map(token => token.length)) * 0.62));
    context.font = `600 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    context.textBaseline = "middle";

    drops.forEach((drop, index) => {
      if (reducedMotion) {
        const columns = width >= 600 ? 2 : 1;
        drop.renderX = 12 + (index % columns) * width / columns;
        drop.renderY = 20 + Math.floor(index / columns) * (height - 40) / Math.max(1, Math.ceil(tokens.length / columns) - 1);
      } else {
        drop.y += drop.speed * delta;
        if (drop.y > 1.22) drop.y = -0.18 - drop.phase * 0.58;
        drop.renderX = 12 + drop.x * Math.max(0, width - context.measureText(drop.token).width - 24);
        drop.renderY = drop.y * height;
      }

      const measured = context.measureText(drop.token).width;
      drop.bounds = {x:drop.renderX - 8, y:drop.renderY - 12, width:measured + 16, height:24};
      const isCaptured = capturedSet.has(drop.token);

      if (!reducedMotion && !isCaptured) {
        for (let trailIndex = drop.trail; trailIndex > 0; trailIndex -= 1) {
          const alpha = Math.pow(0.56, trailIndex);
          context.fillStyle = `rgba(${COLORS.trail}, ${alpha})`;
          context.fillText(drop.token, drop.renderX, drop.renderY - lineHeight * trailIndex);
        }
      }

      context.shadowBlur = isCaptured ? 0 : 8;
      context.shadowColor = "rgba(85, 255, 145, 0.68)";
      context.fillStyle = isCaptured ? COLORS.captured : COLORS.head;
      context.globalAlpha = isCaptured ? 0.28 : 1;
      context.fillText(drop.token, drop.renderX, drop.renderY);
      context.globalAlpha = 1;
      context.shadowBlur = 0;
    });

    frame = requestAnimationFrame(draw);
  }

  function drawGrid() {
    context.strokeStyle = COLORS.grid;
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 28) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
    }
    for (let y = 0; y < height; y += 24) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
    }
  }

  function captureAt(event) {
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const drop = [...drops].reverse().find((candidate) => {
      const box = candidate.bounds;
      return box && x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
    });
    if (!drop || capturedSet.has(drop.token)) return;
    onCapture(drop.token);
  }

  resize();
  canvas.addEventListener("pointerdown", captureAt);
  window.addEventListener("resize", resize);
  frame = requestAnimationFrame(draw);

  return {
    setCaptured(next) {
      capturedSet.clear();
      for (const token of next) capturedSet.add(token);
    },
    destroy() {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", captureAt);
      window.removeEventListener("resize", resize);
    }
  };
}

function seededRandom(seed) {
  let state = hashSeed(seed) || 0x9e3779b9;
  return () => {
    state |= 0;
    state = state + 0x6d2b79f5 | 0;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
