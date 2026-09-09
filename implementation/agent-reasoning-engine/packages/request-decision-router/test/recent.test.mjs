import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {loadVerifiedDecisionProfile,routeRequest as routeRequestWithoutDefaults,admitDecisionProfile} from '../index.mjs';
import {semanticModulePort} from './semantic-module-fixture.mjs';

const root=fileURLToPath(new URL('../../../../../../',import.meta.url));
const profilePath=fileURLToPath(new URL('../profiles/cyberalchemy-v1.json',import.meta.url));
const loaded=loadVerifiedDecisionProfile(profilePath,root);
assert.equal(loaded.ok,true,loaded.reason_codes?.join(','));
const modulePort=semanticModulePort();
const routeRequest=(input,profile)=>routeRequestWithoutDefaults(input,profile,modulePort);
const context=(raw_request,objective_kind=null,requested_effects=[])=>({schema_version:'are.request-context/v1',request_id:'recent-regression',raw_request,objective_kind,requested_effects,target_refs:[],constraints:[],evidence_refs:['user']});
test('RECENT covers declared query phrases under explicit read-only intent',()=>{
  const policy=loaded.value.routes.find(r=>r.route_id==='CA2-ROUTE-RECENT');
  assert.deepEqual(policy.effect_classes,['local-read']);assert.equal(policy.owner_gate_ref,null);
  const registry=JSON.parse(readFileSync(root+'/cyberAlchemy-v2/agent-routing/routes.json'));
  for(const phrase of registry.routes.find(r=>r.route_id===policy.route_id).match){
    const result=routeRequest(context(phrase,'recent-context'),loaded.value);
    assert.equal(result.kind,'direct',phrase);assert.equal(result.selected.route_id,policy.route_id,phrase);
  }
});
test('committed does not collapse into the publication command commit',()=>{
  const selected=routeRequest(context('recent committed files'),loaded.value);
  assert.equal(selected.kind,'direct');
  assert.equal(selected.selected.route_id,'CA2-ROUTE-RECENT');
  assert.deepEqual(selected.candidates,['CA2-ROUTE-RECENT']);
  for(const phrase of ['recent changes in a project','recover recent repository context','what changed recently']) {
    const result=routeRequest(context(phrase),loaded.value);
    assert.equal(result.kind,'direct');assert.equal(result.selected.route_id,'CA2-ROUTE-RECENT');
  }
});
test('explicit recent objectives select the query route',()=>{
  for(const objective of ['recent-context','recent-changes']){
    const result=routeRequest(context('Show this project history',objective),loaded.value);
    assert.equal(result.kind,'direct');assert.equal(result.selected.route_id,'CA2-ROUTE-RECENT');
  }
});
test('recent query cannot carry publication, mutation or external effects',()=>{
  for(const effect of ['publication','implementation','persistent-mutation','external-effect']){
    assert.notEqual(routeRequest(context('recent changes in a project','recent-context',[effect]),loaded.value).kind,'direct');
  }
});
test('cache refresh and hook installation cannot use the read-only route',()=>{
  for(const phrase of ['recent changes in a project with cache refresh','recent changes in a project with hook installation']){
    assert.notEqual(routeRequest(context(phrase,'recent-context'),loaded.value).kind,'direct');
  }
});
test('negated recent query has no fallback',()=>{
  assert.equal(routeRequest(context('Do not recover recent repository context.'),loaded.value).kind,'block');
});
test('RECENT policy tampering invalidates the digest',()=>{
  const profile=JSON.parse(readFileSync(profilePath));
  profile.route_policies.find(p=>p.route_id==='CA2-ROUTE-RECENT').effect_classes.push('persistent-mutation');
  assert.equal(admitDecisionProfile(profile).ok,false);
});
