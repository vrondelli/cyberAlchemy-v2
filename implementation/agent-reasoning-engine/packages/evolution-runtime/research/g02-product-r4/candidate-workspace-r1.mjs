// Private experimental workspace, not authority or semantic proof.
// Open Questions: evidence/G02-NATIVE-CANDIDATE-WORKSPACE-R1.md.
import {createHash} from 'node:crypto';
const stable = x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)
  ?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const need=(v,r)=>{if(!v)throw Error('candidate-workspace.'+r);};
const safePath=p=>typeof p==='string'&&p.length>0&&p.length<=512&&!p.startsWith('/')&&
  !p.includes('\\')&&!p.split('/').some(x=>!x||x==='.'||x==='..')&&!/[\x00-\x1f]/.test(p);
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&
  Object.keys(x).sort().join(',')===[...keys].sort().join(',');
const text=(x,max)=>typeof x==='string'&&x.length>0&&x.length<=max&&x.trim()===x;

export const candidateWorkspaceTool={type:'function',function:{name:'update_candidate',
  description:'Record or revise an issue-relevance hypothesis. Plausible/discarded candidates require exact quotations from confirmed delivered base reads. A valid citation is not proof of causal responsibility. Keep unresolved verification questions explicit. This tool does not read files, select context, or apply changes.',
  parameters:{type:'object',additionalProperties:false,required:['path','status','reason','question','evidence'],properties:{
    path:{type:'string'},status:{type:'string',enum:['unverified','plausible','discarded']},
    reason:{type:'string',maxLength:240},question:{type:'string',maxLength:160},
    evidence:{type:'array',maxItems:2,items:{type:'object',additionalProperties:false,
      required:['read_id','start_line','end_line','quote'],properties:{read_id:{type:'string'},
        start_line:{type:'integer',minimum:1},end_line:{type:'integer',minimum:1},quote:{type:'string',maxLength:160}}}}
  }}}};

export function createCandidateWorkspace({confirmedReads,validateBaseRead,maximumCandidates=24,maximumBytes=8192}){
  need(typeof confirmedReads==='function'&&typeof validateBaseRead==='function','callbacks');
  need(Number.isSafeInteger(maximumCandidates)&&maximumCandidates>=1&&maximumCandidates<=24&&
       Number.isSafeInteger(maximumBytes)&&maximumBytes>=512&&maximumBytes<=8192,'bounds');
  const records=new Map();let generation=0;
  const project=(map=records,version=generation)=>{
    const state={schema_version:'are.g02-candidate-workspace/v1',generation:version,
      posture:'model-authored hypotheses; citations checked, responsibility not independently verified',
      candidates:structuredClone([...map.values()].sort((a,b)=>a.path.localeCompare(b.path))),authority_effect:'none'};
    const result={...state,state_sha256:hash(state)};
    need(Buffer.byteLength(stable(result))<=maximumBytes,'projection-byte-cap');return result;
  };
  const update=args=>{
    need(exact(args,['path','status','reason','question','evidence']),'shape');
    need(safePath(args.path)&&['unverified','plausible','discarded'].includes(args.status)&&
      text(args.reason,240)&&typeof args.question==='string'&&args.question.length<=160&&
      args.question.trim()===args.question,'record');
    need(args.status!=='unverified'||text(args.question,160),'unverified-question-required');
    need(Array.isArray(args.evidence)&&args.evidence.length<=2&&
      (args.status==='unverified'||args.evidence.length>0),'evidence-required');
    need(records.has(args.path)||records.size<maximumCandidates,'candidate-cap');
    const reads=confirmedReads();need(Array.isArray(reads),'delivery-shape');
    const known=new Map(reads.map(r=>[r.id,r]));const seen=new Set();
    const evidence=args.evidence.map(e=>{
      need(exact(e,['read_id','start_line','end_line','quote']),'citation-shape');
      need(typeof e.read_id==='string'&&/^[a-f0-9]{64}$/.test(e.read_id)&&
        Number.isSafeInteger(e.start_line)&&Number.isSafeInteger(e.end_line)&&
        e.start_line>=1&&e.end_line>=e.start_line&&text(e.quote,160),'citation-format');
      const read=known.get(e.read_id);need(read&&read.path===args.path,'citation-not-delivered-for-path');
      need(e.start_line>=read.start_line&&e.end_line<=read.end_line,'citation-outside-read');
      need(validateBaseRead(read)===true,'citation-base-provenance');
      const lines=read.body.split(/\r?\n/);
      const quoted=lines.slice(e.start_line-read.start_line,e.end_line-read.start_line+1).join('\n');
      need(quoted.includes(e.quote),'quote-not-in-cited-lines');
      const identity=stable(e);need(!seen.has(identity),'duplicate-citation');seen.add(identity);
      return {...e,source_sha256:read.source_sha256,first_confirmed_receipt:read.first_confirmed_receipt};
    });
    // Commit only after every citation and the full new projection fit.
    const next=new Map(records);next.set(args.path,{path:args.path,status:args.status,
      reason:args.reason,question:args.question,evidence});
    const projection=project(next,generation+1);records.set(args.path,next.get(args.path));generation++;
    return projection;
  };
  return Object.freeze({update,projection:()=>project()});
}
