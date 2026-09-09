import dagre from "@dagrejs/dagre";

export const NODE_WIDTH = 208;
export const NODE_HEIGHT = 88;
export const LAYOUT_WORKER_NODE_THRESHOLD = 80;

export interface LayoutInput {
  nodes: readonly { id: string }[];
  relations: readonly { source: string; target: string }[];
}

export interface LayoutResult {
  positions: Record<string, { x: number; y: number }>;
  layoutMs: number;
}

export function shouldUseLayoutWorker(nodeCount: number): boolean {
  return nodeCount > LAYOUT_WORKER_NODE_THRESHOLD;
}

export function computeLayout(input: LayoutInput): LayoutResult {
  const started = performance.now();
  const layout = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  layout.setGraph({ rankdir: "LR", ranksep: 92, nodesep: 34, edgesep: 18, marginx: 50, marginy: 50 });
  for (const node of input.nodes) layout.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  for (const relation of input.relations) layout.setEdge(relation.source, relation.target);
  dagre.layout(layout);
  return {
    positions: Object.fromEntries(input.nodes.map((node) => {
      const point = layout.node(node.id);
      return [node.id, { x: point.x - NODE_WIDTH / 2, y: point.y - NODE_HEIGHT / 2 }];
    })),
    layoutMs: performance.now() - started,
  };
}
