// Retrospective offline diagnosis, not a claim that a planned live experiment ran.
// Open questions: PLAN.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHypothesisObservation,createLearningDecision,verifyEvolutionRecord} from '../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
import {digest} from '../../../../../implementation/agent-reasoning-engine/packages/request-intent-runtime/src/canonical.mjs';
const dir=import.meta.dirname,root=resolve(dir,'../../../../..'),prefix=relative(root,dir),read=n=>JSON.parse(readFileSync(resolve(dir,n)));
const hypotheses=read('hypotheses.json').records,experiments=read('experiments.json').records;
const specs=[
 {key:'C-state',source:'contextbench/REPLAY.json',kind:'inconclusive',claim:'Five archived failure replays reproduce original diagnostics and verify receipt-bound base-valid projection/export. These are structural probes, not model selections, accuracy or efficiency results.',decision:'collect-replications',next:'Retain the tested terminal mechanism, but do not spend a full cohort expecting it alone to close missing source coverage or the token target.'},
 {key:'C-discovery',source:'contextbench/REPRESENTATION-CEILING.json',kind:'inconclusive',claim:'Five selected failed valid-read archives have proven native SpanF1 ceilings below one even with unrestricted selection. This supports the need to test source discovery; it does not establish that the proposed ledger improves discovery.',decision:'run-experiment',next:'Specify and review a bounded task-derived source-discovery hypothesis using public evidence only; freeze exact costs and comparison before model calls.'},
 {key:'C-input',source:'contextbench/TOKEN-ANALYSIS.json',kind:'inconclusive',claim:'Treatment needs another35001tokens saved; all last calls total28811, and input accounts for95.95% of costs. Earlier input/call efficiency must be investigated; no proposed compression policy is proven.',decision:'run-experiment',next:'Attribute repeated actual input without exposing gold, then select one input-retention or stop-policy ablation and review it separately from terminal repair.'}
];
const observations=[],decisions=[];
for(const s of specs){
 const h=hypotheses.find(h=>h.hypothesis_key==='dual8k-v2-'+s.key+'-H1');if(!h)throw Error('hypothesis missing:'+s.key);
 const source=read(s.source),o=createHypothesisObservation({hypothesis_ref:h.record_id,source_result_ref:prefix+'/'+s.source,source_result_digest:digest(source),observation_kind:s.kind,phase:'anomaly',claim:s.claim,evaluator_id:'offline-receipt-and-native-metric-diagnosis',evidence_refs:[prefix+'/'+s.source],limitations:['Retrospective outcome-selected development diagnostics; no successor model generations or scored predictions.','Support is for the diagnostic premise, not proof of proposed treatment performance.','Native context coverage, semantic retention and repair correctness remain distinct.']});
 observations.push(o);decisions.push(createLearningDecision({hypothesis_ref:h.record_id,observation_refs:[o.record_id],disposition:s.decision,next_action:s.next,reason_codes:['offline-premise-only','campaign-goal-not-achieved'],supporting_count:0,counterevidence_count:0}));
}
if(![...observations,...decisions].every(r=>verifyEvolutionRecord(r).ok))throw Error('native record verification');
writeFileSync(resolve(dir,'offline-observations.json'),JSON.stringify({status:'retrospective-offline-diagnosis',planned_live_experiments_executed:0,observations,decisions,authority_effect:'none',open_questions_ref:'PLAN.md'},null,2)+'\n');
console.log(JSON.stringify({observations:observations.length,decisions:decisions.length,live_experiments_executed:0}));
