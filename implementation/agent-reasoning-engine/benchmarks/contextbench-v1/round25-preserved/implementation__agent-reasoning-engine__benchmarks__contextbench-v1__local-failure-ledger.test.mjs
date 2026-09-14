import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {persistLocalFailureLedger} from './local-failure-ledger.mjs';

test('each accepted local failure is durable before sequence completion',t=>{
  const root=mkdtempSync(join(tmpdir(),'are-local-failure-ledger-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
  const first={cell_id:'a',failure_code:'deadline-exceeded'};
  persistLocalFailureLedger(root,[first]);
  assert.deepEqual(JSON.parse(readFileSync(join(root,'local-failures.json'))),{schema_version:'are.contextbench-local-failure-ledger/v1',rows:[first],recorded_failures:1,authority_effect:'none'});
  const second={cell_id:'b',failure_code:'tool-calls-invalid'};
  persistLocalFailureLedger(root,[first,second]);
  const final=JSON.parse(readFileSync(join(root,'local-failures.json')));
  assert.deepEqual(final.rows,[first,second]);assert.equal(final.recorded_failures,2);
});
