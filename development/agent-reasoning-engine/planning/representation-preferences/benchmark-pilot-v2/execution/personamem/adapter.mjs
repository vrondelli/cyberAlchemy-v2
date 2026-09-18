import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const directory=import.meta.dirname;
const digest=x=>createHash('sha256').update(x).digest('hex');
const read=p=>JSON.parse(readFileSync(join(directory,p),'utf8'));
export function adaptVisible(input){
 if(!Array.isArray(input.history?.chat_history)||input.query?.role!=='user'||typeof input.query.content!=='string')throw Error('invalid visible record');
 const messages=[],removed=[];
 for(const [index,m] of input.history.chat_history.entries()){
  if(m.role==='system'){
   if(index!==0||!m.content.startsWith('You are an AI assistant helping a user with the following persona:'))throw Error('unexpected system content');
   removed.push({index,reason:'oracle-persona-gold-isolation',sha256:digest(m.content)});continue;
  }
  if(!['user','assistant'].includes(m.role)||typeof m.content!=='string')throw Error('nontext history');
  messages.push({role:m.role,content:m.content});
 }
 messages.push({role:'user',content:input.query.content});
 return {messages,removed};
}
export function prepareTasks({split='development'}={}){
 if(!['development','reserved'].includes(split))throw Error('invalid split');
 const selection=read('selection.json');
 return selection.tasks.filter(t=>t.split===split).map(t=>{
  const file=t.task_id.split(':')[1],raw=readFileSync(join(directory,'source',file+'.history.json'));
  if(digest(raw)!==t.history_sha256)throw Error('history source drift');
  const visibleRaw=readFileSync(join(directory,'visible',file+'.json'));
  if(digest(visibleRaw)!==t.visible_sha256)throw Error('visible source drift');
  const input=JSON.parse(visibleRaw),{messages,removed}=adaptVisible(input);
  return {task_id:t.task_id,branch:'personamem',messages,treatment_projection:null,
   exposure:{selected_lessons:[],source:'existing-representation-lifecycle',status:'unmeasured',reason:'native history has no host-confirmed representation lesson; lifecycle probe required before freeze'},
   metadata:{split:t.split,stratum:t.stratum,persona_id:t.persona_id,history_sha256:t.history_sha256,visible_sha256:t.visible_sha256,variant:'text-history-without-oracle-persona-system',removed,upstream_token_count:t.upstream_token_count}};
 });
}
