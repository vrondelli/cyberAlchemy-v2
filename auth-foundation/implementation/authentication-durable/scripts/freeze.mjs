import {suites as suiteSpecs,requireCurrentReceipt} from './receipt-policy.mjs';
import {snapshot,root,sha} from './source-snapshot.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const current=snapshot(),dir=resolve(root,'evidence/repairs');
const suites=Object.keys(suiteSpecs);
const evidence={};
for(const suite of suites){const file=suite+'-receipt.json',bytes=readFileSync(resolve(dir,file)),r=JSON.parse(bytes);
 const artifacts=Object.fromEntries(suiteSpecs[suite].artifacts.map(p=>[p,sha(readFileSync(resolve(root,'evidence',p)))]));requireCurrentReceipt(r,{suite,digest:current.source_digest,logHash:sha(readFileSync(resolve(dir,suite+'.txt'))),artifacts});Object.assign(evidence,artifacts);
 evidence['repairs/'+file]=sha(bytes);evidence['repairs/'+suite+'.txt']=r.output_sha256;
}
const original=resolve(root,'../authentication-https'),prior=JSON.parse(readFileSync(resolve(original,'evidence/INPUT-CANDIDATE.json')));
for(const f of prior.files)if(sha(readFileSync(resolve(original,f.path)))!==f.sha256)throw Error('Frozen HTTPS predecessor changed');
const predecessor=JSON.parse(readFileSync(resolve(root,'../../development/authentication-v1/history/before-operations/CANDIDATE.json')));
writeFileSync(resolve(root,'evidence/CANDIDATE.json'),JSON.stringify({schema_version:'auth-durable-candidate/v2',...current,predecessor_digest:predecessor.source_digest,authority_effect:'none',open_questions_ref:'../README.md#open-questions'},null,2)+'\n');
writeFileSync(resolve(root,'evidence/VERIFICATION.json'),JSON.stringify({status:'bounded-local-operations-prototype-passed',candidate_digest:current.source_digest,current_suites:suites,evidence,original_auth_source_inputs_unchanged:prior.files.length,inherited:{candidate_digest:predecessor.source_digest,verification:'../../development/authentication-v1/history/before-operations/VERIFICATION.json',claim:'Historical durable integration and pilot evidence only; not rerun against this candidate'},authority_effect:'none',open_questions_ref:'../README.md#open-questions'},null,2)+'\n');
console.log(JSON.stringify({candidate_digest:current.source_digest,files:Object.keys(current.files).length,current_suites:suites.length}));
