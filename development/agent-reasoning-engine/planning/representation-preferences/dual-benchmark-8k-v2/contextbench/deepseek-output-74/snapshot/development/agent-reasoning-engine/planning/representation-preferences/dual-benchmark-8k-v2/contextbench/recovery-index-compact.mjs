// Receipt-bound historical paging only. No disk, providers or gold. Open questions: COMPACT-RECOVERY-CURSOR.md.
import {createHash} from 'node:crypto';
import {bindDelivery,stable} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/delivery.mjs';
import {recoverObservedRead} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/evidence-index.mjs';
const VERSION='historical-recovery-page-v2';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
const clone=x=>JSON.parse(stable(x));
const uint=x=>Number.isSafeInteger(x)&&x>=0;
const need=(x,code)=>{if(!x)throw Error('recovery-page.'+code);};
const fields=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===[...keys].sort().join(',');
function observations(archive){
 const b=bindDelivery(archive);need(b.unmapped.length===0,'unmapped-delivery');
 const ordered=[...b.read_observations].sort((a,b)=>Math.max(...b.confirmed_receipts)-Math.max(...a.confirmed_receipts)||a.id.localeCompare(b.id)),seen=new Set(),reads=[];
 for(const read of ordered){const identity=stable([read.path,read.source_sha256,read.start_line,read.end_line,read.body]);if(seen.has(identity))continue;seen.add(identity);reads.push(read);}
 return {reads,delivered_count:ordered.length,duplicate_count:ordered.length-reads.length};
}
export function createRecoverySnapshot({captures,receipts}){
 const archive=clone({captures,receipts}),{reads,delivered_count,duplicate_count}=observations(archive);
 // Fingerprint exact receipt/capture archive, including unsuccessful attempts. No source lookup.
 return {version:VERSION,fingerprint:hash({version:VERSION,archive}),archive,observation_count:reads.length,delivered_observation_count:delivered_count,duplicate_observation_count:duplicate_count};
}
function checked(snapshot){
 need(fields(snapshot,['version','fingerprint','archive','observation_count','delivered_observation_count','duplicate_observation_count'])&&snapshot.version===VERSION,'snapshot-shape');
 need(hash({version:VERSION,archive:snapshot.archive})===snapshot.fingerprint,'snapshot-integrity');
 const {reads,delivered_count,duplicate_count}=observations(snapshot.archive);need(snapshot.observation_count===reads.length&&snapshot.delivered_observation_count===delivered_count&&snapshot.duplicate_observation_count===duplicate_count,'snapshot-count');return reads;
}
function cursorFor(snapshot,offset){
 const body={v:VERSION,s:snapshot.fingerprint,o:offset};
 return offset+'.'+createHash('sha256').update(stable(body)).digest('base64url');
}
function cursorOffset(cursor,snapshot,total){
 if(cursor===null)return 0;
 need(typeof cursor==='string'&&/^[1-9][0-9]{0,14}\.[A-Za-z0-9_-]{43}$/.test(cursor),'cursor-format');
 const offset=Number(cursor.split('.')[0]);need(uint(offset)&&offset>0&&offset<total,'cursor-shape');
 need(cursor===cursorFor(snapshot,offset),'stale-cursor');return offset;
}
function render(snapshot,reads,offset,count){
 const end=offset+count,next=end<reads.length?cursorFor(snapshot,end):null;
 const entries=reads.slice(offset,end).map((r,i)=>({handle:'r'+(offset+i),path:r.path,start_line:r.start_line,end_line:r.end_line}));
 return {version:VERSION,snapshot:snapshot.fingerprint,entries,total:reads.length,offset,omitted:reads.length-count,next_cursor:next};
}
/** Returns model.text only when the COMPLETE serialized page fits both limits.
 * Hold the same private snapshot for traversal; newer archives yield stale cursors.
 */
export async function buildRecoveryPage({snapshot,cursor=null,max_entries=16,max_bytes=1024,max_tokens=256,measure_tokens}){
 need(uint(max_entries)&&max_entries>0&&max_entries<=16&&uint(max_bytes)&&max_bytes>0&&max_bytes<=1024&&uint(max_tokens)&&max_tokens>0&&max_tokens<=256&&typeof measure_tokens==='function','invalid-limits');
 const reads=checked(snapshot),offset=cursorOffset(cursor,snapshot,reads.length);let measurements=0;
 for(let count=Math.min(max_entries,reads.length-offset);count>= (reads.length?1:0);count--){
  const value=render(snapshot,reads,offset,count),text=stable(value),size=Buffer.byteLength(text);if(size>max_bytes)continue;
  const measured=await measure_tokens(text);measurements++;need(uint(measured),'invalid-token-measurement');if(measured>max_tokens)continue;
  const material={version:VERSION,status:reads.length?'ready':'empty',model:{text},private:{snapshot:snapshot.fingerprint,offset,count,read_ids:reads.slice(offset,offset+count).map(r=>r.id)},fit:{bytes:size,measured_tokens:measured,measurements,max_entries,max_bytes,max_tokens},next_cursor:value.next_cursor};
  return {...material,integrity_sha256:hash(material)};
 }
 return {version:VERSION,status:'unfit',model:null,next_cursor:null,snapshot:snapshot.fingerprint,offset,total:reads.length,omitted:reads.length,measurements,reason:'next-entry-or-envelope-cannot-fit',progress:false,required_action:'Increase permitted page budget within fixed bounds or explicitly stop; never retry the same cursor automatically.'};
}
/** Input is the already-decoded complete tool argument object, exactly {handle}.
 * Page receipt/presentation admission is caller-owned; this validates listed membership.
 */
export function resolveRecoveryRequest({snapshot,page,request}){
 const reads=checked(snapshot);
 need(fields(request,['handle'])&&typeof request.handle==='string'&&/^r(?:0|[1-9][0-9]*)$/.test(request.handle),'request-schema');
 need(fields(page,['version','status','model','private','fit','next_cursor','integrity_sha256']),'page-shape');
 const {integrity_sha256,...material}=page;need(hash(material)===integrity_sha256,'page-integrity');
 need(page.version===VERSION&&page.status==='ready'&&page.private.snapshot===snapshot.fingerprint,'stale-or-unready-page');
 const {offset,count,read_ids}=page.private;need(uint(offset)&&uint(count)&&count>0&&count<=16&&offset+count<=reads.length,'page-range');
 const expected=render(snapshot,reads,offset,count);need(page.model.text===stable(expected)&&page.next_cursor===expected.next_cursor&&stable(read_ids)===stable(reads.slice(offset,offset+count).map(r=>r.id)),'page-binding');
 const entry=expected.entries.find(e=>e.handle===request.handle);need(entry,'unlisted-handle');
 const index=Number(entry.handle.slice(1)),read=reads[index];
 return recoverObservedRead({...snapshot.archive,retrieval_handle:'observed-read:'+read.id});
}
