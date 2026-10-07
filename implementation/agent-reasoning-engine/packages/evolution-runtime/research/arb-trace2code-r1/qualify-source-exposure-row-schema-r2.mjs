// Exclusive qualification of exact reported schema supplement; no providers/labels.
// Open Questions: evidence/G01-SOURCE-EXPOSURE-ROW-SCHEMA-183.json.
import assert from 'node:assert/strict';import {readFileSync,lstatSync,realpathSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import {join,dirname,resolve} from 'node:path';import {fileURLToPath} from 'node:url';
import {supplementalRowIdentity} from './source-exposure-row-schema-r2.mjs';import {createReceipt} from './atomic-campaign-receipt-r1.mjs';
const HERE=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(p));
const OUT='/home/vlad_/are-benchmark-archive/g01-source-exposure-row-schema-r2-20261007';
const PRIOR='/home/vlad_/are-benchmark-archive/g01-source-freeze-exposure-r1-20261007';
assert.equal(existsSync(OUT),false,'no qualification replay');
assert.equal(sha(readFileSync(join(PRIOR,'FREEZE.json'))),'92ce42b898dbe56114b85dbe20765d6631f807c5b7bf3d435916ecca9cca1b58');
assert.equal(sha(readFileSync(join(PRIOR,'RESULT.json'))),'11d971054ea0249d9fa8652c9a75744fb6ac7c36520ad733b5735e5f84d7514b');
const prior=read(join(PRIOR,'RESULT.json')),priorFreeze=read(join(PRIOR,'FREEZE.json')),pins={};
function trace(path){if(pins[path])return;const bytes=readFileSync(path);pins[path]=sha(bytes);for(const m of bytes.toString('utf8').matchAll(/\b(?:import|export)\s+[^;\n]*?\sfrom\s+['"](\.[^'"]+)['"]/g))trace(resolve(dirname(path),m[1]));}
for(const path of [fileURLToPath(import.meta.url),join(HERE,'source-exposure-row-schema-r2.test.mjs'),join(HERE,'source-freeze-exposure-r1.test.mjs'),join(HERE,'source-directory-exposure-r1.test.mjs')])trace(path);
for(const path of [join(HERE,'../../evidence/G01-SOURCE-EXPOSURE-ROW-SCHEMA-183.json'),join(PRIOR,'FREEZE.json'),join(PRIOR,'RESULT.json')])pins[path]=sha(readFileSync(path));
for(const[p,h]of Object.entries(priorFreeze.source_pins)){assert.equal(sha(readFileSync(p)),h);pins[p]=h;}
const selected=[...new Set(prior.unresolved.map(r=>r.archive))].map(archive=>{const m=prior.manifests.find(m=>m.archive===archive);assert.ok(m);const st=lstatSync(m.path);assert.ok(st.isFile()&&!st.isSymbolicLink()&&st.size<=2*1024*1024);assert.equal(realpathSync(m.path),m.path);assert.equal(sha(readFileSync(m.path)),m.manifest_sha256);return {archive,path:m.path,manifest_sha256:m.manifest_sha256};});
assert.equal(selected.length,7);assert.equal(prior.unresolved.length,80);
const testFiles=['source-exposure-row-schema-r2.test.mjs','source-freeze-exposure-r1.test.mjs','source-directory-exposure-r1.test.mjs'].map(n=>join(HERE,n));
const output=execFileSync(process.execPath,['--test',...testFiles],{encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024});console.log(output);const count=/(?:ℹ|#) pass (\d+)/.exec(output);assert.ok(count);
mkdirSync(OUT,{mode:0o700});createReceipt(join(OUT,'FREEZE.json'),{source_pins:pins,selected_manifests:selected,tests:Number(count[1]),rows:80,providers:0,labels_read:false,authority_effect:'none',open_questions_owner:'G01-SOURCE-EXPOSURE-ROW-SCHEMA-183.json'});
const rows=[],caseIds=new Set(prior.case_ids),instances=new Set();let recognized=0,other=0;
for(const m of selected){const bytes=readFileSync(m.path);assert.equal(sha(bytes),m.manifest_sha256);const manifest=JSON.parse(bytes);
 for(const issue of prior.unresolved.filter(r=>r.archive===m.archive)){assert.ok(Array.isArray(manifest[issue.field]));const row=manifest[issue.field][issue.ordinal],projection=supplementalRowIdentity(row);rows.push({archive:m.archive,field:issue.field,ordinal:issue.ordinal,...projection});
  if(projection.case_id){caseIds.add(projection.case_id);recognized++;}else if(projection.instance_id){instances.add(projection.instance_id);other++;}
 }}
assert.equal(rows.length,80);assert.equal(recognized,8);assert.equal(other,72);
for(const[p,h]of Object.entries(pins))assert.equal(sha(readFileSync(p)),h);for(const m of selected)assert.equal(sha(readFileSync(m.path)),m.manifest_sha256);
const result={status:'exact-reported-identity-schema-supplement-qualified',freeze_sha256:sha(readFileSync(join(OUT,'FREEZE.json'))),observed_at:new Date().toISOString(),tests_passed:Number(count[1]),source_pins_verified:Object.keys(pins).length,manifest_pins_verified:selected.length,rows,recognized_defects4j_rows:recognized,classified_other_dataset_rows:other,distinct_other_dataset_instances:instances.size,other_dataset_instances:[...instances].sort(),unresolved_selected_row_schemas:rows.filter(r=>r.posture==='unresolved'),distinct_prepared_defects4j_case_ids:caseIds.size,new_defects4j_case_ids:[...caseIds].filter(id=>!prior.case_ids.includes(id)).sort(),providers:0,reference_label_reads:0,complete_exposure_union:false,confirmation_selection_allowed:false,unexposed_count:null,remaining_gaps:prior.coverage_gaps,limitation:'Only reported eighty row schemas classified. Other-dataset IDs are retained exclusions, not evidence of repository/revision disjointness. Unknown roots, non-FREEZE manifests, removed/external archives and cross-ID aliases still prevent confirmation selection.',authority_effect:'none',open_questions_owner:'G01-SOURCE-EXPOSURE-ROW-SCHEMA-183.json'};
createReceipt(join(OUT,'RESULT.json'),result);console.log(JSON.stringify({freeze_sha256:result.freeze_sha256,result_sha256:sha(readFileSync(join(OUT,'RESULT.json'))),tests_passed:result.tests_passed,source_pins_verified:result.source_pins_verified,manifest_pins_verified:7,recognized_defects4j_rows:recognized,classified_other_dataset_rows:other,distinct_other_dataset_instances:instances.size,distinct_prepared_defects4j_case_ids:caseIds.size,new_defects4j_case_ids:result.new_defects4j_case_ids,unresolved_selected_rows:result.unresolved_selected_row_schemas.length,confirmation_selection_allowed:false}));
