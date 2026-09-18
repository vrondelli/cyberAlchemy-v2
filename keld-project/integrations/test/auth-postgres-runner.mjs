import {execFileSync,spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
const directory=await mkdtemp(join(tmpdir(),'keld-auth-test-'));
const name='keld-auth-test-'+randomUUID(),password=randomUUID();let created=false,child,stopping=false;
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:20000}).trim();
const stop=()=>{stopping=true;child?.kill('SIGTERM');};process.on('SIGINT',stop);process.on('SIGTERM',stop);
try{
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1','-keyout',join(directory,'key.pem'),'-out',join(directory,'cert.pem')],{stdio:'ignore',timeout:20000});
 docker('run','--pull=never','--detach','--rm','--name',name,'--memory=384m','--tmpfs','/var/lib/postgresql/data:rw,size=256m','--publish','127.0.0.1::5432','--env','POSTGRES_PASSWORD='+password,'--env','POSTGRES_DB=keld_test','postgres:16-alpine');created=true;
 let ready=false;for(let i=0;i<40&&!stopping;i++){try{docker('exec',name,'pg_isready','-h','127.0.0.1','-U','postgres','-d','keld_test');ready=true;break;}catch{await delay(250);}}
 if(!ready||stopping)throw Error('database-not-ready');
 const port=docker('port',name,'5432/tcp').match(/^127\.0\.0\.1:(\d+)$/)?.[1];if(!port)throw Error('non-loopback-database');
 const code=await new Promise((resolve,reject)=>{
  child=spawn(process.execPath,[fileURLToPath(new URL('./auth-postgres-check.mjs',import.meta.url))],{stdio:'inherit',env:{...process.env,NODE_EXTRA_CA_CERTS:join(directory,'cert.pem'),KELD_TEST_DATABASE_URL:`postgres://postgres:${password}@127.0.0.1:${port}/keld_test`,KELD_TEST_CERT:join(directory,'cert.pem'),KELD_TEST_KEY:join(directory,'key.pem')}});
  child.on('error',reject);child.on('exit',code=>resolve(code??1));
 });process.exitCode=code;
}catch{console.error(JSON.stringify({ok:false,error:'isolated-auth-test-failed'}));process.exitCode=1;}
finally{if(created)try{docker('rm','--force',name);}catch{console.error(JSON.stringify({ok:false,error:'test-container-cleanup-failed',container:name}));process.exitCode=1;}await rm(directory,{recursive:true,force:true});process.off('SIGINT',stop);process.off('SIGTERM',stop);}
