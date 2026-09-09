import {textSha256,type SelectedSource} from './source-context';
// Open questions: ../../../../plans/orchestrator-integration/T5C-SOURCE-ENTRY.md.
export interface SourceTarget {source:SelectedSource;textSha256:string;runId?:string}
const destination=(kind:string)=>kind==='chat'?'#/chat':kind==='project'?'#/collections/projects':kind==='knowledge'?'#/apps/orchestrator/ontologies':null;
export function sourceHref(target:SourceTarget):string|null {
 const path=destination(target.source.kind);if(!path)return null;
 return path+'?origin='+encodeURIComponent(JSON.stringify(target));
}
export function sourceTarget(hash:string):SourceTarget|null {
 try{
  const raw=new URLSearchParams(hash.split('?')[1]??'').get('origin');if(!raw||raw.length>4096)return null;
  const value=JSON.parse(raw),s=value.source;
  if(!s||!['chat','project','knowledge'].includes(s.kind)||!['id','revision','selector'].every(k=>typeof s[k]==='string'&&s[k].trim()&&s[k].length<=512)||typeof value.textSha256!=='string'||!/^([a-f0-9]{64})$/.test(value.textSha256)||value.runId!==undefined&&(typeof value.runId!=='string'||value.runId.length>1024))return null;
  if(!hash.startsWith(destination(s.kind)+'?'))return null;
  return {source:{kind:s.kind,id:s.id,revision:s.revision,selector:s.selector},textSha256:value.textSha256,...(value.runId?{runId:value.runId}:{})};
 }catch{return null;}
}
export async function matchSource(target:SourceTarget,selected:SelectedSource|null,text:string|null):Promise<'matching'|'changed'|'unavailable'>{
 if(!selected||text===null||selected.kind!==target.source.kind||selected.id!==target.source.id||selected.selector!==target.source.selector)return 'unavailable';
 return selected.revision===target.source.revision&&await textSha256(text)===target.textSha256?'matching':'changed';
}
