// Strict ARE delivery-ledger -> ContextBench trajectory adapter.
// Open questions: README.md. No gold annotations are accepted by this interface.
import {createHash} from 'node:crypto';
import {readFileSync, realpathSync} from 'node:fs';
import {resolve, relative, isAbsolute, sep} from 'node:path';
const hash=s=>createHash('sha256').update(s).digest('hex');
const need=(v,m)=>{if(!v)throw Error(m);};
const closed=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).every(k=>keys.includes(k));
export function exportTrajectory(ledger,repoRoot){
 need(closed(ledger,['schema_version','instance_id','repo_url','commit','events','final_event_ids']),'ledger.shape');
 need(ledger.schema_version==='are.context-delivery-ledger/v1','ledger.version');
 need(typeof ledger.instance_id==='string'&&ledger.instance_id.length>0,'ledger.instance');
 need(typeof ledger.repo_url==='string'&&ledger.repo_url.length>0&&/^[a-f0-9]{40}$/.test(ledger.commit),'ledger.source');
 need(Array.isArray(ledger.events)&&ledger.events.length>0&&ledger.events.length<=10000,'ledger.events');
 need(Array.isArray(ledger.final_event_ids)&&new Set(ledger.final_event_ids).size===ledger.final_event_ids.length,'ledger.final');
 const base=realpathSync(repoRoot),events=new Map(),steps=[],provenance=[];
 for(const e of ledger.events){
  need(closed(e,['id','path','start_line','end_line','body','source_sha256','delivered','turn','body_encoding']),'event.shape');
  need(typeof e.id==='string'&&e.id.length>0&&!events.has(e.id),'event.identity');
  need(typeof e.delivered==='boolean'&&Number.isSafeInteger(e.turn)&&e.turn>=0,'event.delivery');
  need(typeof e.path==='string'&&e.path.length>0&&!isAbsolute(e.path)&&!e.path.includes('\\')&&!e.path.split('/').some(p=>p==='..'||p==='.'||p===''),'event.path');
  const abs=realpathSync(resolve(base,e.path)),rel=relative(base,abs);
  need(rel&&!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel),'event.source-escape');
  const source=readFileSync(abs);need(/^[a-f0-9]{64}$/.test(e.source_sha256)&&hash(source)===e.source_sha256,'event.source-drift');
  const text=new TextDecoder('utf-8',{fatal:true}).decode(source),lines=text.match(/[^\n]*\n|[^\n]+$/g)??[];
  need(e.body_encoding===undefined||e.body_encoding==='legacy-line-join','event.body-encoding');
  need(Number.isSafeInteger(e.start_line)&&Number.isSafeInteger(e.end_line)&&e.start_line>=1&&e.end_line>=e.start_line&&e.end_line<=(e.body_encoding==='legacy-line-join'?text.split('\n').length:lines.length),'event.range');
  need(typeof e.body==='string'&&e.body===(e.body_encoding==='legacy-line-join'?text.split('\n').slice(e.start_line-1,e.end_line).join('\n'):lines.slice(e.start_line-1,e.end_line).join('')),'event.body-mismatch');
  need(e.start_line<=lines.length&&e.body.length>0,'event.empty-read');
  const spanEnd=Math.min(e.end_line,lines.length);
  events.set(e.id,{...e,end_line:spanEnd});
  if(e.delivered){steps.push({files:[e.path],spans:{[e.path]:[{start:e.start_line,end:spanEnd}]}});provenance.push({event_id:e.id,turn:e.turn,body_sha256:hash(e.body),source_sha256:e.source_sha256});}
 }
 const files=new Set(),spans={};
 for(const id of ledger.final_event_ids){const e=events.get(id);need(e?.delivered===true,'final.unconfirmed-event');files.add(e.path);(spans[e.path]??=[]).push({start:e.start_line,end:e.end_line});}
 need(steps.length>0,'instrument.no-delivered-context');
 // Missing final extraction is explicit, never substitute the union of archived reads.
 need(files.size>0,'instrument.no-final-context');
 return {prediction:{instance_id:ledger.instance_id,repo_url:ledger.repo_url,commit:ledger.commit,traj_data:{pred_steps:steps,pred_files:[...files].sort(),pred_spans:spans}},sidecar:{schema_version:'are.contextbench-export-evidence/v1',ledger_sha256:hash(JSON.stringify(ledger)),step_provenance:provenance,final_event_ids:ledger.final_event_ids,claim_ceiling:'Confirmed delivery and declared final selection only; neither proves semantic use.',authority_effect:'none'}};
}
