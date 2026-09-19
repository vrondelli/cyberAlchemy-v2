// Additive candidate; no live admission. Open questions: FINDING-REFERENCE-CANDIDATE-R1.md.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import Ajv from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/node_modules/ajv/dist/ajv.js';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {verifyInvestigationJoin,validateInvestigationFinding} from './compact-repair-evidence-join.mjs';
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
export function createFindingCatalog({joined,inputs,branch_id,limit=64}){
 assert.ok(verifyInvestigationJoin(joined,inputs),'finding-ref.join-integrity');
 assert.ok(Number.isSafeInteger(limit)&&limit>=0&&limit<=64,'finding-ref.catalog-limit');
 const branch=joined.branch_bindings.find(b=>b.branch_id===branch_id);assert.ok(branch,'finding-ref.branch');
 const allowed=new Set(branch.read_ids);
 const reads=joined.read_observations.filter(r=>allowed.has(r.id)).sort((a,b)=>b.confirmed_receipts.at(-1)-a.confirmed_receipts.at(-1)||a.id.localeCompare(b.id));
 const entries=reads.slice(0,limit).map((r,i)=>({ref:`${branch_id}:r${i+1}`,read_id:r.id,path:r.path,start_line:r.start_line,end_line:r.end_line,excerpt:r.body.slice(0,160)}));
 const body={schema:'are.finding-reference-catalog/v1',branch_id,join_sha256:joined.join_sha256,limit,omitted_reads:reads.length-entries.length,entries};
 return {...body,catalog_sha256:hash(body)};
}
export function findingReferenceTool(catalog){
 const refs=catalog.entries.map(e=>e.ref);
 return {type:'function',function:{name:'submit_investigation',description:'Submit provisional claims using only catalog references. Empty claims are allowed. References prove delivery, not claim correctness.',parameters:{type:'object',additionalProperties:false,required:['branch_id','claims'],properties:{branch_id:{const:catalog.branch_id,type:'string'},claims:{type:'array',maxItems:8,items:{type:'object',additionalProperties:false,required:['text','read_refs'],properties:{text:{type:'string',minLength:1,maxLength:1000,pattern:'\\S'},read_refs:{type:'array',minItems:1,maxItems:16,uniqueItems:true,items:refs.length?{type:'string',enum:refs}:{not:{}}}}}}}}}};
}
export function findingCatalogView(catalog){
 return {branch_id:catalog.branch_id,catalog_sha256:catalog.catalog_sha256,omitted_reads:catalog.omitted_reads,entries:catalog.entries.map(({read_id,...entry})=>entry)};
}
export function diagnoseFindingReferences({raw,catalog,joined,inputs}){
 assert.deepEqual(catalog,createFindingCatalog({joined,inputs,branch_id:catalog.branch_id,limit:catalog.limit}),'finding-ref.catalog-integrity');
 if(typeof raw!=='string'||Buffer.byteLength(raw)>8192)return {ok:false,issues:[{path:'',keyword:'maxBytes',message:'Submission must be a JSON string of at most 8192 bytes.'}]};
 let value;try{value=JSON.parse(raw);}catch{return {ok:false,issues:[{path:'',keyword:'parse',message:'Invalid JSON.'}]};}
 const validate=new Ajv({strict:true,allErrors:true,ownProperties:true}).compile(findingReferenceTool(catalog).function.parameters);
 if(!validate(value))return {ok:false,issues:validate.errors.map(e=>({path:e.instancePath,keyword:e.keyword,message:e.message,...(e.keyword==='required'?{field:e.params.missingProperty}:{}),...(e.keyword==='additionalProperties'?{field:e.params.additionalProperty}:{})}))};
 const refs=new Map(catalog.entries.map(e=>[e.ref,e.read_id]));
 const native={branch_id:value.branch_id,claims:value.claims.map(c=>({text:c.text,read_ids:c.read_refs.map(ref=>refs.get(ref))}))};
 if(Buffer.byteLength(JSON.stringify(native))>8192)return {ok:false,issues:[{path:'/claims',keyword:'expandedSize',message:'Claims exceed the native evidence limit after reference expansion; reduce claims or citations.'}]};
 const finding=validateInvestigationFinding({raw:JSON.stringify(native),branch_id:catalog.branch_id,joined,inputs});
 return {ok:true,finding,catalog_sha256:catalog.catalog_sha256};
}
export function findingFeedback(diagnostic){
 assert.equal(diagnostic.ok,false);
 // Preserve every issue in durable diagnostics; bound only the model projection.
 const issues=diagnostic.issues.slice(0,32);
 return {ok:false,issues,omitted_issue_count:diagnostic.issues.length-issues.length,instruction:'Correct the submission using only this catalog. Empty claims are allowed. Do not invent evidence.'};
}
export function assessReferenceExploration({receipts,envelope_tokens}){
 assert.ok(Number.isSafeInteger(envelope_tokens)&&envelope_tokens>0&&envelope_tokens<=8000);
 const models=receipts.filter(r=>r.kind==='model');let spent=0;
 for(const r of models){assert.ok(r.dispatched===true&&r.status===200&&!r.failure_code&&[r.input_tokens,r.output_tokens].every(n=>Number.isSafeInteger(n)&&n>=0),'finding-ref.unknown-usage');spent+=r.input_tokens+r.output_tokens;}
 return {explore:spent+envelope_tokens+8000<=24000&&models.length+3<=24,spent_tokens:spent,model_calls:models.length,finalization_reserve_tokens:8000,finalization_reserve_calls:2,maximum_finalization_envelope:4000};
}
