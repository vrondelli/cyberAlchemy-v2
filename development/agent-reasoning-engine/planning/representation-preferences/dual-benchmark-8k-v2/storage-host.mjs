// Additive guard. Open questions and provenance: STORAGE-HOST.md.
import {readFileSync,statSync,statfsSync,realpathSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const GiB=1024n**3n;
const fail=reason=>{throw Object.assign(new Error('storage-host.'+reason),{code:'STORAGE_HOST_REJECTED'});};
const requireThat=(value,reason)=>{if(!value)fail(reason);};
const decode=value=>value.replace(/\\([0-7]{3})/g,(_,oct)=>String.fromCharCode(parseInt(oct,8)));
export function validateHostMount(binding,mountinfo){
 requireThat(binding?.schema==='are.wsl-host-storage-binding/v1'&&binding.verified===true,'verified-binding-required');
 requireThat(binding.distribution==='Ubuntu'&&binding.virtual_disk==='ext4.vhdx','distribution-binding');
 const base=/^(?:\\\\\?\\)?([A-Za-z]):\\(.+)$/.exec(binding.windows_base_path??'');
 requireThat(base&&base[1].toUpperCase()===binding.host_drive&&binding.host_drive==='D','backing-drive-mismatch');
 requireThat(binding.host_root==='/mnt/d','host-root-mismatch');
 const mounts=mountinfo.trim().split('\n').map(line=>{const [left,right]=line.split(' - ');if(!right)return null;const fields=left.split(' '),tail=right.split(' ');return {device:fields[2],root:decode(fields[3]??''),mount:decode(fields[4]??''),fs:tail[0],source:decode(tail[1]??''),options:tail.slice(2).join(' ')};}).filter(Boolean);
 const found=mounts.filter(m=>m.mount===binding.host_root);
 requireThat(found.length===1,'unique-host-mount-required');const mount=found[0];
 requireThat(mount.root==='/'&&mount.source.replaceAll('/','\\').toUpperCase()==='D:\\','host-mount-source-mismatch');
 requireThat(mount.fs==='drvfs'||(mount.fs==='9p'&&/(?:^|[,;])aname=drvfs(?:[;,]|$)/.test(mount.options)),'host-mount-filesystem');
 if(mount.fs==='9p'){const metadata=decode(mount.options).split(/[;,]/),values=key=>metadata.filter(x=>x.startsWith(key+'=')).map(x=>x.slice(key.length+1));requireThat(values('aname').length===1&&values('aname')[0]==='drvfs','host-mount-metadata');requireThat(values('path').length===1&&values('path')[0].toUpperCase()==='D:\\','host-mount-path-mismatch');}
 return mount;
}
export function guardStorage({binding,output,growth_reservation_bytes=0},deps={}){
 const read=deps.read??(path=>readFileSync(path,'utf8')),stat=deps.stat??statSync,realpath=deps.realpath??realpathSync,exists=deps.exists??existsSync,measure=deps.measure??(path=>statfsSync(path,{bigint:true}));
 requireThat(Number.isSafeInteger(growth_reservation_bytes)&&growth_reservation_bytes>=0,'growth-reservation');
 const mountinfo=read('/proc/self/mountinfo'),mount=validateHostMount(binding,mountinfo);
 requireThat(stat(binding.host_root).isDirectory()&&realpath(binding.host_root)===binding.host_root,'host-directory-identity');
 requireThat(binding.provenance?.path&&/^[a-f0-9]{64}$/.test(binding.provenance.sha256),'provenance-binding-required');
 requireThat(createHash('sha256').update(read(binding.provenance.path)).digest('hex')===binding.provenance.sha256,'provenance-drift');
 let guest=resolve(output);while(!exists(guest)){const parent=dirname(guest);requireThat(parent!==guest,'guest-output-ancestor');guest=parent;}
 requireThat(stat(guest).isDirectory(),'guest-directory');guest=realpath(guest);
 requireThat(guest!=='/mnt'&&!guest.startsWith('/mnt/'),'guest-output-on-host-mount');
 const mounts=mountinfo.trim().split('\n').map(line=>{const [left,right]=line.split(' - ');if(!right)return null;const f=left.split(' '),r=right.split(' ');return {device:f[2],root:decode(f[3]??''),mount:decode(f[4]??''),fs:r[0],source:decode(r[1]??'')};}).filter(Boolean);
 const roots=mounts.filter(m=>m.mount==='/');requireThat(roots.length===1&&roots[0].fs==='ext4'&&roots[0].root==='/','ubuntu-root-mount');
 const covering=mounts.filter(m=>guest===m.mount||guest.startsWith(m.mount==='/'?'/':m.mount+'/')).sort((a,b)=>b.mount.length-a.mount.length);
 requireThat(covering.length>0&&covering.filter(m=>m.mount.length===covering[0].mount.length).length===1,'ambiguous-guest-mount');
 requireThat(covering.length>0&&covering[0].fs==='ext4'&&covering[0].device===roots[0].device&&covering[0].source===roots[0].source,'guest-root-device-mismatch');
 const bytes=path=>{const s=measure(path);requireThat(typeof s.bavail==='bigint'&&typeof s.bsize==='bigint'&&s.bavail>=0n&&s.bsize>0n,'filesystem-measurement');return s.bavail*s.bsize;};
 const host=bytes(binding.host_root),guestFree=bytes(guest),growth=BigInt(growth_reservation_bytes);
 const receipt={schema:'are.wsl-storage-admission/v1',admitted:host>=12n*GiB+growth&&guestFree>=8n*GiB+growth,host_root:binding.host_root,host_drive:binding.host_drive,windows_base_path:binding.windows_base_path,host_mount:mount,guest_root:guest,host_free_bytes:host.toString(),guest_free_bytes:guestFree.toString(),minimum_host_free_bytes:(12n*GiB).toString(),minimum_guest_free_bytes:(8n*GiB).toString(),growth_reservation_bytes,provenance:binding.provenance};
 if(!receipt.admitted)throw Object.assign(new Error('storage-host.capacity'),{code:'STORAGE_CAPACITY_REJECTED',receipt});return receipt;
}
