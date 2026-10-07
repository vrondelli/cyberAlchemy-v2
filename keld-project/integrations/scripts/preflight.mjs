import {accessSync,constants,readdirSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const mode=process.argv[2]??'full';
if(!['test','full'].includes(mode))throw new Error('usage: node scripts/preflight.mjs test|full');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const project=resolve(root,'..');
const failures=[];
const requireThat=(condition,code)=>{if(!condition)failures.push(code);};
const executable=path=>{try{accessSync(path,constants.X_OK);return true;}catch{return false;}};
const readable=path=>{try{accessSync(path,constants.R_OK);return true;}catch{return false;}};
const sha256=path=>createHash('sha256').update(readFileSync(path)).digest('hex');

requireThat(process.platform==='linux','linux-node-required');
requireThat(process.version==='v26.8.1','node-26.8.1-required');
const tests=readdirSync(join(root,'test')).filter(name=>name.endsWith('.test.mjs'));
requireThat(tests.length>=8,'integration-test-inventory-incomplete');
requireThat(readable(join(root,'node_modules/nock/package.json')),'integration-dependencies-missing');

if(mode==='full'){
  const home=homedir(),sops=join(home,'.local/bin/sops'),age=join(home,'.local/bin/age'),ageKeygen=join(home,'.local/bin/age-keygen');
  const python=process.env.KELD_PYTHON??join(home,'.local/share/keld-python-3.14/bin/python');
  requireThat(executable(sops)&&sha256(sops)==='e5bec3346a873ae91d871550f3e698c1aad962aff462a080e40f25fde17fef6b','pinned-sops-missing');
  requireThat(executable(age)&&sha256(age)==='2e305637f2a0555305e21c17fb74446acbb39b53135d43d4b744e50c287133a5','pinned-age-missing');
  requireThat(executable(ageKeygen)&&sha256(ageKeygen)==='c56ef69834e18ca4d3b953117f4481522c35fb6862a5d2871685aa4685893664','pinned-age-keygen-missing');
  requireThat(executable(join(project,'web/node_modules/.bin/vite')),'web-dependencies-missing');
  try{accessSync(join(project,'web/dist/index.html'),constants.R_OK);}catch{failures.push('react-build-missing');}
  try{execFileSync(python,['-c','import stripe; assert stripe.VERSION == "15.6.1"'],{stdio:'ignore'});}catch{failures.push('python-stripe-15.6.1-missing');}
  try{
    if(process.env.KELD_REMOTE_BUILDER)execFileSync('ssh',['-o','BatchMode=yes',process.env.KELD_REMOTE_BUILDER,'docker','info','--format','{{.ServerVersion}}'],{stdio:'ignore'});
    else execFileSync('docker',['info','--format','{{.ServerVersion}}'],{stdio:'ignore'});
  }catch{failures.push(process.env.KELD_REMOTE_BUILDER?'remote-docker-unavailable':'docker-daemon-unavailable');}
}

if(failures.length){console.error(JSON.stringify({ok:false,mode,failures}));process.exitCode=1;}
else console.log(JSON.stringify({ok:true,mode,node:process.version,platform:process.platform,testFiles:tests.length}));
