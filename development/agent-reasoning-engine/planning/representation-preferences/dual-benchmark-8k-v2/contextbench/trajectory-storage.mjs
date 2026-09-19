// Full trajectory storage supervision. Open questions: TRAJECTORY-STORAGE.md.
import {lstatSync,readdirSync,realpathSync} from 'node:fs';
import {resolve,join,relative,sep} from 'node:path';
import {guardStorage} from '../storage-host-small-run.mjs';
import {createStageOutputGuard,MAXIMUM_STAGE_BYTES} from './trajectory-output-guard.mjs';
import {createStagePersistence} from './packet-diversity-v1/stage-persistence.mjs';
export const MAXIMUM_SOURCE_BYTES=2*1024**3;
const need=(x,m)=>{if(!x)throw Error('trajectory-storage.'+m);};
const within=(a,b)=>{const r=relative(a,b);return r===''||(!r.startsWith('..'+sep)&&r!=='..'&&!r.startsWith(sep));};
export function createTrajectoryStorage({evidence_root,source_root,binding,tasks,host_guard=guardStorage}){
 const evidence=resolve(evidence_root),sources=resolve(source_root);
 need(realpathSync(evidence)===evidence&&realpathSync(sources)===sources,'canonical-roots');
 need(lstatSync(evidence).isDirectory()&&lstatSync(sources).isDirectory()&&!within(evidence,sources)&&!within(sources,evidence),'separate-roots');
 need(Array.isArray(tasks)&&tasks.length>0&&tasks.every(t=>/^[a-zA-Z0-9_-]+$/.test(t.id)&&typeof t.repository_cache==='string'&&/^[a-f0-9]{40}$/.test(t.base_commit))&&new Set(tasks.map(t=>t.id)).size===tasks.length,'tasks');
 const allowed=new Map(tasks.flatMap(t=>['control','treatment'].map(arm=>[t.id+'-r1-'+arm,t])));
 const guard=createStageOutputGuard({root:evidence}),persistence=createStagePersistence({stage_guard:guard,stage_root:evidence});
 let stopped=false;
 function sourceUsage(){
  need(realpathSync(sources)===sources,'source-root-drift');let bytes=0,entries=0;
  function walk(path){
   need(++entries<=100000,'source-entry-limit');const stat=lstatSync(path);
   need(!stat.isSymbolicLink()&&(stat.isFile()||stat.isDirectory()),'source-file-kind');
   bytes+=Math.max(stat.size,stat.blocks*512);need(Number.isSafeInteger(bytes)&&bytes<=MAXIMUM_SOURCE_BYTES,'source-byte-limit');
   if(stat.isDirectory())for(const name of readdirSync(path))walk(join(path,name));
  }
  for(const name of readdirSync(sources))need(allowed.has(name),'unassigned-source-tree');
  walk(sources);return {bytes,entries};
 }
 function check(){
  need(!stopped,'stopped');try{
   const source=sourceUsage(),state=guard.snapshot();need(!state.poisoned,'evidence-poisoned');
   const growth=Math.max(0,MAXIMUM_SOURCE_BYTES-source.bytes)+Math.max(0,MAXIMUM_STAGE_BYTES-state.bytes);
   const host=host_guard({binding,output:evidence,growth_reservation_bytes:growth});need(host?.admitted===true,'host-denied');
   const source_host=host_guard({binding,output:sources,growth_reservation_bytes:growth});need(source_host?.admitted===true,'source-host-denied');
   return {source,evidence:state,host,source_host};
  }catch(e){stopped=true;throw e;}
 }
 function admit_source({task,cache,source_root,phase}){
  need(['before-prepare','before-base','before-work'].includes(phase),'source-phase');
  const path=resolve(source_root),name=relative(sources,path),expected=allowed.get(name);
  need(expected&&path===join(sources,name)&&resolve(cache)===resolve(expected.repository_cache)&&task.base_commit===expected.base_commit,'source-assignment');
  check();return true;
 }
 check();return Object.freeze({persistence,guard,check,admit_source,evidence_root:evidence,source_root:sources});
}
