// Rehearse a fresh disposable instance; only its own generated volume is removed.
import {mkdtemp,cp,symlink,mkdir,readFile,writeFile,rm,open} from 'node:fs/promises';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve,join} from 'node:path';
const exec=promisify(execFile),root=resolve(new URL('..',import.meta.url).pathname);
process.chdir(root);process.umask(0o077);
const work=await mkdtemp(join(root,'.runtime/fresh-'));
const project='auth-foundation-https-cleancheck';
let app,created=false,proxyStopped=false,log;
const compose=(args,cwd=root,env=process.env)=>exec('docker',['compose','--env-file','.runtime/compose.env',...args],{cwd,env,timeout:30000});
try{
 for(const dir of ['src','scripts','test','proxy','themes','bridge'])await cp(join(root,dir),join(work,dir),{recursive:true});
 for(const file of ['compose.yaml','package.json','package-lock.json'])await cp(join(root,file),join(work,file));
 await mkdir(join(work,'.runtime'),{mode:0o700});
 await symlink(join(root,'node_modules'),join(work,'node_modules'),'dir');
 for(const dir of ['browser-libs','tools'])await symlink(join(root,'.runtime',dir),join(work,'.runtime',dir),'dir');
 await cp(join(root,'.runtime/auth-prototype-bridge'),join(work,'.runtime/auth-prototype-bridge'));
 const env={...process.env,COMPOSE_PROJECT_NAME:project};
 // Refuse to adopt another run's state.
 const existing=await exec('docker',['ps','-aq','--filter','label=com.docker.compose.project='+project]);if(existing.stdout.trim())throw Error('Fresh rehearsal project already exists');
 await compose(['stop','proxy']);proxyStopped=true;created=true;
 const setup=await exec(process.execPath,['scripts/setup.mjs'],{cwd:work,env,timeout:360000,maxBuffer:1048576});
 await writeFile(join(root,'.runtime/fresh-setup.log'),setup.stdout+setup.stderr,{mode:0o600});
 log=await open(join(root,'.runtime/fresh-app.log'),'w',0o600);
 app=spawn(process.execPath,['src/server.mjs'],{cwd:work,env:{...env,NODE_EXTRA_CA_CERTS:join(work,'.runtime/tls/ca.crt')},stdio:['ignore',log.fd,log.fd]});
 await exec(process.execPath,['scripts/fresh-smoke.mjs'],{cwd:work,env:{...env,NODE_EXTRA_CA_CERTS:join(work,'.runtime/tls/ca.crt'),LD_LIBRARY_PATH:join(root,'.runtime/browser-libs/root/usr/lib/x86_64-linux-gnu')},timeout:60000,maxBuffer:1048576});
 const result={schema_version:'auth-https-fresh-check/v1',status:'passed',recorded_on:new Date().toISOString(),checks:['new CA, credentials and empty database','scoped provisioner on imported realm','verified HTTPS browser login and human authorization','verified HTTPS private-key service authorization'],authority_effect:'none',open_questions:['Production hosting and recovery remain outside this local rehearsal.']};
 await writeFile(join(root,'evidence/FRESH-SETUP.json'),JSON.stringify(result,null,2)+'\n');console.log('Fresh HTTPS setup and browser/service smoke checks passed.');
} catch(error){
 console.error('Fresh rehearsal failed:',error.message.split('\n')[0]);process.exitCode=1;
} finally {
 if(app){const ended=new Promise(r=>app.once('exit',r));app.kill('SIGTERM');await Promise.race([ended,new Promise(r=>setTimeout(r,3000))]);if(app.exitCode===null)app.kill('SIGKILL')}
 if(log)await log.close();
 if(created){await compose(['down','--volumes'],work,{...process.env,COMPOSE_PROJECT_NAME:project}).catch(()=>{process.exitCode=1;console.error('Fresh test cleanup needs inspection')})}
 if(proxyStopped)await compose(['start','proxy']);
 // Keep failing fixtures private for diagnosis; clean only a successful owned rehearsal.
 if(!process.exitCode)await rm(work,{recursive:true,force:true});
}
