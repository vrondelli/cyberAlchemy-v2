// Real guard/persistence integration. Open questions: MEASURED-TERMINAL-CATALOG-PROTOCOL-R2.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {createStageOutputGuard} from './comparison-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {persistCatalogFinalOutcome} from './measured-terminal-catalog-final-parent-output-r1.mjs';
test('successful and failed settlement reports persist through actual final reserve',t=>{
 const root=mkdtempSync(join(tmpdir(),'catalog-output-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const guard=createStageOutputGuard({root,maximum_bytes:64*1024**2}),persistence=createStagePersistence({stage_root:root,stage_guard:guard});
 for(const failed of [false,true]){
  const value={qualified:!failed,process_settlement:{local_settled:true},measurement_report:{model_calls:0}};
  const path=persistCatalogFinalOutcome({persistence,supervision:root,value,failed});
  assert.deepEqual(JSON.parse(readFileSync(path)),value);
 }
 assert.equal(guard.snapshot().poisoned,false);
});
