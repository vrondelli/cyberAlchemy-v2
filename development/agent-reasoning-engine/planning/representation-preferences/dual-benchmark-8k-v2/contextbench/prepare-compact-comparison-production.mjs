// Build only after audited fresh initial-window qualification. Open questions: COMPACT-COMPARISON-LIVE.md.
import assert from 'node:assert/strict';import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync,realpathSync} from 'node:fs';import {join,resolve,dirname} from 'node:path';import {createHash} from 'node:crypto';
import {verifyComparisonProductionR2Freeze} from './comparison-compact-production.mjs';
import {verifyComparisonRequestQualification,COMPARISON_GROWTH_BYTES} from './comparison-compact-production-base.mjs';
const c=import.meta.dirname,root=resolve(c,'../../../../../..'),q=join(c,'compact-comparison-qualification-live-r1'),stage=join(c,'compact-comparison-production-live-r1');
const read=p=>JSON.parse(readFileSync(p)),hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),write=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx',mode:0o600});
const review=read(join(q,'RESULT-REVIEW.json'));assert.equal(review.result_integrity_approved,true);assert.equal(review.qualified,true);
for(const b of review.source_bindings)assert.equal(hash(resolve(root,b.path)),b.sha256);
const qualify=read(join(q,'metadata_root/RESULTS.json')),settlement=read(join(q,'supervision/RESULTS.json'));
assert.equal(qualify.qualified,true);assert.equal(qualify.model_calls,0);assert.equal(settlement.qualified,true);assert.equal(settlement.process_settlement.local_settled,true);assert.equal(settlement.process_settlement.process_group_absent,true);assert.equal(settlement.process_settlement.exit_code,0);assert.equal(settlement.process_settlement.forced,false);
const original=read(join(q,'FREEZE.json')),request=structuredClone(original.request);
for(const k of ['outcome_root','runs_root','metadata_root','source_root'])request[k]=join(stage,k);
const evidence={amendment:join(q,'PROTOCOL.json'),capacity:join(c,'COMPARISON-CAPACITY-QUALIFICATION-R1.json'),request_qualification:join(q,'metadata_root/RESULTS.json')};
const files=new Map();
function bind(p){p=realpathSync(p);if(files.has(p))return;files.set(p,{path:p,sha256:hash(p)});if(p.endsWith('.mjs'))for(const spec of new vm.SourceTextModule(readFileSync(p,'utf8'),{identifier:p}).dependencySpecifiers){if(spec.startsWith('node:'))continue;assert.ok(spec.startsWith('.'));bind(resolve(dirname(p),spec));}}
for(const name of ['prepare-compact-comparison-production.mjs','run-comparison-compact-production.mjs','comparison-compact-generation-worker.mjs','comparison-compact-production-stage-worker.mjs','packet-diversity-v1/score-native-bounded-v3.py','COMPACT-COMPARISON-LIVE.md','COMPACT-PRODUCTION-REVIEW.json','COMPACT-QUALIFICATION-REVIEW.json','compact-reasoning-followup-live-r1/RESEARCH-RESULT.json','compact-reasoning-followup-live-r1/RESEARCH-RESULT-REVIEW.json'])bind(join(c,name));
const config=read(request.sources.config_path);
for(const p of [request.sources.config_path,request.sources.cohort_path,request.credential_path,request.binding.provenance.path,config.scorer,config.source_manifest,...Object.values(evidence),...request.schedule.slots.map(s=>s.task_path),...qualify.rows.map(r=>r.prompt_path),join(q,'FREEZE.json'),join(q,'REVIEW.json'),join(q,'RESULT-REVIEW.json'),join(q,'supervision/RESULTS.json')])bind(p);
for(const b of review.source_bindings)bind(resolve(root,b.path));
verifyComparisonRequestQualification({qualification:qualify,schedule:request.schedule,files:new Map([...files.values()].map(b=>[b.path,b.sha256]))});
mkdirSync(stage,{mode:0o700});
const manifest_path=join(stage,'FREEZE.json');write(manifest_path,{schema:'are.comparison-production-freeze/v1',files:[...files.values()].sort((a,b)=>a.path.localeCompare(b.path)),request,evidence,score_root:join(stage,'score'),supervision_root:join(stage,'supervision'),generation_deadline_ms:9000000,combined_growth_bytes:COMPARISON_GROWTH_BYTES,open_questions_ref:'../COMPACT-COMPARISON-LIVE.md'});
const manifest_sha256=hash(manifest_path);verifyComparisonProductionR2Freeze({manifest_path,manifest_sha256});
console.log(JSON.stringify({manifest_path,manifest_sha256,files:files.size,provider_calls:0,live_execution_admitted:false}));
