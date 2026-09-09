import type { VerifiedDataset } from "../contracts/bundle";
import type { FocusScene } from "../contracts/scene";
import type { Selection } from "../state/workbenchState";
import { nodeViewModel } from "../presentation/nodePresentation";
import { ReactFlowAdapter } from "./reactFlowAdapter";

export function GraphCanvas({ dataset, scene, selection, onSelectNode, onSelectRelation }: { readonly dataset: VerifiedDataset; readonly scene: FocusScene; readonly selection: Selection; readonly onSelectNode: (id: string) => void; readonly onSelectRelation: (id: string) => void }) {
  const nodes = scene.nodes.map((item) => ({ id: item.id, x: item.x, y: item.y, view: nodeViewModel(item.node, dataset.sidecar.nodes[item.id]), selected: selection?.kind === "node" && selection.id === item.id }));
  return <section className="graph-canvas" aria-label={`Ontology scene with ${nodes.length} nodes and ${scene.relations.length} relations`} data-visible-nodes={nodes.length} data-visible-relations={scene.relations.length}>
    <ReactFlowAdapter scene={{ nodes, relations: scene.relations }} callbacks={{ onSelectNode, onSelectRelation }} />
  </section>;
}
