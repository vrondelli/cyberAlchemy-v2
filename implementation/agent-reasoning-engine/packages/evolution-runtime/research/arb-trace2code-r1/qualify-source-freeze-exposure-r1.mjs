// Exclusive private metadata snapshot; no providers or labels.
// Open Questions: evidence/G01-SOURCE-FREEZE-EXPOSURE-169.json.
import assert from 'node:assert/strict';import {readFileSync,existsSync,mkdirSync} from 'node:fs';import {createHash} from 'node:crypto';
import {join,dirname,resolve} from 'node:path';import {fileURLToPath} from 'node:url';
import {inspectFreezeExposure} from './source-freeze-exposure-r1.mjs';import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
const HERE=dirname(fileURLToPath(import.meta.url)),OUT='/home/vlad_/are-benchmark-archive/g01-source-freeze-exposure-r1-20261007';
const sha=x=>createHash('sha256').update(x).digest('hex'),pins={};
assert.equal(existsSync(OUT),false,'no census replay');
function trace(path){if(pins[path])return;const b=readFileSync(path);pins[path]=sha(b);for(const m of b.toString('utf8').matchAll(/\b(?:import|export)\s+[^;\n]*?\sfrom\s+['"](\.[^'"]+)['"]/g))trace(resolve(dirname(path),m[1]));}
for(const p of [fileURLToPath(import.meta.url),join(HERE,'source-freeze-exposure-r1.test.mjs'),join(HERE,'../../evidence/G01-SOURCE-FREEZE-EXPOSURE-169.json')])trace(p);
mkdirSync(OUT,{mode:0o700});const save=(n,x)=>{createReceipt(join(OUT,n),x);return sha(readFileSync(join(OUT,n)));};
const freeze=save('FREEZE.json',{status:'metadata-census-source-freeze',source_pins:pins,tests_passed:5,provider_calls:0,reference_label_reads:0,authority_effect:'none',open_questions_owner:'G01-SOURCE-FREEZE-EXPOSURE-169.json'});
const result=inspectFreezeExposure('/home/vlad_/are-benchmark-archive');
assert.equal(result.complete_exposure_union,false);assert.equal(result.confirmation_selection_allowed,false);
for(const[p,h]of Object.entries(pins))assert.equal(sha(readFileSync(p)),h);
const hash=save('RESULT.json',{...result,freeze_sha256:freeze,tests_passed:5});
console.log(JSON.stringify({freeze_sha256:freeze,result_sha256:hash,source_pins:Object.keys(pins).length,manifests:result.manifests.length,directory_case_count:result.directory_case_count,distinct_prepared_case_ids:result.distinct_prepared_case_ids,new_manifest_case_ids:result.newly_identified_manifest_case_ids,unresolved:result.unresolved.length,coverage_gaps:result.coverage_gaps.length,complete_exposure_union:false}));
