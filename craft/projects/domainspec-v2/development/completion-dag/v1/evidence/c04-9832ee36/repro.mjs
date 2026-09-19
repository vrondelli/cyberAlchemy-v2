import fs from 'node:fs';
import path from 'node:path';
import {canonicalJson,sha256,verifyReleaseCandidate} from '/source/tools/verify-release-candidate.mjs';
const root='/review/bundle';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(p,v)=>fs.writeFileSync(path.join(root,p),canonicalJson(v)+'\n');
const expected='9832ee36c5332be825ff065fb8cff05b23b2fd81';
const baseline=verifyReleaseCandidate(root,expected);
for(const run of ['run-1','run-2']) {const p=`qualification/${run}/qualification-certificate.json`;const c=read(p);c.observations[0].result='fail';c.observations[0].detail_code='injected-failure';write(p,c);}
function walk(d,rel=''){return fs.readdirSync(d,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:1).flatMap(e=>{const p=rel?rel+'/'+e.name:e.name;const full=path.join(d,e.name);if(e.isDirectory())return walk(full,p);const b=fs.readFileSync(full);return [{path:p,size_bytes:b.length,sha256:sha256(b)}];});}
const c=read('candidate.json');c.artifacts=walk(root).filter(r=>!['candidate.json','SHA256SUMS','verify-release-candidate.mjs'].includes(r.path));c.qualification.evidence_inventory_sha256=sha256(canonicalJson(c.artifacts.filter(r=>r.path.startsWith('qualification/'))));delete c.manifest_sha256;c.manifest_sha256=sha256(canonicalJson(c));write('candidate.json',c);
fs.writeFileSync(path.join(root,'SHA256SUMS'),walk(root).filter(r=>r.path!=='SHA256SUMS').sort((a,b)=>a.path<b.path?-1:1).map(r=>r.sha256+'  '+r.path).join('\n')+'\n');
const mutated=verifyReleaseCandidate(root,expected);const cert=read('qualification/run-1/qualification-certificate.json');const declared=cert.certificate_sha256;delete cert.certificate_sha256;
const result={baseline:baseline.result,mutated:mutated.result,checks:mutated.checks.length,failed:mutated.checks.filter(c=>c.result!=='pass'),observation:cert.observations[0],declared_certificate_digest:declared,actual_certificate_digest:sha256(canonicalJson(cert))};fs.writeFileSync('/review/result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
