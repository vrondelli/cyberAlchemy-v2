// Bounded diagnostic, not a production selector. Writes JSON to stdout only.
// Run with the existing tsx loader. Every generated case is classified; none is removed.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {stripTypeScriptTypes} from 'node:module';
const project=path.resolve(import.meta.dirname,'../../../../..'),cli=path.join(project,'impl/cli');
const get=relative=>import(pathToFileURL(path.join(cli,relative)).href);
const {mixedWorkflowPublicFixture}=await get('test/helpers/workflow-public-mixed.ts');
const {planCompiledReconciledProject}=await get('src/generation/reconciled-project.ts');
const {createOperationBinding}=await get('src/verification/reconciled-operation-binding.ts');
const {createOperationCases}=await get('src/verification/reconciled-operation-cases.ts');
const {canonicalJson,sha256}=await get('src/input/source-manifest.ts');
const {createCrossGeneratorBoundary}=await get('src/verification/reconciled-cross-generator-boundary.ts');
const {createCrossGeneratorOperationSurface}=await get('src/verification/reconciled-cross-generator-operation-surface.ts');
const {createOperationProtocolReference}=await get('src/verification/reconciled-cross-generator-operation-reference.ts');
const {expandOperationProtocolRecipe}=await get('src/verification/reconciled-cross-generator-operation.ts');
const file=path.join(cli,'src/verification/reconciled-operation-cases.ts'),original=fs.readFileSync(file,'utf8');
assert.equal(sha256(original),'95bf28a1677709c346be8d5749f8bc0b9d526fada01afa83c69af854211e5949','Review classification instrumentation after generator changes');
let source=original;
function replace(a,b){assert.equal(source.split(a).length,2,'unique marker: '+a);source=source.replace(a,b);}
replace(' const oracle=createEffectfulOperationReference',' let category="initial",target="operation";const labels:any[]=[];\n const oracle=createEffectfulOperationReference');
replace('cases.push(c);','cases.push(c);labels.push({id:c.id,category,target});');
for(const [a,b]of [
 [' for(const vector of vectors){',' category="input-vectors";for(const vector of vectors){'],
 [' for(let round=0;!baseline',' category="witness-search";for(let round=0;!baseline'],
 [" for(const mode of ['committed','rejected'"," category='transaction-modes';for(const mode of ['committed','rejected'"],
 [' if(b.inputs.length||b.events.length)add',' category="capture";if(b.inputs.length||b.events.length)add'],
 [" for(const mode of ['null','array','inherited'"," category='input-object-shape';for(const mode of ['null','array','inherited'"],
 ["  for(const mode of ['getter','non-enumerable','missing-field'])add(facts.bad(base.input,mode,p.name)","  target=p.name;category='input-field-descriptors';for(const mode of ['getter','non-enumerable','missing-field'])add(facts.bad(base.input,mode,p.name)"],
 ['  for(const invalid of facts.negative(p.type,seed))','  category="nested-invalid-values";for(const invalid of facts.negative(p.type,seed))'],
 ['  for(const omission of facts.omissions(p.type,seed))','  category="optional-omissions";for(const omission of facts.omissions(p.type,seed))'],
 ['  if(b.inputs.length!==1||action.reads.length)for','  category="baseline-substitutions";if(b.inputs.length!==1||action.reads.length)for'],
 [' for(const [i,read]of action.reads.entries()){',' category="reads";for(const [i,read]of action.reads.entries()){target=read.slot;'],
 [' for(const event of action.events){',' category="events";for(const event of action.events){target=event.slot;'],
 [' return {recipes,cases};',' (globalThis as any).__operationCaseLabels=labels;return {recipes,cases};']
])replace(a,b);
source=stripTypeScriptTypes(source).replace(/from '([^']+)'/g,(_,s)=>"from '"+pathToFileURL(path.resolve(path.dirname(file),s.replace(/\.js$/,'.ts'))).href+"'");
const tagged=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const badPaths=(r,at='$')=>{
 if(r.tag==='bad')return [{path:at+(r.field?'.'+r.field:''),mode:r.mode}];
 return [...Object.entries(r.fields??{}).flatMap(([k,v])=>badPaths(v,at+'.'+k)),...(r.items??[]).flatMap((v,i)=>badPaths(v,at+'['+i+']')),...['input','payload'].flatMap(k=>r[k]?badPaths(r[k],at+'.'+k):[])];
};
const outcomeFields=v=>Object.fromEntries(v.outcome[1].map(([k,x])=>[k,x[1]]));
const ranges=ids=>{const out=[];for(const id of ids){const n=Number(id.slice(5)),last=out.at(-1);if(last&&last[1]+1===n)last[1]=n;else out.push([n,n]);}return out;};
const normalizeOwned=(v,id)=>typeof v==='string'&&v.startsWith('owned:'+id+':')?'owned:CASE:'+v.slice(('owned:'+id+':').length):Array.isArray(v)?v.map(x=>normalizeOwned(x,id)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,normalizeOwned(x,id)])):v;
const cleanup=[],rows=[];
try{
 const f=mixedWorkflowPublicFixture({after:fn=>cleanup.push(fn)}),plan=planCompiledReconciledProject(f.graph,f.selection);
 const wp=path.resolve(import.meta.dirname,'../..'),read=name=>fs.readFileSync(path.join(wp,name),'utf8');
 const boundary=createCrossGeneratorBoundary(f.graph,plan,read('cross-generator-verification-contract.json'));
 const surface=createCrossGeneratorOperationSurface(f.graph,plan,boundary,read('cross-generator-operation-contract.json'));
 for(const node of f.graph.nodes.filter(n=>n.kind==='Operation')){
  const binding=createOperationBinding(node,f.graph,plan),baseline=createOperationCases(f.graph,plan,binding);
  const measured=tagged.createOperationCases(f.graph,plan,binding),labels=globalThis.__operationCaseLabels;
  assert.equal(canonicalJson(baseline),canonicalJson(measured),'instrumentation must preserve every output byte');
  assert.equal(labels.length,baseline.cases.length);
  const protocol=createOperationProtocolReference(f.graph,plan,surface,node.selector),groups=new Map(),categories={},stages={},semantics=new Set(),protocols=new Set();
  for(const [i,c]of baseline.cases.entries()){
   const data=JSON.parse(c.values[0]),input=expandOperationProtocolRecipe(baseline.recipes,data.input);
   const fixture={reads:data.reads.map(r=>({...r,value:expandOperationProtocolRecipe(baseline.recipes,r.value)})),clocks:data.clocks};
   const expected=JSON.parse(c.expected.value),observed=protocol.expected(c.id,input,fixture,data.mode);
   assert.equal(canonicalJson(observed.semantic),canonicalJson(expected));
   const fields=outcomeFields(expected),stage=fields.stage??fields.status,label=labels[i];
   assert.equal(c.id,label.id);
   semantics.add(canonicalJson(expected));protocols.add(canonicalJson(normalizeOwned(observed,c.id)));
   const failures=badPaths(input).concat(...fixture.reads.map(r=>badPaths(r.value,'read:'+r.slot)));
   let disposition='keep-integration',reason='distinct-operation-contract-or-boundary';
   if(label.category==='input-vectors'||label.category==='baseline-substitutions'){
    disposition='review-owner-versus-integration';reason=fields.status==='committed'?'select-reachable-boundaries-and-wiring-per-root':'identify-first-rejection-and-intended-obligation-before-reduction';
   }
   if(label.category==='nested-invalid-values'){
    disposition='review-owner-versus-integration';reason='retain-operation-input-normalization-witnesses;owning-provider-coverage-is-separate';
   }
   if(label.category==='events'&&['input','read','guard','write-validation'].includes(stage)){
    disposition='review-target-reachability';reason='earlier-capture-may-be-intended;do-not-credit-downstream-event-validation';
   }
   const key=canonicalJson({category:label.category,target:label.target,mode:data.mode,capture:data.capture,stage,status:fields.status,code:fields.code??null,disposition,reason});
   let g=groups.get(key);if(!g){g={...JSON.parse(key),case_ids:[],semantic:new Set(),protocol:new Set(),failure_examples:[]};groups.set(key,g);}
   for(const failure of failures)if(g.failure_examples.length<3&&!g.failure_examples.some(v=>canonicalJson(v)===canonicalJson(failure)))g.failure_examples.push(failure);
   g.case_ids.push(c.id);g.semantic.add(canonicalJson(expected));g.protocol.add(canonicalJson(normalizeOwned(observed,c.id)));
   categories[label.category]=(categories[label.category]??0)+1;
   stages[stage]=(stages[stage]??0)+1;
  }
  const buckets=[...groups.values()].map(({case_ids,semantic,protocol,...g})=>({...g,count:case_ids.length,case_ranges:ranges(case_ids),distinct_semantic_observations:semantic.size,distinct_direct_protocol_observations:protocol.size}));
  const ids=buckets.flatMap(g=>g.case_ranges.flatMap(([a,b])=>Array.from({length:b-a+1},(_,i)=>a+i))).sort((a,b)=>a-b);
  assert.deepEqual(ids,baseline.cases.map((_,i)=>i),'each case assigned exactly once');
  rows.push({selector:node.selector,case_count:baseline.cases.length,complete_source_output_sha256:sha256(canonicalJson(baseline)),reads:binding.action.reads.length,writes:binding.action.writes.length,guards:binding.action.guards.map(g=>g.selector),events:binding.action.events.map(e=>({slot:e.slot,target:e.target})),categories,stages,distinct_semantic_observations:semantics.size,distinct_direct_protocol_observations:protocols.size,buckets});
  console.error(JSON.stringify({selector:node.selector,cases:baseline.cases.length,categories,stages,semantic_classes:semantics.size,protocol_classes:protocols.size}));
 }
 const totals={};for(const r of rows)for(const [k,n]of Object.entries(r.categories))totals[k]=(totals[k]??0)+n;
 console.log(JSON.stringify({schema_version:'diagnostic.operation-case-classification/v1',authority_effect:'none',selection_effect:'none',fixture:'mixedWorkflowPublicFixture',generator_sha256:sha256(original),plan_sha256:plan.plan_sha256,source_manifest_sha256:f.graph.source_manifest.manifest_sha256,case_count:rows.reduce((n,r)=>n+r.case_count,0),totals,checks:['instrumented output byte-identical','source semantic and direct protocol references agree','each current case classified exactly once'],limitations:['No native or mutation execution in this diagnostic.','Equal observations are not a safe selection key.','Case IDs use inclusive numeric ranges; scoped to exact selector and source digest.','Only owned:case-ID:ordinal labels are alpha-renamed for diagnostic protocol distinctness; cross-case identity obligations remain.','Category names describe generation origin, not proven minimal obligations.','No direct read/write cases in this mixed fixture; owning effectful tests remain required.'],rows},null,2));
}finally{cleanup.reverse().forEach(fn=>fn());}
