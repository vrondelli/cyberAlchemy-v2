import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {buildMemory,memoryContext} from './context.mjs';
import {reserveCost,checkBudget,scoreFinding} from './lib.mjs';
const load=n=>JSON.parse(readFileSync(new URL(n,import.meta.url),'utf8'));
const task=load('task.json'),budget=load('budget.json'),rubric=load('rubric.json');
test('call count, balanced oracle and conservative reservation fit reported balance',()=>{
 assert.equal(task.checkpoints.length*task.arms.length*task.passes.length,48);
 assert.equal(Object.values(rubric).filter(r=>r.verdict==='supported').length,6);
 const total=48*reserveCost(task.max_request_bytes,task,budget);
 assert.ok(Math.abs(total-3.370752)<1e-8);assert.ok(total<budget.experiment_cap);
 assert.throws(()=>reserveCost(200001,task,budget));assert.throws(()=>checkBudget(7.99,0,0.02,budget));assert.throws(()=>checkBudget(0,3.99,0.02,budget));assert.throws(()=>checkBudget(NaN,0,0.02,budget));
});
test('source citations must match exact allowed path, line and quote; verdict alone is insufficient',()=>{
 const rule={verdict:'supported',sources:['a']},files={a:'one\ntwo'};
 const good={verdict:'supported',citations:[{path:'a',line:2,quote:'two'}]};assert.equal(scoreFinding(good,rule,files).passed,true);
 for(const citation of [{path:'a',line:1,quote:'two'},{path:'b',line:2,quote:'two'},{path:'a',line:2,quote:''},{path:'a',line:2,quote:'invented'}])assert.equal(scoreFinding({...good,citations:[citation]},rule,files).passed,false);
 assert.equal(scoreFinding({...good,verdict:'refuted'},rule,files).passed,false);
});
test('actual ARE projection selects applicable audit rules; summary retains equal source information',()=>{
 const state=buildMemory(),snapshot=JSON.stringify(state);assert.equal(Object.keys(state.lessons).length,3);
 for(const request of ['Audit runtime checkpoint','Audit evidence checkpoint']){
  const projection=JSON.parse(memoryContext(state,'are',request));assert.equal(projection.items.length,2);
  const summary=memoryContext(state,'summary',request);
  for(const item of projection.items){assert.ok(summary.includes(item.instruction));assert.ok(summary.includes(item.source_ref));}
 }
 assert.equal(JSON.stringify(state),snapshot);
});
test('source packets plus maximum retained notes leave room below the request cap',()=>{
 const root=resolve(import.meta.dirname,'../../../../../../..');
 for(const c of task.checkpoints){const bytes=c.sources.reduce((n,p)=>n+Buffer.byteLength(readFileSync(resolve(root,p),'utf8'))*1.6,0);
  assert.ok(bytes+12*2000+40000<task.max_request_bytes,c.id);
 }
});
