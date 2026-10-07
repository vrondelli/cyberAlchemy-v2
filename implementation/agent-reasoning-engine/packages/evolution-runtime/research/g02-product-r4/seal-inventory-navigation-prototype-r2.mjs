// Source-only capacity evidence. Open Questions: G02-INVENTORY-NAVIGATION-R2.json.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
import {hash} from './vps-json-provider-r1.mjs';
import {buildInventory,buildFilePacket,buildNavigationRequest} from './inventory-navigation-r2.mjs';
const prior='/home/vlad_/are-benchmark-archive/g02-query-expansion-screen-r1-20261006',root='/home/vlad_/are-benchmark-archive/g02-inventory-navigation-prototype-r2-20261006',here=dirname(fileURLToPath(import.meta.url));
const need=(v,r)=>{if(!v)throw Error('inventory-preflight.'+r);};
need(!existsSync(root),'output-exists-no-replay');
const indexBytes=readFileSync(join(prior,'INDEX-ADMISSION-SEAL.json')),index=JSON.parse(indexBytes),freezeBytes=readFileSync(join(prior,'FREEZE.json')),freeze=JSON.parse(freezeBytes);
need(index.freeze_sha256===hash(freezeBytes)&&index.rows.length===12,'source-inputs');
const rows=[];
for(const r of index.rows){
 const c=freeze.cases.find(c=>c.pair===r.pair);need(!!c,'case');
 const git=(...args)=>execFileSync('git',['-c',`safe.directory=${c.base}`,'-C',c.base,...args],{maxBuffer:16*1024**2});
 need(git('rev-parse','HEAD').toString().trim()===c.base_commit&&!git('diff','--name-only','HEAD').length,'base-drift');
 need(hash(readFileSync(c.task_path))===c.task_sha256,'task-drift');
 need(hash(readFileSync(c.prior_prediction_path))===c.prior_prediction_sha256,'observation-drift');
 const observed=new Set(c.observed_files),available=r.admitted.filter(p=>!observed.has(p));
 const inventory=buildInventory(r.admitted,c.observed_files),flat=[...inventory.groups.values()].flat();
 need(flat.length===available.length&&new Set(flat).size===available.length&&flat.every(p=>available.includes(p)),'inventory-coverage');
 const largest=[...inventory.groups.keys()].map(prefix=>Buffer.byteLength(JSON.stringify(buildFilePacket(inventory,[prefix])))).sort((a,b)=>b-a);
 const request=buildNavigationRequest({request_id:'construction-'+r.pair,problem_statement:JSON.parse(readFileSync(c.task_path)).problem_statement,stage:'directories',packet:inventory.catalog});
 rows.push({pair:r.pair,instance_id:c.instance_id,base_commit:c.base_commit,task_sha256:c.task_sha256,admitted_paths_sha256:hash(JSON.stringify(r.admitted)),admitted_files:r.admitted.length,available_files:available.length,excluded_observed_files:r.admitted.length-available.length,observation_ledger_sha256:c.prior_prediction_sha256,groups:inventory.groups.size,catalog_bytes:Buffer.byteLength(JSON.stringify(inventory.catalog)),directory_request_bytes:Buffer.byteLength(JSON.stringify(request)),largest_possible_three_group_packet_bytes_upper_bound:largest.slice(0,3).reduce((a,b)=>a+b,0),all_admitted_paths_preserved:true});
}
need(rows.every(r=>r.largest_possible_three_group_packet_bytes_upper_bound<=65536),'three-group-cap');
mkdirSync(root,{mode:0o700});
const result={status:'all12-source-only-capacity-preflights-passed',source_sha256:Object.fromEntries(['inventory-navigation-r2.mjs','inventory-navigation-r2.test.mjs','inventory-navigation-r1.mjs','vps-json-provider-r1.mjs','seal-inventory-navigation-prototype-r2.mjs'].map(n=>[n,hash(readFileSync(join(here,n)))])),source_index_seal_sha256:hash(indexBytes),source_freeze_sha256:hash(freezeBytes),synthetic_tests_passed:7,provider_calls:0,reference_label_reads:0,rows,claim_ceiling:'Construction/capacity only; no localization quality, native F1 or superiority evidence. A new campaign and gate remain to be frozen.',authority_effect:'none',open_questions_owner:'G02-INVENTORY-NAVIGATION-R2.json'};
writeFileSync(join(root,'CONSTRUCTION-SEAL.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({root,status:result.status,rows:rows.length,seal_sha256:hash(readFileSync(join(root,'CONSTRUCTION-SEAL.json')))}));
