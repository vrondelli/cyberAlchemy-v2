import type { RelationRecord } from "../contracts/relation";
import { predicatePalette } from "../presentation/relationPalette";
export function RelationLegend({ relations }: { readonly relations: readonly RelationRecord[] }) {
  const palette = predicatePalette(relations.map((relation) => relation.sourcePredicate));
  return <details className="relation-legend"><summary>Relations <span>{palette.length} visible types</span></summary><div className="relation-legend__items">{palette.map((item) => <span key={item.predicate}><i style={{ background: item.color }} />{item.predicate.replaceAll("_", " ")}</span>)}</div></details>;
}
