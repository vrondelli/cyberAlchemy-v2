import {legacyNodes} from './legacyGraphAliases.ts';
import {featureMaps} from './featureMaps.ts';
export const GRAPH_VERSION='engine-graph-v1';
export const MIN_ZOOM=.04,MAX_ZOOM=1.8;
// Explicit semantic IDs: reordering a source map cannot rename a node.
const identities:Record<string,Record<string,string>>={
 "concepts": {
  "Request": "request",
  "Route": "route",
  "Context Envelope": "context-envelope",
  "Agent and host": "agent-host",
  "Runtime journal": "runtime-journal",
  "Reasoning State": "reasoning-state",
  "Proposed effect": "proposed-effect",
  "Owner and host policy": "host-policy",
  "Continuation": "continuation",
  "Conversation": "conversation",
  "Improvement research": "improvement-research"
 },
 "working-memory": {
  "Reasoning events": "reasoning-events",
  "Append-only log": "append-log",
  "Checkpoint": "checkpoint",
  "Epoch": "epoch",
  "Branches and contrary evidence": "contrary-evidence",
  "Verified transition": "verified-transition",
  "Context refresh": "context-refresh",
  "Selected context": "selected-context",
  "Runtime journal": "runtime-journal",
  "Failure research": "failure-research"
 },
 "gateway": {
  "Agent client": "agent-client",
  "Local Unix socket": "unix-socket",
  "Persistent gateway": "gateway",
  "Backend adapter": "backend-adapter",
  "Agent backend": "agent-backend",
  "Host policy": "host-policy",
  "Resume credentials": "resume-credentials",
  "Session store": "session-store",
  "Acknowledgements": "acknowledgements",
  "Unknown outcome": "unknown-outcome",
  "Completed request": "completed-request"
 },
 "configuration": {
  "Product profile": "product-profile",
  "Repository profile": "repository-profile",
  "Source paths and digests": "source-digests",
  "Gateway options": "gateway-options",
  "Backend transport": "backend-transport",
  "Run configuration": "run-config",
  "Secret provider": "secret-provider",
  "Storage limits": "storage-limits"
 },
 "compatibility": {
  "Product candidate": "product-candidate",
  "Runtime platform": "runtime-platform",
  "Host protocol": "host-protocol",
  "Process adapter": "backend-adapter",
  "Model transport": "model-transport",
  "Model qualification": "model-qualification",
  "Stored records": "stored-records",
  "Owner review": "owner-review",
  "Publication and deployment": "publication"
 },
 "workflows": {
  "User request": "request",
  "Route decision": "route",
  "Context decision": "context-decision",
  "Work within scope": "scoped-work",
  "Effect assessment": "effect-assessment",
  "Host authorization": "host-policy",
  "Observed result": "observed-result",
  "Continue decision": "continuation",
  "Stop or new request": "next-request"
 },
 "interaction-learning": {
  "Completed interaction": "completed-interaction",
  "Correction source": "correction-source",
  "Target and scope": "lesson-scope",
  "Host attestation": "host-attestation",
  "Candidate lesson": "candidate-lesson",
  "Saved lesson history": "lesson-history",
  "Compatible later task": "compatible-task",
  "Lesson projection": "lesson-projection",
  "Outcome checks": "outcome-checks",
  "Research recommendation": "research-recommendation",
  "Revision or revocation": "lesson-revocation"
 },
 "privacy": {
  "Request and context": "request-context",
  "Operational records": "operational-records",
  "Reasoning State": "reasoning-state",
  "Interaction lessons": "interaction-lessons",
  "Operator policy": "operator-policy",
  "Secrets": "secrets",
  "Revision and revocation": "lesson-revocation",
  "Physical deletion": "physical-deletion",
  "Copies and research evidence": "copies"
 },
 "operations": {
  "Runtime checks": "runtime-checks",
  "Local gateway": "gateway",
  "Secret provider": "secret-provider",
  "Storage and disk limits": "storage-limits",
  "Host effect policy": "host-policy",
  "Observed tool result": "observed-result",
  "State and journal digests": "recovery-digests",
  "Valid checkpoint": "valid-checkpoint",
  "Verified later events": "verified-events",
  "Blocked unknown outcome": "unknown-outcome"
 }
};

export type EngineNode={id:string;title:string;detail:string;guides:string[];sources:{guide:string;title:string;detail:string}[];position:{x:number;y:number}};
export type EngineEdge={id:string;source:string;target:string;meaning:string;kind:'flow'|'constraint'|'structure';guides:string[];meanings:string[]};
const nodeMap=new Map<string,EngineNode>();
export const engineEdges:EngineEdge[]=[];
export const workflowNodes:Record<string,string[]>={};
export {legacyNodes} from './legacyGraphAliases.ts';

const edge=(source:string,target:string,meaning:string,guides:string[],kind:EngineEdge['kind']='flow')=>{
 const id=source+'--'+target+'--'+kind,existing=engineEdges.find(e=>e.id===id);
 if(existing){existing.guides=[...new Set([...existing.guides,...guides])];existing.meanings=[...new Set([...existing.meanings,meaning])];}
 else engineEdges.push({id,source,target,meaning,meanings:[meaning],guides,kind});
};
Object.entries(featureMaps).forEach(([guide,map],region)=>{
 const ids=map.parts.map(part=>identities[guide][part.title]);workflowNodes[guide]=ids;
 map.parts.forEach((part,i)=>{
  const id=ids[i];
  const source={guide,title:part.title,detail:part.detail},existing=nodeMap.get(id);
  if(existing){if(!existing.guides.includes(guide))existing.guides.push(guide);existing.sources.push(source);}
  else nodeMap.set(id,{id,title:part.title,detail:part.detail,guides:[guide],sources:[source],position:{x:(region%3)*1260+(i%3)*350,y:Math.floor(region/3)*1300+Math.floor(i/3)*270}});
 });
 map.connections.forEach(([a,b,meaning])=>edge(ids[a],ids[b],meaning,[guide]));
});
// Cross-region facts, grounded in the same reviewed guides. These are not live events.
edge('proposed-effect','effect-assessment','assess the exact proposal',['concepts','workflows']);
edge('context-decision','context-envelope','prepares selected context',['concepts','workflows']);
edge('reasoning-state','reasoning-events','contains explicit progress events',['working-memory'],'structure');
edge('checkpoint','valid-checkpoint','must be verified before recovery',['working-memory','operations'],'constraint');
edge('agent-host','agent-client','connects through the gateway client',['gateway'],'structure');
edge('gateway-options','gateway','configures the local gateway',['configuration','gateway'],'constraint');
edge('product-profile','product-candidate','identifies the product version',['configuration','compatibility'],'constraint');
edge('source-digests','context-refresh','checks selected sources for changes',['configuration','working-memory'],'constraint');
edge('observed-result','completed-interaction','provides the prior outcome for correction',['interaction-learning'],'constraint');
edge('lesson-history','interaction-lessons','retains attributed lesson records',['interaction-learning','privacy'],'structure');
edge('runtime-journal','operational-records','is an operational record',['privacy'],'structure');
edge('run-config','runtime-checks','supplies configured runtime limits',['configuration','operations'],'constraint');
export const engineNodes=[...nodeMap.values()];
export const engineNodeMap=Object.fromEntries(engineNodes.map(n=>[n.id,n]));
export const resolveNode=(id:string|null|undefined)=>id?(engineNodeMap[id]?id:legacyNodes[id]??null):null;
export const neighbors=(id:string)=>engineEdges.filter(e=>e.source===id||e.target===id);
export const graphHref=(node:string)=>'#'+new URLSearchParams({view:'continuity',node}).toString();
