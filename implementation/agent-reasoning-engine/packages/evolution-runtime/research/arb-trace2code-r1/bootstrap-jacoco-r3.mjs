// Permanent, versioned WSL tools; no shell environment or benchmark mutation.
// Open Questions: evidence/G01-JACOCO-FEASIBILITY-R3.json.
import {get} from 'node:https';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const root='/home/vlad_/.local/share/are-toolchains/jacoco-0.8.12';
const entries=[
 {name:'agent.jar',url:'https://repo.maven.apache.org/maven2/org/jacoco/org.jacoco.agent/0.8.12/org.jacoco.agent-0.8.12-runtime.jar',sha1:'2bec6efe140e3a38a81607181476a4016ef2c613'},
 {name:'cli.jar',url:'https://repo.maven.apache.org/maven2/org/jacoco/org.jacoco.cli/0.8.12/org.jacoco.cli-0.8.12-nodeps.jar',sha1:'4b92df4f57d37f7d262ce15f4600d4593f9f1a58'}
];
const hash=(b,kind='sha256')=>createHash(kind).update(b).digest('hex');
function fetch(url){return new Promise((resolve,reject)=>{const q=get(url,r=>{if(r.statusCode!==200){r.resume();reject(Error('download.status-'+r.statusCode));return;}let size=0;const parts=[];r.on('data',b=>{size+=b.length;if(size>5*1024**2)q.destroy(Error('download.size'));else parts.push(b);});r.on('end',()=>resolve(Buffer.concat(parts)));r.on('error',reject);});q.setTimeout(30000,()=>q.destroy(Error('download.timeout')));q.on('error',reject);});}
if(existsSync(join(root,'RECEIPT.json'))){const r=JSON.parse(readFileSync(join(root,'RECEIPT.json')));for(const e of entries){const b=readFileSync(join(root,e.name)),old=r.entries.find(x=>x.name===e.name);if(hash(b,'sha1')!==e.sha1||hash(b)!==old.sha256)throw Error('toolcache.drift');}console.log(JSON.stringify({status:'verified-existing-permanent-cache',root}));}
else{if(existsSync(root)){if(readdirSync(root).length)throw Error('toolcache.partial-no-overwrite');}else mkdirSync(root,{mode:0o700});const rows=[];for(const e of entries){const published=(await fetch(e.url+'.sha1')).toString('ascii').trim();if(published!==e.sha1)throw Error('download.published-checksum-drift');const b=await fetch(e.url);if(hash(b,'sha1')!==published)throw Error('download.checksum');writeFileSync(join(root,e.name),b,{flag:'wx',mode:0o600});rows.push({...e,bytes:b.length,sha256:hash(b)});}const receipt={version:'0.8.12',entries:rows,checksum_scope:'Maven Central published SHA1 verified over HTTPS; SHA256 recorded locally for subsequent immutable pinning, not claimed as an independent publisher signature.',setup_diagnostic:'Initial checksum literals copied from concatenated stdout straddled the two40-character digests. Check failed before any jar download/write. Corrected from individually quoted official values; empty directory reused, no artifacts overwritten.',automatic_retries:0,authority_effect:'none',open_questions_owner:'G01-JACOCO-FEASIBILITY-R3.json'};writeFileSync(join(root,'RECEIPT.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({status:'permanent-tools-downloaded-and-checksummed',root,entries:rows}));}
