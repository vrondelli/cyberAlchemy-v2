import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {canonicalJson, digest, deepFreeze} from './runtime/request-intent-runtime/src/canonical.mjs';
import {createResearchHypothesis, createHypothesisObservation, createResearchExperiment, createLearningDecision} from './runtime/evolution-runtime/index.mjs';
import {qualify, protocolBytes} from './runtime/benchmark/analyze.mjs';
import {extractMetrics} from './runtime/benchmark/metrics.mjs';

export const profile = JSON.parse(readFileSync(new URL('./profile.json', import.meta.url)));
const root = fileURLToPath(new URL('../../../../../', import.meta.url));
export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const check = (ok, code) => {if (!ok) throw Error('workspace-research.' + code);};
const same = (a,b) => canonicalJson(a) === canonicalJson(b);

export function loadInput() {
  // Portable historical evidence. Every embedded source/log is rehashed below;
  // this does not assert that today's runtime still has the historical bytes.
  const input=JSON.parse(readFileSync(new URL('./input.json',import.meta.url),'utf8'));
  assessInput(input);
  return input;
}

// Exact historical input verification, not live process attestation/currentness.
export function assessInput(input) {
  for (const key of ['report','candidate','budget','protocol','ontology']) {
    check(typeof input?.[key] === 'string' && sha(input[key]) === profile[key].sha256, key + '-digest');
  }
  check(sha(protocolBytes) === profile.protocol.sha256, 'analyzer-protocol-drift');
  const report=JSON.parse(input.report), candidate=JSON.parse(input.candidate), budget=JSON.parse(input.budget);
  const s=report.smoke;
  check(report.schema === 'cc006-product-test/v1' && candidate.candidate_id === 'CC-006', 'schema');
  check(report.authorityEffect === 'none' && report.approval === 'not-requested' && candidate.authority_effect === 'none', 'authority');
  check(report.candidateSha256 === profile.candidate.sha256 && s.identity.candidateSha256 === report.candidateSha256
    && s.identity.binarySha256 === report.build.binarySha256 && s.identity.budgetSha256 === profile.budget.sha256
    && s.identity.protocolSha256 === profile.protocol.sha256, 'identity');
  for (const flight of [s.preflight,s.postflight]) check(flight.ok === true && same(flight.current,s.identity)
    && flight.errors.length === 0 && flight.source.selected_runtime_prerequisites_pass === true, 'flight');
  check(Array.isArray(input.logs) && input.logs.length === 2 && new Set(input.logs.map(l=>l.path)).size === 2, 'log-coverage');
  for (const log of s.logs) {
    const actual=input.logs.find(l=>l.path === log.path);
    check(actual && actual.sha256 === log.sha256 && sha(actual.bytes) === log.sha256, 'log-digest');
  }
  const stdout=input.logs.find(l=>l.path.endsWith('/stdout.log'));
  check(stdout, 'stdout-required');
  const metrics=extractMetrics(stdout.bytes);
  check(s.parseError === null && s.observationError === null && same(metrics,s.metrics), 'raw-metric-mismatch');
  check(same(Object.keys(metrics).sort(),Object.keys(budget.budgets).sort()), 'metric-coverage');
  const rows=Object.entries(budget.budgets).map(([name,b])=>{
    const samples=metrics[name];
    check(samples.length >= b.minimum_samples, 'insufficient-samples');
    const ordered=[...samples].sort((a,b)=>a-b);
    // Historical smoke aggregate only. Never label this a campaign population.
    const smokeStatisticMs=ordered[Math.ceil(ordered.length*.95)-1];
    return {name,samplesMs:samples,smokeStatisticMs,budgetMs:b.p95_ms,exceeded:smokeStatisticMs>b.p95_ms};
  });
  check(Number.isSafeInteger(s.result.pid) && s.result.pid > 0 && s.result.exitCode === 1
    && !s.result.timedOut && !s.result.interrupted && s.result.signal === null, 'process-result');
  check(rows.some(r=>r.exceeded) && report.status === 'FAIL' && report.checks.unifiedSmoke === 'FAIL', 'outcome-mismatch');
  const hostRejections=qualify(s.host,s.startMs,s.endMs);
  check(same(hostRejections,s.hostRejections) && hostRejections.includes('host-unqualified:memoryPressureAvg10'), 'host-mismatch');
  return {smoke:'FAIL',host:'REJECTED',hostRejections,metrics:rows,
    observation:'inconclusive',performanceInference:'not_evaluable',populationP95:null,
    limitation:'Rejected host; no qualified comparison or repair benefit can be inferred.'};
}

export function materializeRegistration(input) {
  const assessment=assessInput(input), candidate=JSON.parse(input.candidate);
  const resultRef='workspace-product-test:'+profile.report.sha256;
  const implementation={schema_version:'are.benchmark-implementation-evidence/v1',candidate_digest:profile.candidate.sha256,
    changed_sources:candidate.changed_sources,binding_posture:'historical-selected-source-evidence-not-transitive-closure',authority_effect:'none'};
  implementation.record_id='implementation-evidence:'+digest(implementation);
  const hypothesis=createResearchHypothesis({hypothesis_key:'workspace-snapshot-worker-cc006',
    statement:'Moving snapshot database reads off the desktop command thread may reduce UI contention without changing snapshot semantics.',
    mechanism:'Run SQLite reads on a blocking worker.',falsifier:'A qualified controlled comparison shows no benefit or changes observable snapshot semantics.',
    scope:'Workspace native snapshot repair; retrospective hypothesis, not a claim that chat latency is fixed.',
    metrics:['workspace.tauri.snapshot','chat.connect-to-ready','chat.delta-to-paint'],provenance_refs:[resultRef],
    implementation_ref:implementation.record_id,implementation_pattern:'blocking-worker-snapshot',
    experiment_template:{research_question:'Does the snapshot repair reduce contention under qualified comparable conditions?',
      baseline_ref:candidate.previous.sha256,treatment_ref:profile.candidate.sha256,dataset_refs:[resultRef],required_repetitions:40,
      success_criteria:{existing_budgets_unchanged:true,qualified_comparison_required:true,semantic_equivalence_required:true},
      stop_conditions:['Stop on failed smoke; retain rejected hosts and all failures.']}});
  const observation=createHypothesisObservation({hypothesis_ref:hypothesis.record_id,source_result_ref:resultRef,
    source_result_digest:profile.report.sha256,observation_kind:'inconclusive',phase:'anomaly',
    claim:'CC006 smoke failed and memory pressure rejected the host; repair benefit remains not evaluable.',
    evaluator_id:'workspace.cc006-research-adapter/v1',evidence_refs:[resultRef],limitations:[assessment.limitation,'Historical backfill is not preregistration.']});
  const experiment=createResearchExperiment({...hypothesis.experiment_template,hypothesis_ref:hypothesis.record_id,
    metrics:hypothesis.metrics,observation_refs:[observation.record_id]});
  const decision=createLearningDecision({hypothesis_ref:hypothesis.record_id,observation_refs:[observation.record_id],experiment_ref:experiment.record_id,
    disposition:'inconclusive',reason_codes:['host-rejected','controlled-comparison-missing'],
    next_action:'Inspect timing boundaries and qualify a future controlled experiment; do not claim improvement.'});
  const question={schema_version:'are.benchmark-research-question/v1',question:'Which startup boundaries explain latency, and can qualified measurements distinguish repair benefit from host contention?',
    posture:'open-not-a-causal-conclusion',source_observation_ref:observation.record_id,authority_effect:'none'};
  question.record_id='research-question:'+digest(question);
  const material={schema_version:'workspace.benchmark-research-registration/v1',ontology_id:'are.research-learning',
    adapter_id:'workspace.cc006-research-adapter/v1',experiment_id:'workspace-cc006-retrospective',
    posture:'retrospective-not-preregistered',implementation,question,records:[hypothesis,experiment,observation,decision],assessment,
    evidence:input,authority_effect:'none'};
  return deepFreeze({...material,registration_digest:digest(material)});
}

export function verifyRegistration(record) {
  try {return same(record,materializeRegistration(record.evidence));} catch {return false;}
}
