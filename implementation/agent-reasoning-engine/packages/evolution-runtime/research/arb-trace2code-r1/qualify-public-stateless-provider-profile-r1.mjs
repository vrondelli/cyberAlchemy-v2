// Exclusive offline qualification; no labels, providers, credentials or deploy.
// Open Questions: evidence/G01-PUBLIC-STATELESS-PROVIDER-PROFILE-R1.json.
import assert from 'node:assert/strict';import {readFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
import {buildPublicStatelessRelaySource,BASE_RELAY_SHA} from '../g02-product-r4/public-stateless-provider-profile-r1.mjs';
import {hash} from '../g02-product-r4/vps-json-provider-r1.mjs';
const HERE=dirname(fileURLToPath(import.meta.url));
const ROOT='/home/vlad_/are-benchmark-archive/g01-public-stateless-provider-profile-r1-20261007';
const ANCESTOR='/home/vlad_/are-benchmark-archive/g01-native-method-live-r7-20261007';
const profile=resolve(HERE,'../g02-product-r4/public-stateless-provider-profile-r1.mjs');
const test=resolve(HERE,'../g02-product-r4/public-stateless-provider-profile-r1.test.mjs');
const priorTest=resolve(HERE,'../g02-product-r4/vps-json-provider-r1.test.mjs');
const protocol=resolve(HERE,'../../evidence/G01-PUBLIC-STATELESS-PROVIDER-PROFILE-R1.json');
assert.equal(process.argv.length,2);assert.equal(existsSync(ROOT),false,'no qualification replay');
const pins={};function trace(p){if(pins[p])return;const bytes=readFileSync(p);pins[p]=hash(bytes);
 for(const m of bytes.toString('utf8').matchAll(/\b(?:import|export)\s+[^;\n]*?\sfrom\s+['"](\.[^'"]+)['"]/g))trace(resolve(dirname(p),m[1]));}
for(const p of [fileURLToPath(import.meta.url),profile,test,priorTest,protocol])trace(p);
const priorFreeze=JSON.parse(readFileSync(join(ANCESTOR,'FREEZE.json')));
const checkAncestor=()=>{for(const[p,pin]of Object.entries(priorFreeze.source_pins))assert.equal(hash(readFileSync(p)),pin);};checkAncestor();
const result=JSON.parse(readFileSync(join(ANCESTOR,'RESULT.json'))),inputPins={};
for(const row of result.rows){const dir=join(ANCESTOR,row.cell,'requests');
 for(const name of readdirSync(dir).filter(n=>/^\d+-STARTED\.json$/.test(n))){const p=join(dir,name);inputPins[p]=hash(readFileSync(p));}}
assert.equal(Object.keys(inputPins).length,144);
const lineagePins=Object.fromEntries(['FREEZE.json','RESULT.json','AUDIT.json','PREDICTION-SEAL.json'].map(n=>[join(ANCESTOR,n),hash(readFileSync(join(ANCESTOR,n)))]));
const generatedSource=buildPublicStatelessRelaySource(),started=new Date().toISOString();
mkdirSync(ROOT,{mode:0o700});createReceipt(join(ROOT,'FREEZE.json'),{
 status:'frozen-before-offline-qualification',source_pins:pins,public_input_pins:inputPins,ancestor_receipt_pins:lineagePins,
 base_relay_sha256:BASE_RELAY_SHA,generated_relay_sha256:hash(generatedSource),protocol:JSON.parse(readFileSync(protocol)),
 actual_provider_calls:0,labels_read:false,authority_effect:'none'});
const freezeHash=hash(readFileSync(join(ROOT,'FREEZE.json')));let status='offline-profile-qualified',error=null,tests=0;
try{const output=execFileSync(process.execPath,['--test',test,priorTest],{encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024});
 tests=Number(output.match(/(?:ℹ|#) tests (\d+)/)?.[1]);assert.equal(tests,16);
 for(const[p,pin]of Object.entries({...pins,...inputPins,...lineagePins}))assert.equal(hash(readFileSync(p)),pin);checkAncestor();
}catch{status='offline-profile-qualification-failed';error='offline-test-or-pin-verification-failed';}
const receipt={status,freeze_sha256:freezeHash,started_at:started,finished_at:new Date().toISOString(),tests,
 source_pins_verified:Object.keys(pins).length,public_inputs_verified:Object.keys(inputPins).length,
 ancestor_source_pins_verified:Object.keys(priorFreeze.source_pins).length,generated_relay_sha256:hash(generatedSource),
 actual_provider_calls:0,labels_read:false,deployed:false,error,authority_effect:'none',
 claim_ceiling:'Offline parity/privacy qualification only; no quality or reliability improvement measured',
 open_questions_owner:'G01-PUBLIC-STATELESS-PROVIDER-PROFILE-R1.json'};
createReceipt(join(ROOT,'RESULT.json'),receipt);console.log(JSON.stringify({...receipt,result_sha256:hash(readFileSync(join(ROOT,'RESULT.json')))}));
if(error)process.exitCode=2;
