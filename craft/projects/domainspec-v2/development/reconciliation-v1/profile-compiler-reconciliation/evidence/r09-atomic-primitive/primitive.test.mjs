// Candidate primitive evidence only; no shipping CLI dependency or product approval.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync, spawn} from 'node:child_process';
import {once} from 'node:events';
import {before, after, test} from 'node:test';

let root, addonPath, native;
before(() => {
  assert.equal(process.platform,'linux'); assert.equal(process.arch,'x64');
  root=fs.mkdtempSync(path.join(os.tmpdir(),'r09-atomic-primitive-'));
  addonPath=path.join(root,'rename-noreplace.node');
  const headers=path.resolve(path.dirname(process.execPath),'../include/node');
  assert.ok(fs.existsSync(path.join(headers,'node_api.h')));
  const portable=process.env.DOMAINSPEC_R09_LIBC_FREE==='1';
  execFileSync('/home/vrondelli/projects/cyberAlchemy-v2/tools/toolchain/run',[
    'cc','-std=c11','-O2','-shared','-fPIC','-fvisibility=hidden','-Wall','-Wextra','-Werror',
    ...(portable?['-nostdlib','-fno-stack-protector','-fno-builtin','-Wl,-z,relro,-z,now,-z,noexecstack']:[]),
    '-DNAPI_VERSION=8','-I'+headers,path.join(import.meta.dirname,portable?'rename-noreplace-portable.c':'rename-noreplace.c'),'-o',addonPath,
  ],{encoding:'utf8',timeout:60000,stdio:['ignore','pipe','pipe']});
  native=createRequire(import.meta.url)(addonPath);
});
after(() => {if(root)fs.rmSync(root,{recursive:true,force:true});});
function fixture(t) {
  const parent=fs.mkdtempSync(path.join(root,'case-'));
  const fd=fs.openSync(parent,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY|fs.constants.O_NOFOLLOW);
  t.after(()=>fs.closeSync(fd));
  const stage=path.join(parent,'stage');fs.mkdirSync(stage);
  fs.writeFileSync(path.join(stage,'artifact'),'complete artifact');
  fs.writeFileSync(path.join(stage,'receipt'),'complete receipt');
  return {parent,fd,stage,target:path.join(parent,'target')};
}
const identity=p=>{const s=fs.lstatSync(p);return [s.dev,s.ino,s.mode];};

test('atomic destination claim publishes the complete staged directory and receipt',t=>{
  const f=fixture(t),expected=identity(f.stage);
  native.renameNoReplace(f.fd,'stage','target');
  assert.deepEqual(identity(f.target),expected);assert.equal(fs.existsSync(f.stage),false);
  assert.deepEqual(fs.readdirSync(f.target).sort(),['artifact','receipt']);
  assert.equal(fs.readFileSync(path.join(f.target,'artifact'),'utf8'),'complete artifact');
  assert.equal(fs.readFileSync(path.join(f.target,'receipt'),'utf8'),'complete receipt');
});

for(const kind of ['empty-directory','nonempty-directory','file','dangling-link','directory-link']) {
  test('atomic no-replace preserves existing '+kind,t=>{
    const f=fixture(t),outside=path.join(f.parent,'owner');fs.mkdirSync(outside);
    fs.writeFileSync(path.join(outside,'sentinel'),'owner bytes');
    if(kind==='empty-directory'||kind==='nonempty-directory')fs.mkdirSync(f.target);
    if(kind==='nonempty-directory')fs.writeFileSync(path.join(f.target,'keep'),'keep');
    if(kind==='file')fs.writeFileSync(f.target,'keep');
    if(kind==='dangling-link')fs.symlinkSync(path.join(f.parent,'absent'),f.target);
    if(kind==='directory-link')fs.symlinkSync(outside,f.target);
    const before=identity(f.target),stage=identity(f.stage);
    assert.throws(()=>native.renameNoReplace(f.fd,'stage','target'),{code:'EEXIST'});
    assert.deepEqual(identity(f.target),before);assert.deepEqual(identity(f.stage),stage);
    assert.equal(fs.readFileSync(path.join(outside,'sentinel'),'utf8'),'owner bytes');
    if(kind==='file')assert.equal(fs.readFileSync(f.target,'utf8'),'keep');
    if(kind==='nonempty-directory')assert.equal(fs.readFileSync(path.join(f.target,'keep'),'utf8'),'keep');
    if(kind==='empty-directory')assert.deepEqual(fs.readdirSync(f.target),[]);
  });
}

test('held parent descriptor does not follow a renamed-parent symlink replacement',t=>{
  const f=fixture(t),held=f.parent+'-held',outside=f.parent+'-outside';
  fs.mkdirSync(outside);fs.writeFileSync(path.join(outside,'sentinel'),'owner bytes');
  fs.renameSync(f.parent,held);fs.symlinkSync(outside,f.parent);
  native.renameNoReplace(f.fd,'stage','target');
  assert.equal(fs.readFileSync(path.join(held,'target','artifact'),'utf8'),'complete artifact');
  assert.deepEqual(fs.readdirSync(outside),['sentinel']);
  assert.equal(fs.readFileSync(path.join(outside,'sentinel'),'utf8'),'owner bytes');
});

test('invalid leaf names, descriptors and arity reject without touching the stage',t=>{
  const f=fixture(t),before=identity(f.stage);
  for(const bad of ['', '.', '..', '../escape','nested/target','target\0suffix','x'.repeat(256),null,4]) {
    assert.throws(()=>native.renameNoReplace(f.fd,bad,'target'),{code:'R09_ARGUMENT'});
    assert.throws(()=>native.renameNoReplace(f.fd,'stage',bad),{code:'R09_ARGUMENT'});
  }
  for(const bad of [-1,1.5,NaN,Infinity,2**40,'1'])assert.throws(()=>native.renameNoReplace(bad,'stage','target'),{code:'R09_ARGUMENT'});
  assert.throws(()=>native.renameNoReplace(f.fd,'stage'),{code:'R09_ARGUMENT'});
  assert.throws(()=>native.renameNoReplace(f.fd,'stage','target',0),{code:'R09_ARGUMENT'});
  const file=fs.openSync(path.join(f.stage,'artifact'),'r');
  try{assert.throws(()=>native.renameNoReplace(file,'stage','target'),{code:'ENOTDIR'});}finally{fs.closeSync(file);}
  assert.deepEqual(identity(f.stage),before);assert.equal(fs.existsSync(f.target),false);
});

test('simultaneous processes select one complete winner without merging or replacement',async t=>{
  const f=fixture(t);fs.renameSync(f.stage,path.join(f.parent,'stage-a'));
  fs.mkdirSync(path.join(f.parent,'stage-b'));
  fs.writeFileSync(path.join(f.parent,'stage-a','winner'),'a');
  fs.writeFileSync(path.join(f.parent,'stage-b','winner'),'b');
  fs.writeFileSync(path.join(f.parent,'stage-b','artifact'),'complete artifact');
  fs.writeFileSync(path.join(f.parent,'stage-b','receipt'),'complete receipt');
  const program=`const fs=require('fs'),a=require(${JSON.stringify(addonPath)});const fd=fs.openSync(${JSON.stringify(f.parent)},fs.constants.O_RDONLY|fs.constants.O_DIRECTORY|fs.constants.O_NOFOLLOW);process.send('ready');process.once('message',()=>{try{a.renameNoReplace(fd,process.argv[1],'target');process.send({result:'won'});}catch(e){process.send({result:e.code});}finally{fs.closeSync(fd);process.disconnect();}});`;
  const children=['stage-a','stage-b'].map(stage=>spawn(process.execPath,['-e',program,stage],{stdio:['ignore','pipe','pipe','ipc']}));
  t.after(()=>{for(const c of children)if(c.exitCode===null)c.kill();});
  const exits=children.map(c=>once(c,'exit'));
  await Promise.all(children.map(async c=>assert.equal((await once(c,'message'))[0],'ready')));
  const results=children.map(async c=>(await once(c,'message'))[0]);
  for(const c of children)c.send('go');
  assert.deepEqual((await Promise.all(results)).map(r=>r.result).sort(),['EEXIST','won']);
  for(const [code]of await Promise.all(exits))assert.equal(code,0);
  const winner=fs.readFileSync(path.join(f.target,'winner'),'utf8'),loser=winner==='a'?'b':'a';
  assert.equal(fs.readFileSync(path.join(f.parent,'stage-'+loser,'winner'),'utf8'),loser);
  assert.equal(fs.existsSync(path.join(f.parent,'stage-'+winner)),false);
  assert.deepEqual(fs.readdirSync(f.target).sort(),['artifact','receipt','winner']);
});
