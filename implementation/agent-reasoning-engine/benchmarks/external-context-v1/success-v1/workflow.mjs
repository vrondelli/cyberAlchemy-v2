// Bounded workflow state. Open questions: README.md.
import {hash} from '../common.mjs';
export function createWorkflow(){
 let hypotheses=[],probeRequests=0;const candidates=new Map(),results=new Map();
 return {
  hypotheses(value){if(value.length<2||value.length>3)throw Error('competing hypotheses required');hypotheses=structuredClone(value);return {ok:true,count:hypotheses.length};},
  stage(value,seen){if(hypotheses.length<2)throw Error('record competing hypotheses first');if(value.files.some(f=>!seen.has(f.path)))throw Error('uninspected mutation');const candidate_id=hash(value);if(!candidates.has(candidate_id)&&candidates.size>=2)throw Error('candidate budget exhausted');const candidate={...value,candidate_id};candidates.set(candidate_id,candidate);return candidate;},
  candidate(id){const c=candidates.get(id);if(!c)throw Error('unknown candidate');return c;},
  reserveProbe(){if(probeRequests>=4)throw Error('probe budget exhausted');probeRequests++;},
  recordProbe(id,r){if(id!=='baseline'&&!candidates.has(id))throw Error('unknown candidate');if(r.candidate_id!==id)throw Error('probe candidate mismatch');results.set(id,{status:r.status,probe_id:r.probe_id,log_sha256:r.log_sha256,excerpt:r.excerpt?.slice(-1600)});},
  finalize(id){const c=this.candidate(id);return {...c,public_test:results.get(id)??null};},
  snapshot(){return {hypotheses:structuredClone(hypotheses),candidates:[...candidates.values()].map(c=>({candidate_id:c.candidate_id,files:c.files,test:results.get(c.candidate_id)??null})),probe_requests:probeRequests,baseline:results.get('baseline')??null};},
  notice(remaining){return JSON.stringify({remaining_model_calls:remaining,state:this.snapshot(),instruction:'Source reads show the initial base. Stage complete edits against that base. Use exact candidate IDs when testing/finalizing. Test evidence applies only to its candidate. Reserve the final four calls for review and finalization.'});}
 };
}
