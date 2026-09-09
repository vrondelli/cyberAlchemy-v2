import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export function verifyEntries(entries,read){
  if(!Array.isArray(entries)||!entries.length)throw Error('missing-inputs');
  const seen=new Set();
  for(const e of entries){
    if(typeof e.path!=='string'||e.path.startsWith('/')||e.path.split('/').includes('..')||seen.has(e.path))throw Error('invalid-input-path');
    seen.add(e.path);
    if(!/^[a-f0-9]{64}$/.test(e.sha256)||sha(read(e.path))!==e.sha256)throw Error('input-drift:'+e.path);
  }
}
export function verifyNative(){
  const here=fileURLToPath(new URL('./',import.meta.url)),repo=fileURLToPath(new URL('../../../../../',import.meta.url));
  const identity=JSON.parse(readFileSync(here+'native/identity.json'));
  const bytes=readFileSync(here+'native/inputs.json');
  if(sha(bytes)!==identity.inputs_sha256)throw Error('inputs-manifest-drift');
  verifyEntries(JSON.parse(bytes).sources,p=>readFileSync(repo+p));
  verifyEntries(identity.frontend,p=>readFileSync(here+'native/'+p));
  const binary='cyberAlchemy-v2/workspace/experiments/control-center/latency-comparison-018/native/artifact/essays-desktop';
  if(identity.binary!==binary||sha(readFileSync(repo+binary))!==identity.binary_sha256)throw Error('binary-drift');
  return identity;
}
