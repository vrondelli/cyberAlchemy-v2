import type { NodeViewModel } from "../presentation/nodePresentation";
import { NodeKindIcon } from "./NodeKindIcon";
export function NodeCard({ node, selected = false, compact = false, onSelect }: { readonly node: NodeViewModel; readonly selected?: boolean; readonly compact?: boolean; readonly onSelect?: () => void }) {
  return <button type="button" className={`node-card${selected ? " is-selected" : ""}${compact ? " is-compact" : ""}`} onClick={onSelect} aria-pressed={selected} title={node.summary} data-node-id={node.id}>
    <span className="node-card__kind"><NodeKindIcon kind={node.kind} /><span>{node.kind}</span></span>
    <strong>{node.title}</strong>{!compact && <span className="node-card__summary">{node.summary}</span>}
  </button>;
}
