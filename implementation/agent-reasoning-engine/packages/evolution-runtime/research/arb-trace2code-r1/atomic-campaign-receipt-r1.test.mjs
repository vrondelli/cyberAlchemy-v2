// Open Questions: evidence/G01-CAMPAIGN-DURABILITY-R1.json.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, existsSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
const moduleUrl = new URL('./atomic-campaign-receipt-r1.mjs', import.meta.url).href;
test('complete private receipt; identical and different replays both refused', () => {
  const path=join(mkdtempSync(join(tmpdir(),'are-atomic-')),'RESULT.json');
  createReceipt(path,{status:'synthetic-complete'});
  const before=readFileSync(path);
  assert.equal(statSync(path).mode & 0o777,0o600);
  for(const value of [{status:'synthetic-complete'},{status:'changed'}]) assert.throws(()=>createReceipt(path,value),{code:'EEXIST'});
  assert.deepEqual(readFileSync(path),before);
});
for(const stage of ['file-synced','published','directory-synced']) test(`SIGKILL at ${stage} leaves absent or complete final bytes`,()=>{
  const path=join(mkdtempSync(join(tmpdir(),'are-atomic-kill-')),'RESULT.json');
  const value={status:'synthetic-complete',payload:'x'.repeat(100000)};
  const code=`import {createReceipt} from ${JSON.stringify(moduleUrl)};createReceipt(${JSON.stringify(path)},${JSON.stringify(value)},{checkpoint:s=>{if(s===${JSON.stringify(stage)})process.kill(process.pid,'SIGKILL')}});`;
  const child=spawnSync(process.execPath,['--input-type=module','-e',code],{timeout:10000});
  assert.equal(child.signal,'SIGKILL');
  assert.equal(existsSync(path),stage!=='file-synced');
  if(existsSync(path)) assert.deepEqual(JSON.parse(readFileSync(path)),value);
});
