import type { RelationRecord, RelationViewModel } from "../contracts/relation";

export function relationViewModel(record: RelationRecord): RelationViewModel {
  return { id: record.id, predicate: record.sourcePredicate, label: record.label, sentence: record.sentence, color: record.color, dash: record.dash, sourceId: record.sourceId, targetId: record.targetId, evidenceRefs: record.evidenceRefs, mappingLoss: record.mappingLoss };
}
