import {hash,stable,need} from "file:///home/vrondelli/projects/cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/coding-agent-runtime/glm-flash-v1/transport.mjs";

export const PAGE_CHARS=5000;
const split=(text,n)=>n>0&&n<text.length&&/[\uD800-\uDBFF]/.test(text[n-1])&&/[\uDC00-\uDFFF]/.test(text[n]);
const integer=n=>Number.isSafeInteger(n)&&n>=0;

// The allowlisted runtime performs the read. This adapter changes only the
// returned body, keeping the full file hash and explicit half-open page bounds.
export function pageObservation(observation,args,maximumChars=PAGE_CHARS){
 need([4000,5000,5500].includes(maximumChars),'page-limit-invalid');
 if(!observation.ok)return observation;
 const o=observation.output,text=o?.utf8,offset=args.offset??0;
 need(typeof text==='string'&&o.path===args.path&&hash(text)===o.sha256,'page-source-invalid');
 need(integer(offset)&&offset<=text.length&&!split(text,offset),'page-offset-invalid');
 if(text.length<=maximumChars&&Buffer.byteLength(text,'utf8')<=maximumChars&&offset===0)return observation;
 let end=Math.min(text.length,offset+maximumChars);let low=offset,high=end;while(low<high){const mid=Math.ceil((low+high)/2);if(Buffer.byteLength(text.slice(offset,mid),'utf8')<=maximumChars)low=mid;else high=mid-1;}end=low;if(split(text,end))end--;
 const output={path:o.path,sha256:o.sha256,paged:true,offset_unit:'utf16-code-units',offset,next_offset:end,total_chars:text.length,eof:end===text.length,utf8:text.slice(offset,end)};
 output.page_sha256=hash(output.utf8);
 return {ok:true,schema_version:'are.glm-file-page/v1',tool_name:'read-file',arguments:args,output,
  output_sha256:hash(stable(output)),output_bytes:Buffer.byteLength(stable(output)),effect_calls:0,authority_effect:'none'};
}

// A page hash alone does not prove source identity. Only gap-free assembled
// text matching the pinned full-file hash can establish complete delivery.
export function projectPagedFiles(history,files,confirmed=new Set(),maximumChars=PAGE_CHARS){
 const groups=new Map();
 for(const [turn,e] of history.entries())for(const [i,c] of (e.calls??[]).entries()){
  const obs=e.observations?.[i],o=obs?.output;
  if(c.name!=='read-file'||obs?.ok!==true||o?.paged!==true)continue;
  const path=c.arguments?.path;
  need(o.path===path&&o.sha256===files[path]&&typeof o.utf8==='string'&&o.page_sha256===hash(o.utf8)
   &&o.offset_unit==='utf16-code-units'&&integer(o.offset)&&integer(o.next_offset)&&integer(o.total_chars)
   &&o.offset===(c.arguments.offset??0)&&o.next_offset<=o.total_chars&&o.next_offset-o.offset===o.utf8.length
   &&o.utf8.length<=maximumChars&&(o.utf8.length>0||o.offset===o.total_chars)&&o.eof===(o.next_offset===o.total_chars), 'page-range-invalid');
  const native=e.messages?.[0]?.tool_calls?.[i],result=e.messages?.[i+1];let args;
  try{args=typeof native?.function?.arguments==='string'?JSON.parse(native.function.arguments):native?.function?.arguments;}catch{need(false,'page-protocol-invalid');}
  need(native?.id===c.id&&native?.function?.name==='read-file'&&stable(args)===stable(c.arguments)
   &&result?.role==='tool'&&result.tool_call_id===c.id&&result.content===stable(obs),'page-protocol-invalid');
  if(!groups.has(path))groups.set(path,{path,sha256:o.sha256,total_chars:o.total_chars,first_turn:turn,pages:[]});
  const g=groups.get(path);need(g.total_chars===o.total_chars,'page-source-drift');
  g.pages.push({...o,confirmed:confirmed.has(c.id)});
 }
 return [...groups.values()].map(g=>{
  const assemble=pages=>{
   let text='';const ranges=[];
   for(const o of pages.sort((a,b)=>a.offset-b.offset||a.next_offset-b.next_offset)){
    if(o.offset>text.length)continue;
    const overlap=Math.min(text.length-o.offset,o.utf8.length);
    need(text.slice(o.offset,o.offset+overlap)===o.utf8.slice(0,overlap),'page-overlap-mismatch');
    text+=o.utf8.slice(overlap);ranges.push([o.offset,o.next_offset]);
   }
   const complete=text.length===g.total_chars;
   if(complete)need(hash(text)===g.sha256,'page-assembled-hash-mismatch');
   return {complete,covered:text.length,ranges};
  };
  const all=assemble([...g.pages]),delivered=assemble(g.pages.filter(p=>p.confirmed));
  return {path:g.path,sha256:g.sha256,total_chars:g.total_chars,first_turn:g.first_turn,read_complete:all.complete,
   full_file_delivered:delivered.complete,delivered_ranges:delivered.ranges,eof_received:g.pages.some(p=>p.confirmed&&p.eof),first_missing_offset:delivered.complete?null:delivered.covered};
 });
}


// Advisory native arguments, derived from validated coverage. Never rewrites
// a model call and never treats current prompt projection as confirmed delivery.
export function nextPageRead(missingPaths,files){
 const path=missingPaths[0];if(path===undefined)return null;
 const file=files.find(f=>f.path===path),offset=file?file.first_missing_offset:0;
 need(typeof path==='string'&&path.length>0&&integer(offset),'page-next-read-invalid');
 return {name:'read-file',arguments:{path,offset}};
}
