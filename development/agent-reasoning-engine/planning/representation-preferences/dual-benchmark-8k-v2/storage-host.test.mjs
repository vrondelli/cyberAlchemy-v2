import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {guardStorage,validateHostMount} from './storage-host.mjs';
const evidence='verified registry metadata',mount='133 82 0:71 / /mnt/d rw,noatime - 9p D:\\134 rw,aname=drvfs;path=D:\\;uid=1000';
const binding={schema:'are.wsl-host-storage-binding/v1',verified:true,distribution:'Ubuntu',windows_base_path:'D:\\WSL\\Ubuntu',virtual_disk:'ext4.vhdx',host_drive:'D',host_root:'/mnt/d',provenance:{path:'/evidence',sha256:createHash('sha256').update(evidence).digest('hex')}};
function deps({host=20n*1024n**3n,guest=20n*1024n**3n,mountinfo='80 1 8:1 / / rw - ext4 /dev/sda rw\n'+mount}={}){return {read:path=>path==='/proc/self/mountinfo'?mountinfo:evidence,stat:()=>({isDirectory:()=>true}),exists:()=>true,realpath:path=>path,measure:path=>({bavail:path==='/mnt/d'?host:guest,bsize:1n})};}
const run=(b=binding,d=deps(),growth=0)=>guardStorage({binding:b,output:'/workspace',growth_reservation_bytes:growth},d);
test('verified D drvfs mount admits unchanged reserves and growth',()=>{const result=run(binding,deps(),33554432);assert.equal(result.admitted,true);assert.equal(result.minimum_host_free_bytes,'12884901888');assert.equal(result.minimum_guest_free_bytes,'8589934592');});
test('empty guest directory is not a mounted host volume',()=>assert.throws(()=>run(binding,deps({mountinfo:'80 1 8:1 / / rw - ext4 /dev/sda rw'})),/unique-host-mount/));
test('wrong host drive or registry base fails closed',()=>{for(const patch of [{host_root:'/mnt/c'},{host_drive:'C'},{windows_base_path:'C:\\WSL\\Ubuntu'},{verified:false}])assert.throws(()=>run({...binding,...patch}));});
test('mount source/filesystem/root mismatches and duplicates rejected',()=>{for(const value of [mount.replace('D:\\134','C:\\134'),mount.replace('aname=drvfs','aname=other'),mount.replace(' / /mnt/d',' /sub /mnt/d'),mount+'\n'+mount])assert.throws(()=>run(binding,deps({mountinfo:value})));});
test('provenance drift and symlink host roots rejected',()=>{assert.throws(()=>run({...binding,provenance:{...binding.provenance,sha256:'0'.repeat(64)}}),/provenance-drift/);assert.throws(()=>run(binding,{...deps(),realpath:()=>'/other'}),/host-directory-identity/);});
test('both reserve thresholds and growth enforce measured failure receipt',()=>{for(const values of [{host:12n*1024n**3n-1n},{guest:8n*1024n**3n-1n},{host:12n*1024n**3n}])assert.throws(()=>run(binding,deps(values),1),error=>error.code==='STORAGE_CAPACITY_REJECTED'&&error.receipt.admitted===false);});
test('measurement failure cannot fall back to C or guest',()=>{const calls=[];assert.throws(()=>run(binding,{...deps(),measure:path=>{calls.push(path);throw Error('measurement failed');}}),/measurement failed/);assert.deepEqual(calls,['/mnt/d']);});
test('invalid reservation and non-bigint measurement rejected',()=>{assert.throws(()=>run(binding,deps(),-1));assert.throws(()=>run(binding,{...deps(),measure:()=>({bavail:100,bsize:4096})}),/filesystem-measurement/);});
test('Windows extended path form and drvfs filesystem accepted',()=>{assert.equal(validateHostMount({...binding,windows_base_path:'\\\\?\\D:\\WSL\\Ubuntu'},mount.replace(' - 9p ',' - drvfs ')).source,'D:\\');});

test('contradictory drvfs metadata and guest overlay are rejected',()=>{assert.throws(()=>run(binding,deps({mountinfo:mount.replace('path=D:', 'path=C:')})),/host-mount-path-mismatch/);for(const overlay of ['90 80 0:5 / /workspace rw - tmpfs tmpfs rw','90 80 8:2 / /workspace rw - ext4 /dev/sdb rw'])assert.throws(()=>run(binding,deps({mountinfo:'80 1 8:1 / / rw - ext4 /dev/sda rw\n'+mount+'\n'+overlay})),/guest-root-device-mismatch/);});

test('duplicate host metadata and deepest guest mounts fail closed',()=>{for(const extra of [';path=C:\\',';aname=other'])assert.throws(()=>run(binding,deps({mountinfo:mount+extra})));const root='80 1 8:1 / / rw - ext4 /dev/sda rw';assert.throws(()=>run(binding,deps({mountinfo:root+'\n'+mount+'\n90 80 8:1 / /workspace rw - ext4 /dev/sda rw\n91 80 0:5 / /workspace rw - tmpfs tmpfs rw'})),/ambiguous-guest-mount/);});
