const CLEARANCE = 0.06;
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

export function canOccupy(point, bounds, blockers) {
  return Math.abs(point.x) <= bounds.width / 2 - 0.45 && Math.abs(point.z) <= bounds.depth / 2 - 0.45
    && blockers.every(b => distance(point, b) >= b.radius + CLEARANCE - 1e-6);
}

export function segmentClear(a, b, bounds, blockers) {
  if (!canOccupy(a, bounds, blockers) || !canOccupy(b, bounds, blockers)) return false;
  const dx = b.x - a.x, dz = b.z - a.z;
  const lengthSquared = dx * dx + dz * dz;
  return blockers.every(obstacle => {
    const t = lengthSquared ? Math.max(0, Math.min(1, ((obstacle.x - a.x) * dx + (obstacle.z - a.z) * dz) / lengthSquared)) : 0;
    return distance({x:a.x + dx * t, z:a.z + dz * t}, obstacle) >= obstacle.radius + CLEARANCE - 1e-6;
  });
}

// Visibility graph around inflated collision circles. Every returned segment is
// checked continuously; a walk can never cut diagonally through a machine.
export function findPath(start, destination, bounds, blockers) {
  if (!canOccupy(start, bounds, blockers) || !canOccupy(destination, bounds, blockers)) return null;
  if (segmentClear(start, destination, bounds, blockers)) return [{...destination}];
  const nodes = [{...start}, {...destination}];
  for (const obstacle of blockers) {
    const radius = (obstacle.radius + CLEARANCE + 0.02) / Math.cos(Math.PI / 16);
    for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI / 8;
      const point = {x:obstacle.x + Math.cos(angle) * radius, z:obstacle.z + Math.sin(angle) * radius};
      if (canOccupy(point, bounds, blockers)) nodes.push(point);
    }
  }
  const cost = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set();
  cost[0] = 0;
  while (visited.size < nodes.length) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) if (!visited.has(i) && (current < 0 || cost[i] < cost[current])) current = i;
    if (current < 0 || !Number.isFinite(cost[current])) return null;
    if (current === 1) {
      const path = [];
      for (let i = 1; i !== 0; i = previous[i]) path.unshift(nodes[i]);
      return path;
    }
    visited.add(current);
    for (let i = 0; i < nodes.length; i++) {
      if (visited.has(i)) continue;
      const candidateCost = cost[current] + distance(nodes[current], nodes[i]);
      if (candidateCost < cost[i] && segmentClear(nodes[current], nodes[i], bounds, blockers)) {
        cost[i] = candidateCost;
        previous[i] = current;
      }
    }
  }
  return null;
}

// Fit the opaque artwork, not its transparent canvas, into a physical envelope.
export function fitStationVisual(layout, pixelWidth, pixelHeight) {
  const heightByShape = {desk:1.7, table:2, bench:2.5, terminal:2.05, scanner:2.4, cabinet:2.7, rack:2.8, dial:2.35, crate:1.9, airlock:3.25};
  const maxHeight = Math.min(layout.visual_size.height, heightByShape[layout.shape] ?? layout.visual_size.height);
  const maxWidth = layout.footprint.width;
  const scale = Math.min(maxWidth / pixelWidth, maxHeight / pixelHeight);
  return {width:pixelWidth * scale, height:pixelHeight * scale};
}

export function inspectionPoint(layout, visualSize, verticalFov, aspect, bounds, blockers) {
  const verticalTangent = Math.tan(verticalFov * Math.PI / 360);
  const fitDistance = Math.max(visualSize.height / (2 * verticalTangent), visualSize.width / (2 * verticalTangent * aspect)) * 1.35;
  const distanceFromProp = Math.max(2.5, fitDistance, Math.max(layout.footprint.width, layout.footprint.depth) / 2 + 0.65);
  const facing = layout.facing ?? 0;
  for (const offset of [0, 0.3, -0.3, 0.6, -0.6]) {
    const point = {x:layout.x + Math.sin(facing + offset) * distanceFromProp, z:layout.z + Math.cos(facing + offset) * distanceFromProp};
    if (canOccupy(point, bounds, blockers)) return point;
  }
  return canOccupy(layout.interaction_anchor, bounds, blockers) ? layout.interaction_anchor : null;
}
