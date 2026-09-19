// Branch-local native binding, global receipt coordinates. Open questions: INDEPENDENT-EVIDENCE-JOIN.md.
import {createHash} from 'node:crypto';
import {bindDelivery,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const need=(v,m)=>{if(!v)throw Error('independent-join.'+m);};
const uint=n=>Number.isSafeInteger(n)&&n>=0,hash=x=>createHash('sha256').update(stable(x)).digest('hex');
/** Partial arm view: unassigned receipts remain explicit. Never claims complete arm accounting. */
export function bindInvestigationEvidence({branches,receipts}){
 need(Array.isArray(branches)&&branches.length>=1&&branches.length<=3&&Array.isArray(receipts),'inputs');
 need(receipts.every(r=>r&&typeof r==='object'&&!Array.isArray(r)),'receipt-shape');
 const branchIds=new Set(),assigned=new Set(),reads=new Map(),memberships=[],requests=[],branch_bindings=[];
 for(const branch of branches){
  need(branch&&/^q[1-3]$/.test(branch.branch_id)&&!branchIds.has(branch.branch_id),'branch-identity');branchIds.add(branch.branch_id);
  need(Array.isArray(branch.receipt_indices)&&branch.receipt_indices.length>0&&Array.isArray(branch.captures),'branch-inputs');
  let previous=-1;for(const i of branch.receipt_indices){need(uint(i)&&i<receipts.length&&i>previous&&!assigned.has(i),'receipt-assignment');previous=i;assigned.add(i);}
  const localReceipts=branch.receipt_indices.map(i=>receipts[i]);
  // Capture bytes and native tool IDs are untouched. Bind separately to avoid cross-conversation ID conflation.
  const binding=bindDelivery({captures:branch.captures,receipts:localReceipts});
  need(binding.unmapped.length===0&&binding.token_accounting.cost_complete,'unconfirmed-branch');
  need(binding.requests.every(r=>r.posture==='confirmed-successful-request'),'unsuccessful-branch');
  need(binding.requests.length>0,'branch-without-model-request');
  const localReads=[];
  for(const read of binding.read_observations){
   const mapped={...read,first_confirmed_receipt:branch.receipt_indices[read.first_confirmed_receipt],confirmed_receipts:read.confirmed_receipts.map(i=>branch.receipt_indices[i])};
   const existing=reads.get(read.id);
   if(existing){const material=x=>Object.fromEntries(Object.entries(x).filter(([k])=>!['first_confirmed_receipt','confirmed_receipts'].includes(k)));need(stable(material(existing))===stable(material(mapped)),'native-id-conflict');existing.confirmed_receipts=[...new Set([...existing.confirmed_receipts,...mapped.confirmed_receipts])].sort((a,b)=>a-b);existing.first_confirmed_receipt=existing.confirmed_receipts[0];}
   else reads.set(read.id,mapped);
   localReads.push(read.id);memberships.push({branch_id:branch.branch_id,native_read_id:read.id,global_receipt_indices:mapped.confirmed_receipts});
  }
  for(const request of binding.requests)requests.push({...request,receipt_index:branch.receipt_indices[request.receipt_index],branch_id:branch.branch_id,capture_indices_scope:'branch-local'});
  branch_bindings.push({branch_id:branch.branch_id,receipt_indices:[...branch.receipt_indices],read_ids:localReads.sort(),captures_sha256:hash(branch.captures),receipts_sha256:hash(localReceipts),token_accounting:binding.token_accounting});
 }
 const read_observations=[...reads.values()].sort((a,b)=>a.id.localeCompare(b.id));
 const toolIds=new Map();for(const r of read_observations){if(!toolIds.has(r.tool_call_id))toolIds.set(r.tool_call_id,[]);toolIds.get(r.tool_call_id).push(r.id);}
 const body={schema:'are.independent-evidence-join/v1',branch_bindings,requests:requests.sort((a,b)=>a.receipt_index-b.receipt_index),read_observations,memberships,tool_id_collisions:[...toolIds].filter(([,ids])=>ids.length>1).map(([tool_call_id,read_ids])=>({tool_call_id,read_ids})),unassigned_receipt_indices:receipts.flatMap((_,i)=>assigned.has(i)?[]:[i]),receipts_sha256:hash(receipts),claim_ceiling:'Branch-confirmed delivered observations only; not final selection, source validation or whole-arm accounting.',authority_effect:'none'};
 return {...body,join_sha256:hash(body)};
}
export function verifyInvestigationJoin(joined,inputs){try{return stable(joined)===stable(bindInvestigationEvidence(inputs));}catch{return false;}}
export function validateInvestigationFinding({raw,branch_id,joined,inputs}){
 need(verifyInvestigationJoin(joined,inputs),'finding-join-integrity');
 need(typeof raw==='string'&&Buffer.byteLength(raw)<=8192,'finding-size');let value;try{value=JSON.parse(raw);}catch{throw Error('independent-join.finding-json');}
 need(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')==='branch_id,claims'&&value.branch_id===branch_id&&Array.isArray(value.claims)&&value.claims.length<=8,'finding-schema');
 const allowed=new Set(joined.branch_bindings.find(x=>x.branch_id===branch_id)?.read_ids??[]);need(joined.branch_bindings.some(x=>x.branch_id===branch_id),'finding-branch');
 for(const c of value.claims){need(c&&typeof c==='object'&&!Array.isArray(c)&&Object.keys(c).sort().join(',')==='read_ids,text'&&typeof c.text==='string'&&c.text.trim().length>0&&c.text.length<=1000&&Array.isArray(c.read_ids)&&c.read_ids.length>=1&&c.read_ids.length<=16&&new Set(c.read_ids).size===c.read_ids.length&&c.read_ids.every(id=>allowed.has(id)),'finding-unbound-claim');}
 return {branch_id,claims:value.claims,posture:'provisional-model-claims',join_sha256:joined.join_sha256};
}
