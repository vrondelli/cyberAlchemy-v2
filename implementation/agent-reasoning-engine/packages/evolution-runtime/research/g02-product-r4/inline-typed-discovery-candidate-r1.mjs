// Contingent source-only prototype, NOT integrated into the frozen native run.
// Open Questions: evidence/G02-TYPED-NAVIGATION-R2.json.
import{createHash}from'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
// Never invent acquisitions or change any ordinary observation field.
export function appendPartialDefinitionMetadata({result,index,maximumBytes=4096}){
 if(result?.ok!==true||!index||!['parsed','parsed-partial'].includes(index.status))return result;
 const o=result.output;
 if(!o||typeof o.utf8!=='string'||typeof o.path!=='string'||o.source_revision!=='base'||
  !Number.isSafeInteger(o.start_line)||!Number.isSafeInteger(o.end_line)||o.start_line<1||o.end_line<o.start_line||
  index.source_sha256!==o.source_sha256||!Array.isArray(index.definitions)||
  !Number.isSafeInteger(maximumBytes)||maximumBytes<512||maximumBytes>4096)return result;
 const definitions=index.definitions.filter(d=>d.kind==='function'&&d.start_line<=o.end_line&&d.end_line>=o.start_line&&
  (d.start_line<o.start_line||d.end_line>o.end_line));
 // Innermost overlapping definitions first; no issue, Gold or score ranking.
 definitions.sort((a,b)=>(a.end_line-a.start_line)-(b.end_line-b.start_line)||a.start_line-b.start_line||a.id.localeCompare(b.id));
 const metadata={discovery_only:true,incomplete_parse:index.incomplete_parse===true,
  reason:'This read intersects a function not fully acquired by this read. These are optional navigation hints, not evidence or final handles.',
  source_sha256:o.source_sha256,observation_body_sha256:sha(o.utf8),candidates:[],omitted_candidates:definitions.length};
 for(const d of definitions.slice(0,3)){
  const suggestion={id:d.id,qualified_name:d.qualified_name,signature:d.signature,signature_truncated:d.signature_truncated,
   definition_start_line:d.start_line,definition_end_line:d.end_line,
   read_file_args:{path:o.path,start_line:d.start_line,line_count:Math.min(100,d.end_line-d.start_line+1),revision:'base'}};
  const proposed={...metadata,candidates:[...metadata.candidates,suggestion],omitted_candidates:definitions.length-metadata.candidates.length-1};
  if(Buffer.byteLength(JSON.stringify(proposed))>maximumBytes)break;
  Object.assign(metadata,proposed);
 }
 if(!metadata.candidates.length)return result;
 return {...result,output:{...o,typed_navigation:metadata}};
}
