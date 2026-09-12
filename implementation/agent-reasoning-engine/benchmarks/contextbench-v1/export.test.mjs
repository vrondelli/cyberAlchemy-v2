import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {exportTrajectory} from './export.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
function setup(){const root=mkdtempSync(join(tmpdir(),'are-cb-test-'));const source='first\nλ second\nthird\n';writeFileSync(join(root,'a.txt'),source);const e={id:'read-1',path:'a.txt',start_line:1,end_line:1,body:'first\n',source_sha256:hash(source),delivered:true,turn:0};return {root,ledger:{schema_version:'are.context-delivery-ledger/v1',instance_id:'fixture-1',repo_url:'fixture',commit:'a'.repeat(40),events:[e,{...e,id:'read-2',start_line:2,end_line:2,body:'λ second\n',turn:1}],final_event_ids:['read-2']}};}
test('final context is selected delivered evidence, not cumulative archive',()=>{const {root,ledger}=setup();try{const x=exportTrajectory(ledger,root);assert.equal(x.prediction.traj_data.pred_steps.length,2);assert.deepEqual(x.prediction.traj_data.pred_spans,{'a.txt':[{start:2,end:2}]});assert.deepEqual(x.sidecar.final_event_ids,['read-2']);}finally{rmSync(root,{recursive:true});}});
for(const [name,change,code] of [
 ['undelivered final',x=>x.events[1].delivered=false,'final.unconfirmed-event'],
 ['missing final',x=>x.final_event_ids=[],'instrument.no-final-context'],
 ['invented body',x=>x.events[0].body='gold answer','event.body-mismatch'],
 ['source hash drift',x=>x.events[0].source_sha256='0'.repeat(64),'event.source-drift'],
 ['out of bounds',x=>x.events[0].end_line=99,'event.range'],
 ['duplicate event',x=>x.events[1].id='read-1','event.identity'],
 ['path escape',x=>x.events[0].path='../secret','event.path'],
 ['gold injection',x=>x.gold_context=[],'ledger.shape']])test(name,()=>{const {root,ledger}=setup();try{change(ledger);assert.throws(()=>exportTrajectory(ledger,root),new RegExp(code));}finally{rmSync(root,{recursive:true});}});
test('symlink escape fails',()=>{const {root,ledger}=setup();const outside=mkdtempSync(join(tmpdir(),'are-cb-outside-'));try{writeFileSync(join(outside,'x'), 'first\n');symlinkSync(join(outside,'x'),join(root,'escape'));ledger.events[0].path='escape';assert.throws(()=>exportTrajectory(ledger,root),/source-escape/);}finally{rmSync(root,{recursive:true});rmSync(outside,{recursive:true});}});
