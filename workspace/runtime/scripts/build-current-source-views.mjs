import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const runtimeRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const repoRoot=resolve(runtimeRoot,'../..');
const sha=value=>createHash('sha256').update(value).digest('hex');
const readPaths=new Map();
function read(relativePath){
 const absolute=resolve(repoRoot,relativePath);
 if(absolute!==repoRoot&&!absolute.startsWith(repoRoot+sep))throw Error(`SOURCE_OUTSIDE_REPOSITORY:${relativePath}`);
 const bytes=readFileSync(absolute);
 readPaths.set(relative(repoRoot,absolute).replaceAll('\\','/'),sha(bytes));
 return bytes.toString('utf8');
}
const json=path=>JSON.parse(read(path));
const tracked=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:repoRoot,encoding:'utf8',maxBuffer:16*1024*1024}).split('\0').filter(Boolean);
const existing=path=>existsSync(resolve(repoRoot,path));
const selected=tracked.filter(existing).sort();
const ref=path=>`cyberAlchemy-v2/${path}`;
const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
const first=(...values)=>values.find(value=>typeof value==='string'&&value.trim())??null;
const records={definitions:[],products:[],projects:[],ontologies:[]};
const seen=Object.fromEntries(Object.keys(records).map(key=>[key,new Set()]));
function add(collection,value){
 let id=value.recordId;
 if(seen[collection].has(id))id=`${id}@${value.sourceRefs[0]}`;
 if(seen[collection].has(id))throw Error(`DUPLICATE_PROJECTION_ID:${collection}:${id}`);
 seen[collection].add(id);
 records[collection].push({...value,recordId:id,collection});
}

// Canonical term text comes from the normative section, not index intuition.
const definitionsPath='authority/definitions/DEFINITIONS.md';
const definitionsText=read(definitionsPath);
const indexPath='authority/definitions/DEFINITIONS-INDEX.md';
const indexText=read(indexPath);
const indexed=new Map([...indexText.matchAll(/^\| (CAV2-D\d+) \| ([^|]+) \| ([^|]+) \| \[.*?\]\(([^)]+)\)/gm)].map(match=>[match[1],{term:clean(match[2]),status:clean(match[3]),link:match[4]}]));
for(const sectionText of definitionsText.split(/^#{2,3} (?=CAV2-D\d+:)/m).slice(1)){
 const heading=/^(CAV2-D\d+): ([^\n]+)/.exec(sectionText);
 if(!heading)continue;
 const [,id,title]=heading;
 const index=indexed.get(id);
 if(!index)continue;
 const normative=sectionText.split(/^### Normative Definition\s*$/m)[1]?.split(/^### /m)[0];
 if(!normative)throw Error(`NORMATIVE_DEFINITION_MISSING:${id}`);
 add('definitions',{recordId:id,label:index.term||title,status:index.status,meaning:clean(normative),ownerRoute:'CyberAlchemy v2 definitions-governance owner',sourceRefs:[ref(definitionsPath)+'#'+id,ref(indexPath)+'#'+id],boundary:'This is a read-only working-tree projection of the canonical source. The UI cannot revise or promote it.',claimCeiling:'Canonical source term at the displayed working-tree epoch; no new authority is granted.'});
}
if(records.definitions.length!==indexed.size)throw Error(`DEFINITION_INDEX_MISMATCH:${records.definitions.length}:${indexed.size}`);

function fromOntologyNode(node,path,collection){
 const id=first(node.id,node.node_id);
 if(!id)throw Error(`NODE_ID_MISSING:${path}`);
 return {recordId:id,label:first(node.label,node.name,id),status:first(node.candidate_status,node.status,'candidate'),meaning:clean(first(node.plain_language,node.meaning,node.claim,node.identity,id)),ownerRoute:first(node.owner_route,node.owner,'Source ontology owner'),sourceRefs:[ref(path)+'#'+id],boundary:clean(first(node.forbidden_collapse,node.boundary,'Source-local meaning; the projection does not adopt or implement it.')),claimCeiling:`${collection==='products'?'Product':'Project'} ontology source projection only; source status and authority remain separate.`};
}
for(const path of ['ontology/product/nodes.json','ontology/ontology-product/nodes.json','ontology/governance/product/nodes.json']){
 const source=json(path);
 for(const node of source.nodes??[]){
  if(node.authority_effect!==undefined&&node.authority_effect!=='none')throw Error(`AUTHORITY_EFFECT_NOT_NONE:${path}:${node.id}`);
  if(['product','capability'].includes(node.role))add('products',fromOntologyNode(node,path,'products'));
  if(node.role==='project')add('projects',fromOntologyNode(node,path,'projects'));
 }
}
const orchestratorIdentity='orchestrator/product/IDENTITY.json';
if(existing(orchestratorIdentity)){
 const p=json(orchestratorIdentity);
 add('products',{recordId:p.product_id,label:p.name,status:p.status,meaning:clean(p.relationship_to_cyberalchemy),ownerRoute:p.owner_route,sourceRefs:[ref(orchestratorIdentity)+'#'+p.product_id],boundary:'Product identity candidate, not a release or implementation approval.',claimCeiling:'Read-only product identity projection only.'});
}
for(const path of selected.filter(path=>/(^|\/)(product-capability|[^/]+\.product-capability)\.json$/.test(path))){
 const p=json(path);
 if(typeof p.capability_id!=='string'||typeof p.outcome!=='string')continue;
 const owner=p.owner_routes?.find?.(route=>route.responsibility==='product-meaning')?.owner??p.owner_route??p.lifecycle_posture?.owner?.value??'Capability source owner';
 add('products',{recordId:p.capability_id,label:clean(p.name??p.title??p.capability_id),status:first(p.lifecycle_posture?.status?.value,p.candidate_status,p.status,'candidate'),meaning:clean(p.outcome),ownerRoute:owner,sourceRefs:[ref(path)+'#'+p.capability_id],boundary:clean(first(p.exclusions?.[0],p.forbidden_collapse,'Capability meaning is not its realization.')),claimCeiling:`Source-local Product Capability record; source authority_effect: ${clean(p.authority_effect??'unspecified')}. Workspace grants none; no implementation, conformance, or release claim.`});
}
for(const path of selected.filter(path=>/^goals\/projects\/[^/]+\/project\.json$/.test(path))){
 const p=json(path);
 if(typeof p.project_id!=='string')throw Error(`PROJECT_ID_MISSING:${path}`);
 add('projects',{recordId:p.project_id,label:first(p.name,p.project_id),status:first(p.lifecycle_state,p.status,'candidate'),meaning:clean(first(p.purpose,p.summary,p.project_id)),ownerRoute:p.owner_routes?.[0]??'Project source owner',sourceRefs:[ref(path)+'#'+p.project_id],boundary:clean(first(p.exclusions?.[0],p.challenge_route,'Project coordination is not product authority.')),claimCeiling:`Project source identity and purpose only; source authority_effect: ${clean(p.authority_effect??'unspecified')}. Workspace grants none.`,projectEntryRef:`#/projects/${encodeURIComponent(p.project_id)}`});
}

// Product/Project navigation follows only declared source relationships. A
// shared thesis does not imply a dependency or integration between projects.
const productNodePaths=['ontology/product/nodes.json','ontology/ontology-product/nodes.json','ontology/governance/product/nodes.json'];
const productRelationPaths=productNodePaths.map(path=>path.replace('/nodes.json','/relations.json'));
const productNodes=new Map();
for(const path of productNodePaths)for(const node of json(path).nodes??[]){
 if(node.role==='product'&&!productNodes.has(node.id))productNodes.set(node.id,{productId:node.id,label:first(node.label,node.id),parentProductId:null,sourceRefs:[ref(path)+'#'+node.id]});
}
if(existing(orchestratorIdentity)){
 const p=json(orchestratorIdentity);
 if(!productNodes.has(p.product_id))productNodes.set(p.product_id,{productId:p.product_id,label:p.name,parentProductId:first(p.parent_product_ref),sourceRefs:[ref(orchestratorIdentity)+'#'+p.product_id]});
}
const productRelations=productRelationPaths.flatMap(path=>(json(path).relations??[]).map(relation=>({...relation,sourcePath:path})));
for(const relation of productRelations.filter(relation=>relation.type==='contains_product')){
 const child=productNodes.get(relation.target);
 if(child&&productNodes.has(relation.source)){
  if(child.parentProductId&&child.parentProductId!==relation.source)throw Error(`CONFLICTING_PRODUCT_PARENT:${child.productId}`);
  child.parentProductId=relation.source;
  child.sourceRefs.push(ref(relation.sourcePath)+'#'+relation.id);
 }
}
const thesisByProduct=new Map(productRelations.filter(relation=>relation.type==='claims_value_through').map(relation=>[relation.source,relation.target]));
const thesisRecords=[];
for(const path of selected.filter(path=>/(^|\/)product-thesis\.record\.json$/.test(path))){
 const p=json(path);
 if(p.canonical_kind!=='product-thesis'||![p.thesis_id,p.product_ref,p.value_proposition].every(value=>typeof value==='string'&&value.trim()))continue;
 if(!productNodes.has(p.product_ref))productNodes.set(p.product_ref,{productId:p.product_ref,label:first(p.title?.replace(/ Product Thesis$/,''),p.product_ref),parentProductId:null,sourceRefs:[ref(path)+'#product_ref']});
 thesisRecords.push({thesisId:p.thesis_id,ontologyNodeId:thesisByProduct.get(p.product_ref)??null,productId:p.product_ref,title:first(p.title,p.thesis_id),proposition:clean(p.value_proposition),commitment:first(p.commitment_state,'unknown'),sourceRefs:[ref(path)+'#'+p.thesis_id],claimCeiling:clean(first(p.claim_ceiling,'Candidate thesis source; no outcome proof.'))});
}
const exchangeIdentity='cyberalchemy-exchange/knowledge-exchange-protocol/IDENTITY-DECISION.json';
if(existing(exchangeIdentity)){
 const p=json(exchangeIdentity),product=productNodes.get(p.product_id);
 if(product&&p.parent_product_id&&productNodes.has(p.parent_product_id)){
  product.parentProductId=p.parent_product_id;
  product.sourceRefs.push(ref(exchangeIdentity)+'#parent_product_id');
 }
}
const projectLinks=[];
const linkKeys=new Set();
function addProjectLink(link){const key=`${link.projectId}:${link.thesisNodeId}:${link.relation}`;if(linkKeys.has(key))return;linkKeys.add(key);projectLinks.push(link);}
for(const path of selected.filter(path=>/^goals\/projects\/[^/]+\/project\.json$/.test(path))){
 const p=json(path);
 const record=records.projects.find(item=>item.sourceRefs.includes(ref(path)+'#'+p.project_id));
 for(const thesisRef of p.thesis_refs??[]){
  if(!first(thesisRef.ontology_node_id,thesisRef.relation))continue;
  addProjectLink({projectId:p.project_id,recordId:record?.recordId??p.project_id,thesisNodeId:thesisRef.ontology_node_id,relation:thesisRef.relation,selector:first(thesisRef.selector),goalRefs:p.goal_refs??[],sourceRefs:[ref(path)+'#thesis_refs',`${thesisRef.source_id??'source'}#${thesisRef.selector??'unspecified'}`]});
 }
}
for(const relation of productRelations.filter(relation=>relation.type==='tests_realization_of')){
 const record=records.projects.find(item=>item.recordId.startsWith(relation.source)&&item.sourceRefs.some(source=>source.includes('/goals/projects/')))??records.projects.find(item=>item.recordId===relation.source||item.recordId.startsWith(relation.source+'@'));
 if(record)addProjectLink({projectId:relation.source,recordId:record.recordId,thesisNodeId:relation.target,relation:relation.type,selector:null,goalRefs:[],sourceRefs:[ref(relation.sourcePath)+'#'+relation.id]});
}
const hierarchy={authorityEffect:'none',products:[...productNodes.values()].sort((a,b)=>a.label.localeCompare(b.label)),theses:thesisRecords.sort((a,b)=>a.title.localeCompare(b.title)),projectLinks:projectLinks.sort((a,b)=>a.projectId.localeCompare(b.projectId)||a.thesisNodeId.localeCompare(b.thesisNodeId))};

const profilePaths=selected.filter(path=>/(^|\/)(ontology|business-ontology|system-ontology)\//.test(path)&&/(^|\/)(profile|PROFILE)\.json$/.test(path));
const graphViews=[];
const skippedGraphs=[];
for(const path of profilePaths){
 const p=json(path);
 const id=first(p.ontology_id,p.ontologyId);
 if(!id)continue;
 const status=first(p.candidate_status,p.status,p.lifecycle_status,p.implementation_state,'candidate');
 const label=first(p.title,p.label,id);
 const owner=first(p.package_owner,p.owner_route,p.runtime_owner,'Ontology source owner');
 add('ontologies',{recordId:id,label,status,meaning:`${first(p.ontology_type,'Ontology package')} · ${path}`,ownerRoute:owner,sourceRefs:[ref(path)],boundary:'Profile discovery is not registration, validation, semantic admission, or runtime conformance.',claimCeiling:`Read-only working-tree ontology package profile; source authority_effect: ${clean(p.authority_effect??'unspecified')}. Workspace grants none.`});
 const nodeRef=first(p.node_registry,p.registries?.nodes,p.package_files?.nodes);
 const relationRef=first(p.relation_registry,p.registries?.relations,p.package_files?.relations);
 if(!nodeRef||!relationRef)continue;
 const nodesPath=relative(repoRoot,resolve(repoRoot,dirname(path),nodeRef)).replaceAll('\\','/');
 const relationsPath=relative(repoRoot,resolve(repoRoot,dirname(path),relationRef)).replaceAll('\\','/');
 if(!existing(nodesPath)||!existing(relationsPath))continue;
 const nodeSource=json(nodesPath),relationSource=json(relationsPath);
 const sourceNodes=nodeSource.nodes??nodeSource.records;
 const sourceRelations=relationSource.relations??relationSource.edges;
 if(!Array.isArray(sourceNodes)||!Array.isArray(sourceRelations)){
  skippedGraphs.push({profile:path,reason:'unsupported registry arrays'});continue;
 }
 if(sourceNodes.some(node=>!first(node.id,node.node_id))||sourceRelations.some(relation=>!first(relation.source,relation.from,relation.from_node_id)||!first(relation.target,relation.to,relation.to_node_id)||!first(relation.type,relation.relation_type,relation.relationship))){
  skippedGraphs.push({profile:path,reason:'unsupported node or relation identity'});continue;
 }
 const nodes=sourceNodes.map(node=>{
  const nodeId=first(node.id,node.node_id);
  if(!nodeId)throw Error(`ONTOLOGY_NODE_ID_MISSING:${nodesPath}`);
  return {id:nodeId,kind:first(node.kind,node.role,node.domainspec_v2_meta_type,'Ontology node'),label:first(node.label,node.name,nodeId),status:first(node.candidate_status,node.status,status),meaning:clean(first(node.plain_language,node.meaning,node.description,node.claim,node.identity,nodeId)),owner_route:first(node.owner_route,owner),source_refs:[ref(nodesPath)+'#'+nodeId],boundary:clean(first(node.forbidden_collapse,node.boundary,'Source-local ontology meaning.')),claim_ceiling:`Read-only node projection; source authority_effect: ${clean(node.authority_effect??'unspecified')}. Workspace grants none.`,authority_effect:'none'};
 });
 const ids=new Set(nodes.map(node=>node.id));
 if(ids.size!==nodes.length)throw Error(`DUPLICATE_ONTOLOGY_NODE:${nodesPath}`);
 const relationVocabulary=new Map((relationSource.relation_vocabulary??[]).map(item=>[item.id,item]));
 const relations=sourceRelations.map((relation,index)=>{
  const source=first(relation.source,relation.from,relation.from_node_id),target=first(relation.target,relation.to,relation.to_node_id),type=first(relation.type,relation.relation_type,relation.relationship);
  if(!source||!target||!type)throw Error(`ONTOLOGY_RELATION_SHAPE:${relationsPath}:${index}`);
  const vocabulary=relationVocabulary.get(type);
  return {id:first(relation.id,relation.relation_id,`${source}:${type}:${target}:${index}`),type,source,target,claim:clean(first(relation.claim,vocabulary?.plain_language,relation.forbidden_collapse,`Source relation ${type}; no additional meaning inferred.`))+` Source authority_effect: ${clean(relation.authority_effect??'unspecified')}; Workspace grants none.`,authority_effect:'none',direction:relation.direction};
 });
 for(const endpoint of new Set(relations.flatMap(relation=>[relation.source,relation.target])))if(!ids.has(endpoint)){
  nodes.push({id:endpoint,kind:'External Reference',label:endpoint,status:'outside-selected-package',meaning:'Named relation endpoint without a node in this selected package.',owner_route:'External source owner',source_refs:[ref(relationsPath)],boundary:'Endpoint identity only; no external meaning imported.',claim_ceiling:'External reference identity only.',authority_effect:'none'});
  ids.add(endpoint);
 }
 const graphEpoch=sha([readPaths.get(path),readPaths.get(nodesPath),readPaths.get(relationsPath)].join(':'));
 graphViews.push({key:path,label:`${label} · ${status}`,ontologyId:id,profilePath:ref(path),status,source:{graphId:`source-profile:${path}`,sourceEpoch:graphEpoch,sourceDigests:{nodes:readPaths.get(nodesPath),relations:readPaths.get(relationsPath)},authorityEffect:'none',nodes,relations}});
}
for(const collection of Object.keys(records))records[collection].sort((a,b)=>a.label.localeCompare(b.label)||a.recordId.localeCompare(b.recordId));
graphViews.sort((a,b)=>a.label.localeCompare(b.label)||a.key.localeCompare(b.key));
const sourceEpoch=sha(JSON.stringify([...readPaths].sort(([a],[b])=>a.localeCompare(b))));
const snapshot={snapshotId:sha(`working-tree-source-view:${sourceEpoch}`),sourceEpoch,generatedAt:'working-tree-source-view',authorityEffect:'none',...Object.fromEntries(Object.entries(records).map(([key,values])=>[key,values.map(value=>({...value,sourceEpoch}))]))};
const emitted=[
 [resolve(runtimeRoot,'src/domain/current-source-view.generated.ts'),`/* Generated by scripts/build-current-source-views.mjs. Read-only working-tree projection; not authority. */\nimport type {WorkspaceSnapshot} from './workspace';\nexport const CURRENT_SOURCE_VIEW = ${JSON.stringify(snapshot,null,2)} as const satisfies WorkspaceSnapshot;\n`],
 [resolve(runtimeRoot,'src/features/ontology/current-graphs.generated.ts'),`/* Generated by scripts/build-current-source-views.mjs. Read-only working-tree projection; not authority. */\nimport type {WorkspaceGraphSource} from './graph';\nexport interface CurrentOntologyGraph {readonly key:string;readonly label:string;readonly ontologyId:string;readonly profilePath:string;readonly status:string;readonly source:WorkspaceGraphSource}\nexport const CURRENT_ONTOLOGY_COVERAGE = ${JSON.stringify({profiles:records.ontologies.length,graphable:graphViews.length,unsupported:skippedGraphs},null,2)} as const;\nexport const CURRENT_ONTOLOGY_GRAPHS = ${JSON.stringify(graphViews,null,2)} as const satisfies readonly CurrentOntologyGraph[];\n`],
 [resolve(runtimeRoot,'src/domain/current-hierarchy.generated.ts'),`/* Generated by scripts/build-current-source-views.mjs. Source relationships only; not authority. */\nimport type {ProductProjectHierarchy} from './product-project-hierarchy';\nexport const CURRENT_PRODUCT_PROJECT_HIERARCHY = ${JSON.stringify(hierarchy,null,2)} as const satisfies ProductProjectHierarchy;\n`],
];
const check=process.argv.includes('--check');
for(const [path,content] of emitted){if(check){if(!existsSync(path)||readFileSync(path,'utf8')!==content)throw Error(`CURRENT_SOURCE_VIEW_DRIFT:${path}`);}else if(!existsSync(path)||readFileSync(path,'utf8')!==content)writeFileSync(path,content);}
process.stdout.write(JSON.stringify({status:'PASS',mode:check?'check':'write',sourceEpoch,counts:Object.fromEntries(Object.entries(records).map(([key,values])=>[key,values.length])),ontologyGraphs:graphViews.length,skippedGraphs,authorityEffect:'none'})+'\n');
