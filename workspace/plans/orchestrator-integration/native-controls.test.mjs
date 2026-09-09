import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nativeCapabilities,offlineCapabilities} from './native-controls.mjs';
// Open questions: PLAN.md#open-questions.
const raw={mode:'native-fixture',fixture_budget_remaining:3,active:false,blocked_reason:null,jobs:[]};
test('read-only installation cannot advertise controls',()=>{const cap=nativeCapabilities(raw,'local',false);assert.equal(cap.canLaunch,false);assert.deepEqual(cap.cancelLaunchIds,[]);});
test('ready native owner advertises bounded review and launch',()=>{const cap=nativeCapabilities(raw,'local',true);assert.equal(cap.canReview,true);assert.equal(cap.remaining,3);assert.equal(cap.runtimeId,'local');});
test('busy, reconciliation and exhausted states block new launch',()=>{
 for(const change of [{active:true},{blocked_reason:'Uncertain run'},{fixture_budget_remaining:0}]){const cap=nativeCapabilities({...raw,...change},'local',true);assert.equal(cap.canReview,false);assert.equal(cap.canLaunch,false);}
});
test('only nonterminal jobs advertise cancellation',()=>{
 const cap=nativeCapabilities({...raw,active:true,jobs:['preparing','running','cancelling','cancelled','succeeded','uncertain'].map(status=>({id:status,status}))},'local',true);
 assert.deepEqual(cap.cancelLaunchIds,['preparing','running','cancelling']);
});
test('offline clears all actionable observations',()=>{const cap=offlineCapabilities('local',true);assert.equal(cap.state,null);assert.equal(cap.remaining,null);assert.equal(cap.canLaunch,false);assert.deepEqual(cap.cancelLaunchIds,[]);});
test('unexpected mode and malformed capability state fail closed',()=>{
 for(const change of [{mode:'live'},{fixture_budget_remaining:-1},{active:1},{jobs:null}])assert.throws(()=>nativeCapabilities({...raw,...change},'local',true));
});
