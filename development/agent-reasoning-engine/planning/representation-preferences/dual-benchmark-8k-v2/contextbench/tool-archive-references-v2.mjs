import {deferReadOnlyOutputs} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/output-deferral.mjs';
// Fresh-run journal references. Open questions: TOOL-ARCHIVE-REFERENCES.md.
import {createHash} from 'node:crypto';
import {openSync,closeSync,readSync,lstatSync,existsSync} from 'node:fs';
import {stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const need=(v,m)=>{if(!v)throw Error('tool-archive.'+m);};
const uint=x=>Number.isSafeInteger(x)&&x>=0;
function size(path){if(!existsSync(path))return 0;const s=lstatSync(path);need(s.isFile()&&!s.isSymbolicLink(),'regular-journal');return s.size;}
function readRange(path,offset,length){
 need(uint(offset)&&uint(length)&&length>0&&length<=16*1024**2&&offset+length<=size(path),'range');
 const fd=openSync(path,'r'),bytes=Buffer.alloc(length);
 try{let n=0;while(n<length){const got=readSync(fd,bytes,n,length-n,offset+n);need(got>0,'short-read');n+=got;}}finally{closeSync(fd);}
 return bytes;
}
function source(event){
 if(event.kind==='source-tool-result')return {tool:event.call?.function?.name,result:event.output};
 if(event.kind==='tool-result')return {tool:event.tool,result:event.output};
 return null;
}
export function resolveToolArchiveReference({journal,record}){
 need(record?.schema==='are.tool-output-archive-reference/v1'&&record.delivery==='unconfirmed','schema');
 const ref=record.result_ref;
 need(ref&&uint(ref.offset)&&uint(ref.length)&&uint(ref.before_offset)&&ref.offset+ref.length<=ref.before_offset&&ref.before_offset<=size(journal),'backward-reference');
 const raw=readRange(journal,ref.offset,ref.length);
 need(raw.at(-1)===10&&hash(raw)===ref.line_sha256,'source-line-digest');
 if(ref.offset)need(readRange(journal,ref.offset-1,1)[0]===10,'line-boundary');
 const event=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw)),item=source(event);
 need(item&&item.tool===record.call?.function?.name&&item.result!==undefined,'source-kind');
 need(hash(stable(item.result))===record.sha256,'result-digest');
 return {schema:'are.tool-output-archive/v1',call:structuredClone(record.call),result:structuredClone(item.result),sha256:record.sha256,delivery:'unconfirmed'};
}
/** All writers to this fresh journal must use this synchronous append wrapper. */
export function createToolArchiveJournal({journal,append}){
 need(typeof append==='function'&&size(journal)===0,'fresh-journal');
 let offset=0,failed=false;const outputs=new Map();
 return value=>{
  need(!failed&&size(journal)===offset,'journal-drift');
  try{
   let event=value;
   if(value.kind==='tool-output-archive'){
    const r=value.record;need(r?.schema==='are.tool-output-archive/v1'&&r.delivery==='unconfirmed'&&hash(stable(r.result))===r.sha256,'archive-record');
    let ref=outputs.get(stable([r.call?.function?.name,r.sha256]));
    if(!ref&&r.result?.error==='tool-output-deferred'){
     const original=outputs.get(stable([r.call?.function?.name,r.result.result_digest]));need(original,'missing-deferral-source');
     const origin={schema:'are.tool-output-archive-reference/v1',call:structuredClone(r.call),sha256:r.result.result_digest,delivery:'unconfirmed',result_ref:{...original,before_offset:offset}};
     const restored=resolveToolArchiveReference({journal,record:origin});
     const projection=deferReadOnlyOutputs([{role:'assistant',tool_calls:[r.call]},{role:'tool',tool_call_id:r.call.id,content:stable(restored.result)}]);
     need(projection.deferrals.length===1&&projection.exchange[1].content===stable(r.result),'deferral-derivation');
     event={kind:'tool-output-deferral-archive',record:{...structuredClone(r),origin}};
    }else{
    need(ref,'missing-source-output');
    const record={schema:'are.tool-output-archive-reference/v1',call:structuredClone(r.call),sha256:r.sha256,delivery:'unconfirmed',result_ref:{...ref,before_offset:offset}};
    resolveToolArchiveReference({journal,record});event={kind:'tool-output-archive-reference',record};
    }
   }
   const text=stable(event)+'\n',length=Buffer.byteLength(text);
   const result=append(text);need(!result||typeof result.then!=='function','synchronous-writer-required');
   need(size(journal)===offset+length,'append-size');
   const actual=readRange(journal,offset,length);need(hash(actual)===hash(text),'append-bytes');
   const item=source(event);
   if(item&&typeof item.tool==='string'&&item.result!==undefined)outputs.set(stable([item.tool,hash(stable(item.result))]),{offset,length,line_sha256:hash(actual)});
   offset+=length;return event;
  }catch(error){failed=true;throw error;}
 };
}
