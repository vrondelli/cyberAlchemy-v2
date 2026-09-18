import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,isAbsolute,relative,resolve,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function inside(root,path){const r=relative(root,path);return r!==''&&r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r)}
function projectFile(root,path){
  if(typeof path!=='string'||isAbsolute(path)||!inside(root,resolve(root,path)))throw Error('Customer source must be inside project');
  const actual=realpathSync(resolve(root,path));
  if(!inside(root,actual))throw Error('Customer source symlink escapes project');
  return {path:relative(root,actual),sha256:digest(readFileSync(actual))};
}

export async function loadCustomerProfile(engineRoot,projectRoot){
  const project=realpathSync(projectRoot);
  const path=resolve(project,'.are-keld/profile.json');
  const raw=JSON.parse(readFileSync(path,'utf8'));
  const guard=()=>{
    for(const value of Object.values(raw.sources)){
      for(const binding of Array.isArray(value)?value:[value])projectFile(project,binding.path);
    }
    const decision=JSON.parse(readFileSync(resolve(project,raw.sources.decision_profile.path),'utf8'));
    for(const source of decision.provenance??[])projectFile(project,source.path);
  };
  guard();
  const {loadRepositoryProfile}=await import(pathToFileURL(resolve(engineRoot,'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs')));
  const loaded=loadRepositoryProfile(path,project);
  if(!loaded.ok)throw Error('Customer profile invalid: '+loaded.reason_codes?.join(','));
  const provider=loaded.context_source_provider;
  return {...loaded,context_source_provider:()=>{
    try{guard();return provider()}catch{return {ok:false,reason_codes:['customer.source-boundary-invalid'],authority_effect:'none'}}
  }};
}

export async function setupCustomerProfile({engineRoot,projectRoot,input}){
  const engine=realpathSync(engineRoot),project=realpathSync(projectRoot);
  if(engine===project||inside(engine,project)||inside(project,engine))throw Error('Engine and customer roots must be separate');
  if(!/^[a-z0-9][a-z0-9-]{0,63}$/.test(input.project_id??''))throw Error('Invalid project_id');
  const allowed=['project_id','decision_profile','definition_sources','system_ontology','instruction_sources','context','effect_defaults','persistent_state'];
  if(Object.keys(input).some(k=>!allowed.includes(k)))throw Error('Unknown setup field');
  if(input.persistent_state!==undefined&&typeof input.persistent_state!=='boolean')throw Error('persistent_state must be boolean');
  if(!Array.isArray(input.definition_sources)||!input.definition_sources.length||!Array.isArray(input.instruction_sources))throw Error('Explicit definition and instruction sources required');
  if(!input.context||!input.effect_defaults)throw Error('Explicit context selectors and effect defaults required');
  const sources={decision_profile:projectFile(project,input.decision_profile),
    definition_sources:input.definition_sources.map(p=>projectFile(project,p)),
    system_ontology:projectFile(project,input.system_ontology),
    instruction_sources:input.instruction_sources.map((p,i)=>({...projectFile(project,p),instruction_id:`customer-instruction:${i}`,authority_posture:'repository-instruction'}))};
  const decision=JSON.parse(readFileSync(resolve(project,sources.decision_profile.path),'utf8'));
  // Check transitive provenance too: the engine loader checks hashes, this checks real paths.
  for(const source of decision.provenance??[])projectFile(project,source.path);
  const runtime=resolve(engine,'cyberAlchemy-v2/implementation/agent-reasoning-engine');
  const base=JSON.parse(readFileSync(resolve(runtime,'packages/codex-app-server-wrapper/profiles/repository-v1.json'),'utf8'));
  const output=resolve(project,'.are-keld');
  mkdirSync(output); // exclusive: never merge with or overwrite an existing setup
  try{
    for(const key of ['interface','protocol_observation','protocol_projection','continuation_selection','context_basis_receipt','reasoning_policy_profile']){
      const binding=base.sources[key];const bytes=readFileSync(resolve(engine,binding.path));
      if(digest(bytes)!==binding.sha256)throw Error('Engine support digest mismatch: '+key);
      const path=resolve(output,key+'.json');writeFileSync(path,bytes,{flag:'wx'});
      sources[key]={path:relative(project,path),sha256:binding.sha256};
    }
    const profile={schema_version:base.schema_version,profile_id:'customer:'+input.project_id,
      protocol_binding:base.protocol_binding,sources,context:input.context,
      context_projection:base.context_projection,context_source_refresh:base.context_source_refresh,
      semantic_evaluation:{enabled:false,trigger:'turn/completed'},
      intent_compilation:base.intent_compilation,cache_telemetry:base.cache_telemetry,
      runtime_journal:{...base.runtime_journal,journal_id:'customer-journal:'+input.project_id},
      reasoning_state:{ledger_id:'customer-ledger:'+input.project_id,storage_mode:input.persistent_state?'append-only-file-fsync':'process-memory',
        ...(input.persistent_state?{log_path:'.are-keld/reasoning-state.jsonl',single_writer:true}:{})},
      turn_bindings:{default:{lane:'interaction-bound',consumer_ref:'customer:'+input.project_id,purpose:'customer-request',
        source_epoch:input.context.source_epoch,requested_effects:[],target_refs:[],constraints:[],evidence_refs:[]},by_thread_id:{},by_client_message_id:{}},
      effect_defaults:input.effect_defaults,authority_effect:'none'};
    const path=resolve(output,'profile.json');writeFileSync(path,JSON.stringify(profile,null,2)+'\n',{flag:'wx'});
    const loaded=await loadCustomerProfile(engine,project);
    return {profile_path:path,project_root:project,engine_root:engine,loaded};
  }catch(error){rmSync(output,{recursive:true,force:true});throw error}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length!==5)throw Error('Usage: node setup-customer-profile.mjs <engine-root> <project-root> <setup.json>');
  const result=await setupCustomerProfile({engineRoot:process.argv[2],projectRoot:process.argv[3],input:JSON.parse(readFileSync(process.argv[4],'utf8'))});
  console.log(JSON.stringify({status:'PASS',profile_path:result.profile_path,claim_limit:'Validated customer context profile; not activation or effect authority.'}));
}
