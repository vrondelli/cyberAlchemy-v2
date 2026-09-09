// Join original outcomes and supplemental audits without replacing failed trials.
// Open questions: README.md#open-questions.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {root,read,sha,verify} from './common.mjs';
import {save,trialState} from '../controller.mjs';
import {parseBoundedJSON,diagnosePatch} from '../../../../../packages/coding-agent-runtime/patch-schema.mjs';
const manifest=verify(),sources=[],rows=[];
function pin(relative){const u=new URL(relative,root),bytes=readFileSync(u);sources.push({path:u.pathname,sha256:sha(bytes)});return JSON.parse(bytes);}
for(const row of read(new URL('prepared/schedule.json',root))){
 const state=trialState(new URL('live/',root).pathname,row,manifest.digest);assert.equal(state.status,'completed');
 const r=pin(`live/${row.id}/result.json`),a=pin(`live/${row.id}/agent-result.json`),e=a.final_response_evidence;
 assert.equal(sha(readFileSync(new URL(`live/${row.id}/agent-result.json`,root))),r.agent_result_sha256);
 assert.equal(e.truncated,false);assert.equal(sha(e.text),e.text_sha256);
 const parsed=parseBoundedJSON(e.text);assert.equal(parsed.ok,true);const candidate=parsed.value,diagnostic=diagnosePatch(candidate);
 assert.equal(candidate.changes.length,1);const change=candidate.changes[0];assert.equal(change.path,'subject.mjs');assert.equal(typeof change.utf8,'string');
 const unchanged=change.utf8===readFileSync(new URL(`live/${row.id}/fixture/subject.mjs`,root),'utf8');
 let validation;
 if(r.validation_sha256){validation=pin(`live/${row.id}/validation.json`);assert.equal(sources.at(-1).sha256,r.validation_sha256);}
 else {const audit=pin(`raw-audits/${row.id}/result.json`);assert.equal(audit.agent_result_sha256,r.agent_result_sha256);assert.equal(audit.raw_response_sha256,e.text_sha256);validation=pin(`raw-audits/${row.id}/validation.json`);assert.equal(audit.raw_source_semantics,validation.ok);}
 assert.equal(validation.subject_sha256,sha(change.utf8));assert.equal(validation.worker_cleanup_verified,true);assert.equal(validation.total,6);
 rows.push({id:row.id,arm:row.arm,window:row.soft_limit,qualified:r.qualified,schema_ok:diagnostic.ok,schema_issues:diagnostic.issues,unchanged_source:unchanged,raw_source_semantics:validation.ok,passed:validation.passed,total:validation.total});
}
assert.equal(rows.length,24);
const by_arm=['byte-baseline','contract-review'].map(arm=>{const rs=rows.filter(r=>r.arm===arm);return {arm,trials:rs.length,qualified:rs.filter(r=>r.qualified).length,schema_failures:rs.filter(r=>!r.schema_ok).length,unchanged_source:rs.filter(r=>r.unchanged_source).length,raw_semantic_passes:rs.filter(r=>r.raw_source_semantics).length};});
const report={trials:rows.length,by_arm,rows,sources,verifier_sha256:sha(readFileSync(new URL('summarize-causes.mjs',root))),interpretation:'Supplemental hidden tests cover all raw replacement sources. Original end-to-end outcomes remain unchanged. Schema and semantic causes can overlap; these are diagnostic counts, not independent causal effects.',authority_effect:'none',open_questions_ref:'README.md#open-questions'};
save(new URL('cause-summary.json',root),report);console.log(JSON.stringify({trials:rows.length,by_arm}));
