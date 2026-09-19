// Diagnostic only: instrument the source reference in memory and compare a bounded native experiment.
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
const cleanup=[],reports=[];let nativeFixture;
try{
 const f=mixedWorkflowPublicFixture({after:fn=>cleanup.push(fn)}),plan=planCompiledReconciledProject(f.graph,f.selection);
 assert.equal(plan.plan_sha256,census.plan_sha256);assert.equal(f.graph.source_manifest.manifest_sha256,census.source_manifest_sha256);
 for(const node of f.graph.nodes.filter(n=>n.kind==='Operation')){
  const binding=createOperationBinding(node,f.graph,plan),cases=createOperationCases(f.graph,plan,binding),reference=traced.createEffectfulOperationReference(f.graph,plan,binding.action);
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
   const expected=reference.expected(x.recipe,x.fixture,x.data.mode);assert.equal(canonicalJson(expected),x.c.expected.value,'instrumented semantic equality');
   const result=outcome(expected),checks=reference.validationChecks(),failure=checks.find(c=>!c.accepted);
   if(failure)allRejected[failure.path]=(allRejected[failure.path]??0)+1;
   if(labels.get(x.c.id)==='input-vectors'&&result.stage==='result'){
    assert.ok(failure);rejected[failure.path]=(rejected[failure.path]??0)+1;resultFailures++;
    const raw=captureOperationRecipe(x.recipe),value=reference.values.normalize(binding.action.bindings.result.type,raw.amount),failures=enumerate(binding.action.bindings.result.type,value).filter(v=>!v.accepted);
    assert.deepEqual(failures[0],failure,'first rejection agrees with independent collect-all traversal');
    if(failures.length>1)multiplyInvalid++;
    for(const v of failures.slice(1))latent[v.path]=(latent[v.path]??0)+1;
   }
   if(labels.get(x.c.id)==='events'&&result.stage==='input'){
    let capture='accepted';try{captureOperationRecipe(x.recipe);}catch{capture='rejected';}
    assert.equal(expected.trace.length,0);assert.equal(expected.getter_reads,0);
    events.push({id:x.c.id,classification:capture==='rejected'?'inert-capture-rejection':'required-root-parameter-rejection'});
   }
  }
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
  const r={selector:node.selector,cases:cases.cases.length,input_vector_result_failures:resultFailures,first_rejected_paths:rejected,all_case_rejected_paths:allRejected,multiple_invalid_owner_cases:multiplyInvalid,masked_later_invalid_paths:latent,early_event_cases:events,targeted:targeted.map(({recipe,fixture,expected,...x})=>({...x,status:outcome(expected).status,stage:outcome(expected).stage??null,trace:expected.trace}))};
  reports.push(r);console.error(JSON.stringify({selector:r.selector,first:r.first_rejected_paths,multiple_invalid:multiplyInvalid,targeted:r.targeted.length}));
  if(node.selector==='commerce:perform')nativeFixture={f,plan,binding,cases,targeted};
 }
 const nativeResults=[];
 if(process.argv.includes('--native')){
  const {f,plan,binding,cases,targeted}=nativeFixture,root=path.join(f.root,'reachability-native'),src=path.join(root,'source'),out=path.join(root,'compiled');
  fs.mkdirSync(root);const modules=binding.module_paths.map(p=>{const a=plan.resolved.artifacts.find(a=>a.relative_path===p);assert.ok(a);return a;});
  for(const a of modules){const file=path.join(src,a.relative_path);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,a.content);}
  const config=path.join(root,'tsconfig.json');fs.writeFileSync(config,JSON.stringify({compilerOptions:{strict:true,skipLibCheck:true,target:'ES2022',module:'CommonJS',rootDir:src,outDir:out,types:[]},files:modules.map(a=>path.join(src,a.relative_path))}));
  const provider=binding.relative_path.replace(/\.ts$/,'.provider.ts'),providerFile=path.join(src,provider),originalProvider=fs.readFileSync(providerFile,'utf8');
  const payload=path.join(root,'cases.json');fs.writeFileSync(payload,JSON.stringify({full:{selector:binding.selector,relative_path:binding.relative_path,callable:binding.callable,...cases},targeted}));
  const runner=path.join(root,'observe.mjs');
  fs.writeFileSync(runner,"import fs from 'node:fs';import path from 'node:path';import{createRequire}from'node:module';const require=createRequire(import.meta.url);const enumImport=async p=>require(path.join(process.argv[3],p.replace(/\\.ts$/,'.js')));\n"+OPERATION_SEMANTIC_RUNNER+"\nconst data=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const results=await observeOperation(data.full);const mismatches=[];for(let i=0;i<results.cases.length;i++)if(JSON.stringify(results.cases[i].outcome)!==JSON.stringify(data.full.cases[i].expected))mismatches.push(data.full.cases[i].id);const fn=(await enumImport(data.full.relative_path))[data.full.callable];const directed=[];for(const x of data.targeted){try{const got=await observeOperationFixture(fn,x.recipe,'committed',null,x.fixture);directed.push({id:x.id,mismatch:JSON.stringify(got)!==JSON.stringify(x.expected)});}catch(e){directed.push({id:x.id,mismatch:true,error:String(e)});}}console.log(JSON.stringify({full_count:results.cases.length,full_mismatch_count:mismatches.length,first_full_mismatch:mismatches[0]??null,directed}));");
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
   ['skip-owned-validation-empty-lines',originalProvider.replace('    own0(result);','    if(result.lines.length!==0)own0(result);')]
  ];
  for(const [name,content]of variants){
   if(name!=='original')assert.notEqual(content,originalProvider,'applied mutant '+name);
   fs.writeFileSync(providerFile,content);const started=performance.now();run(['tsc','--project',config]);
   const result=JSON.parse(run(['node',runner,payload,out]));if(name==='original'){assert.equal(result.full_mismatch_count,0);assert.ok(result.directed.every(v=>!v.mismatch),'directed baseline must agree');}
   nativeResults.push({name,strict_compilation:'pass',...result,ms:performance.now()-started});console.error(JSON.stringify(nativeResults.at(-1)));
  }
 }
 console.log(JSON.stringify({schema_version:'diagnostic.operation-reachability/v1',authority_effect:'none',production_changes:false,generator_sha256:census.generator_sha256,reference_sha256:sha256(original),plan_sha256:census.plan_sha256,rows:reports,native:nativeResults,claim_ceiling:'Exact fixture and named mutants only. Semantic-lane coverage, not full direct-call protocol, source/native audits, all fixtures or universal equivalence.'}));
}finally{cleanup.reverse().forEach(fn=>fn());}
