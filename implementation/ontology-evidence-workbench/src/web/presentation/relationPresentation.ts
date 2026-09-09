import type { VerifiedDataset } from "../contracts/bundle";
import type { RelationRecord } from "../contracts/relation";
import { normalizePredicate, predicateLabel, relationFamily, relationSentence } from "./relationEncoding";
import { relationColor } from "./relationPalette";

const plain = (id: string) => id.replace(/^presentation:/, "");

export function projectRelations(dataset: VerifiedDataset): readonly RelationRecord[] {
  const sidecarEntries = Object.entries(dataset.sidecar.edges);
  const claimed = new Set<string>();
  return dataset.graph.edges.map((edge, index) => {
    const predicate = normalizePredicate(edge.description);
    const match = sidecarEntries.find(([id, evidence]) => !claimed.has(id) && `presentation:${evidence.source}` === edge.source && `presentation:${evidence.target}` === edge.target && normalizePredicate(evidence.source_relation) === predicate);
    if (match) claimed.add(match[0]);
    const id = match?.[0] ?? edge.id ?? `presentation-edge:${index}:${plain(edge.source)}:${predicate}:${plain(edge.target)}`;
    const sourceName = dataset.graph.nodes.find((node) => node.id === edge.source)?.name ?? plain(edge.source);
    const targetName = dataset.graph.nodes.find((node) => node.id === edge.target)?.name ?? plain(edge.target);
    const family = relationFamily(predicate);
    const evidence = match?.[1];
    return Object.freeze({
      id, sourceId: edge.source, targetId: edge.target, sourcePredicate: predicate, family,
      label: predicateLabel(predicate), sentence: relationSentence(sourceName, predicate, targetName),
      color: relationColor(predicate), dash: family === "dependency" ? "dashed" : family === "authority" ? "dotted" : "solid",
      direction: edge.direction === "reverse" || edge.direction === "both" ? edge.direction : "forward",
      mappingLoss: evidence?.mapping_loss ?? "unknown", evidenceRefs: evidence?.evidence_refs ?? [], presentation: edge,
      ...(evidence ? { evidence } : {}),
    } satisfies RelationRecord);
  });
}
