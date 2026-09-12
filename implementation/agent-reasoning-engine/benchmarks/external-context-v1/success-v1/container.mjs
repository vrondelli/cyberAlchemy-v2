// Isolated task operations. Open questions: README.md.
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
export const docker=(args,input,timeout=30000)=>execFileSync('docker',args,{input,encoding:'utf8',timeout,maxBuffer:2000000});
export function start(name,image){docker(['run','-d','--name',name,'--network','none','--cpus','2','--memory','4g','--pids-limit','1024','--cap-drop','ALL','--security-opt','no-new-privileges','--workdir','/testbed','--entrypoint','sleep',image,'infinity']);}
export function cleanup(name){spawnSync('docker',['rm','-f',name],{timeout:30000});const r=spawnSync('docker',['container','ls','-a','--filter','name=^/'+name+'$','--format','{{.Names}}'],{encoding:'utf8',timeout:30000});if(r.status!==0||r.stdout.trim())throw Error('cleanup failed');}
export function applyCandidate(name,c){
 const checks=()=>JSON.parse(docker(['exec','-i',name,'node','-e',"const fs=require('fs'),c=require('crypto');const paths=JSON.parse(fs.readFileSync(0));process.stdout.write(JSON.stringify(Object.fromEntries(paths.map(p=>[p,c.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))));"],JSON.stringify(c.files.map(f=>f.path))));
 const b=checks();if(c.files.some(f=>b[f.path]!==f.before_sha256))throw Error('candidate base mismatch');
 const diff=docker(['exec',name,'git','diff','--binary','--','.',...c.files.map(f=>':(exclude)'+f.path)]);
 docker(['exec','-i',name,'git','apply','--whitespace=nowarn','-'],c.patch);const a=checks();if(c.files.some(f=>a[f.path]!==f.after_sha256))throw Error('candidate result mismatch');
 if(docker(['exec',name,'git','diff','--binary','--','.',...c.files.map(f=>':(exclude)'+f.path)])!==diff)throw Error('non-target source changed');
}
