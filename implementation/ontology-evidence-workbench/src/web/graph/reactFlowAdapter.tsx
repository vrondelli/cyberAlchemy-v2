import { useMemo } from "react";
import { Background, Controls, Handle, Position, ReactFlow, getBezierPath, type Edge, type EdgeProps, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { NodeCard } from "../components/NodeCard";
import { RelationEdgeVisual } from "../components/RelationEdge";
import type { RelationRecord } from "../contracts/relation";
import type { RendererCallbacks, RendererScene } from "./renderer";

interface NodePayload extends Record<string, unknown> { readonly view: RendererScene["nodes"][number]["view"]; readonly onSelect: () => void }
interface EdgePayload extends Record<string, unknown> { readonly relation: RelationRecord }
type OewNode = Node<NodePayload, "ontology">;
type OewEdge = Edge<EdgePayload, "relation">;

function OewNodeCard({ data, selected }: NodeProps<OewNode>) {
  return <><Handle type="target" position={Position.Left} /><NodeCard node={data.view} selected={selected} onSelect={data.onSelect} /><Handle type="source" position={Position.Right} /></>;
}
function OewRelationEdge(props: EdgeProps<OewEdge>) {
  const [path, labelX, labelY] = getBezierPath(props);
  const relation = props.data?.relation;
  if (!relation) return null;
  return <g onClick={() => props.data && (props as unknown as { onSelect?: () => void }).onSelect?.()} role="button" aria-label={relation.sentence}><RelationEdgeVisual path={path} labelX={labelX} labelY={labelY} color={relation.color} dash={relation.dash} label={relation.label} selected={props.selected ?? false} /></g>;
}

const nodeTypes = { ontology: OewNodeCard };
const edgeTypes = { relation: OewRelationEdge };

export function ReactFlowAdapter({ scene, callbacks }: { readonly scene: RendererScene; readonly callbacks: RendererCallbacks }) {
  const nodes = useMemo<OewNode[]>(() => scene.nodes.map((item) => ({ id: item.id, type: "ontology", position: { x: item.x, y: item.y }, data: { view: item.view, onSelect: () => callbacks.onSelectNode(item.id) }, selected: item.selected, draggable: false })), [scene.nodes, callbacks]);
  const edges = useMemo<OewEdge[]>(() => scene.relations.map((relation) => ({ id: relation.id, source: relation.sourceId, target: relation.targetId, type: "relation", data: { relation }, label: relation.label, selectable: true, focusable: true, style: { stroke: relation.color }, markerEnd: { type: "arrowclosed" as const, color: relation.color } })), [scene.relations]);
  return <ReactFlow<OewNode, OewEdge> nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{ padding: .3, maxZoom: 1.1 }} minZoom={.25} maxZoom={1.6} onNodeClick={(_, node) => callbacks.onSelectNode(node.id)} onEdgeClick={(_, edge) => callbacks.onSelectRelation(edge.id)} nodesConnectable={false} elementsSelectable aria-label="Bounded ontology graph">
    <Background color="#274057" gap={26} size={1} /><Controls showInteractive={false} />
  </ReactFlow>;
}
