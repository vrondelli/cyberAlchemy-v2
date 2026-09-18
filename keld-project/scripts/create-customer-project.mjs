import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {setupCustomerProfile} from './setup-customer-profile.mjs';

const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const id=v=>typeof v==='string'&&/^[a-z0-9][a-z0-9-]{0,63}$/.test(v);
const text=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
export function validateProjectSpec(input){
  const errors=[];
  if(!object(input))return ['spec must be an object'];
  for(const key of Object.keys(input))if(!['project_id','definitions','instructions','persistent_state'].includes(key))errors.push(`Unknown field: ${key}`);
  if(!id(input.project_id))errors.push('project_id must use 1–64 lowercase letters, digits or hyphens, beginning with a letter or digit');
  if(!text(input.instructions,16384))errors.push('instructions must be nonempty text, at most 16384 characters');
  if(typeof input.persistent_state!=='boolean')errors.push('persistent_state must be explicitly true or false');
  if(!Array.isArray(input.definitions)||input.definitions.length<1||input.definitions.length>64)errors.push('definitions must contain 1–64 entries');
  else{
    const ids=new Set();
    input.definitions.forEach((d,i)=>{
      const prefix=`definitions[${i}]`;
      if(!object(d)){errors.push(`${prefix} must be an object`);return}
      for(const key of Object.keys(d))if(!['id','term','meaning'].includes(key))errors.push(`${prefix}: unknown field ${key}`);
      if(!id(d.id))errors.push(`${prefix}.id is invalid`);
      else if(ids.has(d.id))errors.push(`${prefix}.id is duplicated`);
      else ids.add(d.id);
      if(!text(d.term,128))errors.push(`${prefix}.term must be nonempty text, at most 128 characters`);
      if(!text(d.meaning,8192))errors.push(`${prefix}.meaning must be nonempty text, at most 8192 characters`);
    });
  }
  return errors;
}

export async function createCustomerProject({engineRoot,projectRoot,input}){
  const errors=validateProjectSpec(input);
  if(errors.length)throw Error('Invalid project specification:\n- '+errors.join('\n- '));
  const engine=realpathSync(engineRoot),project=resolve(projectRoot);
  const {computeDecisionProfileDigest}=await import(pathToFileURL(resolve(engine,'cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/request-decision-router/index.mjs')));
  mkdirSync(project,{mode:0o700}); // No merge, overwrite or existing-project adoption.
  try{
    const put=(name,value)=>{const bytes=JSON.stringify(value,null,2)+'\n';writeFileSync(resolve(project,name),bytes,{flag:'wx',mode:0o600});return createHash('sha256').update(bytes).digest('hex')};
    const registryHash=put('routes.json',{entry_route_id:'entry',routes:[{route_id:'explain-project',objective:'Explain the selected customer project context',match:['explain'],lifecycle_state:'available',capability_ref:'customer:explain'}]});
    const decision={schema_version:'are.decision-profile/v1',profile_id:input.project_id+'-decision',profile_version:'1',authority_effect:'none',
      provenance:[{id:'route-registry',path:'routes.json',sha256:registryHash}],
      route_policies:[{route_id:'explain-project',objective_kinds:['explain'],effect_classes:['local-read'],signal_additions:[],exclusion_additions:[],owner_gate_ref:null,provenance_ids:['route-registry']}],
      consequence:{safe_effects:['local-read'],consequential_effects:[],protected_effects:[],owner_gate_by_effect:{},unknown_effect_behavior:'gate',multiple_admissible_behavior:'gate',max_direct_steps:1}};
    decision.profile_digest=computeDecisionProfileDigest(decision);put('decision.json',decision);
    put('definitions.json',{concepts:input.definitions.map(d=>({concept_id:d.id,term:d.term,current_disposition:'propose',propose:{normative_voice:d.meaning}}))});
    put('ontology.json',{ontology_id:input.project_id,nodes:input.definitions.map(d=>({node_id:'customer.'+d.id,kind:'concept',intent:d.meaning})),edges:[]});
    writeFileSync(resolve(project,'AGENTS.md'),input.instructions+'\n',{flag:'wx',mode:0o600});
    const setup={project_id:input.project_id,decision_profile:'decision.json',definition_sources:['definitions.json'],system_ontology:'ontology.json',instruction_sources:['AGENTS.md'],
      context:{source_epoch:'customer:epoch1',seed_definition_ids:input.definitions.map(d=>d.id),initial_node_ids:input.definitions.map(d=>'customer.'+d.id),required_edge_ids:[],required_edge_ids_by_node:{},omission_candidate_ids:[],universal_relation_classes:[],route_relation_classes_by_route:{},authority_posture:'candidate',effect_posture:'preflight-no-effect'},effect_defaults:{},persistent_state:input.persistent_state};
    put('setup.json',setup);
    return await setupCustomerProfile({engineRoot:engine,projectRoot:project,input:setup});
  }catch(error){rmSync(project,{recursive:true,force:true});throw error}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length!==5)throw Error('Usage: node create-customer-project.mjs <engine-root> <new-project-root> <project-spec.json>');
  const result=await createCustomerProject({engineRoot:process.argv[2],projectRoot:process.argv[3],input:JSON.parse(readFileSync(process.argv[4],'utf8'))});
  console.log(JSON.stringify({status:'PASS',project_root:result.project_root,profile_path:result.profile_path,claim_limit:'Explanation starter with candidate definitions; no arbitrary tool-effect policy, semantic admission or agent activation.'}));
}
