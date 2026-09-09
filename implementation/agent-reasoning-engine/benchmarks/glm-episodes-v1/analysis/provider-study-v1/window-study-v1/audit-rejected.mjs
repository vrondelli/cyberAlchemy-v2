// Supplemental semantic audit, never changes original trial outcome. Open questions: README.md#open-questions.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';
import {verify} from './common.mjs';
import {save,verifyFreeze,trialState} from '../controller.mjs';
import {parseBoundedJSON,diagnosePatch} from '../../../../../packages/coding-agent-runtime/patch-schema.mjs';
import {snapshotTree} from '../../../../../packages/coding-agent-runtime/verifier.mjs';
import {createContainerPublicValidator} from '../../../../../packages/coding-agent-runtime/container-public-validation.mjs';
const root=new URL('./',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex'),need=(x,m)=>{if(!x)throw Error(m);};
const id=process.argv[2],output=resolve(process.argv[3]),manifest=verify();
const row=JSON.parse(readFileSync(new URL('prepared/schedule.json',root))).find(r=>r.id===id);need(row,'unknown row');
const state=trialState(new URL('live/',root).pathname,row,manifest.digest);need(state.status==='completed'&&state.result.status==='BLOCK','only completed rejected trials');
const a=JSON.parse(readFileSync(join(state.root,'agent-result.json'))),e=a.final_response_evidence;need(e&&!e.truncated&&sha(e.text)===e.text_sha256,'incomplete response');
const parsed=parseBoundedJSON(e.text);need(parsed.ok,'unreadable response');const value=parsed.value,base=snapshotTree(join(state.root,'fixture'));
need(value.expected_base_tree_sha256===base.tree_sha256&&value.changes?.length===1,'scope invalid');const change=value.changes[0];need(change.path==='subject.mjs'&&change.operation==='replace-file'&&change.expected_file_sha256===base.files['subject.mjs']&&typeof change.utf8==='string','scope invalid');
mkdirSync(output);const subject=join(output,'candidate.mjs');writeFileSync(subject,change.utf8,{flag:'wx'});
const path=new URL(`prepared/fixtures/${row.fixture}/oracle.json`,root).pathname,cases=JSON.parse(readFileSync(path));
const plan={schema_version:'are.public-case-plan/v1',sources:[{path,sha256:sha(readFileSync(path))}],checks:cases.map((c,i)=>({...c,evidence:[{path,selector:'/'+i,value_sha256:sha(JSON.stringify(c))}]}))};
const validation=createContainerPublicValidator().validate({subject,plan});save(join(output,'validation.json'),validation);need(validation.worker_cleanup_verified,'worker cleanup unknown');
const d=diagnosePatch(value);save(join(output,'result.json'),{id,original_initial_pass:false,original_status:state.result.status,raw_response_sha256:e.text_sha256,agent_result_sha256:sha(readFileSync(join(state.root,'agent-result.json'))),schema_issues:d.issues,raw_source_semantics:validation.ok,passed:validation.passed,total:validation.total,interpretation:'Supplemental diagnostic only; schema rejection remains an end-to-end failure. No repaired submission or replacement trial.',authority_effect:'none',open_questions_ref:'../README.md#open-questions'});console.log(JSON.stringify({id,schema_issues:d.issues,passed:validation.passed,total:validation.total}));
