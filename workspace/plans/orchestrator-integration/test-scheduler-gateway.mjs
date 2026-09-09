// Candidate gateway tests; no provider or installed-state effects. Open questions: T6C3-INTEGRATION.md.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSchedulerFixture} from './scheduler-fixture.mjs';
import {schedulerGateway} from './scheduler-gateway.mjs';
test('shared-owner observations, targeted controls and offline retention',async()=>{
 const f=await createSchedulerFixture();
 try{
  const load=async()=>await(await fetch(f.app.origin+'/api/v1/workspace/runs')).json();
  const call=(action,body={},origin=f.app.origin)=>fetch(f.app.origin+'/api/v1/workspace/runtimes/shared-main/scheduler-runs/'+f.key+'/'+action,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Workspace-Intent':'scheduler-run'},body:JSON.stringify(body)});
  let view=await load();assert.deepEqual(view.errors,[]);assert.equal(view.projection.sources.length,2);
  let run=view.projection.runs[0];assert.equal(run.icon,'text-task');assert.equal(run.mode,'fixture');assert.equal(run.execution,'running');assert.deepEqual(run.actions,['cancel']);
  assert.equal((await call('cancel',{},'https://wrong.example')).status,403);
  assert.equal((await call('cancel',{socket_path:'/injected'})).status,400);
  assert.equal((await call('reconcile-stop')).status,409);assert.equal(f.calls.length,0);
  assert.equal((await call('cancel')).status,200);assert.deepEqual(f.calls[0],{path:'/api/v1/runs/'+f.key+'/cancel',origin:'https://fixture.example',intent:'cancel-native-run',body:{}});
  view=await load();assert.equal(view.projection.runs[0].execution,'uncertain');assert.deepEqual(view.projection.runs[0].actions,['reconcile-stop']);
  assert.equal((await call('reconcile-stop')).status,200);assert.deepEqual((await load()).projection.runs[0].actions,[]);
  f.run.native_execution.phase='succeeded';f.run.status='closed';f.run.graph={completed:1,running:0,pending:0,blocked:0,total:1};f.run.result={status:'available',kind:'fixture-text',content:'Verified by the owner'};
  view=await load();assert.equal(view.projection.runs[0].execution,'succeeded');assert.equal(view.projection.runs[0].result.verification,'source-reported');
  f.setOnline(false);view=await load();assert.equal(view.controls.scheduler.available,false);assert.equal(view.projection.runs[0].source.freshness,'offline');assert.deepEqual(view.projection.runs[0].actions,[]);assert.equal(view.projection.runs[0].result.content,'Verified by the owner');
 }finally{await f.close();}
});
test('scheduler connection requires an explicit loopback origin',()=>{
 assert.throws(()=>schedulerGateway({runtime_id:'main',origin:'https://other.example',public_origin:'https://fixture.example',controls_enabled:true}));
});
