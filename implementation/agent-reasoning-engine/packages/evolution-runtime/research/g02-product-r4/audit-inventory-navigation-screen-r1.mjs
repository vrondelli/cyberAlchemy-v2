// Independent binding/arithmetic audit, not a native evaluator rerun.
// Open Questions: G02-INVENTORY-NAVIGATION-R1.json.
import{readFileSync,writeFileSync,existsSync}from'node:fs';import{join}from'node:path';
import{hash}from'./vps-json-provider-r1.mjs';import{providerBody,validateReply}from'./wsl-vps-provider-r1.mjs';
import{buildInventory,buildFilePacket,parseDirectoryChoice,parseFileChoice}from'./inventory-navigation-r1.mjs';
const root='/home/vlad_/are-benchmark-archive/g02-inventory-navigation-screen-r1-20261006',prior='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006/score-bundles';
const need=(v,r)=>{if(!v)throw Error('inventory-audit.'+r);},bytes=p=>readFileSync(p),read=p=>JSON.parse(bytes(p)),equal=(a,b,r)=>need(JSON.stringify(a)===JSON.stringify(b),r);
need(!existsSync(join(root,'INDEPENDENT-AUDIT.json')),'no-replay');
const freezeBytes=bytes(join(root,'FREEZE.json')),f=JSON.parse(freezeBytes),terminal=read(join(root,'RESULT.json')),seal=read(join(root,'PRE-SCORE-SEAL.json')),screen=read(join(root,'SCREEN-RESULT.json'));
need(terminal.status==='terminal-acquisition-screen'&&terminal.error===null&&terminal.unknown_generation_usage===0&&f.cases.length===12&&seal.rows.length===12,'terminal-cohort');
need(seal.freeze_sha256===hash(freezeBytes)&&screen.freeze_sha256===hash(freezeBytes)&&screen.pre_score_seal_sha256===hash(bytes(join(root,'PRE-SCORE-SEAL.json')))&&terminal.screen_result_sha256===hash(bytes(join(root,'SCREEN-RESULT.json'))),'root-bindings');
let generations=0,tokenizers=0,tokens=0,valid=0;const predictions=[];
for(const c of f.cases){
 const dir=join(root,c.pair),leadBytes=bytes(join(dir,'LEADS.json')),s=seal.rows.filter(x=>x.pair===c.pair);need(s.length===1&&s[0].leads_sha256===hash(leadBytes),'lead-seal');
 const leads=JSON.parse(leadBytes),choicesBytes=bytes(join(dir,'CHOICES.json')),choices=JSON.parse(choicesBytes);need(leads.choices_sha256===hash(choicesBytes)&&choices.pair===c.pair&&choices.instance_id===c.instance_id,'choices-identity');
 const inventory=buildInventory(c.admitted_paths);let prefixes=null,paths=[],invalid=null;
 for(const stage of ['directories','files']){
  if(stage==='files'&&!prefixes){need(!existsSync(join(dir,'files-GENERATION-STARTED.json')),'invalid-dir-replayed');break;}
  const input=read(join(dir,stage+'-INPUT.json')),reply=read(join(dir,stage+'-GENERATION-REPLY.json'));
  need(hash(bytes(c.task_path))===c.task_sha256,'task-drift');const content=JSON.parse(input.messages[1].content);need(content.issue===read(c.task_path).problem_statement&&input.output_cap===512&&input.tools.length===0,'model-input');
  equal(content.inventory,stage==='directories'?inventory.catalog:buildFilePacket(inventory,prefixes),'packet-input');
  const measurement={...input,operation:'tokenize',request_id:input.request_id+'-tokens'},measured=read(join(dir,stage+'-TOKENIZER-REPLY.json'));
  validateReply(measured,measurement);need(measured.status===200&&measured.failure_code===null&&Number.isSafeInteger(measured.prompt_tokens),'tokenizer');tokenizers++;
  need(read(join(dir,stage+'-TOKENIZER-STARTED.json')).request_sha256===hash(providerBody(measurement))&&read(join(dir,stage+'-GENERATION-STARTED.json')).request_sha256===hash(providerBody(input)),'dispatch-digest');
  validateReply(reply,input);need(reply.status===200&&reply.failure_code===null&&[reply.prompt_tokens,reply.completion_tokens].every(x=>Number.isSafeInteger(x)&&x>=0),'known-usage');generations++;tokens+=reply.prompt_tokens+reply.completion_tokens;
  try{if(stage==='directories')prefixes=parseDirectoryChoice(reply.public_response.message.content,inventory);else paths=parseFileChoice(reply.public_response.message.content,content.inventory);}catch{invalid=stage==='directories'?'directory-choice-invalid':'file-choice-invalid';}
 }
 equal(choices.prefixes,prefixes,'prefix-reconstruction');equal(choices.paths,paths,'path-reconstruction');need(choices.invalid===invalid&&leads.queries_valid===(invalid===null),'validity');if(!invalid)valid++;
 equal(choices.source_identities.map(x=>x.path),paths,'source-identities');for(const s of choices.source_identities)need(hash(bytes(join(c.base,s.path)))===s.source_sha256,'source-digest');
 const old=new Set(c.observed_files),expected=paths.filter(p=>!old.has(p));equal(leads.treatment.filter(Boolean).map(x=>x.path),expected,'novelty-no-replacement');need(leads.treatment.length===3&&leads.control.length===3,'all-slots');
 need(hash(bytes(c.old_leads_path))===c.old_leads_sha256,'control-binding');equal(leads.control.filter(Boolean).map(x=>x.path),read(c.old_leads_path).control.filter(Boolean).map(x=>x.path),'control-reconstruction');
 predictions.push({c,leads});
}
// Full prediction barrier precedes all label reads in this independent audit.
const norm=p=>{p=p.replaceAll('\\','/');if(p.startsWith('/testbed/'))return p.slice(9);if(p.startsWith('/workspace/')){const q=p.slice(11),i=q.indexOf('/');return i<0?q:q.slice(i+1);}return p.startsWith('/')?p.replace(/^\/+/, ''):p.replace(/^[./]+/,'');};
let treatmentHits=0,controlHits=0,gain=0;
for(const {c,leads}of predictions){const dir=join(prior,c.pair+'-control'),bundleBytes=bytes(join(dir,'BUNDLE.json'));need(hash(bundleBytes)===c.prior_bundle_sha256,'bundle');const goldBytes=bytes(join(dir,'GOLD-EXPOSED-TASK1.json'));need(hash(goldBytes)===JSON.parse(bundleBytes).gold_sha256,'gold');const g=JSON.parse(goldBytes);need(g.inst_id===c.instance_id,'gold-identity');
 const init=g.init_ctx??[],add=g.add_ctx??[],ctx=!init.length&&!add.length&&Array.isArray(g.gold_ctx)?g.gold_ctx:[...init,...add],gold=new Set(ctx.filter(x=>x.file).map(x=>norm(x.file))),row=screen.rows.find(r=>r.pair===c.pair);need(row.reference_file_count===gold.size&&row.gold_sha256===hash(goldBytes)&&row.choices_valid===leads.queries_valid,'score-row');
 const hits={};for(const arm of ['treatment','control']){const paths=new Set(leads[arm].filter(Boolean).map(x=>x.path)),found=[...paths].filter(p=>gold.has(p)).sort();equal(found,row[arm].novel_reference_files,'file-hits');need(row[arm].hit_count===found.length&&row[arm].allocated_slots===3&&row[arm].reference_file_coverage_gain===found.length/gold.size,'row-arithmetic');hits[arm]=found.length;}
 treatmentHits+=hits.treatment;controlHits+=hits.control;gain+=(hits.treatment-hits.control)/gold.size;
}
gain/=12;need(generations===terminal.generations&&tokenizers===terminal.tokenizers&&tokens===terminal.known_model_tokens&&generations===seal.generations&&tokens===seal.known_model_tokens,'usage-totals');
need(screen.treatment_novel_reference_file_hits===treatmentHits&&screen.control_novel_reference_file_hits===controlHits&&Math.abs(screen.mean_reference_file_coverage_gain_vs_control-gain)<1e-12&&screen.unique_hit_files_per_allocated_slot===treatmentHits/36,'aggregate-arithmetic');
const gate=f.gate,checks={all_12_valid_outputs:valid===12,novel_hits:treatmentHits>=gate.novel_reference_file_hits_at_least,hit_gain:treatmentHits-controlHits>=gate.hit_gain_vs_control_at_least,mean_file_coverage_gain:gain>=gate.mean_reference_file_coverage_gain_vs_control_at_least,precision:treatmentHits/36>=gate.unique_hit_files_per_36_allocated_slots_at_least,cost:tokens<=gate.known_generation_tokens_at_most};equal(checks,screen.checks,'unchanged-gate');need(screen.status===(Object.values(checks).every(Boolean)?'acquisition-screen-qualified-for-native-test':'acquisition-screen-rejected'),'decision');
const result={status:'all12-bindings-arithmetic-and-frozen-decision-verified',freeze_sha256:hash(freezeBytes),screen_result_sha256:hash(bytes(join(root,'SCREEN-RESULT.json'))),valid_cases:valid,generations,tokenizers,known_model_tokens:tokens,checks,scope:'Independent source/input/output binding, selection reconstruction and file-proxy arithmetic; shares pure packet/parser utilities but not score arithmetic. Does not rerun native evaluator or prove source relevance.',authority_effect:'none',open_questions_owner:'G02-INVENTORY-NAVIGATION-R1.json'};
writeFileSync(join(root,'INDEPENDENT-AUDIT.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(result));
