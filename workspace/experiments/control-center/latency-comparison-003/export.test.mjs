import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {runInNewContext} from 'node:vm';
test('actual export source returns detached snapshots and a non-replaceable getter',()=>{
  const source=readFileSync(new URL('./receipt-export.ts',import.meta.url),'utf8').replace('import {receipts} from "wlc-startup-probe";','');
  const receipts=[{attempt_id:'1',status_ipc_ms:3}];
  const context={receipts,__WLC_BUILD_ID__:'a'.repeat(64),__WLC_ARM__:'baseline'};
  runInNewContext(stripTypeScriptTypes(source),context);
  const value=context.__WLC_PHASE_EVIDENCE__;
  value.receipts[0].status_ipc_ms=999;value.receipts.push({});
  assert.equal(context.__WLC_PHASE_EVIDENCE__.receipts[0].status_ipc_ms,3);
  assert.equal(context.__WLC_PHASE_EVIDENCE__.receipts.length,1);
  assert.equal(Object.getOwnPropertyDescriptor(context,'__WLC_PHASE_EVIDENCE__').configurable,false);
  assert.equal(context.__WLC_PHASE_EVIDENCE__.build_id,context.__WLC_BUILD_ID__);
});
