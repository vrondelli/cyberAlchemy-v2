import type { VerifiedDataset } from "../contracts/bundle";
import type { Selection } from "../state/workbenchState";
import { nodeViewModel } from "../presentation/nodePresentation";
import { NodeKindIcon } from "./NodeKindIcon";
export function EvidenceOutline({ dataset, ids, selection, onSelect }: { readonly dataset: VerifiedDataset; readonly ids: readonly string[]; readonly selection: Selection; readonly onSelect: (id: string) => void }) { const nodes = ids.map((id) => dataset.graph.nodes.find((node) => node.id === id)).filter((node) => Boolean(node)).map((node) => nodeViewModel(node!, dataset.sidecar.nodes[node!.id])); return <ul className="evidence-outline">{nodes.map((node) => <li key={node.id}><button type="button" className={selection?.id === node.id ? "is-selected" : ""} onClick={() => onSelect(node.id)}><NodeKindIcon kind={node.kind} /><span><strong>{node.title}</strong><small>{node.kind} · {node.mappingLoss}</small></span></button></li>)}</ul>; }
