// Study-only observation hook. Open questions: ../research/FACT-PROBE-DESIGN.md.
import assert from 'node:assert/strict';
import {sha} from './common.mjs';
const stable=value=>JSON.stringify(value,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
export function captureAdapter(adapter){
 const rendered=new Map();
 return {adapter:Object.freeze({binding:adapter.binding,evidence:adapter.evidence,
  decorate(prompt){const result=adapter.decorate(prompt),digest=sha(JSON.stringify(result));if(rendered.has(digest))assert.equal(rendered.get(digest),result);rendered.set(digest,result);return result;},
  normalize:(...args)=>adapter.normalize(...args)}),
  selected(result,{model,maximum_output_tokens=2048}){
   const models=result.receipts.filter(r=>r.kind==='model'),dispatches=result.recycling.dispatches;assert.equal(models.length,dispatches.length);
   return dispatches.map((dispatch,i)=>{
    const prompt=rendered.get(dispatch.prompt_digest);assert.equal(typeof prompt,'string','selected prompt was not observed');
    const value=JSON.parse(prompt),receipt=models[i];assert.deepEqual(Object.keys(value).sort(),['messages','tools']);
    const body={...value,model,stream:false,max_tokens:maximum_output_tokens,thinking:{type:'enabled',clear_thinking:false},reasoning_effort:receipt.reasoning_effort};
    assert.equal(sha(stable(body)),receipt.request_sha256,'selected prompt does not match physical model receipt');
    const tokenHash=sha(stable({model,messages:value.messages,tools:value.tools}));
    assert.ok(result.receipts.some(r=>r.kind==='tokenizer'&&r.request_sha256===tokenHash&&r.status===200),'selected prompt lacks successful tokenizer receipt');
    return {sequence:dispatch.sequence,generation:dispatch.generation,prompt_digest:dispatch.prompt_digest,prompt,model_request_sha256:receipt.request_sha256,tokenizer_request_sha256:tokenHash,authority_effect:'none'};
   });
  }};
}
