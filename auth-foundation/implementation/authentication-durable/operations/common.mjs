import {readFileSync,writeFileSync,mkdirSync,renameSync,statSync,openSync,closeSync,unlinkSync,fsyncSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
export const root=resolve(new URL('..',import.meta.url).pathname),original=resolve(root,'../authentication-https'),runtime=resolve(root,'.runtime/operations');
process.umask(0o077);mkdirSync(runtime,{recursive:true,mode:0o700});
export const readJson=p=>JSON.parse(readFileSync(p,'utf8'));
export function privateFile(path,data){const tmp=path+'.next',fd=openSync(tmp,'w',0o600);try{writeFileSync(fd,data);fsyncSync(fd);}finally{closeSync(fd);}renameSync(tmp,path);const dir=openSync(resolve(path,'..'),'r');try{fsyncSync(dir);}finally{closeSync(dir);}}
export function requirePrivate(path){if(statSync(path).mode&0o077)throw Error('Private file permissions required: '+path);}
export const docker=(args,options={})=>{try{return execFileSync('docker',args,{maxBuffer:256*1024*1024,stdio:['pipe','pipe','pipe'],...options});}catch(e){throw Error('Docker operation '+args[0]+' failed (status '+(e.status??'unavailable')+'); private command output withheld');}};
export const issuerCompose=['compose','--env-file',resolve(original,'.runtime/compose.env'),'-f',resolve(original,'compose.yaml'),'-f',resolve(root,'issuer.override.yml')];
export function report(name,data){const dir=resolve(root,'evidence/operations');mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,name+'.json'),JSON.stringify({at:new Date().toISOString(),...data,open_questions_ref:'../../operations/README.md#open-questions'},null,2)+'\n');}

export function operationLock(){const path=resolve(runtime,'operation.lock');try{const fd=openSync(path,'wx',0o600);writeFileSync(fd,String(process.pid));closeSync(fd);}catch(error){if(error.code!=='EEXIST')throw error;const pid=Number(readFileSync(path));if(!Number.isSafeInteger(pid)||pid<1)throw Error('Invalid operations lock');try{process.kill(pid,0);}catch(e){if(e.code==='ESRCH'){unlinkSync(path);return operationLock();}throw e;}throw Error('Another operational change is running');}return ()=>{if(readFileSync(path,'utf8')===String(process.pid))unlinkSync(path);};}
