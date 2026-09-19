import {execFileSync} from 'node:child_process';
import {mkdir,access,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
export async function certificates(){
 const dir=resolve('.runtime/tls');await mkdir(dir,{recursive:true,mode:0o700});
 const run=args=>execFileSync('openssl',args,{cwd:dir,stdio:'pipe'});
 try{await access(dir+'/ca.crt')}catch{run(['req','-x509','-newkey','rsa:3072','-nodes','-days','30','-subj','/CN=Auth Foundation disposable HTTPS CA','-addext','basicConstraints=critical,CA:TRUE','-addext','keyUsage=critical,keyCertSign,cRLSign','-keyout','ca.key','-out','ca.crt']);}
 for(const [name,san,usage] of [['frontend','DNS:localhost','serverAuth'],['keycloak','DNS:keycloak','serverAuth'],['operator','DNS:local-operator','clientAuth']]){
  try{await access(dir+'/'+name+'.crt');continue}catch{}
  run(['req','-new','-newkey','rsa:3072','-nodes','-subj','/CN='+name,'-keyout',name+'.key','-out',name+'.csr']);
  await writeFile(dir+'/'+name+'.ext',`basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=${usage}\nsubjectAltName=${san}\n`,{mode:0o600});
  run(['x509','-req','-in',name+'.csr','-CA','ca.crt','-CAkey','ca.key','-CAcreateserial','-days','14','-sha256','-extfile',name+'.ext','-out',name+'.crt']);
 }
}
