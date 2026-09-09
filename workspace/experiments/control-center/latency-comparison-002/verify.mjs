import {readFileSync,readdirSync,lstatSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {verifySaved} from '../latency-hypotheses-001/hypothesize.mjs';
const root=fileURLToPath(new URL('./',import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
function inventory(dir=''){
  return readdirSync(root+dir).sort().flatMap(name=>{
    const path=dir+name,stat=lstatSync(root+path);
    if(stat.isSymbolicLink())throw Error('symlink:'+path);
    if(stat.isDirectory())return inventory(path+'/');
    return ['candidate.json','EVIDENCE.json'].includes(path)?[]:[path];
  }).sort();
}
const c=JSON.parse(readFileSync(root+'candidate.json'));
if(c.authority_effect!=='none'||c.approval!=='not-requested'||c.candidate_id!=='WLC-002')throw Error('candidate-contract');
if(JSON.stringify(c.files.map(f=>f.path))!==JSON.stringify(inventory()))throw Error('inventory-drift');
for(const f of c.files)if(sha(readFileSync(root+f.path))!==f.sha256)throw Error('file-drift:'+f.path);
const prior=verifySaved();
if(!prior.ok||prior.candidate_sha256!==c.predecessor_candidate_sha256)throw Error('predecessor-drift');
for(const b of JSON.parse(readFileSync(root+'sources.json'))){
  if(sha(readFileSync(new URL('../../../runtime/'+b.path,import.meta.url)))!==b.sha256)throw Error('selected-source-drift:'+b.path);
}
console.log(JSON.stringify({ok:true,candidate_sha256:sha(readFileSync(root+'candidate.json')),
  files:c.files.length,claim_ceiling:c.claim_ceiling,authority_effect:'none'},null,2));
