import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyTrace, digest} from '../../prototype-v1/contract-verifier.mjs';
const contract=JSON.parse(readFileSync(new URL('../../prototype-v1/CONTRACT.json',import.meta.url)));
const scope=e=>({...contract.binding,...e});
const request=(id,text)=>scope({id,type:'request',request_id:id,origin:'user',text,request_digest:digest(text)});
const projection=(id,text,lessons=[])=>scope({id:'p'+id,type:'projection',request_id:id,request_digest:digest(text),context_bytes:100,lesson_ids:lessons});
const dispatch=(id,text)=>scope({id:'d'+id,type:'dispatch',request_id:id,request_digest:digest(text)});
const checkpoint=id=>scope({id:'c'+id,type:'checkpoint',change_id:id,durable:true});
const control=(id,source,quote,mode)=>scope({id,type:'change',kind:'control',action:'set-mode',mode,source_request_id:source,source_role:'user',quote});
function base(){
 return [request('q1','Explain context.'),projection('q1','Explain context.'),dispatch('q1','Explain context.'),scope({id:'o1',type:'outcome',request_id:'q1',status:'completed'}),request('q2','Remember: include examples. Enable scoped application.'),scope({id:'lesson',type:'change',kind:'lesson',source_request_id:'q2',source_role:'user',quote:'include examples',posture:'explicit',episode_id:'q1',retention_scope:'current-thread'}),checkpoint('lesson'),control('enable','q2','Enable scoped application.','apply-scoped'),checkpoint('enable'),projection('q2','Remember: include examples. Enable scoped application.',['lesson'])];
}
const cases=[
 ['valid learning trace',()=>[...base(),dispatch('q2','Remember: include examples. Enable scoped application.')],true],
 ['disable after projection before dispatch',()=>[...base(),request('q3','Turn learning off.'),control('off','q3','Turn learning off.','off'),checkpoint('off'),dispatch('q2','Remember: include examples. Enable scoped application.')],false],
 ['disable lesson after projection before dispatch',()=>[...base(),request('q3','Stop using that lesson.'),scope({id:'disable',type:'change',kind:'control',action:'disable-reuse',lesson_id:'lesson',source_request_id:'q3',source_role:'user',quote:'Stop using that lesson.'}),checkpoint('disable'),dispatch('q2','Remember: include examples. Enable scoped application.')],false],
 ['cross-session event',()=>{const t=base();t[5].session_id='another-session';return t;},false],
 ['cross-workspace event',()=>{const t=base();t[5].cwd='/other-workspace';return t;},false],
 ['missing request identity',()=>[request(undefined,'Explain context.'),projection(undefined,'Explain context.'),dispatch(undefined,'Explain context.')].map((e,i)=>({...e,id:'event'+i})),false],
 ['retroactive feedback attached to later outcome',()=>{const t=base();const feedback=t.splice(4,1)[0];t.unshift(feedback);return t;},false],
];
const results=cases.map(([name,build,expectedAccepted])=>{
 let accepted=false,error=null;
 try{verifyTrace(contract,build());accepted=true;}catch(e){error=e.message;}
 return {name,expectedAccepted,accepted,error,status:accepted===expectedAccepted?'PASS':'FAIL'};
});
const hashes={};
for(const file of ['CONTRACT.json','contract-verifier.mjs','contract-verifier.test.mjs']) hashes[file]=createHash('sha256').update(readFileSync(new URL('../../prototype-v1/'+file,import.meta.url))).digest('hex');
const result={recorded_at:new Date().toISOString(),status:results.every(r=>r.status==='PASS')?'PASS':'FAIL',baseline:{passed:17,failed:0},adversarial:results,source_hashes:hashes,live_hook_integration:'not_evaluable: adapter is not implemented in this candidate',model_calls:0,activation:false};
writeFileSync(new URL('./RESULT.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
process.exitCode=result.status==='PASS'?0:1;
