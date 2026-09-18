import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {cpSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,relative} from 'node:path';
import {buildFunction} from '../../language/capabilities/alchlang/plans/general-compiler-v1/implementation/dist/function-builder.js';
import {buildService} from '../../language/capabilities/alchlang/plans/general-compiler-v1/implementation/dist/service-builder.js';
const root=resolve(import.meta.dirname,'../..');
const define='implementation/define-cli';
const router='implementation/agent-reasoning-engine/packages/request-decision-router';
const jobs=[
 ['function',`${router}/alch/route-availability.alch`,`${router}/generated/route-availability`],
 ['function',`${define}/alch/define-language-readiness.alch`,`${define}/generated/language-readiness`],
 ['service',`${define}/alch/define-runtime.alch`,`${define}/generated/define-service`],
 ['service',`${define}/alch/integration/define-integration.alch`,`${define}/generated/define-integration`],
 ['service',`${define}/alch/product-ontology/product-ontology.alch`,`${define}/generated/define-product-ontology`],
 ['service',`${define}/alch/business-ontology/business-ontology.alch`,`${define}/generated/define-business-ontology`],
 ['service',`${define}/alch/system-ontology/system-ontology.alch`,`${define}/generated/define-system-ontology`],
];
const files=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(resolve(dir,e.name)):[resolve(dir,e.name)]);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const snapshot=dir=>Object.fromEntries(files(dir).map(p=>[relative(dir,p),sha(readFileSync(p))]));
const stage=mkdtempSync(resolve(tmpdir(),'keld-provenance-build-'));
const reports=[];
try{
 for(const [kind,source,target] of jobs){
  const output=resolve(stage,String(reports.length));
  const before=snapshot(resolve(root,target));
  await (kind==='service'?buildService:buildFunction)(resolve(root,source),output);
  const after=snapshot(output);
  // Regeneration must preserve the complete bundle and compiled decisions.
  assert.deepEqual(Object.keys(after).sort(),Object.keys(before).sort(),`file inventory changed: ${target}`);
  const behavior=Object.keys(before).filter(p=>p.endsWith('/behavior.mjs'));
  assert.ok(behavior.length,`No compiled decisions found: ${target}`);
  for(const p of behavior)assert.equal(after[p],before[p],`Compiled behavior changed: ${target}/${p}`);
  for(const p of Object.keys(after).filter(p=>p.endsWith('/source.alch')))assert.equal(after[p],before[p],`Authored source changed: ${target}/${p}`);
  reports.push({source,target,output,before,after,behavior_files:behavior.length,changed_files:Object.keys(after).filter(p=>after[p]!==before[p])});
 }
 // Reject concurrent modifications before writing any candidate output.
 for(const report of reports)assert.deepEqual(snapshot(resolve(root,report.target)),report.before,`Target changed during build: ${report.target}`);
 // Copy only changed generated files, preserving existing directory identities.
 for(const report of reports)for(const path of report.changed_files)cpSync(resolve(report.output,path),resolve(root,report.target,path));
 const evidence={schema_version:'keld.portable-regeneration/v1',status:'PASS',authority_effect:'none',claim_limit:'Regenerated candidate bundles with identical authored source and compiled behavior; runtime consumer validation is separate.',bundles:reports.map(({output,before,after,...r})=>({...r,file_count:Object.keys(after).length,files:after}))};
 mkdirSync(resolve(root,'keld-project/evidence'),{recursive:true});
 writeFileSync(resolve(root,'keld-project/evidence/portable-regeneration.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',bundles:reports.map(r=>({target:r.target,changed_files:r.changed_files.length,behavior_files:r.behavior_files}))}));
}finally{rmSync(stage,{recursive:true,force:true})}
