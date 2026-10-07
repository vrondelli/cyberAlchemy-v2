// Source-only construction, no labels or providers. Open Questions: G02-INVENTORY-SOURCE-CARDS-R1.json.
import{existsSync,mkdirSync,readFileSync,writeFileSync,lstatSync,realpathSync}from'node:fs';import{join,dirname,sep}from'node:path';import{fileURLToPath}from'node:url';import{execFileSync}from'node:child_process';
import{hash}from'./vps-json-provider-r1.mjs';import{validateReply}from'./wsl-vps-provider-r1.mjs';
import{buildInventory,parseDirectoryChoice}from'./inventory-navigation-r2.mjs';
import{buildSourceCardPacket,createSourceCardRequest}from'./inventory-source-cards-r1.mjs';
const prior='/home/vlad_/are-benchmark-archive/g02-inventory-navigation-screen-r2-20261006',root='/home/vlad_/are-benchmark-archive/g02-inventory-source-cards-construction-r1-20261006',here=dirname(fileURLToPath(import.meta.url));
const need=(v,r)=>{if(!v)throw Error('card-construction.'+r);},read=p=>JSON.parse(readFileSync(p));
const save=(p,d)=>writeFileSync(p,JSON.stringify(d,null,2)+'\n',{flag:'wx',mode:0o600});
need(!existsSync(root),'no-replay');need(hash(readFileSync(join(prior,'INDEPENDENT-AUDIT.json')))==='682156526cabbbf15707a67617130a89767af8c8ca0d89a37134990acf6cb1b4','prior-audit-pin');
const fBytes=readFileSync(join(prior,'FREEZE.json')),f=JSON.parse(fBytes);need(read(join(prior,'RESULT.json')).status==='terminal-acquisition-screen'&&f.cases.length===12,'terminal-cohort');
for(const[n,h]of Object.entries(f.source_sha256))need(hash(readFileSync(join(here,n)))===h,'prior-source-drift');
mkdirSync(root,{mode:0o700});const rows=[];let upstreamTokens=0;
for(const c of f.cases){
 const git=(...args)=>execFileSync('git',['-c',`safe.directory=${c.base}`,'-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false','-C',c.base,...args],{timeout:120000,maxBuffer:16*1024**2});
 need(git('rev-parse','HEAD').toString().trim()===c.base_commit&&!git('diff','--name-only','HEAD').length,'base-drift');need(hash(readFileSync(c.task_path))===c.task_sha256&&hash(readFileSync(c.prior_prediction_path))===c.prior_prediction_sha256,'task-ledger-drift');
 const input=read(join(prior,c.pair,'directories-INPUT.json')),replyBytes=readFileSync(join(prior,c.pair,'directories-GENERATION-REPLY.json')),reply=JSON.parse(replyBytes);validateReply(reply,input);
 need(reply.status===200&&reply.failure_code===null&&[reply.prompt_tokens,reply.completion_tokens].every(n=>Number.isSafeInteger(n)&&n>=0),'upstream-usage');
 const inventory=buildInventory(c.admitted_paths,c.observed_files),prefixes=parseDirectoryChoice(reply.public_response.message.content,inventory),paths=[...new Set(prefixes.flatMap(p=>inventory.groups.get(p)))].sort();
 const sources=[];for(const path of paths){const target=join(c.base,path);need(lstatSync(target).isFile()&&realpathSync(target).startsWith(realpathSync(c.base)+sep),'source-not-regular');git('ls-files','--error-unmatch','--',path);const bytes=readFileSync(target);need(hash(bytes)===hash(git('show',c.base_commit+':'+path)),'source-blob-drift');sources.push({path,utf8:new TextDecoder('utf-8',{fatal:true}).decode(bytes),source_sha256:hash(bytes)});}
 const problem_statement=read(c.task_path).problem_statement,binding=buildSourceCardPacket({problem_statement,sources}),request=createSourceCardRequest({request_id:'g02-source-cards-r1-'+c.pair,problem_statement,packet:binding.packet});
 need(binding.packet.cards.length===paths.length&&binding.packet.cards.every(x=>!c.observed_files.includes(x.path)),'complete-available-pool');
 const dir=join(root,c.pair);mkdirSync(dir,{mode:0o700});save(join(dir,'PACKET.json'),binding.packet);save(join(dir,'INPUT.json'),request);
 const usage=reply.prompt_tokens+reply.completion_tokens;upstreamTokens+=usage;
 rows.push({pair:c.pair,instance_id:c.instance_id,base:c.base,base_commit:c.base_commit,task_path:c.task_path,task_sha256:c.task_sha256,observation_ledger_sha256:c.prior_prediction_sha256,observed_files:c.observed_files,prefixes,pool_files:paths.length,packet_sha256:hash(readFileSync(join(dir,'PACKET.json'))),input_sha256:hash(readFileSync(join(dir,'INPUT.json'))),packet_bytes:Buffer.byteLength(JSON.stringify(binding.packet)),upstream_directory_reply_sha256:hash(replyBytes),upstream_directory_generation_tokens:usage,old_leads_path:c.old_leads_path,old_leads_sha256:c.old_leads_sha256,prior_bundle_sha256:c.prior_bundle_sha256});
 console.log(JSON.stringify({pair:c.pair,pool_files:paths.length,packet_bytes:Buffer.byteLength(JSON.stringify(binding.packet)),status:'all-candidate-source-cards-sealed'}));
}
save(join(root,'CONSTRUCTION-SEAL.json'),{status:'all12-exact-source-card-capacity-preflights-passed',source_sha256:Object.fromEntries(['inventory-source-cards-r1.mjs','inventory-source-cards-r1.test.mjs','seal-inventory-source-cards-r1.mjs','inventory-navigation-r2.mjs','inventory-navigation-r1.mjs','vps-json-provider-r1.mjs','wsl-vps-provider-r1.mjs'].map(n=>[n,hash(readFileSync(join(here,n)))])),prior_freeze_sha256:hash(fBytes),rows,upstream_directory_generations:12,upstream_directory_generation_tokens:upstreamTokens,synthetic_tests_passed:5,new_provider_calls:0,reference_label_reads:0,claim_ceiling:'Exact source/capacity construction only; no reference-file precision or native-quality qualification.',authority_effect:'none',open_questions_owner:'G02-INVENTORY-SOURCE-CARDS-R1.json'});
console.log(JSON.stringify({root,rows:rows.length,upstream_generation_tokens:upstreamTokens,seal_sha256:hash(readFileSync(join(root,'CONSTRUCTION-SEAL.json')))}));
