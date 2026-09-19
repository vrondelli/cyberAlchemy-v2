// Execute the actual CLI source with injected boundary failures; no provider calls.
// Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import vm from 'node:vm';import * as path from 'node:path';
const source=readFileSync(new URL('./run-measured-terminal-catalog-production-r2.mjs',import.meta.url),'utf8');
for(const failWrite of [false,true])test('postcheck failure retains measurement and settlement; failed write='+failWrite,async()=>{
 const writes=[],printed=[],result={qualified:true,measurement_report:{model_calls:0,rows:[{qualified:true}]},process_settlement:{local_settled:true,process_group_absent:true}};
 const process={argv:['node','cli','qualify','/fixture/FREEZE.json','pin'],env:{NODE_OPTIONS:'--experimental-vm-modules'},on:()=>{},exitCode:0};
 const context=vm.createContext({process,console:{log:s=>printed.push(JSON.parse(s))},AbortController,structuredClone});let checks=0;
 const modules={
  'node:fs':{readFileSync:()=>{},mkdirSync:()=>{},writeFileSync:(file,body)=>{if(failWrite)throw Error('injected disk failure');writes.push({file,body:JSON.parse(body)});}},
  'node:path':{dirname:path.dirname,join:path.join},
  './measured-terminal-catalog-production-r1.mjs':{verifyComparisonProductionFreeze:()=>{if(++checks===2)throw Error('injected source drift');return {request:{schedule:{assigned_outcomes:4}}};},qualifyComparisonProduction:()=>({admitted:true}),verifyInitialQualification:()=>true,runCandidateProduction:()=>{throw Error('model generation forbidden');}},
  './measured-terminal-catalog-qualification-process-r1.mjs':{runComparisonQualification:async()=>result},
  './candidate-only-source-freeze.mjs':{fileHash:()=>{throw Error('unexpected successful artifact');}},
 };
 const entry=new vm.SourceTextModule(source,{context});
 await entry.link(spec=>{const exports=modules[spec];assert.ok(exports,spec);return new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v]of Object.entries(exports))this.setExport(k,v);},{context});});
 await entry.evaluate();assert.equal(process.exitCode,2);assert.equal(printed.length,1);
 const evidence=printed[0].evidence;assert.equal(evidence.qualified,false);assert.deepEqual(evidence.measurement_report,result.measurement_report);assert.deepEqual(evidence.process_settlement,result.process_settlement);assert.equal(evidence.postcheck_error,'injected source drift');
 if(failWrite){assert.equal(evidence.parent_persistence_failure,'injected disk failure');assert.equal(writes.length,0);}
 else {assert.equal(writes[0].file,'/fixture/qualification/FAILED.json');assert.deepEqual(writes[0].body,evidence);}
});
