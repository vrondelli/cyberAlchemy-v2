import type { OntologyNodeRecord, OntologyRelationRecord, WorkspaceGraphSource } from './graph';
export interface RuntimeMetadata {
  packageKey: string; raw: string; runtimeLifecycle: string;
  binding: {package_key:string; path:string; selector:string; sha256:string; record_sha256:string};
}
export type RuntimeNode = OntologyNodeRecord & RuntimeMetadata & {sourceId:string};
export type RuntimeRelation = OntologyRelationRecord & RuntimeMetadata & {sourceId:string};
export interface RuntimeDocument extends RuntimeMetadata {id:string; path:string; content:string;}
export interface RuntimeView {
  id:string; packageKey:string; label:string; kind:'graph'|'document'; documentId:string;
  purpose:string; claim?:string; blockedClaim?:string; raw?:string;
  nodeIds?:string[]; relationIds?:string[]; error?:string|null;
}
export interface RuntimeSnapshot {
  schema:'workspace-ontology-v4/v1'; authorityEffect:'none'; head:string;
  packages:{key:string; ontologyId:string; path:string; owner:string; status:string}[];
  nodes:RuntimeNode[]; relations:RuntimeRelation[]; documents:RuntimeDocument[]; views:RuntimeView[];
}
export function selectRuntimeGraph(s:RuntimeSnapshot, packageKey:string, viewId:string):WorkspaceGraphSource {
  if (!s.packages.some(p=>p.key===packageKey)) throw new Error('Unknown package');
  const view = viewId==='all' ? undefined : s.views.find(v=>v.id===viewId && v.packageKey===packageKey);
  if (viewId!=='all' && (!view || view.kind!=='graph')) throw new Error('Unknown graph view');
  if (view?.error) throw new Error(view.error);
  const relations = view ? s.relations.filter(r=>view.relationIds?.includes(r.id)) : s.relations.filter(r=>r.packageKey===packageKey);
  const selected = new Set(view?.nodeIds ?? s.nodes.filter(n=>n.packageKey===packageKey).map(n=>n.id));
  for (const relation of relations) {selected.add(relation.source);selected.add(relation.target);}
  const nodes=s.nodes.filter(n=>selected.has(n.id));
  if (nodes.length!==selected.size) throw new Error('Missing view endpoint');
  return {graphId:`${packageKey}/${viewId}`,sourceEpoch:s.head,sourceDigests:{nodes:s.head,relations:s.head},authorityEffect:'none',nodes,relations};
}
