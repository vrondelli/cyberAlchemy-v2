// R09 distribution experiment. No native payload is added to the shipping CLI.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {before,after,test} from 'node:test';

const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
let root,bytes,loader;
before(t=>{
 root=fs.mkdtempSync(path.join(os.tmpdir(),'r09-native-packaging-'));
 const portable=process.env.DOMAINSPEC_R09_LIBC_FREE==='1';
 const source=fs.readFileSync(path.join(import.meta.dirname,portable?'rename-noreplace-portable.c':'rename-noreplace.c'));
 const headers=path.resolve(path.dirname(process.execPath),'../include/node');
 const outputs=['first','second'].map(name=>{
  const dir=path.join(root,name);fs.mkdirSync(dir);
  const file=path.join(dir,'primitive.c'),output=path.join(dir,'primitive.node');fs.writeFileSync(file,source);
  execFileSync('/home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run',['cc','-std=c11','-O2','-shared','-fPIC','-fvisibility=hidden','-Wall','-Wextra','-Werror',...(portable?['-nostdlib','-fno-stack-protector','-fno-builtin','-Wl,-z,relro,-z,now,-z,noexecstack']:[]),'-DNAPI_VERSION=8','-I'+headers,file,'-o',output],{encoding:'utf8',timeout:60000,stdio:['ignore','pipe','pipe']});
  return output;
 });
 bytes=fs.readFileSync(outputs[0]);assert.deepEqual(fs.readFileSync(outputs[1]),bytes,'compiler output must not depend on the source/build directory');
 const versions=execFileSync('/usr/bin/readelf',['--version-info',outputs[0]],{encoding:'utf8'});
 const dynamic=execFileSync('/usr/bin/readelf',['--dynamic',outputs[0]],{encoding:'utf8'});
 if(portable){
  assert.doesNotMatch(dynamic,/\(NEEDED\)/);assert.doesNotMatch(versions,/GLIBC_/);
  const symbols=execFileSync('/usr/bin/readelf',['--wide','--dyn-syms',outputs[0]],{encoding:'utf8'});
  const imports=symbols.split('\n').filter(l=>/\bUND\b/.test(l)).map(l=>l.trim().split(/\s+/)[7]).filter(Boolean);
  assert.ok(imports.length>0);assert.ok(imports.every(name=>name.startsWith('napi_')),JSON.stringify(imports));
 }
 t.diagnostic(JSON.stringify({portable,artifact_bytes:bytes.length,base64_bytes:bytes.toString('base64').length,artifact_sha256:digest(bytes),source_sha256:digest(source),glibc_versions:[...new Set(versions.match(/GLIBC_[0-9.]+/g)??[])].sort(),needed:dynamic.split('\n').filter(l=>l.includes('(NEEDED)')).map(l=>l.trim())}));
 loader=String.raw`import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {createRequire} from 'node:module';
const payload=PAYLOAD,expected=DIGEST;let cached;
const reject=(code,message)=>{const error=Error(message);error.code=code;throw error;};
export function loadNative(){
 if(cached)return cached;
 if(process.platform!=='linux'||process.arch!=='x64')reject('R09_NATIVE_PLATFORM','unsupported prototype platform');
 if(process.permission&&!process.permission.has('addons'))reject('R09_NATIVE_PERMISSION','native addons are not permitted');
 const bytes=Buffer.from(payload,'base64');if(crypto.createHash('sha256').update(bytes).digest('hex')!==expected)reject('R09_NATIVE_INTEGRITY','native payload changed');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'r09-native-load-')),file=path.join(dir,'primitive.node');let native;
 try{fs.writeFileSync(file,bytes,{flag:'wx',mode:0o500});native=createRequire(import.meta.url)(file);}
 finally{if(fs.existsSync(file))fs.unlinkSync(file);fs.rmdirSync(dir);}
 cached=Object.freeze(native);return cached;
}
`.replace('PAYLOAD',JSON.stringify(bytes.toString('base64'))).replace('DIGEST',JSON.stringify(digest(bytes)));
});
after(()=>{if(root)fs.rmSync(root,{recursive:true,force:true});});
function fixture(name,content=loader){
 const dir=path.join(root,name);fs.mkdirSync(dir);const scratch=path.join(dir,'scratch');fs.mkdirSync(scratch);
 const file=path.join(dir,'native.mjs');fs.writeFileSync(file,content);return {dir,scratch,file};
}
function run(f,program,flags=[]){
 return execFileSync(process.execPath,[...flags,'--input-type=module','-e',program],{cwd:f.dir,encoding:'utf8',timeout:10000,stdio:['ignore','pipe','pipe'],env:{PATH:'/absent',TMPDIR:f.scratch,NODE_NO_WARNINGS:'1'}});
}
test('embedded native artifact relocates without compiler, source checkout or retained extraction files',()=>{
 const f=fixture('relocated');
 const result=JSON.parse(run(f,`import fs from 'node:fs';import {loadNative} from './native.mjs';
 const before=fs.readdirSync(process.env.TMPDIR);const native=loadNative();const same=loadNative()===native;
 fs.mkdirSync('stage');fs.writeFileSync('stage/receipt','complete');const fd=fs.openSync('.',fs.constants.O_RDONLY|fs.constants.O_DIRECTORY);
 try{native.renameNoReplace(fd,'stage','target');}finally{fs.closeSync(fd);}
 console.log(JSON.stringify({same,before,after:fs.readdirSync(process.env.TMPDIR),receipt:fs.readFileSync('target/receipt','utf8')}));`));
 assert.deepEqual(result,{same:true,before:[],after:[],receipt:'complete'});
});
test('import remains read-only and native loading is lazy',()=>{
 const f=fixture('lazy');
 assert.equal(run(f,`import fs from 'node:fs';const deny=()=>{throw Error('unexpected write');};fs.writeFileSync=deny;fs.mkdtempSync=deny;await import('./native.mjs');console.log('read-only');`).trim(),'read-only');
 assert.deepEqual(fs.readdirSync(f.scratch),[]);
});
test('tampered embedded bytes reject before extracting or loading native code',()=>{
 const original=bytes.toString('base64'),mutant=(original[0]==='A'?'B':'A')+original.slice(1);
 const f=fixture('tampered',loader.replace(JSON.stringify(original),JSON.stringify(mutant)));
 assert.equal(run(f,`import {loadNative} from './native.mjs';try{loadNative();throw Error('unexpected success');}catch(e){if(e.code!=='R09_NATIVE_INTEGRITY')throw e;console.log(e.code);}`).trim(),'R09_NATIVE_INTEGRITY');
 assert.deepEqual(fs.readdirSync(f.scratch),[]);
});
test('permission-restricted Node can import but rejects native load before filesystem effects',()=>{
 const f=fixture('denied');
 assert.equal(run(f,`import {loadNative} from './native.mjs';try{loadNative();throw Error('unexpected success');}catch(e){if(e.code!=='R09_NATIVE_PERMISSION')throw e;console.log(e.code);}`,['--permission','--allow-fs-read='+f.dir]).trim(),'R09_NATIVE_PERMISSION');
 assert.deepEqual(fs.readdirSync(f.scratch),[]);
});
