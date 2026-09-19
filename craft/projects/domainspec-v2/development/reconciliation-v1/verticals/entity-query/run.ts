import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {runCli} from '../../../../impl/cli/src/cli/main.ts';
import {loadCompiledProjectGraph} from '../../../../impl/cli/src/input/project-model.ts';
import {createCompiledSemanticGraph} from '../../../../impl/cli/src/compilation/certificate.ts';
import {planProjectBuild} from '../../../../impl/cli/src/generation/project-build.ts';

const dir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dir,'../../../..');
const source=path.join(dir,'source');
const hash=(s:Buffer|string)=>crypto.createHash('sha256').update(s).digest('hex');
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const files=(root:string):string[]=>fs.readdirSync(root,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(root,e.name)).map(p=>e.name+'/'+p):[e.name]).sort();
const snapshot=(root:string)=>files(root).map(p=>({path:p,sha256:hash(fs.readFileSync(path.join(root,p)))}));
const command=(args:string[])=>{const stdout:string[]=[];const stderr:string[]=[];const code=runCli(args,{stdout:s=>stdout.push(s),stderr:s=>stderr.push(s)});return {code,value:stdout.length?JSON.parse(stdout.at(-1)!):null,diagnostic:stderr.length?JSON.parse(stderr.at(-1)!):null};};
const checks:{id:string,status:string,detail:unknown}[]=[];
const check=(id:string,fn:()=>unknown)=>{try{const detail=fn();checks.push({id,status:'pass',detail:detail??null});}catch(e){checks.push({id,status:'fail',detail:e instanceof Error?e.message:String(e)});}};
const initial=snapshot(source);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dsr007-order-query-'));
const nodePath='specs/commerce/nodes/find-order.json';
const entityPath='specs/commerce/nodes/order.json';
const edgePath='specs/commerce/edges/find-order-reads-order.json';
const generatedFiles:{path:string,content:string,sha256:string}[]=[];
let certificate:unknown=null;
let compiledGraph:unknown=null;
let receipt:unknown=null;
let verification:unknown=null;
let example:unknown=null;
try {
  const graph=loadCompiledProjectGraph(source);
  compiledGraph=createCompiledSemanticGraph(graph);
  check('typed-graph-identity-and-read-only-kind',()=>{
    assert.deepEqual(graph.nodes.map(n=>n.kind).sort(),['Entity','Query']);
    const entity=graph.nodes.find(n=>n.kind==='Entity')!;
    const contract=entity.body.typed_contract as any;
    assert.deepEqual(contract.properties.filter((p:any)=>p.identity).map((p:any)=>p.name),['order_id']);
    assert.equal(contract.ontology_node,'COMMERCE-ORDER');
    assert.equal(graph.relationships.length,1);
    assert.equal(graph.relationships[0]!.relationship,'reads');
    assert.equal(graph.relationships[0]!.source.kind,'Query');
    assert.equal(graph.relationships[0]!.target.kind,'Entity');
    return {nodes:graph.nodes.map(n=>({selector:n.selector,kind:n.kind,definition_id:n.meta_type_id})),relationship:'Query --reads--> Entity',identity:'order_id'};
  });
  check('cli-compile-certificate',()=>{
    const target=path.join(temp,'compiled.json');const r=command(['compile',source,'--target',target]);
    assert.equal(r.code,0,JSON.stringify(r.diagnostic));certificate=r.value.certificate;
    assert.equal(read(target).node_count,2);assert.equal(read(target).edge_count,1);
    assert.deepEqual(read(target).backend_type_ids,['DS-D1.1','DS-D1.5']);
    return {certificate_sha256:r.value.certificate.certificate_sha256,graph_sha256:r.value.certificate.graph_sha256};
  });
  const target=path.join(temp,'target');
  check('cli-build-and-independent-verify',()=>{
    const built=command(['build',source,'--language','typescript','--target-root',target]);
    assert.equal(built.code,0,JSON.stringify(built.diagnostic));receipt=built.value.receipt;
    const verify=command(['verify',source,'--language','typescript','--target-root',target]);
    assert.equal(verify.code,0,JSON.stringify(verify));verification=verify.value;
    assert.equal(verify.value.checks.every((c:any)=>c.result==='pass'),true);
    for(const p of files(target)){const content=fs.readFileSync(path.join(target,p),'utf8');generatedFiles.push({path:p,content,sha256:hash(content)});}
    return {artifact_count:built.value.receipt.artifacts.length,receipt_sha256:built.value.receipt.receipt_sha256};
  });
  check('deterministic-build-and-source-preservation',()=>{
    const second=path.join(temp,'target-repeat');const r=command(['build',source,'--language','typescript','--target-root',second]);assert.equal(r.code,0);
    assert.deepEqual(snapshot(target),snapshot(second));assert.deepEqual(snapshot(source),initial);return snapshot(target);
  });
  const js=path.join(temp,'js');
  check('generated-typescript-compiles',()=>{
    const toolchain=read(path.resolve(root,'../../toolchains/node-typescript/toolchain.json'));
    const image=execFileSync('docker',['image','inspect',toolchain.container_image,'--format','{{.Id}}'],{encoding:'utf8'}).trim();
    assert.match(image,/^sha256:[a-f0-9]{64}$/);
    const dockerArgs=['run','--rm','--pull','never','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--user',`${process.getuid!()}:${process.getgid!()}`,'--mount',`type=bind,source=${temp},target=${temp}`,'--workdir',temp,image,'tsc'];
    const tsc=(args:string[])=>execFileSync('docker',[...dockerArgs,...args],{encoding:'utf8'});
    const sourceFiles=files(target).filter(p=>p.endsWith('.ts')).map(p=>path.join(target,p));
    const version=tsc(['--version']).trim();assert.equal(version,`Version ${toolchain.typescript}`);
    tsc(['--target','ES2022','--module','commonjs','--strict','--skipLibCheck','--outDir',js,...sourceFiles]);
    return {typescript:version,image,network:'none',files:files(js)};
  });
  const query=await import(pathToFileURL(path.join(js,'find-order.js')).href);
  const entity=await import(pathToFileURL(path.join(js,'order.js')).href);
  const rows=Object.freeze([
    Object.freeze({order_id:'order-2',status:'draft',internal_note:'not public'}),
    Object.freeze({order_id:'order-1',status:'submitted',internal_note:'not public either'}),
  ]);
  const params=Object.freeze({order_id:'order-1'});
  check('execute-exact-filter-and-projection',()=>{
    example={input:{rows,parameters:params},output:query.findOrder(rows,params)};
    assert.deepEqual((example as any).output,[{order_id:'order-1',status:'submitted'}]);
    assert.deepEqual(query.findOrder(rows,{order_id:'absent'}),[]);
    assert.deepEqual(query.findOrder([],params),[]);return example;
  });
  check('query-does-not-mutate-input-or-access-implicit-state',()=>{
    const before=JSON.stringify(rows);const output=query.findOrder(rows,params);
    assert.equal(JSON.stringify(rows),before);assert.deepEqual(query.findOrder(rows,params),output);
    assert.equal(Object.isFrozen(output),true);assert.equal(Object.isFrozen(output[0]),true);
    const changed=rows.map(r=>r.order_id==='order-1'?{...r,status:'paid'}:r);
    assert.deepEqual(query.findOrder(changed,params),[{order_id:'order-1',status:'paid'}]);
    assert.deepEqual(query.findOrder(rows,params),[{order_id:'order-1',status:'submitted'}]);
    assert.throws(()=>query.findOrder(rows,{}),/missing parameter:order_id/);
    const code=generatedFiles.find(p=>p.path.endsWith('/find-order.ts'))!.content;
    assert.doesNotMatch(code,/(?:^|\n)\s*import\b|\b(?:require|fetch|import)\s*\(|node:(?:fs|net|http)/);
    return 'Known output depends on explicit snapshot; frozen inputs unchanged; generated query contains no imports, require or fetch. Not a universal purity proof.';
  });
  check('entity-identity-is-not-record-equality',()=>{
    const a=new entity.Order({order_id:'order-1',status:'draft',internal_note:'a'});
    const b=new entity.Order({order_id:'order-1',status:'submitted',internal_note:'b'});
    const c=new entity.Order({order_id:'order-2',status:'draft',internal_note:'a'});
    assert.equal(a.sameIdentity(b),true);assert.equal(a.sameIdentity(c),false);
    assert.equal(Object.isFrozen(a.snapshot()),true);return {same_id_changed_values:true,different_id_same_other_values:false};
  });
  const mutations:[string,string,(v:any)=>any][]=[
    ['wrong-read-endpoint',edgePath,v=>({...v,target_node_id:'find-order'})],
    ['missing-projected-field',nodePath,v=>{v.body.typed_contract.projection=['missing_field'];return v;}],
    ['missing-field-type',entityPath,v=>{delete v.body.typed_contract.properties[0].type;return v;}],
    ['undeclared-write-on-query',nodePath,v=>{v.body.writes=['commerce:order'];return v;}],
    ['missing-parameter-binding',nodePath,v=>{v.body.typed_contract.filter.right.name='missing_parameter';return v;}],
    ['unsupported-type-constructor',entityPath,v=>{v.body.typed_contract.properties[0].type={kind:'entity-reference',target:'commerce:order'};return v;}],
    ['missing-reads-edge','specs/commerce/feature.json',v=>({...v,edges:[]})],
  ];
  for(const [name,p,mutate] of mutations)check('reject-'+name+'-before-output',()=>{
    const mutated=path.join(temp,name);fs.cpSync(source,mutated,{recursive:true});
    fs.writeFileSync(path.join(mutated,p),JSON.stringify(mutate(read(path.join(mutated,p))),null,2)+'\n');
    const before=snapshot(mutated);const out=path.join(temp,name+'-target');
    const r=command(['build',mutated,'--language','typescript','--target-root',out]);
    assert.equal(r.code,22,JSON.stringify(r));assert.match(r.diagnostic.code,/^(MTCLI_|SFC_)/);
    assert.equal(fs.existsSync(out),false);assert.deepEqual(snapshot(mutated),before);
    return {exit_code:r.code,diagnostic:r.diagnostic,target_created:false};
  });
  check('reject-malformed-json-before-output',()=>{
    const mutated=path.join(temp,'malformed');fs.cpSync(source,mutated,{recursive:true});fs.writeFileSync(path.join(mutated,nodePath),'{');
    const before=snapshot(mutated);const out=path.join(temp,'malformed-target');const r=command(['compile',mutated,'--target',out]);
    assert.equal(r.code,22);assert.equal(fs.existsSync(out),false);assert.deepEqual(snapshot(mutated),before);return r.diagnostic;
  });
  check('semantic-change-affects-generated-code-without-changing-kind',()=>{
    const mutated=path.join(temp,'projection-change');fs.cpSync(source,mutated,{recursive:true});const v=read(path.join(mutated,nodePath));v.body.typed_contract.projection=['order_id'];fs.writeFileSync(path.join(mutated,nodePath),JSON.stringify(v,null,2)+'\n');
    const before=planProjectBuild(source,'typescript');const after=planProjectBuild(mutated,'typescript');
    assert.notEqual(before.receipt.compiled_certificate.graph_sha256,after.receipt.compiled_certificate.graph_sha256);
    assert.notEqual(before.artifacts.find(a=>a.relative_path.endsWith('/find-order.ts'))!.sha256,after.artifacts.find(a=>a.relative_path.endsWith('/find-order.ts'))!.sha256);
    assert.deepEqual(loadCompiledProjectGraph(mutated).nodes.map(n=>n.kind).sort(),['Entity','Query']);
    return 'Changing the declared projection changes graph and Query artifact identities without inventing an Operation.';
  });
  check('final-source-preservation',()=>assert.deepEqual(snapshot(source),initial));
}catch(e){checks.push({id:'runner',status:'fail',detail:e instanceof Error?e.stack:String(e)});}
finally{fs.rmSync(temp,{recursive:true,force:true});}
const report={schema_version:'domainspec.dsr007-domain-vertical/v1-candidate',task_id:'DSR-007',status:checks.every(c=>c.status==='pass')?'pass':'fail',scope:'DomainSpec direct JSON -> compiled graph -> TypeScript -> executable JavaScript',alch_status:'deferred-by-user-not-tested',authority_effect:'none',node_version:process.version,source_files:initial,checks,certificate,receipt,verification,example,limitations:['TypeScript slice only','No database or runtime provider','No general runtime input-type validation claim','No Alch comparison','No canonical or package admission'],open_questions_ref:'../../evidence/l0/REPORT.md#open-questions'};
process.stdout.write(JSON.stringify({report,compiled_graph:compiledGraph,generated_files:generatedFiles},null,2)+'\n');
if(report.status!=='pass')process.exitCode=1;
