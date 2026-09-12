// Pinned-image attribution integration check; no repair knowledge. Open questions: README.md.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {fileURLToPath} from 'node:url';import {start,docker,cleanup,applyCandidate} from './container.mjs';import {hash} from '../common.mjs';
const root=fileURLToPath(new URL('./',import.meta.url)),image=JSON.parse(readFileSync(root+'../prepared/image.json')),name='are97-export-check-'+Date.now();const path='packages/svelte/src/compiler/phases/3-transform/client/visitors/SnippetBlock.js';const out=root+'evidence/export-preflight';mkdirSync(out);let report={authority_effect:'none',open_questions_ref:'../../README.md'};
try{
 start(name,image.id);docker(['cp',root+'stage.cjs',name+':/tmp/are-stage.cjs']);
 const initial=docker(['exec',name,'git','diff','--binary']);const source=docker(['exec',name,'cat',path]);
 const make=(old_text,new_text)=>JSON.parse(docker(['exec','-i',name,'node','/tmp/are-stage.cjs'],JSON.stringify({edits:[{path,old_text,new_text}]})));
 const first=source.slice(0,Math.min(200,source.length)),c=make(first,'// attribution preflight\n'+first);
 if(docker(['exec',name,'git','diff','--binary'])!==initial)throw Error('staging mutated base');
 if(c.patch.includes('diff --git a/package.json')||c.patch.includes('diff --git a/pnpm-lock.yaml'))throw Error('image edits leaked');applyCandidate(name,c);
 const dirty=docker(['exec',name,'cat',path]);const d=make(dirty.slice(0,200),'// second baseline delta\n'+dirty.slice(0,200));
 if(d.patch.includes('+// attribution preflight'))throw Error('dirty baseline duplicated');applyCandidate(name,d);
 report={...report,status:'passed',clean_target_delta:true,dirty_target_delta:true,stage_nonmutating:true,preexisting_dependency_changes_excluded:true,initial_image_diff_sha256:hash(initial)};
}catch(e){report.status='failed';report.error=e.message;throw e;}finally{cleanup(name);report.cleanup_verified=true;writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
