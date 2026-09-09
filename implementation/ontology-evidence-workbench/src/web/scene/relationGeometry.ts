export function radialPosition(index: number, total: number, radius = 250): { x: number; y: number } {
  if (total <= 1) return { x: 0, y: 0 };
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) };
}
