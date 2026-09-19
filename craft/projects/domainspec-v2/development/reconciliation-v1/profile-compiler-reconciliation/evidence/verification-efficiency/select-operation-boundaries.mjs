// Candidate only: retain source obligations and boundaries while selecting overlapping multi-invalid vectors.
// No production files or test definitions are edited. Native files live in fixture-owned temporary storage.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';import {stripTypeScriptTypes,createRequire} from 'node:module';import {execFileSync} from 'node:child_process';
const project=path.resolve(import.meta.dirname,'../../../../..'),cli=path.join(project,'impl/cli');
const get=p=>import(pathToFileURL(path.join(cli,p)).href);
const {mixedWorkflowPublicFixture}=await get('test/helpers/workflow-public-mixed.ts');
const {order}=await get('test/helpers/workflow-values.ts');
const {planCompiledReconciledProject}=await get('src/generation/reconciled-project.ts');
const {createOperationBinding}=await get('src/verification/reconciled-operation-binding.ts');
const {createOperationCases,operationValueRecipe}=await get('src/verification/reconciled-operation-cases.ts');
const {captureOperationRecipe}=await get('src/verification/reconciled-operation-values.ts');
const {expandOperationProtocolRecipe}=await get('src/verification/reconciled-cross-generator-operation.ts');
const {OPERATION_SEMANTIC_RUNNER}=await get('src/verification/reconciled-operation-runner.ts');
const {canonicalJson,sha256}=await get('src/input/source-manifest.ts');
const {createCrossGeneratorBoundary}=await get('src/verification/reconciled-cross-generator-boundary.ts');
const {createCrossGeneratorOperationSurface}=await get('src/verification/reconciled-cross-generator-operation-surface.ts');
const {createOperationProtocolReference}=await get('src/verification/reconciled-cross-generator-operation-reference.ts');
const {CROSS_GENERATOR_OPERATION_RUNNER}=await get('src/verification/reconciled-cross-generator-operation-runner.ts');
const {CROSS_GENERATOR_OPERATION_PROTOCOL_SHA256}=await get('src/verification/reconciled-cross-generator-operation.ts');
const inputPaths=['src/verification/reconciled-operation-cases.ts','src/verification/reconciled-operation-effect-reference.ts','src/verification/reconciled-operation-values.ts','src/verification/reconciled-operation-runner.ts','src/verification/reconciled-cross-generator-operation-reference.ts','src/verification/reconciled-cross-generator-operation-runner.ts','test/helpers/workflow-public-mixed.ts','test/helpers/workflow-values.ts'];
const inputHashes=Object.fromEntries(inputPaths.map(p=>[p,sha256(fs.readFileSync(path.join(cli,p),'utf8'))]));
const census=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'TEST-CLASSIFICATION.json'),'utf8'));
assert.equal(sha256(fs.readFileSync(path.join(cli,'src/verification/reconciled-operation-cases.ts'),'utf8')),census.generator_sha256);
const refFile=path.join(cli,'src/verification/reconciled-operation-effect-reference.ts'),original=fs.readFileSync(refFile,'utf8');let source=original;
assert.equal(sha256(original),'eb776f5b1798169c25fad19bf901b6486a02d6ea16c11202e3c30e9506132c66');
const replace=(a,b)=>{assert.equal(source.split(a).length,2,'unique reference marker: '+a);source=source.replace(a,b);};
replace(' const ensure=(type:TypedType,v:any,depth=0):void=>{',' let checks:any[]=[];const ensure=(type:TypedType,v:any,depth=0,at="result"):void=>{');
replace('ensure(type.element,v,depth+1)','ensure(type.element,v,depth+1,at)');
replace('v.forEach((x:any)=>ensure(type.element,x,depth+1))','v.forEach((x:any,i:number)=>ensure(type.element,x,depth+1,at+"["+i+"]"))');
replace('ensure(variant.payload,v.payload,depth+1)','ensure(variant.payload,v.payload,depth+1,at+".payload")');
replace("ensure({kind:'sum',variants:d.variants},v,depth+1)","ensure({kind:'sum',variants:d.variants},v,depth+1,at)");
replace('ensure(p.type as TypedType,v[p.name],depth+1)','ensure(p.type as TypedType,v[p.name],depth+1,at+"."+p.name)');
replace("   if(!facts.reference.evaluate(validator.rule,arguments_))throw new TypeError('OPERATION_REFERENCE_OWNED');","   const accepted=facts.reference.evaluate(validator.rule,arguments_);checks.push({path:at,owner:type.selector,rule:validator.rule,accepted});if(!accepted)throw new TypeError('OPERATION_REFERENCE_OWNED');");
replace('  const trace:string[]=[],batches:unknown[]=[]','  checks=[];const trace:string[]=[],batches:unknown[]=[]');
replace('value=values.normalize(type,values.value(w.value,scope).value);ensure(type,value);','value=values.normalize(type,values.value(w.value,scope).value);ensure(type,value,0,"write:"+w.slot);');
replace(' return {action,facts,values,expected,checkOwned};',' return {action,facts,values,expected,checkOwned,validationChecks:()=>structuredClone(checks)};');
source=stripTypeScriptTypes(source).replace(/from '([^']+)'/g,(_,p)=>"from '"+pathToFileURL(path.resolve(path.dirname(refFile),p.replace(/\.js$/,'.ts'))).href+"'");
const traced=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const outcome=v=>Object.fromEntries(v.outcome[1].map(([k,x])=>[k,x[1]]));
const cleanup=[],reports=[],aggregateRows=[],aggregateExpected=[];let nativeFixture;
const shape=(v)=>v===null?'null':Array.isArray(v)?{length:v.length,items:v.map(shape)}:typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,k==='variant'?x:shape(x)])):typeof v;
const atoms=(v,p='input',out=[])=>{if(v===null||typeof v!=='object')out.push([p,typeof v,String(v)]);else for(const[k,x]of Object.entries(v))atoms(x,p+'.'+k,out);return out;};
const choose=rows=>{
 const selected=new Set(rows.filter(x=>x.mandatory).map(x=>x.c.id));
 const needed=new Set(rows.flatMap(x=>x.obligations));
 const cover=x=>x.obligations.forEach(k=>needed.delete(k));
 rows.filter(x=>selected.has(x.c.id)).forEach(cover);
 while(needed.size){let best,score=0;for(const x of rows){if(selected.has(x.c.id))continue;const n=x.obligations.filter(k=>needed.has(k)).length;if(n>score){score=n;best=x;}}assert.ok(best,'uncovered obligation');selected.add(best.c.id);cover(best);}
 return rows.filter(x=>selected.has(x.c.id));
};
try{
 const f=mixedWorkflowPublicFixture({after:fn=>cleanup.push(fn)}),plan=planCompiledReconciledProject(f.graph,f.selection);
 const wp=path.resolve(import.meta.dirname,'../..'),readContract=name=>fs.readFileSync(path.join(wp,name),'utf8');
 const boundary=createCrossGeneratorBoundary(f.graph,plan,readContract('cross-generator-verification-contract.json'));
 const surface=createCrossGeneratorOperationSurface(f.graph,plan,boundary,readContract('cross-generator-operation-contract.json'));
 assert.equal(plan.plan_sha256,census.plan_sha256);assert.equal(f.graph.source_manifest.manifest_sha256,census.source_manifest_sha256);
 for(const node of f.graph.nodes.filter(n=>n.kind==='Operation')){
  const binding=createOperationBinding(node,f.graph,plan),cases=createOperationCases(f.graph,plan,binding),reference=traced.createEffectfulOperationReference(f.graph,plan,binding.action);
  const protocol=createOperationProtocolReference(f.graph,plan,surface,node.selector);
  const classified=census.rows.find(r=>r.selector===node.selector);assert.equal(sha256(canonicalJson(cases)),classified.complete_source_output_sha256);
  const labels=new Map(classified.buckets.flatMap(b=>b.case_ranges.flatMap(([a,z])=>Array.from({length:z-a+1},(_,i)=>['case-'+(a+i),b.category]))));
  const decoded=cases.cases.map(c=>{const d=JSON.parse(c.values[0]);return {c,data:d,recipe:expandOperationProtocolRecipe(cases.recipes,d.input),fixture:{reads:d.reads.map(r=>({...r,value:expandOperationProtocolRecipe(cases.recipes,r.value)})),clocks:d.clocks}};});
  const rejected={},allRejected={},events=[],latent={};let multiplyInvalid=0,resultFailures=0;
  // Enumerate all declared owned validators independently of short-circuit execution.
  const enumerate=(type,value,at='result',out=[])=>{
   if(type.kind==='scalar')return out;if(type.kind==='optional')return value===null?out:enumerate(type.element,value,at,out);
   if(type.kind==='list'||type.kind==='set'){value.forEach((v,i)=>enumerate(type.element,v,at+'['+i+']',out));return out;}
   if(type.kind==='sum'){const v=type.variants.find(v=>v.name===value.variant);if(v.payload)enumerate(v.payload,value.payload,at+'.payload',out);return out;}
   const d=reference.values.get(type);if(d.kind==='Enum')return enumerate({kind:'sum',variants:d.variants},value,at,out);
   for(const p of d.properties)enumerate(p.type,value[p.name],at+'.'+p.name,out);
   const factory=plan.selection.factories.find(v=>v.selector===type.selector);assert.ok(factory);
   for(const v of factory.base_validators){const rule=reference.facts.reference.rules.get(v.rule);const args=new Map(v.arguments.map(a=>{let x=value;for(const k of a.path??[a.field])x=x[k];return [a.parameter,{type:rule.parameters.find(p=>p.name===a.parameter).type,value:x}];}));out.push({path:at,owner:type.selector,rule:v.rule,accepted:reference.facts.reference.evaluate(v.rule,args)});}
   return out;
  };
  for(const x of decoded){
   x.obligations=[];x.mandatory=true;
   x.protocol=protocol.expected(x.c.id,x.recipe,x.fixture,x.data.mode);
   assert.equal(canonicalJson(x.protocol.semantic),x.c.expected.value);
   const expected=reference.expected(x.recipe,x.fixture,x.data.mode);assert.equal(canonicalJson(expected),x.c.expected.value,'instrumented semantic equality');
   const result=outcome(expected),checks=reference.validationChecks(),failure=checks.find(c=>!c.accepted);
   if(failure)allRejected[failure.path]=(allRejected[failure.path]??0)+1;
   if(labels.get(x.c.id)==='input-vectors'&&result.stage==='result'){
    assert.ok(failure);rejected[failure.path]=(rejected[failure.path]??0)+1;resultFailures++;
    const raw=captureOperationRecipe(x.recipe),value=reference.values.normalize(binding.action.bindings.result.type,raw.amount),failures=enumerate(binding.action.bindings.result.type,value).filter(v=>!v.accepted);
    assert.deepEqual(failures[0],failure,'first rejection agrees with independent collect-all traversal');
    if(failures.length>1)multiplyInvalid++;
    x.mandatory=failures.length<=1;
    const first=failure.path;
    x.obligations.push('shape:'+first+':'+canonicalJson(shape(raw)));
    for(const a of atoms(raw))x.obligations.push('atom:'+first+':'+canonicalJson(a));
    for(let i=0;i<failures.length;i++)for(let j=i+1;j<failures.length;j++)x.obligations.push('invalid-pair:'+failures[i].path+':'+failures[j].path);
    // Normalize only the exact owned-token prefix for this case, never user text.
    const tokens=v=>{if(Array.isArray(v)){if(v[0]==='owned'&&typeof v[1]==='string'&&v[1].startsWith('owned:'+x.c.id+':'))return ['owned','owned:CASE:'+v[1].slice(('owned:'+x.c.id+':').length)];return v.map(tokens);}if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,z])=>[k,tokens(z)]));return v;};
    x.obligations.push('protocol:'+canonicalJson(tokens(x.protocol.calls)));
    for(const v of failures.slice(1))latent[v.path]=(latent[v.path]??0)+1;
   }
   if(labels.get(x.c.id)==='events'&&result.stage==='input'){
    let capture='accepted';try{captureOperationRecipe(x.recipe);}catch{capture='rejected';}
    assert.equal(expected.trace.length,0);assert.equal(expected.getter_reads,0);
    events.push({id:x.c.id,classification:capture==='rejected'?'inert-capture-rejection':'required-root-parameter-rejection'});
   }
  }
  const selected=choose(decoded);
  assert.deepEqual(choose(decoded).map(x=>x.c.id),selected.map(x=>x.c.id),'deterministic selection');
  const allObligations=new Set(decoded.flatMap(x=>x.obligations));
  const covered=new Set(selected.flatMap(x=>x.obligations));
  assert.equal(covered.size,allObligations.size);
  const surfaceRow=surface.rows.find(x=>x.selector===node.selector);
  aggregateRows.push({...surfaceRow,adapter:'operation-protocol',recipes:cases.recipes,cases:selected.map(x=>({id:x.c.id,data:x.data}))});
  aggregateExpected.push({selector:node.selector,initialization:protocol.initialization,identity:{operation:true,events:surfaceRow.modules.filter(m=>m.role==='event-wrapper').map(m=>({selector:m.selector,original:true}))},descriptor:surfaceRow.descriptor,cases:selected.map(x=>({id:x.c.id,...x.protocol}))});
  const base=decoded.find(x=>outcome(JSON.parse(x.c.expected.value)).status==='committed');assert.ok(base);
  const raw=captureOperationRecipe(base.recipe);raw.amount=order();
  const positive=operationValueRecipe(raw),ok=reference.expected(positive,base.fixture);assert.equal(outcome(ok).status,'committed');
  const validChecks=reference.validationChecks();assert.ok(validChecks.length>=6);assert.ok(validChecks.every(v=>v.accepted));
  const targeted=[{id:'directed-valid',recipe:positive,fixture:base.fixture,expected:ok,obligation:'valid-complete-result'}];
  for(const check of validChecks){
   const value=structuredClone(raw),factory=plan.selection.factories.find(f=>f.selector===check.owner),validator=factory.base_validators.find(v=>v.rule===check.rule);
   assert.equal(validator.arguments.length,1);const fields=check.path.replace(/^result/,'amount').replace(/\[(\d+)\]/g,'.$1').split('.');
   fields.push(...(validator.arguments[0].path??[validator.arguments[0].field]));
   let target=value;for(const field of fields.slice(0,-1))target=target[field];target[fields.at(-1)]='0';
   const recipe=operationValueRecipe(value),expected=reference.expected(recipe,base.fixture),actual=reference.validationChecks();
   assert.equal(outcome(expected).stage,'result');assert.deepEqual(actual.find(v=>!v.accepted),{...check,accepted:false});
   const all=enumerate(binding.action.bindings.result.type,reference.values.normalize(binding.action.bindings.result.type,value.amount));
   assert.equal(all.filter(v=>!v.accepted).length,1,'exactly one invalid owner');
   targeted.push({id:'directed-'+check.path,recipe,fixture:base.fixture,expected,obligation:check.path,existing_rejection_count:allRejected[check.path]??0});
  }
  const r={selector:node.selector,selected_cases:selected.length,removed_cases:decoded.length-selected.length,mandatory_cases:decoded.filter(x=>x.mandatory).length,obligation_count:allObligations.size,selected_ids_sha256:sha256(canonicalJson(selected.map(x=>x.c.id))),selected_cases_sha256:sha256(canonicalJson(selected.map(x=>x.c))),source_protocol_full_bytes:Buffer.byteLength(canonicalJson(decoded.map(x=>({id:x.c.id,...x.protocol})))),source_protocol_selected_bytes:Buffer.byteLength(canonicalJson(selected.map(x=>({id:x.c.id,...x.protocol})))),cases:cases.cases.length,input_vector_result_failures:resultFailures,first_rejected_paths:rejected,all_case_rejected_paths:allRejected,multiple_invalid_owner_cases:multiplyInvalid,masked_later_invalid_paths:latent,early_event_cases:events,targeted:targeted.map(({recipe,fixture,expected,...x})=>({...x,status:outcome(expected).status,stage:outcome(expected).stage??null,trace:expected.trace}))};
  reports.push(r);console.error(JSON.stringify({selector:r.selector,first:r.first_rejected_paths,multiple_invalid:multiplyInvalid,targeted:r.targeted.length}));
  if(node.selector==='commerce:perform')nativeFixture={f,plan,binding,cases,targeted,selected,protocol,row:surface.rows.find(x=>x.selector===node.selector),decoded};
 }
 const nativeResults=[];let aggregateNative=null;
 if(process.argv.includes('--native')){
  const {f,plan,binding,cases,targeted,selected,protocol,row,decoded}=nativeFixture,root=path.join(f.root,'reachability-native'),src=path.join(root,'source'),out=path.join(root,'compiled');
  fs.mkdirSync(root);const modules=[...new Set(aggregateRows.flatMap(r=>r.modules.map(m=>m.relative_path)))].map(p=>{const a=plan.resolved.artifacts.find(a=>a.relative_path===p);assert.ok(a);return a;});
  for(const a of modules){const file=path.join(src,a.relative_path);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,a.content);}
  const config=path.join(root,'tsconfig.json');fs.writeFileSync(config,JSON.stringify({compilerOptions:{strict:true,skipLibCheck:true,target:'ES2022',module:'CommonJS',rootDir:src,outDir:out,types:[]},files:modules.map(a=>path.join(src,a.relative_path))}));
  const provider=binding.relative_path.replace(/\.ts$/,'.provider.ts'),providerFile=path.join(src,provider),originalProvider=fs.readFileSync(providerFile,'utf8');
  const protocolRunner=path.join(root,'protocol.mjs'),protocolInput=path.join(root,'protocol-input.json');
  fs.writeFileSync(protocolRunner,CROSS_GENERATOR_OPERATION_RUNNER);
  const protocolPayload=rows=>({controls_sha256:'diagnostic-only-not-registered',protocol_sha256:CROSS_GENERATOR_OPERATION_PROTOCOL_SHA256,rows:[{...row,adapter:'operation-protocol',recipes:cases.recipes,cases:rows.map(x=>({id:x.c.id,data:x.data}))}]});
  const protocolExpected=rows=>({controls_sha256:'diagnostic-only-not-registered',rows:[{selector:row.selector,initialization:protocol.initialization,identity:{operation:true,events:row.modules.filter(m=>m.role==='event-wrapper').map(m=>({selector:m.selector,original:true}))},descriptor:row.descriptor,cases:rows.map(x=>({id:x.c.id,...x.protocol}))}]});
  const payload=path.join(root,'cases.json');fs.writeFileSync(payload,JSON.stringify({full:{selector:binding.selector,relative_path:binding.relative_path,callable:binding.callable,...cases},targeted,selected_ids:selected.map(x=>x.c.id)}));
  const runner=path.join(root,'observe.mjs');
  fs.writeFileSync(runner,"import fs from 'node:fs';import path from 'node:path';import{createRequire}from'node:module';const require=createRequire(import.meta.url);const enumImport=async p=>require(path.join(process.argv[3],p.replace(/\\.ts$/,'.js')));\n"+OPERATION_SEMANTIC_RUNNER+"\nconst data=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const results=await observeOperation(data.full);const mismatches=[];for(let i=0;i<results.cases.length;i++)if(JSON.stringify(results.cases[i].outcome)!==JSON.stringify(data.full.cases[i].expected))mismatches.push(data.full.cases[i].id);const fn=(await enumImport(data.full.relative_path))[data.full.callable];const directed=[];for(const x of data.targeted){try{const got=await observeOperationFixture(fn,x.recipe,'committed',null,x.fixture);directed.push({id:x.id,mismatch:JSON.stringify(got)!==JSON.stringify(x.expected)});}catch(e){directed.push({id:x.id,mismatch:true,error:String(e)});}}console.log(JSON.stringify({full_count:results.cases.length,full_mismatch_count:mismatches.length,first_full_mismatch:mismatches[0]??null,selected_count:data.selected_ids.length,selected_mismatch_count:mismatches.filter(id=>data.selected_ids.includes(id)).length,directed}));");
  const image='domainspec-node-toolchain:26.8.1-ts7.0.2';assert.equal(execFileSync('docker',['image','inspect',image,'--format','{{.Id}}'],{encoding:'utf8'}).trim(),'sha256:ad84ad003986966fc38cf50953363ce81eb44d108734b882bee8b912c9b652ef');
  const docker=['run','--rm','--pull','never','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--user',process.getuid()+':'+process.getgid(),'--mount','type=bind,source='+f.root+',target='+f.root,'--workdir',root,image];
  const run=args=>execFileSync('docker',[...docker,...args],{encoding:'utf8',timeout:60000,maxBuffer:16777216});
  const rootLine=originalProvider.split('\n').find(s=>s.startsWith('const own0='));
  assert.ok(rootLine?.includes('own0Factory.create'));const throwCheck='if(!result.ok)throw new TypeError("OPERATION_VALUE:"+result.failure_codes.join(","));';assert.ok(rootLine.includes(throwCheck));
  const variants=[
   ['original',originalProvider],
   ['ignore-root-factory-rejection',originalProvider.replace(rootLine,rootLine.replace(throwCheck,''))],
   ['skip-result-owned-validation',originalProvider.replace('    own0(result);','    /* diagnostic mutation: omitted owned result validation */')],
   ['skip-rollback',originalProvider.replace('await transaction.rollback();','/* diagnostic mutation: omitted rollback */')],
   ['skip-owned-validation-empty-lines',originalProvider.replace('    own0(result);','    if(result.lines.length!==0)own0(result);')],
   ['skip-owned-validation-singleton-lines',originalProvider.replace('    own0(result);','    if(result.lines.length!==1)own0(result);')],
   ['skip-owned-validation-none-variant',originalProvider.replace('    own0(result);','    if(result.choice.variant!=="None")own0(result);')],
   ['skip-owned-validation-two-invalid-owners',originalProvider.replace('    own0(result);','    if(!(result.id===0n&&result.money.quantity===0n))own0(result);')],
   ['duplicate-guard-call',originalProvider.replace(/if\(!((guard\d+)\(\{[^\n]+\}\))\)/,'if(!($1,$1))')]
  ];
  for(const [name,content]of variants){
   if(name!=='original')assert.notEqual(content,originalProvider,'applied mutant '+name);
   fs.writeFileSync(providerFile,content);const started=performance.now();run(['tsc','--project',config]);
   const result=JSON.parse(run(['node',runner,payload,out]));if(name==='original'){assert.equal(result.full_mismatch_count,0);assert.ok(result.directed.every(v=>!v.mismatch),'directed baseline must agree');}
   const protocolRuns={};
   for(const [label,rows]of [['full',decoded],['selected',selected]]){
    fs.writeFileSync(protocolInput,JSON.stringify(protocolPayload(rows)));const begin=performance.now();
    const output=run(['node',protocolRunner,protocolInput,out]),observed=JSON.parse(output),wanted=protocolExpected(rows);
    assert.equal(observed.rows.length,1);assert.equal(observed.rows[0].cases.length,rows.length,'complete observed case count');
    const mismatches=observed.rows[0].cases.filter((v,i)=>canonicalJson(v)!==canonicalJson(wanted.rows[0].cases[i]));
    const metadata=canonicalJson({...observed,rows:observed.rows.map(r=>({...r,cases:[]}))})===canonicalJson({...wanted,rows:wanted.rows.map(r=>({...r,cases:[]}))});
    protocolRuns[label]={cases:rows.length,bytes:Buffer.byteLength(output),ms:performance.now()-begin,mismatches:mismatches.length,metadata_match:metadata};
    if(name==='original'){assert.ok(metadata);assert.equal(mismatches.length,0,label+' protocol baseline');}
   }
   assert.equal(result.full_mismatch_count>0,result.selected_mismatch_count>0,'semantic mutant detection preserved: '+name);
   assert.equal(protocolRuns.full.mismatches>0,protocolRuns.selected.mismatches>0,'protocol mutant detection preserved: '+name);
   nativeResults.push({name,strict_compilation:'pass',...result,protocol:protocolRuns,ms:performance.now()-started});console.error(JSON.stringify(nativeResults.at(-1)));
  }
  fs.writeFileSync(providerFile,originalProvider);run(['tsc','--project',config]);
  const input=JSON.stringify({controls_sha256:'diagnostic-only-not-registered',protocol_sha256:CROSS_GENERATOR_OPERATION_PROTOCOL_SHA256,rows:aggregateRows});
  assert.ok(Buffer.byteLength(input)<=16777216,'unchanged input bound');fs.writeFileSync(protocolInput,input);
  const started=performance.now(),output=run(['node',protocolRunner,protocolInput,out]);
  assert.equal(canonicalJson(JSON.parse(output)),canonicalJson({controls_sha256:'diagnostic-only-not-registered',rows:aggregateExpected}));
  aggregateNative={rows:aggregateRows.length,cases:aggregateRows.reduce((n,r)=>n+r.cases.length,0),input_bytes:Buffer.byteLength(input),output_bytes:Buffer.byteLength(output),output_limit:16777216,ms:performance.now()-started,exact_match:true};
  console.error(JSON.stringify({aggregate_native:aggregateNative}));
 }
 for(const[p,hash]of Object.entries(inputHashes))assert.equal(sha256(fs.readFileSync(path.join(cli,p),'utf8')),hash,'source currentness '+p);
 console.log(JSON.stringify({schema_version:'diagnostic.operation-boundary-selection/v1',input_hashes:inputHashes,authority_effect:'none',production_changes:false,generator_sha256:census.generator_sha256,reference_sha256:sha256(original),plan_sha256:census.plan_sha256,rows:reports,native:nativeResults,aggregate_native:aggregateNative,claim_ceiling:'Exact mixed fixture, retained obligation signatures and named native semantic/protocol mutants only. Not a production successor coverage contract, source/native audits, all fixtures or universal equivalence.'}));
}finally{cleanup.reverse().forEach(fn=>fn());}
