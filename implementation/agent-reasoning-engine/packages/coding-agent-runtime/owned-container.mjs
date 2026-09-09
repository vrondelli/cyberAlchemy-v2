// Explicit worker lifecycle. Open questions: ../../benchmarks/glm-episodes-v1/ISOLATED-VALIDATION.md
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createContainerSandbox,parseSandboxConfig} from './sandbox.mjs';
export function runOwnedContainer({config,repository_root,command},{execute=spawnSync}={}) {
 const parsed=parseSandboxConfig(config);if(!parsed)throw Error('owned-container-config-required');
 const name='are-validation-'+randomUUID();let launched=false,cleanup;
 const sandbox=createContainerSandbox({config:parsed,repository_root,runner:(engine,args,options)=>{
  launched=true;
  return execute(engine,['run','--name',name,...args.slice(1)],{...options,maxBuffer:parsed.maximum_output_bytes});
 }});
 let result;
 try {result=sandbox.run(command);}
 finally {
  if(launched) {
   let removed,checked;
   try {removed=execute(parsed.engine,['rm','--force',name],{encoding:'utf8',timeout:10000,maxBuffer:4096,env:{LANG:'C',LC_ALL:'C'}});}catch {removed=null;}
   try {checked=execute(parsed.engine,['container','ls','--all','--filter',`name=^/${name}$`,'--format','{{.Names}}'],{encoding:'utf8',timeout:10000,maxBuffer:4096,env:{LANG:'C',LC_ALL:'C'}});}catch {checked=null;}
   cleanup={attempted:true,verified_absent:checked?.status===0&&!checked.error&&String(checked.stdout??'').trim()==='',remove_exit:removed?.status??null};
  } else cleanup={attempted:false,verified_absent:true};
 }
 return {schema_version:'are.owned-container-result/v1',ok:result?.ok===true&&cleanup.verified_absent,container_name:name,sandbox:result,cleanup,authority_effect:'none'};
}
