// Exclusive offline binding qualification; no actual VPS/provider calls or labels.
// Open Questions: evidence/G01-PUBLIC-STATELESS-PROVIDER-BINDING-R1.json.
import assert from 'node:assert/strict';import {readFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';import {hash} from '../g02-product-r4/vps-json-provider-r1.mjs';
import {RELAY_PATH,RELAY_SHA,buildPublicStatelessMuxSource} from '../g02-product-r4/public-stateless-provider-binding-r1.mjs';
const HERE=dirname(fileURLToPath(import.meta.url));
const ROOT='/home/vlad_/are-benchmark-archive/g01-public-stateless-provider-binding-r1-20261007';
const PRIOR='/home/vlad_/are-benchmark-archive/g01-public-stateless-provider-profile-r1-20261007';
const ANCESTOR='/home/vlad_/are-benchmark-archive/g01-native-method-live-r7-20261007';
const priorFreezeHash='53ef65c7ba4a67b5a95a54c21f06696c93b8781fa34e1fde9b377636c1052532';
const priorResultHash='da513fb5b1f59dbba79a422a063bebc7916a05aaa2e8ee7001d250eb28828e82';
assert.equal(process.argv.length,2);assert.equal(existsSync(ROOT),false,'no qualification replay');
assert.equal(hash(readFileSync(join(PRIOR,'FREEZE.json'))),priorFreezeHash);
assert.equal(hash(readFileSync(join(PRIOR,'RESULT.json'))),priorResultHash);
const priorFreeze=JSON.parse(readFileSync(join(PRIOR,'FREEZE.json'))),priorResult=JSON.parse(readFileSync(join(PRIOR,'RESULT.json')));
assert.equal(priorResult.status,'offline-profile-qualified');assert.equal(priorResult.actual_provider_calls,0);
assert.equal(priorResult.generated_relay_sha256,RELAY_SHA);
const ancestorFreeze=JSON.parse(readFileSync(join(ANCESTOR,'FREEZE.json')));
const verify=map=>{for(const[p,pin]of Object.entries(map))assert.equal(hash(readFileSync(p)),pin);};
const checkPrior=()=>{for(const field of ['source_pins','public_input_pins','ancestor_receipt_pins'])verify(priorFreeze[field]);verify(ancestorFreeze.source_pins);};checkPrior();
const tests=['public-stateless-provider-binding-r1.test.mjs','public-stateless-provider-profile-r1.test.mjs',
 'wsl-vps-provider-multiplexed-r2.test.mjs','vps-json-provider-r1.test.mjs'].map(n=>resolve(HERE,'../g02-product-r4',n));
const protocol=resolve(HERE,'../../evidence/G01-PUBLIC-STATELESS-PROVIDER-BINDING-R1.json');
const pins={};function trace(p){if(pins[p])return;const bytes=readFileSync(p);pins[p]=hash(bytes);
 for(const m of bytes.toString('utf8').matchAll(/\b(?:import|export)\s+[^;\n]*?\sfrom\s+['"](\.[^'"]+)['"]/g))trace(resolve(dirname(p),m[1]));}
for(const p of [fileURLToPath(import.meta.url),protocol,...tests])trace(p);
const priorPins={[join(PRIOR,'FREEZE.json')]:priorFreezeHash,[join(PRIOR,'RESULT.json')]:priorResultHash};
mkdirSync(ROOT,{mode:0o700});createReceipt(join(ROOT,'FREEZE.json'),{
 status:'frozen-before-offline-binding-qualification',source_pins:pins,prior_qualification_pins:priorPins,
 generated_mux_sha256:hash(buildPublicStatelessMuxSource()),relay_path:RELAY_PATH,relay_sha256:RELAY_SHA,
 protocol:JSON.parse(readFileSync(protocol)),actual_provider_calls:0,labels_read:false,authority_effect:'none'});
const freezeHash=hash(readFileSync(join(ROOT,'FREEZE.json'))),started=new Date().toISOString();
let status='offline-profile-binding-qualified',error=null,testCount=0;
try{const output=execFileSync(process.execPath,['--test',...tests],{encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024});
 testCount=Number(output.match(/(?:ℹ|#) tests (\d+)/)?.[1]);assert.equal(testCount,28);verify(pins);verify(priorPins);checkPrior();
}catch{status='offline-profile-binding-qualification-failed';error='offline-test-or-pin-verification-failed';}
const receipt={status,freeze_sha256:freezeHash,started_at:started,finished_at:new Date().toISOString(),tests:testCount,
 source_pins_verified:Object.keys(pins).length,prior_profile_source_pins_verified:Object.keys(priorFreeze.source_pins).length,
 prior_public_input_pins_verified:Object.keys(priorFreeze.public_input_pins).length,
 ancestor_source_pins_verified:Object.keys(ancestorFreeze.source_pins).length,
 generated_mux_sha256:hash(buildPublicStatelessMuxSource()),relay_path:RELAY_PATH,relay_sha256:RELAY_SHA,
 actual_provider_calls:0,labels_read:false,provisioned:false,error,authority_effect:'none',
 claim_ceiling:'Offline body/reply/SSH binding only; no actual provider reliability or ranking improvement',
 open_questions_owner:'G01-PUBLIC-STATELESS-PROVIDER-BINDING-R1.json'};
createReceipt(join(ROOT,'RESULT.json'),receipt);console.log(JSON.stringify({...receipt,result_sha256:hash(readFileSync(join(ROOT,'RESULT.json')))}));
if(error)process.exitCode=2;
