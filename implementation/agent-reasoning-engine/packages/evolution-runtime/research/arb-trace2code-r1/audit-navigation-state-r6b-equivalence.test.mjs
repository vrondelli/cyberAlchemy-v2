// Serialized-domain correction only; no campaign/model/label changes.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R6-SUPPLEMENTAL-AUDIT.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
test('r6b helper changes only prototype comparison to exact canonical JSON comparison',()=>{
 const before="assert.deepEqual(actual,saved,'state must reconstruct from prior confirmed delivery');";
 const after="assert.equal(stable(actual),stable(saved),'state JSON must reconstruct from prior confirmed delivery');";
 const original=read('audit-navigation-state-r6.mjs');assert.equal(original.split(before).length,2);
 assert.equal(read('audit-navigation-state-r6b.mjs'),original.replace(before,()=>after));
});
test('r6b auditor preserves original checks with separate immutable supplemental pins and exclusive receipt',()=>{
 let original=read('audit-native-method-live-r6.mjs').replace("'./audit-navigation-state-r6.mjs'","'./audit-navigation-state-r6b.mjs'")
  .replace("join(ROOT,'AUDIT.json')","join(ROOT,'AUDIT-R6B.json')");
 original=original.replace("const ROOT='/home/vlad_/are-benchmark-archive/g01-native-method-live-r6-20261007';","const ROOT='/home/vlad_/are-benchmark-archive/g01-native-method-live-r6-20261007';\nconst SUPPLEMENT='/home/vlad_/are-benchmark-archive/g01-native-method-live-r6-supplemental-audit-r1-20261007';")
  .replace('export async function audit(){',"export async function audit(){\n const supplementBytes=readFileSync(join(SUPPLEMENT,'FREEZE.json')),supplement=JSON.parse(supplementBytes);\n assert.equal(supplement.campaign_freeze_sha256,sha(readFileSync(join(ROOT,'FREEZE.json'))));\n for(const[p,pin]of Object.entries(supplement.source_pins))assert.equal(sha(readFileSync(p)),pin);")
  .replace("const output={status:'post-seal-native-request-source-accounting-audit-passed',","const output={status:'post-seal-native-request-source-accounting-audit-passed',\n  supplemental_audit_freeze_sha256:sha(supplementBytes),\n  audit_correction:'Canonical serialized JSON equality only; original frozen auditor retained. No model-output normalization or campaign/gate changes.',");
 assert.equal(read('audit-native-method-live-r6b.mjs'),original);
});
