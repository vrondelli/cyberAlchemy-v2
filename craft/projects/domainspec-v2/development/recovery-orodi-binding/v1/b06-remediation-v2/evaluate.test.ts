import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { evaluateVerifiedRecoveryProductTest, type VerifiedContext } from './evaluate.js';
import { type RecoveryBundle } from '../../../../impl/operational-resilience/contracts/recovery-product-test.js';
import { normalizeRecoveryEvidence, recoveryDocument, type AdapterInputs } from '../../../../impl/operational-resilience/src/recovery-evidence-adapter.js';
import { recoveryBindingDigest, canonicalRecoveryJson, recoverySha256 } from '../../../../impl/operational-resilience/src/evaluate-recovery-product-test.js';
const read = (name: string) => JSON.parse(readFileSync(new URL('../b05-v1/'+name,import.meta.url),'utf8'));
function fixture() {
 const bundle: RecoveryBundle=read('bundle.json');const pins=read('normalization.json').pins;
 const references=Object.fromEntries(['manifest','sourceManifest','scenarioMap','matrix','results'].map(k=>[k,bundle.documents.find(d=>d.reference.sha256===pins[k])!.reference]));
 Object.assign(references,{producer:bundle.binding.references.producer,observer:bundle.binding.references.observer});
 const context:VerifiedContext={binding_digest:recoveryBindingDigest(bundle.binding),evaluated_at:read('evaluation.json').evaluated_at,provenance:{mode:'fresh',references:references as VerifiedContext['provenance']['references'],pins}};
 return {bundle,context};
}
const evaluate=(f:ReturnType<typeof fixture>)=>evaluateVerifiedRecoveryProductTest(JSON.stringify(f.bundle),f.context);
function changeNormalized(f:ReturnType<typeof fixture>,change:(value:any)=>void){
 const d=f.bundle.documents.find(d=>d.reference.ref.startsWith('domainspec.orodi.recovery-normalized/'))!;
 const old=d.reference.sha256;const value=JSON.parse(d.content);change(value);d.content=canonicalRecoveryJson(value);d.reference={...d.reference,sha256:recoverySha256(d.content)};
 for(const r of f.bundle.records)if(r.source.sha256===old)r.source=d.reference;
}
function reject(f:ReturnType<typeof fixture>){const r=evaluate(f);assert.equal(r.state,'invalid');assert.equal(r.provenance_verified,false);assert.ok(r.assertion_receipts.every(x=>x.state==='invalid'));}
test('verified replay preserves 60 passes, unknown and formation-only outcomes',()=>{const r=evaluate(fixture());assert.equal(r.state,'passed');assert.equal(r.provenance_verified,true);assert.equal(r.assertion_receipts.filter(x=>x.state==='passed').length,60);assert.equal(r.assertion_receipts.filter(x=>x.original_runtime_outcome==='unknown').length,18);assert.ok(r.assertion_receipts.filter(x=>x.scenario_id==='R01-F26').every(x=>x.original_runtime_outcome===null));});
test('B06-F01: missing raw results rejects',()=>{const f=fixture();f.bundle.documents=f.bundle.documents.filter(d=>d.reference.sha256!==f.context.provenance.pins.results);reject(f);});
test('B06-F01: absent raw links and contradictory FAIL reject after rehash',()=>{const f=fixture();changeNormalized(f,v=>{for(const a of v.assertions){a.original_result='FAIL';a.raw_source={ref:'absent',version:'1',sha256:'0'.repeat(64)};a.raw_pointer='/absent';}});reject(f);});
test('B06-F02: repetition-two pointers reuse repetition one',()=>{const f=fixture();for(const r of f.bundle.records.filter(r=>r.repetition===2))r.pointer=f.bundle.records.find(x=>x.scenario_id===r.scenario_id&&x.repetition===1)!.pointer;reject(f);});
test('scenario pointer substitution rejects',()=>{const f=fixture();f.bundle.records[0].pointer=f.bundle.records[1].pointer;reject(f);});
test('capture metadata substitution rejects',()=>{const f=fixture();f.bundle.records[0].capture_started_at_utc=f.bundle.records[1].capture_started_at_utc;reject(f);});
test('invented runtime outcome rejects after rehash',()=>{const f=fixture();changeNormalized(f,v=>{v.assertions[0].runtime_outcome='invented';});reject(f);});
test('raw results replacement rejects against trusted pins',()=>{const f=fixture();const d=f.bundle.documents.find(d=>d.reference.sha256===f.context.provenance.pins.results)!;const v=JSON.parse(d.content);v.runs[0].result='FAIL';d.content=canonicalRecoveryJson(v);d.reference={...d.reference,sha256:recoverySha256(d.content)};reject(f);});
test('missing context fails closed',()=>{const f=fixture();delete (f.context as Partial<VerifiedContext>).provenance;reject(f);});
test('malformed context fails closed',()=>{const f=fixture();f.context.provenance.references=null as any;reject(f);});
test('duplicate raw document rejects',()=>{const f=fixture();f.bundle.documents.push(f.bundle.documents.find(d=>d.reference.sha256===f.context.provenance.pins.results)!);reject(f);});
test('historical adapter cannot establish fresh claim',()=>{const f=fixture();f.context.provenance.mode='historical';reject(f);});
test('valid provenance does not suppress expiry',()=>{const f=fixture();f.context.evaluated_at=f.bundle.binding.expires_at;const r=evaluate(f);assert.equal(r.state,'stale');assert.equal(r.provenance_verified,true);});
test('valid provenance does not suppress changed binding',()=>{const f=fixture();f.context.binding_digest='0'.repeat(64);assert.equal(evaluate(f).state,'stale');});
// Explicitly select NEW raw pins to check honest partial/failed campaign handling.
for(const mode of ['missing','failed'] as const)test('re-normalization preserves '+mode,()=>{
 const f=fixture();const refs=f.context.provenance.references;const input={mode:'fresh'} as AdapterInputs;
 for(const k of Object.keys(refs) as (keyof typeof refs)[])input[k]=f.bundle.documents.find(d=>canonicalRecoveryJson(d.reference)===canonicalRecoveryJson(refs[k]))!;
 const raw=JSON.parse(input.results.content);if(mode==='missing')raw.runs.pop();else raw.runs[0].result='FAIL';
 input.results=recoveryDocument(input.results.reference.ref,raw);refs.results=input.results.reference;f.context.provenance.pins.results=input.results.reference.sha256;
 const rebuilt=normalizeRecoveryEvidence(input,f.context.provenance.pins);assert.equal(rebuilt.status,'normalized');if(rebuilt.status!=='normalized')throw Error('adapter rejected');
 f.bundle.documents=f.bundle.documents.filter(d=>!d.reference.ref.startsWith('domainspec.orodi.recovery-normalized/')&&d.reference.ref!==input.results.reference.ref);
 f.bundle.documents.push(input.results,rebuilt.normalizedDocument);f.bundle.records=rebuilt.records;
 const r=evaluate(f);assert.equal(r.provenance_verified,true);assert.equal(r.state,mode);assert.equal(r.assertion_receipts.filter(x=>x.state==='passed').length,59);
});
