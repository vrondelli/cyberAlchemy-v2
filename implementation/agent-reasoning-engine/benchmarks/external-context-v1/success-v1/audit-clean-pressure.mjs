// Measured pressure-transition evidence, separate from repair success.
// Open questions: CLEAN-PLAN.md.
import {readFileSync,writeFileSync} from 'node:fs';import {hash} from '../common.mjs';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,root))),r=read('evidence/pressure-strict-1/result.json'),captures=read('evidence/pressure-strict-1/captures.json');
const step=r.pressure?.injection_step,pre=captures.filter(c=>c.step===step+1&&c.generation===0&&c.prompt.includes('pressure ballast '));
const measurements=pre.map(c=>{const p=JSON.parse(c.prompt),q=hash({model:'glm-5.3-flash',messages:p.messages,tools:p.tools}),receipt=r.receipts.find(x=>x.kind==='tokenizer'&&x.request_sha256===q&&x.status===200);if(!receipt)throw Error('missing padded tokenizer receipt');return {step:c.step,prompt_sha256:c.prompt_sha256,request_bytes:Buffer.byteLength(c.prompt),input_tokens:receipt.input_tokens,retained_reasoning_reservation:receipt.retained_reasoning_reservation,projected_bound:receipt.input_tokens+receipt.retained_reasoning_reservation+512+2048};});
const post=r.recycling.dispatches[step+1];
const observed=Number.isInteger(step)&&measurements.some(m=>m.projected_bound>=12000)&&post?.generation>=1&&post.projected_upper_bound<12000;
const result={injection_step:step,padded_measurements:measurements,next_dispatch:post,measured_transition:!!observed,runner_transition:r.pressure,authority_effect:'none',open_questions_ref:'CLEAN-PLAN.md'};
writeFileSync(new URL('clean-pressure-transition.json',root),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result,null,2));
if(!observed)process.exitCode=1;
