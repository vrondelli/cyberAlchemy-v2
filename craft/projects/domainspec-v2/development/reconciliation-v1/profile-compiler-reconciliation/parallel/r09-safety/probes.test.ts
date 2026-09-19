// R09 preparation: source execution only; no native compiler qualification.
// Open questions and integration boundaries: RESULT.md and MATRIX.md.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {planReconciledProject, RECONCILED_COMPILATION_VERSION, RECONCILED_TYPESCRIPT_PROFILE} from '../../../../../impl/cli/src/generation/reconciled-project.ts';
import {publishReconciledProject, verifyReconciledProject} from '../../../../../impl/cli/src/generation/reconciled-output.ts';
import {RESOLVED_ARTIFACT_LAYOUT} from '../../../../../impl/cli/src/generation/resolved-artifact-plan.ts';
import {EXACT_UINT64_PROFILE} from '../../../../../impl/cli/src/generation/exact-uint64.ts';
import {publishInstantiation} from '../../../../../impl/cli/src/generation/publish-instantiation.ts';
import {testPlan} from '../../../../../impl/cli/test/helpers/plans.ts';

function fixture(t:any) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'r09-safety-'));
  t.after(()=>{try{assert.equal(fs.readFileSync(path.join(root,'unrelated'),'utf8'),'preserve');}finally{fs.rmSync(root,{recursive:true,force:true});}});
  const source=path.join(root,'source');
  const write=(p:string,value:unknown)=>{const file=path.join(source,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value));};
  write('project.json',{schema_version:'domainspec.project/v1',project_id:'r09-safety',features:['alpha'],cross_feature_edges:[]});
  write('specs/alpha/feature.json',{schema_version:'domainspec.feature/v1',feature_id:'alpha',nodes:['total'],edges:[]});
  write('specs/alpha/nodes/total.json',{schema_version:'domainspec.node/v1',feature_id:'alpha',node_id:'total',kind:'Calculation',body:{description:'Exact safety fixture',inputs:[],typed_contract:{schema_version:'domainspec.typed-calculation/v2',ontology_calculation:'R09-TOTAL',inputs:[],result:{kind:'scalar',name:'UInt64'},division_rounding:'reject',expression:{op:'literal',value:'7'}}}});
  const selection={schema_version:RECONCILED_COMPILATION_VERSION,profile_id:RECONCILED_TYPESCRIPT_PROFILE,language:'typescript',module_root:'application',layout_version:RESOLVED_ARTIFACT_LAYOUT,value_profile:EXACT_UINT64_PROFILE,field_bindings:[],factories:[],operations:[],workflows:[]};
  const sentinel=path.join(root,'unrelated');fs.writeFileSync(sentinel,'preserve');
  const preserved=()=>assert.equal(fs.readFileSync(sentinel,'utf8'),'preserve');
  return {root,source,selection,preserved,plan:()=>planReconciledProject(source,selection)};
}

test('R09-P01 public scalar plan rejects reserved, traversal, case and Unicode module roots',t=>{
  const f=fixture(t);
  for(const module_root of ['con','aux','lpt9','package/class','../escape','a/../b','/absolute','a\\b','Application','caf\u00e9','cafe\u0301']) {
    assert.throws(()=>planReconciledProject(f.source,{...f.selection,module_root}),/module root|portable/);
  }
  assert.deepEqual(fs.readdirSync(f.root).sort(),['source','unrelated']);
});

test('R09-P02 interrupted reconciled staging leaves no output and preserves unrelated sentinel',t=>{
  const f=fixture(t),plan=f.plan(),target=path.join(f.root,'target');
  const original=fs.writeFileSync;let injected=false;
  fs.writeFileSync=((file:any,...args:any[])=>{
    if(String(file).startsWith(f.root+path.sep)&&String(file).includes('.domainspec-reconciled-')&&!injected){injected=true;throw Error('R09 injected staging interruption');}
    return (original as any)(file,...args);
  }) as any;
  try{assert.throws(()=>publishReconciledProject(plan,target),/R09 injected staging interruption/);}finally{fs.writeFileSync=original;}
  assert.equal(injected,true);assert.equal(fs.existsSync(target),false);
  assert.deepEqual(fs.readdirSync(f.root).sort(),['source','unrelated']);f.preserved();
});

for(const writer of ['reconciled','legacy-node'] as const) {
  test('R09-P03 '+writer+' must preserve a competing empty directory at final rename',t=>{
    const f=fixture(t),plan=writer==='reconciled'?f.plan():testPlan('Entity'),target=path.join(f.root,'target');
    const original=fs.renameSync;let competing:fs.Stats|undefined;let error:unknown;
    fs.renameSync=((from:any,to:any)=>{
      if(String(to)===target){fs.mkdirSync(target);competing=fs.lstatSync(target);}
      return original(from,to);
    }) as any;
    try{writer==='reconciled'?publishReconciledProject(plan as any,target):publishInstantiation(plan as any,target);}catch(e){error=e;}finally{fs.renameSync=original;}
    f.preserved();assert.ok(competing,'race injection reached final rename');
    const after=fs.lstatSync(target);
    assert.deepEqual([after.dev,after.ino],[competing.dev,competing.ino],'competing empty directory identity must survive publication');
    assert.ok(error,'competing target must reject publication');
    assert.deepEqual(fs.readdirSync(target),[]);
  });
}

test('R09-P04 nonempty concurrent target survives rejected reconciled rename',t=>{
  const f=fixture(t),plan=f.plan(),target=path.join(f.root,'target');
  const original=fs.renameSync;let injected=false;
  fs.renameSync=((from:any,to:any)=>{
    if(String(to)===target){fs.mkdirSync(target);fs.writeFileSync(path.join(target,'owner'),'owner bytes');injected=true;}
    return original(from,to);
  }) as any;
  try{assert.throws(()=>publishReconciledProject(plan,target),/not empty|EEXIST|ENOTEMPTY/);}finally{fs.renameSync=original;}
  assert.equal(injected,true);assert.equal(fs.readFileSync(path.join(target,'owner'),'utf8'),'owner bytes');
  assert.deepEqual(fs.readdirSync(f.root).sort(),['source','target','unrelated']);f.preserved();
  assert.equal(verifyReconciledProject(plan,target).result,'fail');
});
