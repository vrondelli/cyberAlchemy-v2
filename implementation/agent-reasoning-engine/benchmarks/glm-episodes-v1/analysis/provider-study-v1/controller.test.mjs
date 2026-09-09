// Controller state/budget checks; no provider calls. Open questions: README.md#open-questions.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {freeze,verifyFreeze,trialState,checkCounts,save,executeRow} from './controller.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const row=JSON.parse(readFileSync(new URL('../controlled-study-v1/prepared/schedule.json',import.meta.url)))[0];
const setup=t=>{const p=mkdtempSync(join(tmpdir(),'are-controller58-'));t.after(()=>rmSync(p,{recursive:true,force:true}));return p;};
test('completed trial skips the client; wrong arm or result bytes fail binding',async t=>{
 const p=setup(t),root=join(p,row.id);mkdirSync(root);save(join(root,'started.json'),{row,freeze_digest:'freeze'});
 const result={id:row.id,receipts:[]};save(join(root,'result.json'),result);save(join(root,'completed.json'),{freeze_digest:'freeze',result_sha256:sha(readFileSync(join(root,'result.json')))});
 assert.equal(trialState(p,row,'freeze').status,'completed');let calls=0;
 const saved=await executeRow({directory:p,row,manifest:{digest:'freeze'},makeClient(){calls++;throw Error('must not run');}});assert.equal(saved.id,row.id);assert.equal(calls,0);
 assert.throws(()=>trialState(p,{...row,arm:'host-envelope'},'freeze'),/binding drift/);
 writeFileSync(join(root,'result.json'),'{}');assert.throws(()=>trialState(p,row,'freeze'),/binding drift/);
});
test('unfinished reservation is never automatically dispatched again',t=>{const p=setup(t),root=join(p,row.id);mkdirSync(root);save(join(root,'started.json'),{row,freeze_digest:'x'});assert.throws(()=>trialState(p,row,'x'),/no redispatch/);});
test('physical caps include failures; retries and unknown kinds are rejected',()=>{
 assert.deepEqual(checkCounts([{kind:'model',status:503},{kind:'tokenizer',status:200}],row),{models:1,tokens:1});
 assert.throws(()=>checkCounts(Array.from({length:row.maximum_model_attempts+1},()=>({kind:'model'})),row),/cap/);
 assert.throws(()=>checkCounts([{kind:'model',automatic_retries:1}],row),/retry/);
 assert.throws(()=>checkCounts([{kind:'unrecognized'}],row),/cap/);
});
test('freeze pins exact schedule and sources; changed schedule blocks dispatch',t=>{const p=setup(t),f=join(p,'freeze');freeze(f);assert.ok(verifyFreeze(f).digest);writeFileSync(join(f,'schedule.json'),'[]');assert.throws(()=>verifyFreeze(f),/artifact drift/);});
test('live calibration evidence binds paired representative prompts with equal measured counts',()=>{
 const dir=new URL('calibration/',import.meta.url),r=JSON.parse(readFileSync(new URL('result.json',dir)));assert.equal(r.model_calls,0);assert.equal(r.receipts.length,6);
 for(const c of r.calibrations){assert.equal(c.matched,true);const pair=r.receipts.filter(x=>x.label.startsWith(c.family+'/'));assert.equal(pair[0].tokens,pair.at(-1).tokens);assert.equal(pair[0].tokens,c.full_request_tokens);}
 for(const x of r.receipts)assert.equal(sha(readFileSync(new URL(`request-${x.index}.json`,dir))),x.request_sha256);
});
test('runner interruption records spent attempts and prevents a second dispatch',async t=>{
 const p=setup(t),f=join(p,'freeze'),directory=join(p,'run');const manifest=freeze(f);mkdirSync(directory);
 let calls=0;const args={directory,row,frozen:f,manifest,credential:{registry:{},reference:'test'},makeClient(){calls++;return {receipts:[{kind:'model',status:503}]};},async runAgent(){throw Error('simulated interrupted dispatch');}};
 await assert.rejects(executeRow(args),/simulated interrupted dispatch/);
 assert.equal(JSON.parse(readFileSync(join(directory,row.id,'interrupted.json'))).receipts.length,1);
 await assert.rejects(executeRow(args),/no redispatch/);assert.equal(calls,1);
});
