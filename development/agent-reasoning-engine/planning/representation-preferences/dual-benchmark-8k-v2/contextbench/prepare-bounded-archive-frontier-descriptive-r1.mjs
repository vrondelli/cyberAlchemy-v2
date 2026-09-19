// Archive candidate diagnostic; original four-task result remains unchanged.
// Build isolated native-scoring inputs without model/evaluator calls. Open questions: CANDIDATE-DESCRIPTIVE-SCORING.md.
import assert from 'node:assert/strict';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {resolve,join} from 'node:path';import {createHash} from 'node:crypto';import {register} from 'node:module';

const c=import.meta.dirname,root=resolve(c,'../../../../../..'),hash=b=>createHash('sha256').update(b).digest('hex'),bound=path=>({path,sha256:hash(readFileSync(path))}),read=p=>JSON.parse(readFileSync(p));
const verifyBinding=b=>assert.equal(hash(readFileSync(resolve(root,b.path))),b.sha256,'diagnostic.binding-drift:'+b.path);
const {collectCandidateSources}=await import('./candidate-only-source-freeze.mjs');
const {stable}=await import('../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs');
const {reconcileComparisonCampaignEvidence}=await import('./bounded-archive-frontier-evidence-manifest-r1.mjs');
const {verifyComparisonOutcomeSeal}=await import('./bounded-archive-frontier-outcome-store-r1.mjs');
const {prepareComparisonPrediction}=await import('./score-bounded-archive-frontier-r1.mjs');
const original_freeze=bound(join(c,'bounded-archive-frontier-production-live-r1/FREEZE.json')),f=read(original_freeze.path),result_review=bound(join(c,'bounded-archive-frontier-production-live-r1/RESULT-REVIEW.json')),review=read(result_review.path);
assert.equal(review.result_integrity_approved,true);for(const b of review.source_bindings)verifyBinding(b);
const manifest=read(join(f.request.metadata_root,'EVIDENCE-MANIFEST.json')),expected_manifest_sha256=hash(stable(manifest));
const args={...f.request,manifest,expected_manifest_sha256};const evidence=reconcileComparisonCampaignEvidence(args),sealed=verifyComparisonOutcomeSeal({root:f.request.outcome_root,schedule:f.request.schedule,sources:f.request.sources,expected_seal_sha256:manifest.outcome_seal_sha256});
const eligible_sequences=[1,2,3];for(const i of eligible_sequences){assert.equal(evidence.rows[i].reconciled,true);assert.equal(prepareComparisonPrediction({slot:f.request.schedule.slots[i],outcome:sealed[i].result,entry:manifest.entries[i],runs_root:f.request.runs_root,source_root:f.request.source_root}).verify(),true);}
const added=['bounded-archive-frontier-descriptive-worker-r1.mjs','run-bounded-archive-frontier-descriptive-r1.mjs','prepare-bounded-archive-frontier-descriptive-r1.mjs','score-bounded-archive-frontier-descriptive-r1.mjs','score-bounded-archive-frontier-descriptive-r1.test.mjs','CANDIDATE-DESCRIPTIVE-SCORING.md'];
const closure=collectCandidateSources(added.map(n=>join(c,n)));
const files=[...new Map([...f.files,...review.source_bindings,original_freeze,result_review,...closure].map(b=>[resolve(root,b.path),{path:resolve(root,b.path),sha256:b.sha256}])).values()].sort((a,b)=>a.path.localeCompare(b.path));for(const b of files)verifyBinding(b);
const stage=join(c,'bounded-archive-frontier-descriptive-live-r1');mkdirSync(stage);const score_root=join(stage,'score'),supervision_root=join(stage,'supervision');mkdirSync(score_root);mkdirSync(supervision_root);
const d={schema:'are.candidate-descriptive-freeze/v1',original_freeze,result_review,files,score_root,supervision_root,diagnostic_contract:{schema:'are.candidate-descriptive-contract/v1',eligible_sequences,reconciliation_sha256:hash(stable(evidence)),sealed_outcomes_sha256:hash(stable(sealed))},new_provider_calls:0,comparative_savings_allowed:false,campaign_goal_achieved:false,open_questions_ref:'../CANDIDATE-DESCRIPTIVE-SCORING.md'};
const path=join(stage,'FREEZE.json');writeFileSync(path,JSON.stringify(d,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({path,sha256:hash(readFileSync(path)),bindings:files.length,prepared_predictions:eligible_sequences.length}));
