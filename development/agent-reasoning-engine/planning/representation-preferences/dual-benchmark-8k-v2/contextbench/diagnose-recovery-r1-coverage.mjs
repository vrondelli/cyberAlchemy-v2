// Evaluator-only diagnostic. Open questions: RECOVERY-R1-COVERAGE-PROTOCOL.md.
import assert from 'node:assert/strict';
import {bindCoverageInputs,verifyCoverageInputs} from './coverage-input-integrity.mjs';
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync,mkdirSync,existsSync,realpathSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {bindDelivery} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {projectDeliveredEvidence,exportTerminalEvidenceSelection} from './terminal-evidence.mjs';
import {verifyProductionFreeze} from './recovery-production.mjs';
import {hydrateReferencedSeal} from './referenced-generation-seal.mjs';
import {campaignContract} from './recovery-campaign.mjs';
import {runReadOnlyPython} from './packet-diversity-v1/scorer-bridge-bounded-v4.mjs';
import {createStageOutputGuard,MAXIMUM_STAGE_BYTES} from './packet-diversity-v1/stage-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
import {guardStorage} from '../storage-host-small-run.mjs';
const here=import.meta.dirname,root=resolve(here,'../../../../../..'),read=p=>JSON.parse(readFileSync(p));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const need=(v,m)=>{if(!v)throw Error('coverage.'+m);};
const manifest=join(here,'RECOVERY-PRODUCTION-FREEZE-R1.json'),manifestHash='d74658ccd1f8a88f476368fe1292ff1f1aa958969fca3e533e388dda8eb8bfb0';
const reviewPath=join(here,'RECOVERY-R1-COVERAGE-REVIEW.json'),review=read(reviewPath),reviewHash=hash(reviewPath);
need(review.approved===true&&review.diagnostic_execution_admitted===true,'review-required');
const priorPath=join(here,'RECOVERY-R1-PARTIAL-SCORE-RESULT-REVIEW.json'),prior=read(priorPath);
const required=[import.meta.filename,join(here,'RECOVERY-R1-COVERAGE-PROTOCOL.md'),join(here,'coverage-input-integrity.mjs'),priorPath,join(here,'evaluator/representation-ceiling.py'),join(here,'terminal-evidence.mjs'),join(here,'packet-diversity-v1/scorer-bridge-bounded-v4.mjs')];
const verifyBindings=bindings=>{need(Array.isArray(bindings)&&bindings.length>0,'bindings-required');for(const b of bindings){const p=resolve(root,b.path);need(realpathSync(p)===p&&hash(p)===b.sha256,'binding-drift');}};
const verify=()=>{need(hash(reviewPath)===reviewHash,'review-drift');verifyBindings(review.source_bindings);for(const p of required)need(review.source_bindings.some(b=>resolve(root,b.path)===p),'required-binding');need(prior.result_integrity_approved===true&&prior.original_experiment_classification==='inconclusive','prior-review');verifyBindings(prior.source_bindings);return verifyProductionFreeze(manifest,manifestHash);};
const f=verify(),config=read(f.config_path),binding=read(f.binding_path),generation=f.roots.generation_root;
const terminal=read(join(f.roots.supervision_root,'GENERATION-TERMINAL.json')),seal=read(join(generation,'GENERATION-SEAL.json'));
assert.deepEqual(terminal.seal,seal);
const pairs=hydrateReferencedSeal({root:generation,seal,expected_slots:terminal.outcomes.map(x=>x.reference),...campaignContract({config,root:generation})});
const scores=read(join(here,'recovery-trajectory-r1-partial-score/RESULTS.json'));
need(scores.post_score_integrity_verified===true&&scores.outcomes.length===8,'partial-scores');
const directory=join(here,'recovery-r1-coverage-r1');need(!existsSync(directory),'fresh-directory');
need(guardStorage({binding,output:here,growth_reservation_bytes:MAXIMUM_STAGE_BYTES}).admitted===true,'storage');
mkdirSync(directory,{mode:0o700});const guard=createStageOutputGuard({root:directory}),persistence=createStagePersistence({stage_root:directory,stage_guard:guard});
const outcomes=scores.outcomes.map(x=>({task_id:x.task_id,arm:x.arm,prior_status:x.status,prior_valid:x.valid,usage:x.usage,metrics:x.metrics,coverage:null}));
const inputBindings=[],baseChecks=[];
const checkBase=(repo,commit)=>{for(const [args,expected] of [[['rev-parse','HEAD'],commit],[['status','--porcelain'],'']]){const p=spawnSync('git',['-c','core.hooksPath=/dev/null',...args],{cwd:repo,env:{...process.env,GIT_OPTIONAL_LOCKS:'0',GIT_NO_LAZY_FETCH:'1',GIT_ALLOW_PROTOCOL:''},encoding:'utf8',timeout:30000,maxBuffer:1048576});need(p.status===0&&p.stdout.trim()===expected,'base-identity-or-cleanliness');}};
let failure=null,completed=0;
try{
 for(const [i,{result:pair}] of pairs.entries())for(const arm of ['control','treatment']){
  const task=config.tasks[i],a=pair.arms[arm],row=outcomes.find(x=>x.task_id===task.id&&x.arm===arm);need(row,'assigned-row');
  if(!a.complete){need(!row.prior_valid,'incomplete-scored');continue;}need(row.prior_valid,'completed-unscored');
  need(hash(a.result_path)===a.result_sha256,'result-drift');const r=read(a.result_path),repo=join(f.roots.source_root,task.id+'-r1-'+arm,'base');need(realpathSync(repo)===repo&&r.source_root===resolve(repo,'..'),'source-identity');
  checkBase(repo,task.base_commit);baseChecks.push(()=>checkBase(repo,task.base_commit));
  const snapshotPaths=readdirSync(join(a.run_directory,'snapshots')).filter(n=>n.endsWith('.json')).sort().map(n=>join(a.run_directory,'snapshots',n));
  inputBindings.push(...bindCoverageInputs(snapshotPaths));const snapshots=snapshotPaths.map(read);
  const response_capture=r.response_captures.at(-1),packet=r.terminal_evidence_presentations.find(p=>p.request_sha256===response_capture?.request_sha256)?.packet;need(packet,'packet');
  const publicTask=read(task.task_path),exported=exportTerminalEvidenceSelection({...r,packet,task:publicTask,source_snapshots:snapshots,response_capture},repo);
  assert.deepEqual(exported.prediction,r.native_export.prediction);assert.deepEqual(exported.selection,r.selection);
  const delivery=bindDelivery(r);need(delivery.unmapped.length===0,'unmapped');const projection=projectDeliveredEvidence({reads:delivery.read_observations,snapshots,repoRoot:repo});
  inputBindings.push(...bindCoverageInputs([...projection.eligible,...packet.private.bindings].map(x=>resolve(repo,x.path))));
  const selected=new Set(r.selection.final_read_ids);need([...selected].every(id=>packet.private.bindings.some(x=>x.read_id===id)),'selection-outside-packet');
  const payload={task_id:task.id,instance_id:task.instance_id,repo_url:publicTask.repo_url,base_commit:task.base_commit,repo_root:repo,cases:['archive','offered','selected'].map(stage=>({arm,stage,source_result:a.result_path,source_result_sha256:a.result_sha256,delivered_reads:delivery.read_observations.length,eligible:(stage==='archive'?projection.eligible:packet.private.bindings.filter(x=>stage==='offered'||selected.has(x.read_id))).map(x=>({path:x.path,base_spans:x.base_spans}))}))};
  need(guardStorage({binding,output:directory,growth_reservation_bytes:MAXIMUM_STAGE_BYTES-guard.snapshot().bytes}).admitted===true,'storage');
  const payloadPath=join(directory,task.id+'-'+arm+'-payload.json');persistence.writeJson(payloadPath,payload);
  const proc=await runReadOnlyPython({python:config.python,args:[join(here,'evaluator/representation-ceiling.py'),root,config.upstream,payloadPath]});const evaluated=JSON.parse(proc.stdout);
  need(evaluated.cases.length===3,'stage-count');const actual=evaluated.cases.find(x=>x.stage==='selected');need(Math.abs(actual.maximum_recall_exact-row.metrics.span_coverage)<1e-10&&Math.abs(actual.all_reads_span_f1-row.metrics.span_f1)<1e-10,'native-score-mismatch');
  row.coverage=evaluated.cases;row.evaluator={gold_data_sha256:evaluated.gold_data_sha256,upstream_revision:evaluated.upstream_revision,evaluator_source_hashes:evaluated.evaluator_source_hashes};completed++;
 }
 need(completed===4,'fixed-completed-denominator');verify();verifyCoverageInputs(inputBindings);for(const check of baseChecks)check();
}catch(e){failure={code:e?.diagnostic?.code??'diagnostic-validation-failed',message:e?.diagnostic?null:String(e.message),diagnostic:e?.diagnostic??null};}
if(failure)for(const row of outcomes){if(row.coverage){row.unverified_coverage=row.coverage;row.coverage=null;}}
const result={status:failure?'failed':'completed',diagnostic_valid:failure===null,assigned:8,completed_diagnostics:completed,outcomes,failure,new_provider_calls:0,known_model_tokens:scores.known_tokens,unknown_usage_calls:scores.unknown_usage_calls,original_experiment_classification:'inconclusive',campaign_goal_achieved:false,review_sha256:reviewHash,source_bindings:review.source_bindings,coverage_input_bindings:inputBindings,open_questions_ref:'RECOVERY-R1-COVERAGE-PROTOCOL.md'};
persistence.writeJson(join(directory,'RESULTS.json'),result,{final:true});console.log(JSON.stringify({status:result.status,completed,assigned:8,failure}));if(failure)process.exitCode=2;
