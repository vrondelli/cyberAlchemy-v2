// Post-run attribution repair. Never alters original rollout evidence. Open questions: PLAN.md.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {execFileSync,spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {hash} from '../common.mjs';import {validateArgs} from '../contract.mjs';
const root=fileURLToPath(new URL('./',import.meta.url)),read=p=>JSON.parse(readFileSync(root+p)),out=root+'evidence/export-review';mkdirSync(out);
const responses=read('evidence/live/responses.json'),events=read('evidence/live/events.json'),call=responses.at(-1).message.tool_calls;
if(call.length!==1||call[0].function.name!=='submit_patch_candidate')throw Error('not sole submission');
const v=validateArgs('submit_patch_candidate',call[0].function.arguments);if(!v.ok)throw Error('invalid final submission');
const seen=new Set(events.filter(e=>e.tool==='read_file'&&e.result.ok).map(e=>e.arguments.path));if(v.value.edits.some(e=>!seen.has(e.path)))throw Error('uninspected mutation');
const paths=[...new Set(v.value.edits.map(e=>e.path))],image=read('../prepared/image.json'),task=read('../prepared/task.json');const name='are95-export-'+Date.now();
const docker=(args,input)=>execFileSync('docker',args,{input,encoding:'utf8',timeout:30000,maxBuffer:2000000});const report={paths,authority_effect:'none',open_questions_ref:'../../PLAN.md'};
try{
 docker(['run','-d','--name',name,'--network','none','--cpus','2','--memory','4g','--pids-limit','128','--cap-drop','ALL','--security-opt','no-new-privileges','--workdir','/testbed','--entrypoint','sleep',image.id,'infinity']);
 if(docker(['exec',name,'git','rev-parse','HEAD']).trim()!==task.base_commit)throw Error('base mismatch');
 const before=docker(['exec',name,'git','diff','--binary']);writeFileSync(out+'/image-before.patch',before);report.image_before_sha256=hash(before);
 if(docker(['exec',name,'git','diff','HEAD','--',...paths]).trim())throw Error('model paths already dirty; scoped HEAD diff unsafe');
 docker(['cp',root+'../repo-tool.cjs',name+':/tmp/are-repo-tool.cjs']);
 const applied=JSON.parse(docker(['exec','-i',name,'node','/tmp/are-repo-tool.cjs'],JSON.stringify({name:'apply',args:v.value})));
 const original=readFileSync(root+'evidence/live/prediction.patch','utf8');if(applied.patch!==original)throw Error('original rollout diff not reproduced');
 const patch=docker(['exec',name,'git','diff','--',...paths]);if(!patch.trim())throw Error('empty attributed diff');
 const untouched=docker(['exec',name,'git','diff','--binary','--','.',...paths.map(p=>':(exclude)'+p)]);if(untouched!==before)throw Error('unattributed change');
 writeFileSync(out+'/prediction-model-only.patch',patch,{flag:'wx'});report.patch_sha256=hash(patch);report.original_patch_sha256=hash(original);report.original_reproduced=true;report.model_paths_initially_clean=true;report.untouched_image_diff_preserved=true;report.status='attributed';
}finally{
 spawnSync('docker',['rm','-f',name],{timeout:30000});const c=spawnSync('docker',['container','ls','-a','--filter','name=^/'+name+'$','--format','{{.Names}}'],{encoding:'utf8',timeout:30000});report.cleanup_verified=c.status===0&&!c.stdout.trim();writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}
