// Zero-provider transport probe, never used by the frozen campaign.
// Open Questions: evidence/G02-WSL-VPS-PROVIDER-BINDING-R1.md.
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,existsSync,lstatSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='/home/vlad_/are-benchmark-archive/g02-ssh-connection-reuse-probe-r1-20261006';
if(existsSync(root))throw Error('ssh-probe.output-exists-no-replay');
mkdirSync(root,{mode:0o700});
const sha=x=>createHash('sha256').update(x).digest('hex');
const save=(name,data)=>writeFileSync(join(root,name),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
const host='root@187.77.163.194';
const common=['-o','BatchMode=yes','-o','ConnectTimeout=10','-o','ServerAliveInterval=10','-o','ServerAliveCountMax=2'];
const temp=mkdtempSync(join(tmpdir(),'are-g02-ssh-reuse-r1-')),socket=join(temp,'control.sock');
if(lstatSync(temp).uid!==process.getuid()||(lstatSync(temp).mode&0o777)!==0o700)throw Error('ssh-probe.private-directory');
save('FREEZE.json',{scope:'Existing private VPS only; remote command is fixed true.',
 direct_calls:4,multiplexed_calls:4,provider_calls:0,tokenizer_calls:0,automatic_retries:0,
 interleaving:'Odd pairs direct first, even pairs reused first; one cold master startup separate.',
 implementation_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),
 claim_ceiling:'Infrastructure timing only; no model latency, quality, cost or superiority result.',
 authority_effect:'none',open_questions_owner:'G02-WSL-VPS-PROVIDER-BINDING-R1.md'});
const run=args=>{
 const start=performance.now();
 execFileSync('ssh',[...common,...args],{stdio:['ignore','ignore','ignore'],timeout:30000});
 return performance.now()-start;
};
let opened=false,error=null,close_error=null,startup_ms=null,cleanup='not-attempted';const timings=[];
try{
 startup_ms=run(['-M','-N','-f','-o','ControlPersist=60','-S',socket,host]);opened=true;
 const stat=lstatSync(socket);
 if(!stat.isSocket()||stat.uid!==process.getuid()||(stat.mode&0o777)!==0o600)throw Error('ssh-probe.private-socket');
 run(['-S',socket,'-O','check',host]);
 for(let n=1;n<=4;n++){
  const arms=n%2?['direct','reused']:['reused','direct'];
  for(const arm of arms){
   save(n+'-'+arm+'-STARTED.json',{started_at:new Date().toISOString(),remote_command:'true'});
   const args=arm==='direct'?['-o','ControlMaster=no','-o','ControlPath=none',host,'true']:
    ['-o','ControlMaster=no','-o','ProxyCommand=/bin/false','-S',socket,host,'true'];
   const elapsed_ms=run(args),row={pair:n,arm,elapsed_ms,exit_code:0,provider_calls:0};
   timings.push(row);save(n+'-'+arm+'-RESULT.json',row);
  }
 }
}catch(e){error=e.code??e.message;}finally{
 if(opened)try{run(['-S',socket,'-O','exit',host]);}catch(e){close_error=e.code??'master-close-failed';}
 if(!close_error)try{rmdirSync(temp);cleanup='empty-probe-directory-removed';}catch{cleanup='probe-directory-retained';}
}
save('RESULT.json',{status:error||close_error?'failed-no-replay':'terminal',startup_ms,timings,error,close_error,
 temporary_directory:temp,cleanup,provider_calls:0,tokenizer_calls:0,benchmark_changed:false,
 authority_effect:'none',open_questions_owner:'G02-WSL-VPS-PROVIDER-BINDING-R1.md'});
console.log(JSON.stringify({root,status:error||close_error?'failed-no-replay':'terminal',startup_ms,timings,error,close_error,cleanup}));
if(error||close_error)process.exitCode=1;
