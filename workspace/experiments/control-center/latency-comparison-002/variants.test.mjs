import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scheduleAfterHandshake,measureHandshake,receipts} from './startup-probe.ts';
import {validateRows} from '../latency-comparison-001/register.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
function pending(){let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};}
test('warmup waits for handshake, starts once and cancels scheduled work',async()=>{
  const ready=pending();let fallback,started=0,cleaned=0;
  const stop=scheduleAfterHandshake(()=>{started++;return ()=>cleaned++;},ready.promise,{set:fn=>{fallback=fn;return 1;},clear:()=>{}});
  assert.equal(started,0);ready.resolve();await Promise.resolve();
  fallback();assert.equal(started,1);stop();assert.equal(cleaned,1);
});
test('unmount before settlement prevents warmup, including strict-mode replay',async()=>{
  const ready=pending();let started=0;
  const timers={set:()=>1,clear:()=>{}};
  const old=scheduleAfterHandshake(()=>{started++;return ()=>{};},ready.promise,timers);old();
  const current=scheduleAfterHandshake(()=>{started++;return ()=>{};},ready.promise,timers);
  ready.resolve();await Promise.resolve();assert.equal(started,1);current();
});
test('bounded fallback warms web/error paths without waiting forever',async()=>{
  const ready=pending();let fallback,started=0;
  const stop=scheduleAfterHandshake(()=>{started++;return ()=>{};},ready.promise,{set:fn=>{fallback=fn;return 1;},clear:()=>{}});
  fallback();assert.equal(started,1);ready.resolve();await Promise.resolve();assert.equal(started,1);stop();
});
test('both overlays use identical bridge and performance instrumentation',()=>{
  assert.equal(read('baseline/are-chat-bridge.ts'),read('treatment/are-chat-bridge.ts'));
  assert.equal(read('baseline/performance.ts'),read('treatment/performance.ts'));
  const baseline=read('baseline/WorkspaceApp.tsx'),treatment=read('treatment/WorkspaceApp.tsx');
  const normalized=treatment.replace('import { scheduleAfterHandshake } from "wlc-startup-probe";\n','')
    .replace('    return scheduleAfterHandshake(() => {\n','').replace('\n    });\n  }, []);','\n  }, []);');
  assert.equal(normalized,baseline);
});
test('integrated probe preserves status result, frame wait and error identity',async()=>{
  const old=globalThis.requestAnimationFrame;let frame;
  globalThis.requestAnimationFrame=cb=>{frame=cb;return 1;};
  try{
    const n=receipts.length;let done=false;
    const value={prewarmed:false};
    const promise=measureHandshake(async()=>value).then(r=>{done=true;return r;});
    await Promise.resolve();assert.equal(done,false);frame(0);
    assert.equal(await promise,value);
    assert.equal(validateRows(JSON.stringify(receipts.at(-1))).ok,true);assert.equal(receipts.length,n+1);
    const error=Error('native failure');
    await assert.rejects(measureHandshake(async()=>{throw error;}),e=>e===error);
    assert.equal(receipts.length,n+1);
  }finally{if(old===undefined)delete globalThis.requestAnimationFrame;else globalThis.requestAnimationFrame=old;}
});
