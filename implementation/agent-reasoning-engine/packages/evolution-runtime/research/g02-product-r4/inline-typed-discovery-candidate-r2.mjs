// Optional structural orientation, not evidence acquisition or span expansion.
// Open Questions: evidence/G02-INLINE-TYPED-DISCOVERY-CANDIDATE-R2.json.
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
export function appendPartialDefinitionMetadata({result,index,maximumBytes=4096}) {
 if(result?.ok!==true||!index||!['parsed','parsed-partial'].includes(index.status))return result;
 const o=result.output;
 if(!o||typeof o.utf8!=='string'||typeof o.path!=='string'||o.source_revision!=='base'||
  !Number.isSafeInteger(o.start_line)||!Number.isSafeInteger(o.end_line)||o.start_line<1||o.end_line<o.start_line||
  index.source_sha256!==o.source_sha256||!Array.isArray(index.definitions)||
  !Number.isSafeInteger(maximumBytes)||maximumBytes<512||maximumBytes>4096)return result;
 const eligible=index.definitions.filter(d=>['function','class'].includes(d.kind)&&
  typeof d.id==='string'&&typeof d.qualified_name==='string'&&typeof d.signature==='string'&&
  Number.isSafeInteger(d.start_line)&&Number.isSafeInteger(d.end_line)&&d.start_line>=1&&d.end_line>=d.start_line&&
  d.start_line<=o.end_line&&d.end_line>=o.start_line&&(d.start_line<o.start_line||d.end_line>o.end_line));
 const order=(a,b)=>(a.end_line-a.start_line)-(b.end_line-b.start_line)||a.start_line-b.start_line||a.id.localeCompare(b.id);
 const functions=eligible.filter(d=>d.kind==='function').sort(order),classes=eligible.filter(d=>d.kind==='class').sort(order);
 // A single containing class provides orientation; never imply its full body was read.
 const selected=[...functions.slice(0,classes.length?2:3),...classes.slice(0,1)];
 const metadata={discovery_only:true,incomplete_parse:index.incomplete_parse===true,
  reason:'Optional structural orientation for definitions intersecting this partial read. Class suggestions acquire only a short header window. These hints are not evidence or terminal handles; acquire relevant source with ordinary read_file.',
  source_sha256:o.source_sha256,observation_body_sha256:sha(o.utf8),candidates:[],omitted_candidates:eligible.length};
 for(const d of selected){
  const suggestion={id:d.id,kind:d.kind,qualified_name:d.qualified_name,signature:d.signature,signature_truncated:d.signature_truncated,
   definition_start_line:d.start_line,definition_end_line:d.end_line,
   suggested_read_scope:d.kind==='class'?'header-window-not-full-class':'bounded-definition-window',
   read_file_args:{path:o.path,start_line:d.start_line,line_count:Math.min(d.kind==='class'?10:100,d.end_line-d.start_line+1),revision:'base'}};
  const proposed={...metadata,candidates:[...metadata.candidates,suggestion],omitted_candidates:eligible.length-metadata.candidates.length-1};
  if(Buffer.byteLength(JSON.stringify(proposed))>maximumBytes)continue;
  Object.assign(metadata,proposed);
 }
 if(!metadata.candidates.length)return result;
 return {...result,output:{...o,typed_navigation:metadata}};
}
