import type { RelationRecord, RelationViewModel } from "../contracts/relation";
import { relationViewModel } from "./relationViewModels";

export interface RelationSurfacePack { readonly graph: RelationViewModel; readonly outline: RelationViewModel; readonly table: RelationViewModel; readonly inspector: RelationViewModel }
export function compileRelationSurfacePack(record: RelationRecord): RelationSurfacePack {
  const model = relationViewModel(record);
  return { graph: model, outline: model, table: model, inspector: model };
}
export function relationSurfacesAgree(pack: RelationSurfacePack): boolean {
  return new Set(Object.values(pack).map((item) => `${item.id}|${item.predicate}|${item.sourceId}|${item.targetId}`)).size === 1;
}
