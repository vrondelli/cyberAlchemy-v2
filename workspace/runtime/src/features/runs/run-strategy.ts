// Validated presentation of source graph structure. Open questions: README.md.
export interface RunStrategyView {
 kind:string;model:string;goal:string;max_parallelism:number;
 nodes:Array<{node_id:string;role_id:string;stage:string;depends_on:string[];max_attempts:number;status:string;persona_ref?:string;persona_version?:string}>;
 edges:Array<{from:string;to:string}>;
}
export function projectRunStrategy(value:unknown):RunStrategyView|null {
 if(value==null)return null;
 const raw=value as RunStrategyView;
 // Older source projections sometimes report only model metadata.
 if(raw&&typeof raw==="object"&&raw.nodes===undefined)return null;
 const text=(value:unknown):value is string=>typeof value==='string'&&value.trim().length>0;
 if(!raw||![raw.kind,raw.model,raw.goal].every(text)||!Number.isInteger(raw.max_parallelism)||raw.max_parallelism<1||!Array.isArray(raw.nodes)||!raw.nodes.length||raw.nodes.length>256||!Array.isArray(raw.edges))throw Error('RUN_STRATEGY_INVALID');
 const ids=new Set(raw.nodes.map(node=>node.node_id));if(ids.size!==raw.nodes.length)throw Error('RUN_STRATEGY_DUPLICATE_NODE');
 for(const node of raw.nodes){
  if(![node.node_id,node.role_id,node.stage,node.status].every(text)||!Number.isInteger(node.max_attempts)||node.max_attempts<1||!Array.isArray(node.depends_on)||new Set(node.depends_on).size!==node.depends_on.length||node.depends_on.some(id=>!ids.has(id)))throw Error('RUN_STRATEGY_NODE_INVALID');
 }
 const expected=raw.nodes.flatMap(node=>node.depends_on.map(parent=>JSON.stringify([parent,node.node_id]))).sort();
 const edges=raw.edges.map(edge=>JSON.stringify([edge.from,edge.to])).sort();
 if(JSON.stringify(expected)!==JSON.stringify(edges))throw Error('RUN_STRATEGY_EDGES_INVALID');
 const done=new Set<string>(),visiting=new Set<string>();
 const visit=(id:string)=>{if(visiting.has(id))throw Error('RUN_STRATEGY_CYCLE');if(done.has(id))return;visiting.add(id);raw.nodes.find(node=>node.node_id===id)!.depends_on.forEach(visit);visiting.delete(id);done.add(id);};
 raw.nodes.forEach(node=>visit(node.node_id));
 return structuredClone(raw);
}
