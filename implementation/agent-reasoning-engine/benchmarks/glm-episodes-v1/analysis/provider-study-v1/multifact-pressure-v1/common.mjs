// Fixed study helpers. Open questions: README.md.
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {verifyFreeze} from '../controller.mjs';
export const root=new URL('./',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(p)),need=(x,m)=>{if(!x)throw Error(m);};
export function verify(){const m=read(new URL('prepared/manifest.json',root));need(verifyFreeze(new URL('../frozen/',root).pathname).digest===m.parent_freeze_digest,'parent drift');for(const f of m.sources)need(sha(readFileSync(new URL(f.path,root)))===f.sha256,'source drift '+f.path);for(const f of m.files)need(sha(readFileSync(new URL('prepared/'+f.path,root)))===f.sha256,'fixture drift '+f.path);return {...m,digest:sha(readFileSync(new URL('prepared/manifest.json',root)))};}
export function planFor(path){const cases=read(path);return {schema_version:'are.public-case-plan/v1',sources:[{path,sha256:sha(readFileSync(path))}],checks:cases.map((c,i)=>({...c,evidence:[{path,selector:'/'+i,value_sha256:sha(JSON.stringify(c))}]}))};}
export function exposure(a,selected,task){
 const prompts=selected.map(s=>JSON.parse(s.prompt)),last=prompts.at(-1);
 const present=(body,f)=>!!body&&body.messages.some(m=>{try{const o=JSON.parse(m.content);return m.role==='tool'&&o.ok===true&&o.tool_name==='read-file'&&o.output?.path===f.path&&o.output.sha256===f.sha256&&o.output.utf8===f.utf8;}catch{return false;}});
 return {facts:task.facts.map(f=>({key:f.key,path:f.path,delivered:prompts.some(p=>present(p,f)),present_at_final:present(last,f)})),recycles:a.recycling?.recycles??null};
}
