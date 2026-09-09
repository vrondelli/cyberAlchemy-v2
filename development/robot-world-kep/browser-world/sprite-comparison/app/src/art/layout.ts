export const COLONY_LAYOUT = Object.freeze({
  tiles: [
    { frame: 'ground', x: 230, y: 218, scale: 1.34 },
    { frame: 'ground', x: 840, y: 218, scale: 1.34 },
    { frame: 'plaza', x: 230, y: 672, scale: 1.34 },
    { frame: 'path', x: 840, y: 672, scale: 1.34 }
  ],
  props: [
    { frame: 'workshop', x: 640, y: 330, scale: 0.44, label: 'WORKSHOP' },
    { frame: 'parts-store', x: 224, y: 372, scale: 0.38, label: 'PARTS STORE' },
    { frame: 'research-shelter', x: 1056, y: 372, scale: 0.38, label: 'RESEARCH' },
    { frame: 'charging-pad', x: 280, y: 684, scale: 0.43, label: 'CHARGE' },
    { frame: 'cargo', x: 872, y: 690, scale: 0.43, label: 'CARGO' },
    { frame: 'plant', x: 1134, y: 664, scale: 0.42, label: 'GROW' }
  ]
} as const);

export const LOAD_GRID = Object.freeze({ columns: 25, spacing: 42, originX: 120, originY: 112 });
