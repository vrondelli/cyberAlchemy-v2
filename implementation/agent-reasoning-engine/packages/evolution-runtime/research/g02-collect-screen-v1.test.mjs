import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeG02Screen} from './g02-collect-screen-v1.mjs';

const thresholds={minimum_span_f1:0.5,minimum_file_f1:0.8,maximum_model_tokens:261037};
const result={task_id:'contextbench-3',status:'final_context_selected',model_calls:80,known_total_tokens:260000,unknown_usage_dispatched_requests:0,native_export:{prediction:{instance_id:'sample-3'}}};
const score={native:{instance_id:'sample-3',final:{span:{coverage:0.6,precision:0.6},file:{coverage:0.8,precision:1}}}};

test('a complete native result meets all predeclared task gates',()=>{
 const screen=summarizeG02Screen({task_id:'contextbench-3',result,native_score:score,...thresholds});
 assert.equal(screen.decision,'pass');assert.equal(screen.metrics.span_f1,0.6);assert.ok(Math.abs(screen.metrics.file_f1-8/9)<1e-12);
});

test('an unsealed billing failure and overspend cannot be scored as a win',()=>{
 const stopped={...result,status:'run_error',model_calls:87,known_total_tokens:286850,native_export:null};
 const screen=summarizeG02Screen({task_id:'contextbench-3',result:stopped,run_result:{status:'run_error',error:'glm.billing-unavailable'},...thresholds});
 assert.equal(screen.decision,'reject');assert.equal(screen.error,'glm.billing-unavailable');
 assert.equal(screen.gates.valid_export,false);assert.equal(screen.gates.token_ceiling,false);assert.equal(screen.gates.native_score,false);
});

test('score identity and unknown model usage fail closed',()=>{
 const wrong=summarizeG02Screen({task_id:'contextbench-3',result,native_score:{native:{...score.native,instance_id:'different'}},...thresholds});
 assert.equal(wrong.decision,'reject');assert.equal(wrong.gates.native_score,false);
 const unknown=summarizeG02Screen({task_id:'contextbench-3',result:{...result,unknown_usage_dispatched_requests:1},native_score:score,...thresholds});
 assert.equal(unknown.decision,'reject');assert.equal(unknown.gates.known_usage,false);
});
