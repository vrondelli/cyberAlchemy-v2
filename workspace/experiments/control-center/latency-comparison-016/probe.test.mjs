import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {installProbe} from './probe.mjs';
test('captures distinct timer/frame gaps and cleans up without unsupported long-task claims',()=>{
  let now=0,frame,timer,cancelled=false,cleared=false;
  const context={window:{},document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},
    performance:{now:()=>now,timeOrigin:1000,getEntriesByType:()=>[]},
    requestAnimationFrame:fn=>{frame=fn;return 1;},cancelAnimationFrame:()=>{cancelled=true;},
    setInterval:fn=>{timer=fn;return 2;},clearInterval:()=>{cleared=true;}};
  runInNewContext('('+installProbe.toString()+')()',context);
  now=20;timer();now=230;frame();
  const r=context.window.__WLC016__.finish();
  assert.equal(r.frames[0].gap,230);assert.equal(r.timers[0].gap,20);
  assert.equal(r.longTaskSupported,false);assert.equal(r.evidence_mode,'instrumented-diagnostic');
  assert.ok(cancelled&&cleared);
});
