// Private content-addressed receipt archive; verifies archive readability and never deletes source.
import {createHash} from 'node:crypto';
import {chmodSync,createReadStream,existsSync,mkdirSync,renameSync,statSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {join,resolve} from 'node:path';

const [label,baseArg,...names]=process.argv.slice(2);
if(!/^[a-z0-9-]+$/.test(label??'')||!baseArg||!names.length||
  names.some(name=>!/^[a-zA-Z0-9._-]+$/.test(name)||name==='.'||name==='..'))
  throw Error('archive.arguments');
const base=resolve(baseArg),allowed=new Set(['/opt/are/evolution-runtime','/opt/are-benchmark-runs']);
if(!allowed.has(base)||new Set(names).size!==names.length)throw Error('archive.scope');
for(const name of names)if(!statSync(join(base,name)).isDirectory())throw Error('archive.non-directory:'+name);
const destination='/opt/are/evolution-runtime/archives';
mkdirSync(destination,{recursive:true,mode:0o700});
const temporary=join(destination,`${label}.pending.tar.zst`);
if(existsSync(temporary))throw Error('archive.pending-exists');
const packed=spawnSync('tar',['-C',base,'-I','zstd -T1 -3','-cf',temporary,...names],
  {stdio:['ignore','ignore','pipe'],timeout:3*60*60*1000,maxBuffer:1024*1024});
if(packed.status!==0)throw Error('archive.tar-failed:'+(packed.error?.message??packed.stderr?.toString().slice(-300)));
const checked=spawnSync('tar',['-I','zstd','-tf',temporary],
  {stdio:'ignore',timeout:3*60*60*1000});
if(checked.status!==0)throw Error('archive.verify-failed');
const digest=createHash('sha256');
for await(const chunk of createReadStream(temporary))digest.update(chunk);
const archiveSha=digest.digest('hex'),archive=join(destination,`${label}-${archiveSha}.tar.zst`);
if(existsSync(archive))throw Error('archive.target-exists');
renameSync(temporary,archive);
chmodSync(archive,0o600);
const manifest={schema_version:'are.private-campaign-archive/v1',label,source_base:base,source_names:names,
  archive_path:archive,archive_sha256:archiveSha,archive_bytes:statSync(archive).size,
  verification:'tar --use-compress-program=zstd -tf completed with status 0',
  source_retained:true,deleted_source_files:0,created_at:new Date().toISOString(),
  claim_ceiling:'Private receipt preservation only; not a public artifact or release approval',
  open_questions_ref:'PRODUCT-PAGE-REPLICATION-PLAN.md'};
writeFileSync(join(destination,`${label}-${archiveSha}.json`),JSON.stringify(manifest,null,2)+'\n',
  {flag:'wx',mode:0o600});
console.log(JSON.stringify(manifest));
