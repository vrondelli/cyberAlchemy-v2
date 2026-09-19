// Prospective tokenizer diagnostic construction. Open questions: PAYLOAD-PAIR-QUALIFICATION.md.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync,realpathSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {encodeToolPayload,decodeToolPayload,PAYLOAD_GUIDE} from './tool-payload-codec.mjs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {createResearchExperiment,verifyEvolutionRecord} from '../../../../../../implementation/agent-reasoning-engine/packages/evolution-runtime/index.mjs';
const c=import.meta.dirname,root=resolve(c,'../../../../../..'),stage=join(c,'payload-pair-live-r2');
const read=p=>JSON.parse(readFileSync(p)),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const research=read(join(c,'COMPARISON-PAYLOAD-RESEARCH-R1.json')),review=read(join(c,'TOOL-PAYLOAD-CODEC-REVIEW.json'));
assert.equal(review.approved,true);
for(const b of review.source_bindings)assert.equal(sha(resolve(root,b.path)),b.sha256);
const events_path=join(c,'comparison-production-live-r1/runs_root/00/events.jsonl');
const events=readFileSync(events_path,'utf8').trim().split('\n').map(JSON.parse);
const initial=events.find(e=>e.capture?.prompt),response=events.find(e=>e.kind==='response-capture'),tool=events.find(e=>e.kind==='source-tool-result');
assert.ok(initial&&response&&tool);assert.equal(tool.call.function.name,'search');
const raw=JSON.parse(initial.capture.prompt);
raw.messages.push(response.response_capture.public_response.message,{role:'tool',tool_call_id:tool.call.id,content:stable(tool.output)});
const encoded=structuredClone(raw),codec=encodeToolPayload({tool:'search',result:tool.output});
assert.equal(codec.encoded,true);assert.deepEqual(decodeToolPayload({tool:'search',payload:codec.payload}),tool.output);
encoded.messages.at(-1).content=stable(codec.payload);encoded.messages[0].content+='\n'+PAYLOAD_GUIDE;
assert.ok(raw.messages.every(m=>!Object.hasOwn(m,'reasoning_content')));
const checked=structuredClone(encoded);checked.messages.at(-1).content=stable(decodeToolPayload({tool:'search',payload:JSON.parse(checked.messages.at(-1).content)}));checked.messages[0].content=checked.messages[0].content.slice(0,-('\n'+PAYLOAD_GUIDE).length);assert.deepEqual(checked,raw);
mkdirSync(stage,{mode:0o700});mkdirSync(join(stage,'fixture'),{mode:0o700});
const write=(p,v)=>writeFileSync(p,stable(v)+'\n',{flag:'wx',mode:0o600});
const rows=['raw','encoded'].map((id,i)=>{const prompt_path=join(stage,id+'.json');write(prompt_path,i?encoded:raw);return {id,prompt_path,prompt_sha256:sha(prompt_path)};});
const experiment=createResearchExperiment({
 hypothesis_ref:research.selection.selected,
 research_question:'For a prospective pair derived from the same public exchange, does lossless tool-result encoding reduce measured input and bring input plus 512 margin plus 2048 output reserve to at most8000?',
 baseline_ref:rows[0].prompt_path,treatment_ref:rows[1].prompt_path,
 metrics:['measured-input-tokens','projected-tokens','exact-payload-roundtrip','tokenizer-attempts','model-dispatches'],
 dataset_refs:[events_path,...rows.map(r=>r.prompt_path)],required_repetitions:1,
 success_criteria:{complete_known_measurements:2,encoded_input_strictly_lower:true,encoded_projected_at_most:8000,lossless_payload:true,model_calls:0},
 stop_conditions:['First provider failure stops second condition','Prompt/source drift','D:/WSL storage denial','120-second stage deadline','Any non-tokenizer dispatch attempt'],
 observation_refs:research.qualification_experiment.observation_refs
});
assert.equal(verifyEvolutionRecord(experiment).ok,true);assert.equal(experiment.observation_refs.length,1);assert.ok(research.registration.records.some(r=>r.record_id===experiment.observation_refs[0]));
const protocol={
 schema:'are.prospective-public-payload-pair/v1',experiment,
 parent_qualification_ref:research.qualification_experiment.record_id,parent_research_path:join(c,'COMPARISON-PAYLOAD-RESEARCH-R1.json'),
 source_mode:'prospective-public-derived-pair',historical_replay:false,
 derivation:{events_path,events_sha256:sha(events_path),raw:'Public initial request + public assistant message + exact stable serialized tool result',encoded:'Only losslessly encode tool result and append full PAYLOAD_GUIDE to system content',exact_roundtrip_verified:true,observations:tool.output.output.observations.length,original_payload_bytes:codec.original_bytes,encoded_payload_bytes:codec.payload_bytes},
 rows,request_policy:{model:'glm-5.3-flash',output_reservation:2048,margin:512,retained_reasoning_reservation:0,tokenizer_dispatches_maximum:2,tokenizer_attempts_per_condition:1,model_calls_maximum:0,deadline_ms:120000},
 limitations:['One exposed public exchange; not historical replay','No comprehension, runtime or whole-task savings claim','Native preparation threshold below7999 reported separately from at-most8000 arithmetic criterion'],
 full_comparison_success_criteria:research.full_comparison_success_criteria,
 full_comparison_budgets:research.full_comparison_budgets,
 campaign_goal_achieved:false,authority_effect:'none',open_questions_ref:'../PAYLOAD-PAIR-QUALIFICATION.md'
};
const protocol_path=join(stage,'PROTOCOL.json');write(protocol_path,protocol);
const prior=read(join(c,'comparison-production-live-r1/FREEZE.json'));
const request={rows,out_root:join(stage,'output'),fixture_root:join(stage,'fixture'),binding:prior.request.binding,credential_path:prior.request.credential_path};
const files=new Map();
function bind(p){p=realpathSync(p);if(files.has(p))return;files.set(p,{path:p,sha256:sha(p)});if(p.endsWith('.mjs'))for(const spec of new vm.SourceTextModule(readFileSync(p,'utf8'),{identifier:p}).dependencySpecifiers){if(spec.startsWith('node:'))continue;assert.ok(spec.startsWith('.'),spec);bind(resolve(dirname(p),spec));}}
for(const name of ['prepare-payload-pair.mjs','run-payload-pair.mjs','payload-pair-worker.mjs','measure-payload-pair.mjs','measure-payload-pair.test.mjs','tool-payload-codec.mjs','TOOL-PAYLOAD-CODEC-REVIEW.json','PAYLOAD-PAIR-QUALIFICATION.md','COMPARISON-PAYLOAD-RESEARCH-R1.json','COMPARISON-PAYLOAD-RESEARCH-REVIEW.json','FOLLOWUP-RECONSTRUCTION-ASSESSMENT-R1.json'])bind(join(c,name));
for(const p of [events_path,protocol_path,request.binding.provenance.path,request.credential_path,...rows.map(r=>r.prompt_path)])bind(p);
const manifest_path=join(stage,'FREEZE.json');
write(manifest_path,{schema:'are.payload-pair-freeze/v1',request,protocol_path,deadline_ms:120000,growth_bytes:33*1024**2,files:[...files.values()].sort((a,b)=>a.path.localeCompare(b.path)),open_questions_ref:'../PAYLOAD-PAIR-QUALIFICATION.md'});
console.log(JSON.stringify({manifest_path,manifest_sha256:sha(manifest_path),files:files.size,experiment:experiment.record_id,provider_calls:0}));
