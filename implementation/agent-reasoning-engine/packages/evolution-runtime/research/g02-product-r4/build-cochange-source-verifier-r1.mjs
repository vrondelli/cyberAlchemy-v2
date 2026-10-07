// Whole12 source construction, no reference data or provider calls.
// Open Questions: evidence/G02-COCHANGE-SOURCE-VERIFIER-R1.json.
import{readFileSync,writeFileSync,mkdirSync,existsSync}from'node:fs';import{join,dirname}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';
import{sourceView}from'./cochange-source-verifier-r1.mjs';import{bindDelivery}from'../../../../benchmarks/contextbench-v1/delivery.mjs';
const here=dirname(fileURLToPath(import.meta.url)),parent='/home/vlad_/are-benchmark-archive/g02-prebase-cochange-source-r1-20261006',root='/home/vlad_/are-benchmark-archive/g02-cochange-source-verifier-r1-20261006';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,r)=>{if(!v)throw Error('verifier-builder.'+r);},read=p=>JSON.parse(readFileSync(p));
need(!existsSync(root),'no-overwrite');const sealBytes=readFileSync(join(parent,'SOURCE-SEAL.json')),seal=JSON.parse(sealBytes),freeze=read(join(parent,'FREEZE.json'));
need(seal.valid===12&&seal.rows.length===12&&seal.freeze_sha256===sha(readFileSync(join(parent,'FREEZE.json'))),'full12-source-seal');
for(const[n,pin]of Object.entries(freeze.source_sha256))need(sha(readFileSync(join(here,n)))===pin,'parent-source-drift');
const packets=[];
for(const c of freeze.cases){const leadBytes=readFileSync(join(parent,c.pair,'LEADS.json')),lead=JSON.parse(leadBytes),row=seal.rows.find(r=>r.pair===c.pair);
 need(row.leads_sha256===sha(leadBytes)&&lead.instance_id===c.instance_id&&lead.base_commit===c.base_commit,'lead-pin');
 const tb=readFileSync(c.task_path);need(sha(tb)===c.task_sha256,'task-pin');const task=JSON.parse(tb);let issue=task.problem_statement,normalized=false;
 need(typeof issue==='string','issue');try{const inner=JSON.parse(issue);if(typeof inner==='string'){issue=inner;normalized=true;}}catch{}
 const cb=readFileSync(c.control_path);need(sha(cb)===c.control_sha256,'control-pin');const control=JSON.parse(cb),d=bindDelivery({captures:control.result.captures,receipts:control.result.receipts});need(d.unmapped.length===0,'observed-source-binding');
 const candidates=lead.treatment.map((l,i)=>({...sourceView({id:'f'+i,path:l.path,bytes:readFileSync(join(c.base,l.path)),issue,kind:'candidate'}),historical_relation:l.witnesses.map(w=>({seed_path:w.seed_path,cochange_support:w.cochange_support}))}));
 const seedPaths=[...new Set(lead.treatment.flatMap(l=>l.witnesses.map(w=>w.seed_path)))].sort((a,b)=>c.seed_paths.indexOf(a)-c.seed_paths.indexOf(b)).slice(0,3);
 const seeds=seedPaths.map((path,i)=>{const bytes=readFileSync(join(c.base,path)),observed=d.read_observations.filter(r=>r.path===path);need(observed.length&&observed.every(r=>r.source_sha256===sha(bytes)),'seed-file-identity');
  return{...sourceView({id:'s'+i,path,bytes,issue,kind:'seed',maximumLines:120,maximumBytes:16000}),origin:'New source-only view of the same SHA-bound historically witnessed seed file; may include lines not in historical reads.'};
 });
 need(candidates.length<=3&&(candidates.length===0||seeds.length>0),'candidate-seed-capacity');
 packets.push({pair:c.pair,instance_id:c.instance_id,repo_url:c.repo_url,base_commit:c.base_commit,task_sha256:c.task_sha256,issue,issue_json_string_normalized_once:normalized,parent_leads_sha256:sha(leadBytes),candidates,seeds,scope:'Partial canonical base-source views; history indicates association, not responsibility. No native delivery or source-completeness claim.'});
}
need(packets.length===12&&packets.flatMap(p=>p.candidates).length===20&&packets.filter(p=>p.candidates.length).length===8,'full-cohort');
mkdirSync(root,{mode:0o700});const packetBytes=JSON.stringify({packets,reference_label_reads:0,provider_calls:0,authority_effect:'none',open_questions_owner:'G02-COCHANGE-SOURCE-VERIFIER-R1.json'},null,2)+'\n';writeFileSync(join(root,'PACKETS.json'),packetBytes,{flag:'wx',mode:0o600});
const construction={status:'all12-source-views-constructed',packets_sha256:sha(packetBytes),parent_source_seal_sha256:sha(sealBytes),source_sha256:Object.fromEntries(['build-cochange-source-verifier-r1.mjs','cochange-source-verifier-r1.mjs'].map(n=>[n,sha(readFileSync(join(here,n)))])),protocol_sha256:sha(readFileSync(join(here,'../../evidence/G02-COCHANGE-SOURCE-VERIFIER-R1.json'))),cases:12,candidate_files:20,nonempty_cases:8,reference_label_reads:0,provider_calls:0,authority_effect:'none',open_questions_owner:'G02-COCHANGE-SOURCE-VERIFIER-R1.json'};
const bytes=JSON.stringify(construction,null,2)+'\n';writeFileSync(join(root,'CONSTRUCTION-SEAL.json'),bytes,{flag:'wx',mode:0o600});console.log(JSON.stringify({status:construction.status,packets_sha256:construction.packets_sha256,construction_sha256:sha(bytes),cases:12,candidate_files:20,nonempty_cases:8}));
