import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifySaved as verifyHypotheses} from '../latency-hypotheses-001/hypothesize.mjs';
import {sha,profile} from '../research-learning-owned/adapter.mjs';
export const loadDesign=()=>JSON.parse(readFileSync(new URL('./design.json',import.meta.url)));
const keys=['schema_version','session_id','attempt_id','clock','frame_available','start_ms','status_end_ms','end_ms','status_ipc_ms','post_status_frame_ms','authority_effect'];
export function validateRows(jsonl){
  const errors=[],rows=[],seen=new Set();
  const lines=jsonl.trimEnd().split('\n');
  for(const [index,line] of lines.entries()){
    let r;try{r=JSON.parse(line);}catch{errors.push({line:index+1,code:'invalid-json'});continue;}
    const bad=code=>errors.push({line:index+1,code});
    if(!r||typeof r!=='object'||Array.isArray(r)){bad('row-object-required');continue;}
    if(JSON.stringify(Object.keys(r).sort())!==JSON.stringify([...keys].sort()))bad('exact-fields-required');
    if(r.schema_version!=='workspace.handshake-phases/v1'||r.clock!=='frontend-monotonic'||r.authority_effect!=='none')bad('contract');
    if(![r.session_id,r.attempt_id].every(x=>typeof x==='string'&&x.trim()))bad('identity');
    const id=JSON.stringify([r.session_id,r.attempt_id]);if(seen.has(id))bad('duplicate-attempt');seen.add(id);
    if(typeof r.frame_available!=='boolean')bad('frame-flag');
    if(!['start_ms','status_end_ms','end_ms','status_ipc_ms','post_status_frame_ms'].every(k=>Number.isFinite(r[k])&&r[k]>=0)
      ||r.status_end_ms<r.start_ms||r.end_ms<r.status_end_ms
      ||Math.abs(r.status_ipc_ms-(r.status_end_ms-r.start_ms))>1e-9
      ||Math.abs(r.post_status_frame_ms-(r.end_ms-r.status_end_ms))>1e-9)bad('invalid-timing');
    rows.push(r);
  }
  return {ok:errors.length===0,errors,rows,claim_ceiling:'phase-row-shape-only; not host qualification or native campaign evidence',authority_effect:'none'};
}
export function assessRegistration(){
  const design=loadDesign(),checks=[];
  const add=(id,status,blockers=[])=>checks.push({id,status,blockers});
  try{const prior=verifyHypotheses();add('selected-hypothesis',prior.ok&&prior.candidate_sha256===design.predecessor_candidate_sha256?'PASS':'FAIL');}
  catch(e){add('selected-hypothesis','FAIL',[e.message]);}
  add('treatment-operation','not_evaluable',['Source-selected operation and semantic non-interference proof are not implemented.']);
  for(const arm of ['baseline','treatment'])add(arm+'-native-identity','not_evaluable',['Build and independently verify exact instrumented source, binary, fixture, budget and protocol identities.']);
  add('instrumentation-overhead','not_evaluable',['Qualified instrumented-versus-uninstrumented overhead evidence is missing.']);
  add('semantic-equivalence','not_evaluable',['Exact-arm event ordering, response and error-path equivalence evidence is missing.']);
  add('native-run','not_evaluable',['experiment.register incomplete','host.qualify pending']);
  return {schema_version:'workspace.latency-comparison-readiness/v1',comparison_id:design.comparison_id,
    source_bindings:['design.json','phase-probe.mjs','register.mjs','register.test.mjs','README.md'].map(path=>({path,sha256:sha(readFileSync(new URL(path,import.meta.url)))})),
    selected_hypothesis_candidate_sha256:design.predecessor_candidate_sha256,
    inherited_budget_sha256:profile.budget.sha256,inherited_protocol_sha256:profile.protocol.sha256,
    registration_status:'incomplete',checks,
    construction:{task:'experiment.register',state:'in-progress',runnable_now:['Select the exact unrelated startup operation or reject this treatment','Integrate the additive probe in isolated baseline and treatment candidates','Build exact candidates and implement native evidence verification']},
    operational_support:[{task:'host.qualify',owner:'Workspace test operator',stage:'future native product-test',blocks_current_construction:false}],
    deferred:['Live comparison','Product approval','Tauri activation','Lab reconciliation','Publication'],authority_effect:'none',open_questions_ref:'README.md#open-questions'};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  if(process.argv.length!==2)throw Error('unsupported-argument');
  console.log(JSON.stringify(assessRegistration(),null,2));
}
